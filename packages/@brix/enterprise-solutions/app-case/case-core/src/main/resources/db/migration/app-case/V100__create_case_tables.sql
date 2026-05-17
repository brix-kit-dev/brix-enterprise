-- ============================================================
-- Flyway Migration: V100__create_case_tables.sql
-- Module: brix-app-case (Case Service)
-- Version: 3.0.0-SNAPSHOT
-- Date: 2026-02-23
-- Author: Brix Team
--
-- 设计原则（现代 PostgreSQL 最佳实践）：
-- 1. 每表 8 个预留字段（ext_varchar_1~5, ext_int_1, ext_json_1, ext_timestamp_1）
-- 2. 软删除（deleted_at TIMESTAMPTZ + deleted_by），无需 deleted BOOLEAN
-- 3. 统一审计字段（created_at, updated_at, created_by, updated_by）
-- 4. 多租户（tenant_id）
-- 5. VARCHAR(64) 主键（应用层生成）
--
-- 【v3.0 多租户说明】
-- - 所有业务表必须包含 tenant_id 字段
-- - 使用复合唯一约束保证租户内数据唯一性
--
-- 核心表清单：
-- | 表名                      | 说明                     |
-- |---------------------------|--------------------------|
-- | biz_case                  | Case 主表                |
-- | biz_case_parameter        | Case 参数表（EAV 模式）   |
-- | biz_case_node             | Case 节点状态表          |
-- | biz_case_schedule         | Case 行程表（Day 级别）   |
-- | biz_case_schedule_item    | Case 行程项（Item 级别）  |
-- | biz_case_timeline_event   | Case Timeline（不可变）   |
-- | biz_case_template         | Case 模板定义            |
-- | biz_case_template_node    | Case 模板节点定义        |
-- ============================================================


-- ============================================================
-- Part 1: biz_case — Case 主表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_case (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 业务字段
    case_no             VARCHAR(64)     NOT NULL,
    name                VARCHAR(100)    NOT NULL,
    description         VARCHAR(500),
    status              VARCHAR(32)     NOT NULL DEFAULT 'DRAFT',
    template_id         VARCHAR(64),
    template_code       VARCHAR(64),
    template_version    VARCHAR(32),
    customer_id         VARCHAR(64),
    current_node_code   VARCHAR(64),

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(64),
    updated_by          VARCHAR(64),
    deleted_at          TIMESTAMPTZ,
    deleted_by          VARCHAR(100),

    -- 预留字段（8 个）
    ext_varchar_1       VARCHAR(255),
    ext_varchar_2       VARCHAR(255),
    ext_varchar_3       VARCHAR(255),
    ext_varchar_4       VARCHAR(255),
    ext_varchar_5       VARCHAR(255),
    ext_int_1           INTEGER,
    ext_json_1          JSONB,
    ext_timestamp_1     TIMESTAMP,

    -- 约束
    CONSTRAINT uk_case_no UNIQUE (tenant_id, case_no)
);

CREATE INDEX IF NOT EXISTS idx_case_tenant      ON biz_case(tenant_id);
CREATE INDEX IF NOT EXISTS idx_case_customer    ON biz_case(tenant_id, customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_case_status      ON biz_case(tenant_id, status)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_case_template    ON biz_case(tenant_id, template_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_case_created_at  ON biz_case(tenant_id, created_at DESC);

COMMENT ON TABLE biz_case IS 'Case 主表 — 服务案例/订单';
COMMENT ON COLUMN biz_case.id IS '主键 ID（应用层生成）';
COMMENT ON COLUMN biz_case.case_no IS 'Case 编号（业务单号）';
COMMENT ON COLUMN biz_case.name IS 'Case 名称';
COMMENT ON COLUMN biz_case.description IS 'Case 描述';
COMMENT ON COLUMN biz_case.status IS '状态: DRAFT/ACTIVE/COMPLETED/CANCELLED';
COMMENT ON COLUMN biz_case.template_id IS '关联模板 ID';
COMMENT ON COLUMN biz_case.template_code IS '模板编码（冗余，便于查询）';
COMMENT ON COLUMN biz_case.template_version IS '模板版本（冗余，用于追溯）';
COMMENT ON COLUMN biz_case.customer_id IS '客户 ID';
COMMENT ON COLUMN biz_case.current_node_code IS '当前节点编码';
COMMENT ON COLUMN biz_case.tenant_id IS '租户 ID';


-- ============================================================
-- Part 2: biz_case_parameter — Case 参数表（EAV 模式）
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_case_parameter (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联 Case
    case_id             VARCHAR(64)     NOT NULL,

    -- 参数信息
    param_key           VARCHAR(64)     NOT NULL,
    param_value         TEXT,
    param_type          VARCHAR(32)     DEFAULT 'STRING',

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(64),
    updated_by          VARCHAR(64),
    deleted_at          TIMESTAMPTZ,
    deleted_by          VARCHAR(100),

    -- 预留字段（8 个）
    ext_varchar_1       VARCHAR(255),
    ext_varchar_2       VARCHAR(255),
    ext_varchar_3       VARCHAR(255),
    ext_varchar_4       VARCHAR(255),
    ext_varchar_5       VARCHAR(255),
    ext_int_1           INTEGER,
    ext_json_1          JSONB,
    ext_timestamp_1     TIMESTAMP,

    -- 约束
    CONSTRAINT uk_case_param UNIQUE (case_id, param_key),
    CONSTRAINT fk_case_param_case FOREIGN KEY (case_id) REFERENCES biz_case(id)
);

CREATE INDEX IF NOT EXISTS idx_case_param_case   ON biz_case_parameter(case_id);
CREATE INDEX IF NOT EXISTS idx_case_param_tenant ON biz_case_parameter(tenant_id);
CREATE INDEX IF NOT EXISTS idx_case_param_key    ON biz_case_parameter(param_key) WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_case_parameter IS 'Case 参数表 — EAV 模式扩展参数';
COMMENT ON COLUMN biz_case_parameter.case_id IS '关联 biz_case.id';
COMMENT ON COLUMN biz_case_parameter.param_key IS '参数键（如 package_code, partner_id）';
COMMENT ON COLUMN biz_case_parameter.param_value IS '参数值（字符串存储）';
COMMENT ON COLUMN biz_case_parameter.param_type IS '参数类型: STRING/NUMBER/BOOLEAN/JSON/DATE';


-- ============================================================
-- Part 3: biz_case_node — Case 节点状态表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_case_node (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联 Case
    case_id             VARCHAR(64)     NOT NULL,

    -- 节点信息
    node_code           VARCHAR(64)     NOT NULL,
    node_name           VARCHAR(100),
    node_seq            INTEGER         NOT NULL DEFAULT 0,
    status              VARCHAR(32)     NOT NULL DEFAULT 'PENDING',
    started_at          TIMESTAMP,
    completed_at        TIMESTAMP,
    completed_by        VARCHAR(64),
    skip_reason         VARCHAR(500),

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(64),
    updated_by          VARCHAR(64),
    deleted_at          TIMESTAMPTZ,
    deleted_by          VARCHAR(100),

    -- 预留字段（8 个）
    ext_varchar_1       VARCHAR(255),
    ext_varchar_2       VARCHAR(255),
    ext_varchar_3       VARCHAR(255),
    ext_varchar_4       VARCHAR(255),
    ext_varchar_5       VARCHAR(255),
    ext_int_1           INTEGER,
    ext_json_1          JSONB,
    ext_timestamp_1     TIMESTAMP,

    -- 约束
    CONSTRAINT uk_case_node UNIQUE (case_id, node_code),
    CONSTRAINT fk_case_node_case FOREIGN KEY (case_id) REFERENCES biz_case(id)
);

CREATE INDEX IF NOT EXISTS idx_case_node_case   ON biz_case_node(case_id);
CREATE INDEX IF NOT EXISTS idx_case_node_tenant ON biz_case_node(tenant_id);
CREATE INDEX IF NOT EXISTS idx_case_node_status ON biz_case_node(tenant_id, status) WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_case_node IS 'Case 节点状态表 — 流程节点运行时状态';
COMMENT ON COLUMN biz_case_node.case_id IS '关联 biz_case.id';
COMMENT ON COLUMN biz_case_node.node_code IS '节点编码（如 CASE_CREATE, PAYMENT_CONFIRM）';
COMMENT ON COLUMN biz_case_node.node_name IS '节点名称';
COMMENT ON COLUMN biz_case_node.node_seq IS '节点序号';
COMMENT ON COLUMN biz_case_node.status IS '节点状态: PENDING/IN_PROGRESS/DONE/SKIPPED';
COMMENT ON COLUMN biz_case_node.started_at IS '开始时间';
COMMENT ON COLUMN biz_case_node.completed_at IS '完成时间';
COMMENT ON COLUMN biz_case_node.completed_by IS '完成人 ID';
COMMENT ON COLUMN biz_case_node.skip_reason IS '跳过原因（SKIPPED 状态时必填）';


-- ============================================================
-- Part 4: biz_case_schedule — Case 行程表（Day 级别，无状态）
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_case_schedule (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联 Case
    case_id             VARCHAR(64)     NOT NULL,

    -- 行程信息
    schedule_date       DATE            NOT NULL,
    day_no              INTEGER         NOT NULL,
    title               VARCHAR(200),
    description         VARCHAR(500),
    location            VARCHAR(200),

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(64),
    updated_by          VARCHAR(64),
    deleted_at          TIMESTAMPTZ,
    deleted_by          VARCHAR(100),

    -- 预留字段（8 个）
    ext_varchar_1       VARCHAR(255),
    ext_varchar_2       VARCHAR(255),
    ext_varchar_3       VARCHAR(255),
    ext_varchar_4       VARCHAR(255),
    ext_varchar_5       VARCHAR(255),
    ext_int_1           INTEGER,
    ext_json_1          JSONB,
    ext_timestamp_1     TIMESTAMP,

    -- 约束
    CONSTRAINT uk_schedule_day UNIQUE (case_id, schedule_date),
    CONSTRAINT fk_schedule_case FOREIGN KEY (case_id) REFERENCES biz_case(id)
);

CREATE INDEX IF NOT EXISTS idx_schedule_case   ON biz_case_schedule(case_id);
CREATE INDEX IF NOT EXISTS idx_schedule_tenant ON biz_case_schedule(tenant_id);
CREATE INDEX IF NOT EXISTS idx_schedule_date   ON biz_case_schedule(schedule_date) WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_case_schedule IS 'Case 行程表 — Day 级别（无状态）';
COMMENT ON COLUMN biz_case_schedule.case_id IS '关联 biz_case.id';
COMMENT ON COLUMN biz_case_schedule.schedule_date IS '行程日期';
COMMENT ON COLUMN biz_case_schedule.day_no IS '第几天（从 1 开始）';
COMMENT ON COLUMN biz_case_schedule.title IS '当日行程标题';
COMMENT ON COLUMN biz_case_schedule.description IS '当日行程描述';
COMMENT ON COLUMN biz_case_schedule.location IS '当日主要地点';


-- ============================================================
-- Part 5: biz_case_schedule_item — Case 行程项（Item 级别，有状态）
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_case_schedule_item (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联行程
    schedule_id         VARCHAR(64)     NOT NULL,
    case_id             VARCHAR(64)     NOT NULL,

    -- 行程项信息
    item_seq            INTEGER         NOT NULL DEFAULT 0,
    item_type           VARCHAR(32)     NOT NULL,
    title               VARCHAR(200)    NOT NULL,
    description         VARCHAR(500),
    start_time          TIME,
    end_time            TIME,
    location            VARCHAR(200),
    partner_id          VARCHAR(64),
    partner_name        VARCHAR(100),
    status              VARCHAR(32)     NOT NULL DEFAULT 'PENDING',
    notes               TEXT,

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(64),
    updated_by          VARCHAR(64),
    deleted_at          TIMESTAMPTZ,
    deleted_by          VARCHAR(100),

    -- 预留字段（8 个）
    ext_varchar_1       VARCHAR(255),
    ext_varchar_2       VARCHAR(255),
    ext_varchar_3       VARCHAR(255),
    ext_varchar_4       VARCHAR(255),
    ext_varchar_5       VARCHAR(255),
    ext_int_1           INTEGER,
    ext_json_1          JSONB,
    ext_timestamp_1     TIMESTAMP,

    -- 约束
    CONSTRAINT fk_schedule_item_schedule FOREIGN KEY (schedule_id) REFERENCES biz_case_schedule(id),
    CONSTRAINT fk_schedule_item_case FOREIGN KEY (case_id) REFERENCES biz_case(id)
);

CREATE INDEX IF NOT EXISTS idx_schedule_item_schedule ON biz_case_schedule_item(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_item_case     ON biz_case_schedule_item(case_id);
CREATE INDEX IF NOT EXISTS idx_schedule_item_tenant   ON biz_case_schedule_item(tenant_id);
CREATE INDEX IF NOT EXISTS idx_schedule_item_status   ON biz_case_schedule_item(tenant_id, status) WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_case_schedule_item IS 'Case 行程项 — Item 级别（有状态）';
COMMENT ON COLUMN biz_case_schedule_item.schedule_id IS '关联 biz_case_schedule.id';
COMMENT ON COLUMN biz_case_schedule_item.case_id IS '关联 biz_case.id（冗余，便于查询）';
COMMENT ON COLUMN biz_case_schedule_item.item_seq IS '项目顺序';
COMMENT ON COLUMN biz_case_schedule_item.item_type IS '项目类型: CHECKUP/CONSULTATION/TRANSFER/HOTEL/MEAL/OTHER';
COMMENT ON COLUMN biz_case_schedule_item.status IS '状态: PENDING/IN_PROGRESS/COMPLETED/CANCELLED';
COMMENT ON COLUMN biz_case_schedule_item.partner_id IS '合作方 ID（医院/酒店/车辆公司等）';
COMMENT ON COLUMN biz_case_schedule_item.partner_name IS '合作方名称（冗余）';


-- ============================================================
-- Part 6: biz_case_timeline_event — Case Timeline（不可变事实记录）
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_case_timeline_event (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联 Case
    case_id             VARCHAR(64)     NOT NULL,

    -- 事件信息
    event_type          VARCHAR(64)     NOT NULL,
    event_source        VARCHAR(64),
    event_payload       JSONB,
    occurred_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_id            VARCHAR(64),
    actor_name          VARCHAR(100),
    node_code           VARCHAR(64),
    schema_version      VARCHAR(16)     DEFAULT 'v1',

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段（只有 created_at，因为禁止 UPDATE）
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(64),

    -- 预留字段（8 个）
    ext_varchar_1       VARCHAR(255),
    ext_varchar_2       VARCHAR(255),
    ext_varchar_3       VARCHAR(255),
    ext_varchar_4       VARCHAR(255),
    ext_varchar_5       VARCHAR(255),
    ext_int_1           INTEGER,
    ext_json_1          JSONB,
    ext_timestamp_1     TIMESTAMP

    -- ⚠️ 注意：无 updated_at, updated_by, deleted, deleted_at
    -- Timeline 是法律级不可变事实，禁止 UPDATE/DELETE
);

CREATE INDEX IF NOT EXISTS idx_timeline_case       ON biz_case_timeline_event(case_id);
CREATE INDEX IF NOT EXISTS idx_timeline_tenant     ON biz_case_timeline_event(tenant_id);
CREATE INDEX IF NOT EXISTS idx_timeline_type       ON biz_case_timeline_event(tenant_id, event_type);
CREATE INDEX IF NOT EXISTS idx_timeline_occurred   ON biz_case_timeline_event(case_id, occurred_at DESC);

COMMENT ON TABLE biz_case_timeline_event IS 'Case Timeline — 不可变事实记录（Append-Only）';
COMMENT ON COLUMN biz_case_timeline_event.case_id IS '关联 biz_case.id';
COMMENT ON COLUMN biz_case_timeline_event.event_type IS '事件类型: CaseCreated/PaymentConfirmed/ReportDelivered 等';
COMMENT ON COLUMN biz_case_timeline_event.event_source IS '事件来源服务';
COMMENT ON COLUMN biz_case_timeline_event.event_payload IS '事件载荷（JSON）';
COMMENT ON COLUMN biz_case_timeline_event.occurred_at IS '事件发生时间';
COMMENT ON COLUMN biz_case_timeline_event.actor_id IS '操作人 ID';
COMMENT ON COLUMN biz_case_timeline_event.actor_name IS '操作人名称（冗余）';
COMMENT ON COLUMN biz_case_timeline_event.node_code IS '关联节点编码';
COMMENT ON COLUMN biz_case_timeline_event.schema_version IS '事件 Schema 版本';

-- ⚠️ Timeline 只允许 INSERT 的 Trigger（防御性）
CREATE OR REPLACE FUNCTION prevent_timeline_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Timeline events are immutable. UPDATE/DELETE is not allowed.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_timeline_no_update ON biz_case_timeline_event;
CREATE TRIGGER trg_timeline_no_update
    BEFORE UPDATE OR DELETE ON biz_case_timeline_event
    FOR EACH ROW EXECUTE FUNCTION prevent_timeline_mutation();


-- ============================================================
-- Part 7: biz_case_template — Case 模板定义
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_case_template (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 模板信息
    template_code       VARCHAR(64)     NOT NULL,
    template_name       VARCHAR(100)    NOT NULL,
    version             VARCHAR(32)     NOT NULL,
    description         VARCHAR(500),
    status              VARCHAR(32)     NOT NULL DEFAULT 'DRAFT',
    is_default          BOOLEAN         NOT NULL DEFAULT FALSE,

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(64),
    updated_by          VARCHAR(64),
    deleted_at          TIMESTAMPTZ,
    deleted_by          VARCHAR(100),

    -- 预留字段（8 个）
    ext_varchar_1       VARCHAR(255),
    ext_varchar_2       VARCHAR(255),
    ext_varchar_3       VARCHAR(255),
    ext_varchar_4       VARCHAR(255),
    ext_varchar_5       VARCHAR(255),
    ext_int_1           INTEGER,
    ext_json_1          JSONB,
    ext_timestamp_1     TIMESTAMP,

    -- 约束
    CONSTRAINT uk_template_version UNIQUE (tenant_id, template_code, version)
);

CREATE INDEX IF NOT EXISTS idx_template_tenant ON biz_case_template(tenant_id);
CREATE INDEX IF NOT EXISTS idx_template_code   ON biz_case_template(tenant_id, template_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_template_status ON biz_case_template(tenant_id, status)        WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_case_template IS 'Case 模板定义 — 流程模板';
COMMENT ON COLUMN biz_case_template.template_code IS '模板编码（如 JP_CHECKUP, JP_TREATMENT）';
COMMENT ON COLUMN biz_case_template.template_name IS '模板名称';
COMMENT ON COLUMN biz_case_template.version IS '版本号（如 v1.0, v1.1）';
COMMENT ON COLUMN biz_case_template.status IS '状态: DRAFT/ACTIVE/DEPRECATED';
COMMENT ON COLUMN biz_case_template.is_default IS '是否为默认模板';


-- ============================================================
-- Part 8: biz_case_template_node — Case 模板节点定义
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_case_template_node (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联模板
    template_id         VARCHAR(64)     NOT NULL,

    -- 节点定义
    node_code           VARCHAR(64)     NOT NULL,
    node_name           VARCHAR(100)    NOT NULL,
    node_seq            INTEGER         NOT NULL,
    node_type           VARCHAR(32)     NOT NULL DEFAULT 'MANUAL',
    description         VARCHAR(500),
    trigger_event       VARCHAR(64),
    is_required         BOOLEAN         NOT NULL DEFAULT TRUE,
    config              JSONB,

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(64),
    updated_by          VARCHAR(64),
    deleted_at          TIMESTAMPTZ,
    deleted_by          VARCHAR(100),

    -- 预留字段（8 个）
    ext_varchar_1       VARCHAR(255),
    ext_varchar_2       VARCHAR(255),
    ext_varchar_3       VARCHAR(255),
    ext_varchar_4       VARCHAR(255),
    ext_varchar_5       VARCHAR(255),
    ext_int_1           INTEGER,
    ext_json_1          JSONB,
    ext_timestamp_1     TIMESTAMP,

    -- 约束
    CONSTRAINT uk_template_node UNIQUE (template_id, node_code),
    CONSTRAINT fk_template_node_template FOREIGN KEY (template_id) REFERENCES biz_case_template(id)
);

CREATE INDEX IF NOT EXISTS idx_template_node_template ON biz_case_template_node(template_id);
CREATE INDEX IF NOT EXISTS idx_template_node_tenant   ON biz_case_template_node(tenant_id);

COMMENT ON TABLE biz_case_template_node IS 'Case 模板节点定义 — 流程节点配置';
COMMENT ON COLUMN biz_case_template_node.template_id IS '关联 biz_case_template.id';
COMMENT ON COLUMN biz_case_template_node.node_code IS '节点编码（如 CASE_CREATE, PAYMENT_CONFIRM）';
COMMENT ON COLUMN biz_case_template_node.node_name IS '节点名称';
COMMENT ON COLUMN biz_case_template_node.node_seq IS '节点顺序';
COMMENT ON COLUMN biz_case_template_node.node_type IS '节点类型: AUTO/MANUAL/EVENT';
COMMENT ON COLUMN biz_case_template_node.trigger_event IS '触发事件（EVENT 类型时必填）';
COMMENT ON COLUMN biz_case_template_node.is_required IS '是否必需节点';
COMMENT ON COLUMN biz_case_template_node.config IS '节点配置（JSON）';


-- ============================================================
-- 表结构摘要
-- ============================================================
--
-- | 表名                      | 域         | 说明                    | 预留字段 |
-- |---------------------------|------------|------------------------|---------|
-- | biz_case                  | Case 核心  | Case 主表               | 8       |
-- | biz_case_parameter        | Case 核心  | Case 参数表（EAV）       | 8       |
-- | biz_case_node             | Case 核心  | Case 节点状态表          | 8       |
-- | biz_case_schedule         | 行程域     | Case 行程表（Day）       | 8       |
-- | biz_case_schedule_item    | 行程域     | Case 行程项（Item）      | 8       |
-- | biz_case_timeline_event   | 事件域     | Timeline（不可变）       | 8       |
-- | biz_case_template         | 模板域     | Case 模板定义           | 8       |
-- | biz_case_template_node    | 模板域     | Case 模板节点定义        | 8       |
--
-- 设计要点：
-- 1. biz_case_timeline_event 禁止 UPDATE/DELETE（Trigger 防御）
-- 2. biz_case_schedule（Day）无状态，biz_case_schedule_item（Item）有状态
-- 3. EAV 模式的 biz_case_parameter 便于灵活扩展参数
-- 4. 所有表支持多租户（tenant_id）与软删除（deleted_at IS NULL）
-- ============================================================
