-- ============================================================
-- Flyway Migration: V100__create_booking_tables.sql
-- Module: brix-app-booking (Booking/Appointment Service)
-- Version: 3.0.0-SNAPSHOT
-- Date: 2026-02-28
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
-- | 表名                          | 说明                       |
-- |-------------------------------|---------------------------|
-- | biz_booking                   | 预约主表                   |
-- | biz_booking_item              | 预约服务项表               |
-- | biz_booking_coordination      | 协调记录表                 |
-- | biz_booking_communication     | 沟通记录表（与客户/合作方） |
-- | biz_booking_status_log        | 状态变更日志（审计）        |
-- ============================================================


-- ============================================================
-- Part 1: biz_booking — 预约主表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_booking (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 业务字段
    booking_no          VARCHAR(64)     NOT NULL,
    booking_type        VARCHAR(32)     NOT NULL,
    title               VARCHAR(200),
    description         VARCHAR(500),
    status              VARCHAR(32)     NOT NULL DEFAULT 'DRAFT',

    -- 关联 Case（可选，预约可独立于 Case 存在）
    case_id             VARCHAR(64),
    case_no             VARCHAR(64),

    -- 关联客户
    customer_id         VARCHAR(64)     NOT NULL,
    customer_name       VARCHAR(100),
    customer_phone      VARCHAR(32),
    customer_email      VARCHAR(255),

    -- 关联合作方（医院/机构）
    partner_id          VARCHAR(64),
    partner_code        VARCHAR(64),
    partner_name        VARCHAR(100),

    -- 关联产品/套餐
    package_id          VARCHAR(64),
    package_code        VARCHAR(64),
    package_name        VARCHAR(100),

    -- 预约时间
    preferred_date      DATE,
    preferred_time      TIME,
    confirmed_date      DATE,
    confirmed_time      TIME,
    duration_minutes    INTEGER,

    -- 负责人
    assignee_id         VARCHAR(64),
    assignee_name       VARCHAR(100),

    -- 备注
    internal_notes      TEXT,
    customer_notes      TEXT,

    -- 来源
    source              VARCHAR(32)     DEFAULT 'WEB',
    channel             VARCHAR(64),

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
    CONSTRAINT uk_booking_no UNIQUE (tenant_id, booking_no)
);

CREATE INDEX IF NOT EXISTS idx_booking_tenant       ON biz_booking(tenant_id);
CREATE INDEX IF NOT EXISTS idx_booking_customer     ON biz_booking(tenant_id, customer_id)  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_booking_partner      ON biz_booking(tenant_id, partner_id)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_booking_case         ON biz_booking(tenant_id, case_id)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_booking_status       ON biz_booking(tenant_id, status)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_booking_assignee     ON biz_booking(tenant_id, assignee_id)  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_booking_date         ON biz_booking(tenant_id, preferred_date);
CREATE INDEX IF NOT EXISTS idx_booking_created_at   ON biz_booking(tenant_id, created_at DESC);

COMMENT ON TABLE biz_booking IS '预约主表 — 客户预约/协调记录';
COMMENT ON COLUMN biz_booking.id IS '主键 ID（应用层生成）';
COMMENT ON COLUMN biz_booking.booking_no IS '预约编号（业务单号）';
COMMENT ON COLUMN biz_booking.booking_type IS '预约类型: CHECKUP/TREATMENT/CONSULTATION/FOLLOW_UP';
COMMENT ON COLUMN biz_booking.title IS '预约标题';
COMMENT ON COLUMN biz_booking.status IS '状态: DRAFT/PENDING/COORDINATING/CONFIRMED/CANCELLED/COMPLETED/NO_SHOW';
COMMENT ON COLUMN biz_booking.case_id IS '关联 Case ID（可选）';
COMMENT ON COLUMN biz_booking.customer_id IS '客户 ID';
COMMENT ON COLUMN biz_booking.partner_id IS '合作方 ID（医院/机构）';
COMMENT ON COLUMN biz_booking.package_id IS '产品/套餐 ID';
COMMENT ON COLUMN biz_booking.preferred_date IS '客户期望日期';
COMMENT ON COLUMN biz_booking.confirmed_date IS '确认日期';
COMMENT ON COLUMN biz_booking.assignee_id IS '负责人 ID';
COMMENT ON COLUMN biz_booking.source IS '来源: WEB/MOBILE/ADMIN/IMPORT';
COMMENT ON COLUMN biz_booking.channel IS '渠道（推广渠道标识）';


-- ============================================================
-- Part 2: biz_booking_item — 预约服务项表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_booking_item (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联预约
    booking_id          VARCHAR(64)     NOT NULL,

    -- 服务项信息
    item_seq            INTEGER         NOT NULL DEFAULT 0,
    item_type           VARCHAR(32)     NOT NULL,
    item_code           VARCHAR(64),
    item_name           VARCHAR(200)    NOT NULL,
    description         VARCHAR(500),
    quantity            INTEGER         NOT NULL DEFAULT 1,
    unit                VARCHAR(32),
    unit_price          DECIMAL(12, 2),
    total_price         DECIMAL(12, 2),
    currency            VARCHAR(8)      DEFAULT 'JPY',

    -- 关联合作方
    partner_id          VARCHAR(64),
    partner_name        VARCHAR(100),

    -- 服务时间
    service_date        DATE,
    service_time        TIME,
    duration_minutes    INTEGER,

    -- 状态
    status              VARCHAR(32)     NOT NULL DEFAULT 'PENDING',

    -- 备注
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
    CONSTRAINT fk_booking_item_booking FOREIGN KEY (booking_id) REFERENCES biz_booking(id)
);

CREATE INDEX IF NOT EXISTS idx_booking_item_booking ON biz_booking_item(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_item_tenant  ON biz_booking_item(tenant_id);
CREATE INDEX IF NOT EXISTS idx_booking_item_status  ON biz_booking_item(tenant_id, status) WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_booking_item IS '预约服务项表 — 预约包含的服务项目';
COMMENT ON COLUMN biz_booking_item.booking_id IS '关联 biz_booking.id';
COMMENT ON COLUMN biz_booking_item.item_seq IS '服务项顺序';
COMMENT ON COLUMN biz_booking_item.item_type IS '服务项类型: CHECKUP/TREATMENT/TRANSLATE/TRANSFER/HOTEL/MEAL/OTHER';
COMMENT ON COLUMN biz_booking_item.item_code IS '服务项编码';
COMMENT ON COLUMN biz_booking_item.quantity IS '数量';
COMMENT ON COLUMN biz_booking_item.unit_price IS '单价';
COMMENT ON COLUMN biz_booking_item.total_price IS '总价';
COMMENT ON COLUMN biz_booking_item.status IS '状态: PENDING/CONFIRMED/COMPLETED/CANCELLED';


-- ============================================================
-- Part 3: biz_booking_coordination — 协调记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_booking_coordination (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联预约
    booking_id          VARCHAR(64)     NOT NULL,

    -- 协调信息
    coordination_type   VARCHAR(32)     NOT NULL,
    coordination_date   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    coordinator_id      VARCHAR(64)     NOT NULL,
    coordinator_name    VARCHAR(100),

    -- 协调对象（合作方）
    partner_id          VARCHAR(64),
    partner_name        VARCHAR(100),
    contact_person      VARCHAR(100),
    contact_phone       VARCHAR(32),
    contact_email       VARCHAR(255),

    -- 协调内容
    subject             VARCHAR(200),
    content             TEXT,
    result              VARCHAR(32),
    result_notes        TEXT,

    -- 附件
    attachments         JSONB,

    -- 下次跟进
    next_follow_up      TIMESTAMP,
    follow_up_notes     TEXT,

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
    CONSTRAINT fk_coordination_booking FOREIGN KEY (booking_id) REFERENCES biz_booking(id)
);

CREATE INDEX IF NOT EXISTS idx_coordination_booking     ON biz_booking_coordination(booking_id);
CREATE INDEX IF NOT EXISTS idx_coordination_tenant      ON biz_booking_coordination(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coordination_partner     ON biz_booking_coordination(tenant_id, partner_id)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_coordination_coordinator ON biz_booking_coordination(tenant_id, coordinator_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_coordination_date        ON biz_booking_coordination(coordination_date DESC);
CREATE INDEX IF NOT EXISTS idx_coordination_follow_up   ON biz_booking_coordination(next_follow_up)            WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_booking_coordination IS '协调记录表 — 与合作方的协调沟通';
COMMENT ON COLUMN biz_booking_coordination.booking_id IS '关联 biz_booking.id';
COMMENT ON COLUMN biz_booking_coordination.coordination_type IS '协调类型: PHONE/EMAIL/VISIT/ONLINE/OTHER';
COMMENT ON COLUMN biz_booking_coordination.coordinator_id IS '协调人 ID';
COMMENT ON COLUMN biz_booking_coordination.partner_id IS '合作方 ID';
COMMENT ON COLUMN biz_booking_coordination.contact_person IS '合作方联系人';
COMMENT ON COLUMN biz_booking_coordination.result IS '协调结果: SUCCESS/PENDING/FAILED/RESCHEDULED';
COMMENT ON COLUMN biz_booking_coordination.next_follow_up IS '下次跟进时间';
COMMENT ON COLUMN biz_booking_coordination.attachments IS '附件列表（JSON 数组）';


-- ============================================================
-- Part 4: biz_booking_communication — 沟通记录表（与客户）
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_booking_communication (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联预约
    booking_id          VARCHAR(64)     NOT NULL,

    -- 沟通信息
    communication_type  VARCHAR(32)     NOT NULL,
    direction           VARCHAR(16)     NOT NULL,
    communication_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    operator_id         VARCHAR(64)     NOT NULL,
    operator_name       VARCHAR(100),

    -- 沟通对象（客户）
    customer_id         VARCHAR(64),
    customer_name       VARCHAR(100),
    contact_method      VARCHAR(32),
    contact_value       VARCHAR(255),

    -- 沟通内容
    subject             VARCHAR(200),
    content             TEXT,
    summary             VARCHAR(500),

    -- 话术模板（风控关联）
    script_template_id  VARCHAR(64),
    script_version      VARCHAR(32),

    -- 附件
    attachments         JSONB,

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
    CONSTRAINT fk_communication_booking FOREIGN KEY (booking_id) REFERENCES biz_booking(id)
);

CREATE INDEX IF NOT EXISTS idx_communication_booking   ON biz_booking_communication(booking_id);
CREATE INDEX IF NOT EXISTS idx_communication_tenant    ON biz_booking_communication(tenant_id);
CREATE INDEX IF NOT EXISTS idx_communication_customer  ON biz_booking_communication(tenant_id, customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_communication_operator  ON biz_booking_communication(tenant_id, operator_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_communication_at        ON biz_booking_communication(communication_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_script    ON biz_booking_communication(script_template_id)     WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_booking_communication IS '沟通记录表 — 与客户的沟通记录';
COMMENT ON COLUMN biz_booking_communication.booking_id IS '关联 biz_booking.id';
COMMENT ON COLUMN biz_booking_communication.communication_type IS '沟通类型: PHONE/SMS/EMAIL/WECHAT/LINE/WHATSAPP/OTHER';
COMMENT ON COLUMN biz_booking_communication.direction IS '方向: INBOUND/OUTBOUND';
COMMENT ON COLUMN biz_booking_communication.operator_id IS '操作人 ID';
COMMENT ON COLUMN biz_booking_communication.customer_id IS '客户 ID';
COMMENT ON COLUMN biz_booking_communication.contact_method IS '联系方式类型: PHONE/EMAIL/WECHAT/LINE';
COMMENT ON COLUMN biz_booking_communication.contact_value IS '联系方式值';
COMMENT ON COLUMN biz_booking_communication.script_template_id IS '话术模板 ID（风控审计用）';
COMMENT ON COLUMN biz_booking_communication.script_version IS '话术模板版本';
COMMENT ON COLUMN biz_booking_communication.attachments IS '附件列表（JSON 数组）';


-- ============================================================
-- Part 5: biz_booking_status_log — 状态变更日志（审计）
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_booking_status_log (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联预约
    booking_id          VARCHAR(64)     NOT NULL,

    -- 状态变更
    from_status         VARCHAR(32),
    to_status           VARCHAR(32)     NOT NULL,
    changed_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by          VARCHAR(64)     NOT NULL,
    changed_by_name     VARCHAR(100),

    -- 变更原因
    reason              VARCHAR(500),
    notes               TEXT,

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段（只有 created_at，因为是审计日志）
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

    -- 注意：审计日志表无 updated_at, updated_by, deleted, deleted_at
);

CREATE INDEX IF NOT EXISTS idx_status_log_booking   ON biz_booking_status_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_status_log_tenant    ON biz_booking_status_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_status_log_status    ON biz_booking_status_log(tenant_id, to_status);
CREATE INDEX IF NOT EXISTS idx_status_log_changed   ON biz_booking_status_log(changed_at DESC);

COMMENT ON TABLE biz_booking_status_log IS '预约状态变更日志 — 审计记录';
COMMENT ON COLUMN biz_booking_status_log.booking_id IS '关联 biz_booking.id';
COMMENT ON COLUMN biz_booking_status_log.from_status IS '变更前状态';
COMMENT ON COLUMN biz_booking_status_log.to_status IS '变更后状态';
COMMENT ON COLUMN biz_booking_status_log.changed_at IS '变更时间';
COMMENT ON COLUMN biz_booking_status_log.changed_by IS '变更人 ID';
COMMENT ON COLUMN biz_booking_status_log.reason IS '变更原因';


-- ============================================================
-- 表结构摘要
-- ============================================================
--
-- | 表名                          | 域         | 说明                    | 预留字段 |
-- |-------------------------------|------------|------------------------|---------|
-- | biz_booking                   | 预约核心   | 预约主表                | 8       |
-- | biz_booking_item              | 预约核心   | 预约服务项表             | 8       |
-- | biz_booking_coordination      | 协调域     | 协调记录表（与合作方）    | 8       |
-- | biz_booking_communication     | 沟通域     | 沟通记录表（与客户）     | 8       |
-- | biz_booking_status_log        | 审计域     | 状态变更日志             | 8       |
--
-- 设计要点：
-- 1. biz_booking_status_log 为审计日志，无软删除字段
-- 2. biz_booking 可独立于 Case 存在，也可关联 Case
-- 3. 沟通记录关联话术模板用于风控审计
-- 4. 协调记录支持附件和下次跟进提醒
-- 5. 所有表支持多租户（tenant_id）与软删除（deleted_at IS NULL）
-- ============================================================
