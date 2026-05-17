-- ============================================================
-- Flyway Migration: V100__create_contracts_tables.sql
-- Module: brix-app-contracts (Contract Management Service)
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
-- ❌ 不做电子签名系统（第三方服务对接 v3+ 再评估）
-- ❌ 合同签署后不可变（修改须新建版本并重新签署）
-- ❌ 合同事件不直接驱动 Case 推进（仅作为事实记录）
--
-- 核心表清单：
-- | 表名                        | 说明                     |
-- |-----------------------------|--------------------------|
-- | biz_contract_template       | 合同模板表               |
-- | biz_contract_template_var   | 模板变量定义表           |
-- | biz_contract                | 合同实例主表             |
-- | biz_contract_signatory      | 合同签署方表             |
-- | biz_contract_attachment     | 合同附件表               |
-- | biz_contract_audit_log      | 合同操作审计（只追加）   |
-- ============================================================


-- ============================================================
-- Part 1: biz_contract_template — 合同模板表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_contract_template (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 业务字段
    template_code       VARCHAR(64)     NOT NULL,
    template_name       VARCHAR(200)    NOT NULL,
    template_type       VARCHAR(50)     NOT NULL,
    category            VARCHAR(50),
    description         VARCHAR(500),
    content             TEXT,
    content_type        VARCHAR(32)     NOT NULL DEFAULT 'HTML',
    version             VARCHAR(20)     NOT NULL DEFAULT '1.0',
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    requires_signature  BOOLEAN         NOT NULL DEFAULT TRUE,
    signature_count     INTEGER         NOT NULL DEFAULT 2,
    validity_days       INTEGER,
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
    CONSTRAINT uk_contract_template_code UNIQUE (tenant_id, template_code, version)
);

CREATE INDEX IF NOT EXISTS idx_contract_tpl_tenant   ON biz_contract_template(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_tpl_type     ON biz_contract_template(tenant_id, template_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contract_tpl_category ON biz_contract_template(tenant_id, category)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contract_tpl_status   ON biz_contract_template(tenant_id, status)        WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contract_tpl_active   ON biz_contract_template(tenant_id, is_active)     WHERE deleted_at IS NULL AND is_active = TRUE;

COMMENT ON TABLE biz_contract_template IS '合同模板表 — 标准合同模板定义';
COMMENT ON COLUMN biz_contract_template.id IS '主键 ID（应用层生成）';
COMMENT ON COLUMN biz_contract_template.template_code IS '模板编码';
COMMENT ON COLUMN biz_contract_template.template_name IS '模板名称';
COMMENT ON COLUMN biz_contract_template.template_type IS '模板类型: SERVICE_AGREEMENT/NDA/CONSENT/AUTHORIZATION';
COMMENT ON COLUMN biz_contract_template.category IS '分类: CHECKUP/TREATMENT/TRANSLATION/TRANSPORT';
COMMENT ON COLUMN biz_contract_template.content IS '模板内容（支持变量占位符）';
COMMENT ON COLUMN biz_contract_template.content_type IS '内容格式: HTML/MARKDOWN/PDF';
COMMENT ON COLUMN biz_contract_template.version IS '版本号';
COMMENT ON COLUMN biz_contract_template.requires_signature IS '是否需要签署';
COMMENT ON COLUMN biz_contract_template.signature_count IS '需要签署方数量';
COMMENT ON COLUMN biz_contract_template.validity_days IS '合同有效期（天数）';
COMMENT ON COLUMN biz_contract_template.status IS '状态: DRAFT/ACTIVE/DISABLED/ARCHIVED';


-- ============================================================
-- Part 2: biz_contract_template_var — 模板变量定义表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_contract_template_var (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联模板
    template_id         VARCHAR(64)     NOT NULL,

    -- 业务字段
    var_name            VARCHAR(64)     NOT NULL,
    var_label           VARCHAR(100)    NOT NULL,
    var_type            VARCHAR(32)     NOT NULL DEFAULT 'STRING',
    is_required         BOOLEAN         NOT NULL DEFAULT TRUE,
    default_value       VARCHAR(500),
    validation_rule     VARCHAR(200),
    placeholder         VARCHAR(200),
    sort_order          INTEGER         NOT NULL DEFAULT 0,

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
    CONSTRAINT uk_template_var UNIQUE (template_id, var_name),
    CONSTRAINT fk_template_var_template FOREIGN KEY (template_id) REFERENCES biz_contract_template(id)
);

CREATE INDEX IF NOT EXISTS idx_template_var_template ON biz_contract_template_var(template_id);
CREATE INDEX IF NOT EXISTS idx_template_var_tenant   ON biz_contract_template_var(tenant_id);

COMMENT ON TABLE biz_contract_template_var IS '模板变量定义表 — 合同模板的变量配置';
COMMENT ON COLUMN biz_contract_template_var.template_id IS '关联 biz_contract_template.id';
COMMENT ON COLUMN biz_contract_template_var.var_name IS '变量名（如 customer_name）';
COMMENT ON COLUMN biz_contract_template_var.var_label IS '变量显示标签';
COMMENT ON COLUMN biz_contract_template_var.var_type IS '变量类型: STRING/NUMBER/DATE/BOOLEAN';
COMMENT ON COLUMN biz_contract_template_var.is_required IS '是否必填';
COMMENT ON COLUMN biz_contract_template_var.validation_rule IS '校验规则（正则表达式）';


-- ============================================================
-- Part 3: biz_contract — 合同实例主表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_contract (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联信息
    template_id         VARCHAR(64),
    template_version    VARCHAR(20),
    case_id             VARCHAR(64),
    customer_id         VARCHAR(64),

    -- 业务字段
    contract_no         VARCHAR(64)     NOT NULL,
    contract_name       VARCHAR(200)    NOT NULL,
    contract_type       VARCHAR(50)     NOT NULL,
    category            VARCHAR(50),
    content             TEXT,
    content_snapshot    TEXT,
    variables_data      JSONB,
    
    -- 状态 & 有效期
    status              VARCHAR(32)     NOT NULL DEFAULT 'DRAFT',
    effective_date      DATE,
    expiry_date         DATE,
    
    -- 签署信息
    sign_deadline       TIMESTAMPTZ,
    signed_at           TIMESTAMPTZ,
    all_signed          BOOLEAN         NOT NULL DEFAULT FALSE,
    
    -- 金额信息（可选）
    total_amount        DECIMAL(12,2),
    currency            VARCHAR(10)     DEFAULT 'JPY',
    
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
    CONSTRAINT uk_contract_no UNIQUE (tenant_id, contract_no)
);

CREATE INDEX IF NOT EXISTS idx_contract_tenant     ON biz_contract(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_template   ON biz_contract(template_id);
CREATE INDEX IF NOT EXISTS idx_contract_case       ON biz_contract(case_id)                     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contract_customer   ON biz_contract(tenant_id, customer_id)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contract_type       ON biz_contract(tenant_id, contract_type)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contract_status     ON biz_contract(tenant_id, status)           WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contract_effective  ON biz_contract(tenant_id, effective_date)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contract_expiry     ON biz_contract(tenant_id, expiry_date)      WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_contract IS '合同实例主表 — 具体签署的合同';
COMMENT ON COLUMN biz_contract.id IS '主键 ID（应用层生成）';
COMMENT ON COLUMN biz_contract.template_id IS '来源模板 ID';
COMMENT ON COLUMN biz_contract.template_version IS '模板版本号（快照）';
COMMENT ON COLUMN biz_contract.case_id IS '关联 Case ID';
COMMENT ON COLUMN biz_contract.customer_id IS '客户 ID';
COMMENT ON COLUMN biz_contract.contract_no IS '合同编号';
COMMENT ON COLUMN biz_contract.contract_name IS '合同名称';
COMMENT ON COLUMN biz_contract.contract_type IS '合同类型: SERVICE_AGREEMENT/NDA/CONSENT';
COMMENT ON COLUMN biz_contract.content IS '当前合同内容';
COMMENT ON COLUMN biz_contract.content_snapshot IS '签署时内容快照（不可变）';
COMMENT ON COLUMN biz_contract.variables_data IS '变量填充数据（JSON）';
COMMENT ON COLUMN biz_contract.status IS '状态: DRAFT/PENDING_SIGN/PARTIALLY_SIGNED/SIGNED/EXPIRED/TERMINATED/VOIDED';
COMMENT ON COLUMN biz_contract.effective_date IS '生效日期';
COMMENT ON COLUMN biz_contract.expiry_date IS '到期日期';
COMMENT ON COLUMN biz_contract.sign_deadline IS '签署截止时间';
COMMENT ON COLUMN biz_contract.signed_at IS '完成签署时间';
COMMENT ON COLUMN biz_contract.all_signed IS '是否所有方都已签署';


-- ============================================================
-- Part 4: biz_contract_signatory — 合同签署方表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_contract_signatory (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联合同
    contract_id         VARCHAR(64)     NOT NULL,

    -- 签署方信息
    signatory_type      VARCHAR(32)     NOT NULL,
    signatory_id        VARCHAR(64),
    signatory_name      VARCHAR(100)    NOT NULL,
    signatory_role      VARCHAR(50),
    email               VARCHAR(200),
    phone               VARCHAR(32),
    id_type             VARCHAR(32),
    id_number           VARCHAR(64),
    sort_order          INTEGER         NOT NULL DEFAULT 0,

    -- 签署状态
    status              VARCHAR(32)     NOT NULL DEFAULT 'PENDING',
    signed_at           TIMESTAMPTZ,
    sign_ip             VARCHAR(50),
    sign_device         VARCHAR(200),
    signature_data      TEXT,
    
    -- 通知记录
    notified_at         TIMESTAMPTZ,
    reminder_count      INTEGER         NOT NULL DEFAULT 0,

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
    CONSTRAINT fk_signatory_contract FOREIGN KEY (contract_id) REFERENCES biz_contract(id)
);

CREATE INDEX IF NOT EXISTS idx_signatory_contract  ON biz_contract_signatory(contract_id);
CREATE INDEX IF NOT EXISTS idx_signatory_tenant    ON biz_contract_signatory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_signatory_type      ON biz_contract_signatory(signatory_type)        WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_signatory_status    ON biz_contract_signatory(tenant_id, status)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_signatory_user      ON biz_contract_signatory(signatory_id)          WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_contract_signatory IS '合同签署方表 — 合同参与签署的各方';
COMMENT ON COLUMN biz_contract_signatory.contract_id IS '关联 biz_contract.id';
COMMENT ON COLUMN biz_contract_signatory.signatory_type IS '签署方类型: CUSTOMER/COMPANY/PARTNER/WITNESS';
COMMENT ON COLUMN biz_contract_signatory.signatory_id IS '签署方用户/机构 ID';
COMMENT ON COLUMN biz_contract_signatory.signatory_name IS '签署方名称';
COMMENT ON COLUMN biz_contract_signatory.signatory_role IS '签署角色: PARTY_A/PARTY_B/GUARANTOR';
COMMENT ON COLUMN biz_contract_signatory.status IS '状态: PENDING/NOTIFIED/SIGNED/REJECTED/EXPIRED';
COMMENT ON COLUMN biz_contract_signatory.signed_at IS '签署时间';
COMMENT ON COLUMN biz_contract_signatory.sign_ip IS '签署 IP';
COMMENT ON COLUMN biz_contract_signatory.signature_data IS '签名数据（可为图片 Base64 或签名服务返回）';


-- ============================================================
-- Part 5: biz_contract_attachment — 合同附件表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_contract_attachment (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联合同
    contract_id         VARCHAR(64)     NOT NULL,

    -- 文件信息
    file_id             VARCHAR(64),
    file_name           VARCHAR(200)    NOT NULL,
    file_type           VARCHAR(100),
    file_size           BIGINT,
    file_url            VARCHAR(512),
    attachment_type     VARCHAR(50)     NOT NULL DEFAULT 'SUPPLEMENT',
    description         VARCHAR(500),
    sort_order          INTEGER         NOT NULL DEFAULT 0,

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
    CONSTRAINT fk_attachment_contract FOREIGN KEY (contract_id) REFERENCES biz_contract(id)
);

CREATE INDEX IF NOT EXISTS idx_attachment_contract ON biz_contract_attachment(contract_id);
CREATE INDEX IF NOT EXISTS idx_attachment_tenant   ON biz_contract_attachment(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attachment_file     ON biz_contract_attachment(file_id)              WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_contract_attachment IS '合同附件表 — 合同相关文件';
COMMENT ON COLUMN biz_contract_attachment.contract_id IS '关联 biz_contract.id';
COMMENT ON COLUMN biz_contract_attachment.file_id IS '关联文件中心 ID';
COMMENT ON COLUMN biz_contract_attachment.file_name IS '文件名';
COMMENT ON COLUMN biz_contract_attachment.attachment_type IS '附件类型: CONTRACT_PDF/SIGNED_PDF/SUPPLEMENT/ID_COPY';


-- ============================================================
-- Part 6: biz_contract_audit_log — 合同操作审计（只追加）
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_contract_audit_log (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联信息
    contract_id         VARCHAR(64)     NOT NULL,
    signatory_id        VARCHAR(64),

    -- 业务字段
    action              VARCHAR(50)     NOT NULL,
    action_detail       VARCHAR(500),
    before_status       VARCHAR(32),
    after_status        VARCHAR(32),
    operator_id         VARCHAR(64),
    operator_name       VARCHAR(100),
    operator_ip         VARCHAR(50),
    user_agent          VARCHAR(500),
    detail              JSONB,

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段（只追加表）
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
);

CREATE INDEX IF NOT EXISTS idx_contract_audit_tenant   ON biz_contract_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_audit_contract ON biz_contract_audit_log(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_audit_action   ON biz_contract_audit_log(tenant_id, action);
CREATE INDEX IF NOT EXISTS idx_contract_audit_time     ON biz_contract_audit_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contract_audit_operator ON biz_contract_audit_log(operator_id);

COMMENT ON TABLE biz_contract_audit_log IS '合同操作审计 — 合同操作记录（只追加）';
COMMENT ON COLUMN biz_contract_audit_log.contract_id IS '关联 biz_contract.id';
COMMENT ON COLUMN biz_contract_audit_log.signatory_id IS '关联签署方 ID（如签署操作）';
COMMENT ON COLUMN biz_contract_audit_log.action IS '操作: CREATE/UPDATE/SUBMIT/SIGN/REJECT/TERMINATE/VOID/VIEW/DOWNLOAD';
COMMENT ON COLUMN biz_contract_audit_log.before_status IS '操作前状态';
COMMENT ON COLUMN biz_contract_audit_log.after_status IS '操作后状态';
COMMENT ON COLUMN biz_contract_audit_log.detail IS '操作详情（JSON）';

-- ⚠️ 审计日志只允许 INSERT 的 Trigger
CREATE OR REPLACE FUNCTION prevent_contract_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Contract audit log is immutable. UPDATE/DELETE is not allowed.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contract_audit_no_update
    BEFORE UPDATE OR DELETE ON biz_contract_audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_contract_audit_mutation();


-- ============================================================
-- 表结构摘要
-- ============================================================
--
-- | 表名                        | 域         | 说明                    | 预留字段 |
-- |-----------------------------|------------|------------------------|---------|
-- | biz_contract_template       | 模板域     | 合同模板表              | 8       |
-- | biz_contract_template_var   | 模板域     | 模板变量定义表          | 8       |
-- | biz_contract                | 合同域     | 合同实例主表            | 8       |
-- | biz_contract_signatory      | 签署域     | 合同签署方表            | 8       |
-- | biz_contract_attachment     | 附件域     | 合同附件表              | 8       |
-- | biz_contract_audit_log      | 审计域     | 合同操作审计（只追加）  | 8       |
--
-- 设计要点：
-- 1. 合同签署后不可变（修改须新建版本重新签署）
-- 2. content_snapshot 存储签署时快照
-- 3. 支持多方签署（signatory 表）
-- 4. 审计日志只追加（带 Trigger 防护）
-- ============================================================
