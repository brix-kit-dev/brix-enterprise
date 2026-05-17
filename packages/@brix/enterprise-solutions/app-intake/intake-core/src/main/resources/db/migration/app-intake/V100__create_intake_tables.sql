-- ============================================================
-- Flyway Migration: V100__create_intake_tables.sql
-- Module: brix-app-intake (Medical Intake Service)
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
-- 【v2.1 裁决回顾】
-- - Intake 只收集资料，不解析、不评估、不生成医疗建议
-- - 高风险文件能力走 plugin-file-center
--
-- 核心表清单：
-- | 表名                        | 说明                     |
-- |-----------------------------|--------------------------|
-- | biz_intake_task             | 资料收集任务表           |
-- | biz_intake_task_item        | 任务收集项表             |
-- | biz_intake_material         | 收集材料表               |
-- | biz_intake_material_file    | 材料文件关联表           |
-- | biz_intake_form_template    | 表单模板表               |
-- | biz_intake_form_submission  | 表单提交记录表           |
-- ============================================================


-- ============================================================
-- Part 1: biz_intake_task — 资料收集任务表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_intake_task (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联信息
    case_id             VARCHAR(64),
    customer_id         VARCHAR(64)     NOT NULL,
    package_id          VARCHAR(64),
    partner_id          VARCHAR(64),

    -- 业务字段
    task_no             VARCHAR(64)     NOT NULL,
    task_name           VARCHAR(200)    NOT NULL,
    task_type           VARCHAR(50)     NOT NULL,
    category            VARCHAR(50),
    description         VARCHAR(500),
    priority            INTEGER         NOT NULL DEFAULT 0,
    status              VARCHAR(32)     NOT NULL DEFAULT 'PENDING',

    -- 时间控制
    deadline            TIMESTAMPTZ,
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    submitted_at        TIMESTAMPTZ,

    -- 进度
    total_items         INTEGER         NOT NULL DEFAULT 0,
    completed_items     INTEGER         NOT NULL DEFAULT 0,

    -- 负责人
    assignee_id         VARCHAR(64),
    reviewer_id         VARCHAR(64),
    
    -- 备注
    remark              VARCHAR(500),

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    CONSTRAINT uk_intake_task_no UNIQUE (tenant_id, task_no)
);

CREATE INDEX IF NOT EXISTS idx_intake_task_tenant    ON biz_intake_task(tenant_id);
CREATE INDEX IF NOT EXISTS idx_intake_task_case      ON biz_intake_task(case_id)                    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_intake_task_customer  ON biz_intake_task(tenant_id, customer_id)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_intake_task_status    ON biz_intake_task(tenant_id, status)          WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_intake_task_type      ON biz_intake_task(tenant_id, task_type)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_intake_task_assignee  ON biz_intake_task(tenant_id, assignee_id)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_intake_task_deadline  ON biz_intake_task(tenant_id, deadline)        WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_intake_task IS '资料收集任务表 — 医疗资料收集任务';
COMMENT ON COLUMN biz_intake_task.id IS '主键 ID（应用层生成）';
COMMENT ON COLUMN biz_intake_task.case_id IS '关联 Case ID';
COMMENT ON COLUMN biz_intake_task.customer_id IS '客户 ID';
COMMENT ON COLUMN biz_intake_task.package_id IS '关联套餐/产品 ID';
COMMENT ON COLUMN biz_intake_task.partner_id IS '关联合作方 ID（如医院）';
COMMENT ON COLUMN biz_intake_task.task_no IS '任务编号';
COMMENT ON COLUMN biz_intake_task.task_name IS '任务名称';
COMMENT ON COLUMN biz_intake_task.task_type IS '任务类型: CHECKUP_INTAKE/TREATMENT_INTAKE/FOLLOW_UP';
COMMENT ON COLUMN biz_intake_task.category IS '分类: BASIC_INFO/MEDICAL_HISTORY/EXAMINATION/CONSENT';
COMMENT ON COLUMN biz_intake_task.status IS '状态: PENDING/IN_PROGRESS/SUBMITTED/REVIEWING/APPROVED/REJECTED/COMPLETED';
COMMENT ON COLUMN biz_intake_task.deadline IS '截止时间';
COMMENT ON COLUMN biz_intake_task.total_items IS '总收集项数';
COMMENT ON COLUMN biz_intake_task.completed_items IS '已完成项数';


-- ============================================================
-- Part 2: biz_intake_task_item — 任务收集项表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_intake_task_item (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联任务
    task_id             VARCHAR(64)     NOT NULL,

    -- 业务字段
    item_code           VARCHAR(64)     NOT NULL,
    item_name           VARCHAR(200)    NOT NULL,
    item_type           VARCHAR(50)     NOT NULL,
    description         VARCHAR(500),
    is_required         BOOLEAN         NOT NULL DEFAULT TRUE,
    sort_order          INTEGER         NOT NULL DEFAULT 0,
    status              VARCHAR(32)     NOT NULL DEFAULT 'PENDING',

    -- 校验规则
    validation_rules    JSONB,
    accepted_formats    VARCHAR(200),
    max_file_size       BIGINT,
    max_file_count      INTEGER         DEFAULT 10,

    -- 完成信息
    completed_at        TIMESTAMPTZ,
    completed_by        VARCHAR(64),

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    CONSTRAINT uk_task_item_code UNIQUE (task_id, item_code),
    CONSTRAINT fk_task_item_task FOREIGN KEY (task_id) REFERENCES biz_intake_task(id)
);

CREATE INDEX IF NOT EXISTS idx_task_item_task   ON biz_intake_task_item(task_id);
CREATE INDEX IF NOT EXISTS idx_task_item_tenant ON biz_intake_task_item(tenant_id);
CREATE INDEX IF NOT EXISTS idx_task_item_status ON biz_intake_task_item(status)          WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_intake_task_item IS '任务收集项表 — 任务内的具体收集项';
COMMENT ON COLUMN biz_intake_task_item.task_id IS '关联 biz_intake_task.id';
COMMENT ON COLUMN biz_intake_task_item.item_code IS '收集项编码';
COMMENT ON COLUMN biz_intake_task_item.item_name IS '收集项名称';
COMMENT ON COLUMN biz_intake_task_item.item_type IS '类型: FILE/FORM/TEXT/SIGNATURE';
COMMENT ON COLUMN biz_intake_task_item.is_required IS '是否必填';
COMMENT ON COLUMN biz_intake_task_item.validation_rules IS '校验规则（JSON）';
COMMENT ON COLUMN biz_intake_task_item.accepted_formats IS '接受的文件格式: pdf,jpg,png';
COMMENT ON COLUMN biz_intake_task_item.max_file_size IS '最大文件大小（字节）';
COMMENT ON COLUMN biz_intake_task_item.status IS '状态: PENDING/UPLOADED/APPROVED/REJECTED';


-- ============================================================
-- Part 3: biz_intake_material — 收集材料表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_intake_material (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联信息
    task_id             VARCHAR(64),
    task_item_id        VARCHAR(64),
    case_id             VARCHAR(64),
    customer_id         VARCHAR(64)     NOT NULL,

    -- 业务字段
    material_no         VARCHAR(64)     NOT NULL,
    material_name       VARCHAR(200)    NOT NULL,
    material_type       VARCHAR(50)     NOT NULL,
    category            VARCHAR(50),
    description         VARCHAR(500),
    source              VARCHAR(50),
    file_count          INTEGER         NOT NULL DEFAULT 0,
    total_size          BIGINT          NOT NULL DEFAULT 0,
    status              VARCHAR(32)     NOT NULL DEFAULT 'PENDING',

    -- 审核信息
    reviewed_at         TIMESTAMPTZ,
    reviewed_by         VARCHAR(64),
    review_comment      VARCHAR(500),

    -- 元数据（不包含医学解析内容）
    metadata            JSONB,

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    CONSTRAINT uk_material_no UNIQUE (tenant_id, material_no)
);

CREATE INDEX IF NOT EXISTS idx_material_tenant    ON biz_intake_material(tenant_id);
CREATE INDEX IF NOT EXISTS idx_material_task      ON biz_intake_material(task_id)                   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_material_task_item ON biz_intake_material(task_item_id)              WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_material_case      ON biz_intake_material(case_id)                   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_material_customer  ON biz_intake_material(tenant_id, customer_id)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_material_type      ON biz_intake_material(tenant_id, material_type)  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_material_status    ON biz_intake_material(tenant_id, status)         WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_intake_material IS '收集材料表 — 客户提交的资料记录';
COMMENT ON COLUMN biz_intake_material.id IS '主键 ID（应用层生成）';
COMMENT ON COLUMN biz_intake_material.task_id IS '关联任务 ID';
COMMENT ON COLUMN biz_intake_material.task_item_id IS '关联任务项 ID';
COMMENT ON COLUMN biz_intake_material.case_id IS '关联 Case ID';
COMMENT ON COLUMN biz_intake_material.customer_id IS '客户 ID';
COMMENT ON COLUMN biz_intake_material.material_no IS '材料编号';
COMMENT ON COLUMN biz_intake_material.material_type IS '材料类型: ID_CARD/PASSPORT/MEDICAL_RECORD/EXAMINATION/CONSENT_FORM/OTHER';
COMMENT ON COLUMN biz_intake_material.source IS '来源: UPLOAD/SCAN/IMPORT';
COMMENT ON COLUMN biz_intake_material.status IS '状态: PENDING/REVIEWING/APPROVED/REJECTED';
COMMENT ON COLUMN biz_intake_material.metadata IS '元数据（文件信息，不含医学内容）';


-- ============================================================
-- Part 4: biz_intake_material_file — 材料文件关联表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_intake_material_file (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联信息
    material_id         VARCHAR(64)     NOT NULL,
    file_id             VARCHAR(64)     NOT NULL,

    -- 文件信息（冗余存储，方便查询）
    file_name           VARCHAR(200)    NOT NULL,
    file_type           VARCHAR(100),
    file_size           BIGINT,
    file_url            VARCHAR(512),
    sort_order          INTEGER         NOT NULL DEFAULT 0,

    -- 业务字段
    page_number         INTEGER,
    description         VARCHAR(200),

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    CONSTRAINT fk_material_file_material FOREIGN KEY (material_id) REFERENCES biz_intake_material(id)
);

CREATE INDEX IF NOT EXISTS idx_material_file_material ON biz_intake_material_file(material_id);
CREATE INDEX IF NOT EXISTS idx_material_file_tenant   ON biz_intake_material_file(tenant_id);
CREATE INDEX IF NOT EXISTS idx_material_file_file     ON biz_intake_material_file(file_id)          WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_intake_material_file IS '材料文件关联表 — 材料与文件中心的关联';
COMMENT ON COLUMN biz_intake_material_file.material_id IS '关联 biz_intake_material.id';
COMMENT ON COLUMN biz_intake_material_file.file_id IS '文件中心 file_metadata.id';
COMMENT ON COLUMN biz_intake_material_file.file_name IS '文件名（冗余）';
COMMENT ON COLUMN biz_intake_material_file.page_number IS '页码（多页文档时）';


-- ============================================================
-- Part 5: biz_intake_form_template — 表单模板表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_intake_form_template (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 业务字段
    template_code       VARCHAR(64)     NOT NULL,
    template_name       VARCHAR(200)    NOT NULL,
    template_type       VARCHAR(50)     NOT NULL,
    category            VARCHAR(50),
    description         VARCHAR(500),
    version             VARCHAR(20)     NOT NULL DEFAULT '1.0',
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    form_schema         JSONB           NOT NULL,
    ui_schema           JSONB,
    default_values      JSONB,
    validation_schema   JSONB,
    sort_order          INTEGER         NOT NULL DEFAULT 0,
    status              VARCHAR(32)     NOT NULL DEFAULT 'DRAFT',

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    CONSTRAINT uk_form_template_code UNIQUE (tenant_id, template_code, version)
);

CREATE INDEX IF NOT EXISTS idx_form_tpl_tenant   ON biz_intake_form_template(tenant_id);
CREATE INDEX IF NOT EXISTS idx_form_tpl_type     ON biz_intake_form_template(tenant_id, template_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_form_tpl_category ON biz_intake_form_template(tenant_id, category)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_form_tpl_active   ON biz_intake_form_template(tenant_id, is_active)     WHERE deleted_at IS NULL AND is_active = TRUE;

COMMENT ON TABLE biz_intake_form_template IS '表单模板表 — 资料收集表单定义';
COMMENT ON COLUMN biz_intake_form_template.template_code IS '模板编码';
COMMENT ON COLUMN biz_intake_form_template.template_name IS '模板名称';
COMMENT ON COLUMN biz_intake_form_template.template_type IS '类型: BASIC_INFO/MEDICAL_HISTORY/QUESTIONNAIRE/CONSENT';
COMMENT ON COLUMN biz_intake_form_template.form_schema IS '表单 Schema（JSON Schema 格式）';
COMMENT ON COLUMN biz_intake_form_template.ui_schema IS 'UI Schema（表单渲染配置）';
COMMENT ON COLUMN biz_intake_form_template.validation_schema IS '校验规则 Schema';


-- ============================================================
-- Part 6: biz_intake_form_submission — 表单提交记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_intake_form_submission (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联信息
    template_id         VARCHAR(64)     NOT NULL,
    template_version    VARCHAR(20)     NOT NULL,
    task_id             VARCHAR(64),
    task_item_id        VARCHAR(64),
    case_id             VARCHAR(64),
    customer_id         VARCHAR(64)     NOT NULL,

    -- 业务字段
    submission_no       VARCHAR(64)     NOT NULL,
    form_data           JSONB           NOT NULL,
    form_data_snapshot  JSONB,
    status              VARCHAR(32)     NOT NULL DEFAULT 'DRAFT',

    -- 提交信息
    submitted_at        TIMESTAMPTZ,
    submitted_by        VARCHAR(64),
    submit_ip           VARCHAR(50),
    submit_device       VARCHAR(200),

    -- 审核信息
    reviewed_at         TIMESTAMPTZ,
    reviewed_by         VARCHAR(64),
    review_status       VARCHAR(32),
    review_comment      VARCHAR(500),

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    CONSTRAINT uk_form_submission_no UNIQUE (tenant_id, submission_no),
    CONSTRAINT fk_form_submission_template FOREIGN KEY (template_id) REFERENCES biz_intake_form_template(id)
);

CREATE INDEX IF NOT EXISTS idx_form_sub_tenant    ON biz_intake_form_submission(tenant_id);
CREATE INDEX IF NOT EXISTS idx_form_sub_template  ON biz_intake_form_submission(template_id);
CREATE INDEX IF NOT EXISTS idx_form_sub_task      ON biz_intake_form_submission(task_id)               WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_form_sub_case      ON biz_intake_form_submission(case_id)               WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_form_sub_customer  ON biz_intake_form_submission(tenant_id, customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_form_sub_status    ON biz_intake_form_submission(tenant_id, status)     WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_intake_form_submission IS '表单提交记录表 — 客户表单提交';
COMMENT ON COLUMN biz_intake_form_submission.template_id IS '关联 biz_intake_form_template.id';
COMMENT ON COLUMN biz_intake_form_submission.template_version IS '使用的模板版本';
COMMENT ON COLUMN biz_intake_form_submission.submission_no IS '提交编号';
COMMENT ON COLUMN biz_intake_form_submission.form_data IS '表单数据（JSON）';
COMMENT ON COLUMN biz_intake_form_submission.form_data_snapshot IS '提交时快照';
COMMENT ON COLUMN biz_intake_form_submission.status IS '状态: DRAFT/SUBMITTED/REVIEWING/APPROVED/REJECTED';
COMMENT ON COLUMN biz_intake_form_submission.review_status IS '审核状态: APPROVED/NEED_REVISION/REJECTED';


-- ============================================================
-- 表结构摘要
-- ============================================================
--
-- | 表名                        | 域         | 说明                    | 预留字段 |
-- |-----------------------------|------------|------------------------|---------|
-- | biz_intake_task             | 任务域     | 资料收集任务表          | 8       |
-- | biz_intake_task_item        | 任务域     | 任务收集项表            | 8       |
-- | biz_intake_material         | 材料域     | 收集材料表              | 8       |
-- | biz_intake_material_file    | 材料域     | 材料文件关联表          | 8       |
-- | biz_intake_form_template    | 表单域     | 表单模板表              | 8       |
-- | biz_intake_form_submission  | 表单域     | 表单提交记录表          | 8       |
--
-- 设计要点：
-- 1. 只收集资料，不解析、不评估、不生成医疗建议
-- 2. 文件存储走 file-center（material_file 关联）
-- 3. 表单采用 JSON Schema 驱动
-- 4. 支持任务-项-材料三级结构
-- ============================================================
