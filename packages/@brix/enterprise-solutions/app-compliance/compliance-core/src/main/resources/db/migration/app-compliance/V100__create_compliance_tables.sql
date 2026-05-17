-- ============================================================
-- Flyway Migration: V100__create_compliance_tables.sql
-- Module: brix-app-compliance (Risk & Compliance Service)
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
-- 核心表清单：
-- | 表名                              | 说明                     |
-- |-----------------------------------|--------------------------|
-- | biz_compliance_script_template    | 话术模板表               |
-- | biz_compliance_forbidden_word     | 禁止词表                 |
-- | biz_compliance_script_usage_log   | 话术使用审计表（只追加） |
-- | biz_compliance_disclaimer         | 免责声明表               |
-- | biz_compliance_audit_log          | 风控审计日志（只追加）   |
-- ============================================================


-- ============================================================
-- Part 1: biz_compliance_script_template — 话术模板表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_compliance_script_template (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 业务字段
    template_code       VARCHAR(64)     NOT NULL,
    template_name       VARCHAR(100)    NOT NULL,
    category            VARCHAR(50)     NOT NULL,
    content             TEXT            NOT NULL,
    content_type        VARCHAR(32)     NOT NULL DEFAULT 'TEXT',
    variables           JSONB,
    version             VARCHAR(20)     NOT NULL DEFAULT '1.0',
    is_default          BOOLEAN         NOT NULL DEFAULT FALSE,
    status              VARCHAR(32)     NOT NULL DEFAULT 'ACTIVE',

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
    CONSTRAINT uk_script_template_code UNIQUE (tenant_id, template_code, version)
);

CREATE INDEX IF NOT EXISTS idx_script_template_tenant   ON biz_compliance_script_template(tenant_id);
CREATE INDEX IF NOT EXISTS idx_script_template_category ON biz_compliance_script_template(tenant_id, category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_script_template_status   ON biz_compliance_script_template(tenant_id, status)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_script_template_default  ON biz_compliance_script_template(tenant_id, category, is_default) WHERE deleted_at IS NULL AND is_default = TRUE;

COMMENT ON TABLE biz_compliance_script_template IS '话术模板表 — 标准话术/沟通模板';
COMMENT ON COLUMN biz_compliance_script_template.id IS '主键 ID（应用层生成）';
COMMENT ON COLUMN biz_compliance_script_template.template_code IS '模板编码';
COMMENT ON COLUMN biz_compliance_script_template.template_name IS '模板名称';
COMMENT ON COLUMN biz_compliance_script_template.category IS '分类: GREETING/SERVICE_INTRO/FEE_EXPLAIN/DISCLAIMER/FOLLOW_UP';
COMMENT ON COLUMN biz_compliance_script_template.content IS '话术内容（支持 {{variable}} 占位符）';
COMMENT ON COLUMN biz_compliance_script_template.content_type IS '内容类型: TEXT/HTML/MARKDOWN';
COMMENT ON COLUMN biz_compliance_script_template.variables IS '变量定义（JSON）';
COMMENT ON COLUMN biz_compliance_script_template.version IS '版本号';
COMMENT ON COLUMN biz_compliance_script_template.is_default IS '是否默认模板';
COMMENT ON COLUMN biz_compliance_script_template.status IS '状态: DRAFT/ACTIVE/DISABLED/ARCHIVED';


-- ============================================================
-- Part 2: biz_compliance_forbidden_word — 禁止词表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_compliance_forbidden_word (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 业务字段
    word                VARCHAR(200)    NOT NULL,
    word_pattern        VARCHAR(500),
    is_regex            BOOLEAN         NOT NULL DEFAULT FALSE,
    category            VARCHAR(50),
    reason              VARCHAR(500),
    severity            VARCHAR(20)     NOT NULL DEFAULT 'HIGH',
    replacement         VARCHAR(200),
    status              VARCHAR(32)     NOT NULL DEFAULT 'ACTIVE',

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
    ext_timestamp_1     TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_forbidden_word_tenant   ON biz_compliance_forbidden_word(tenant_id);
CREATE INDEX IF NOT EXISTS idx_forbidden_word_severity ON biz_compliance_forbidden_word(tenant_id, severity) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_forbidden_word_category ON biz_compliance_forbidden_word(tenant_id, category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_forbidden_word_status   ON biz_compliance_forbidden_word(tenant_id, status)   WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_compliance_forbidden_word IS '禁止词表 — 风控禁止词汇';
COMMENT ON COLUMN biz_compliance_forbidden_word.id IS '主键 ID（应用层生成）';
COMMENT ON COLUMN biz_compliance_forbidden_word.word IS '禁止词';
COMMENT ON COLUMN biz_compliance_forbidden_word.word_pattern IS '正则表达式模式（当 is_regex=TRUE 时使用）';
COMMENT ON COLUMN biz_compliance_forbidden_word.is_regex IS '是否为正则表达式';
COMMENT ON COLUMN biz_compliance_forbidden_word.category IS '分类: MEDICAL/LEGAL/PRICING/PROMISE';
COMMENT ON COLUMN biz_compliance_forbidden_word.reason IS '禁用原因';
COMMENT ON COLUMN biz_compliance_forbidden_word.severity IS '严重程度: CRITICAL/HIGH/MEDIUM/LOW';
COMMENT ON COLUMN biz_compliance_forbidden_word.replacement IS '建议替换词';
COMMENT ON COLUMN biz_compliance_forbidden_word.status IS '状态: ACTIVE/DISABLED';


-- ============================================================
-- Part 3: biz_compliance_script_usage_log — 话术使用审计表（只追加）
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_compliance_script_usage_log (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联信息
    script_id           VARCHAR(64)     NOT NULL,
    script_version      VARCHAR(20)     NOT NULL,
    case_id             VARCHAR(64),
    customer_id         VARCHAR(64),

    -- 业务字段
    user_id             VARCHAR(64)     NOT NULL,
    user_name           VARCHAR(100),
    channel             VARCHAR(32),
    context_type        VARCHAR(50),
    used_content        TEXT            NOT NULL,
    variables_used      JSONB,

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段（只追加表，无 updated_at）
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

    -- ⚠️ 审计表无软删除字段，无外键约束
);

CREATE INDEX IF NOT EXISTS idx_script_usage_tenant    ON biz_compliance_script_usage_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_script_usage_user      ON biz_compliance_script_usage_log(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_script_usage_case      ON biz_compliance_script_usage_log(case_id);
CREATE INDEX IF NOT EXISTS idx_script_usage_script    ON biz_compliance_script_usage_log(script_id);
CREATE INDEX IF NOT EXISTS idx_script_usage_time      ON biz_compliance_script_usage_log(tenant_id, created_at DESC);

COMMENT ON TABLE biz_compliance_script_usage_log IS '话术使用审计表 — 记录话术使用历史（只追加）';
COMMENT ON COLUMN biz_compliance_script_usage_log.script_id IS '使用的话术模板 ID';
COMMENT ON COLUMN biz_compliance_script_usage_log.script_version IS '使用时的模板版本号';
COMMENT ON COLUMN biz_compliance_script_usage_log.case_id IS '关联 Case ID';
COMMENT ON COLUMN biz_compliance_script_usage_log.customer_id IS '客户 ID';
COMMENT ON COLUMN biz_compliance_script_usage_log.user_id IS '使用者用户 ID';
COMMENT ON COLUMN biz_compliance_script_usage_log.channel IS '使用渠道: WEB/MOBILE/WECHAT/PHONE';
COMMENT ON COLUMN biz_compliance_script_usage_log.context_type IS '场景类型: CONSULTATION/FOLLOW_UP/COMPLAINT';
COMMENT ON COLUMN biz_compliance_script_usage_log.used_content IS '实际使用的内容（变量已填充）';
COMMENT ON COLUMN biz_compliance_script_usage_log.variables_used IS '使用的变量值';

-- ⚠️ 审计表只允许 INSERT 的 Trigger
CREATE OR REPLACE FUNCTION prevent_script_usage_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Script usage log is immutable. UPDATE/DELETE is not allowed.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_script_usage_no_update
    BEFORE UPDATE OR DELETE ON biz_compliance_script_usage_log
    FOR EACH ROW EXECUTE FUNCTION prevent_script_usage_mutation();


-- ============================================================
-- Part 4: biz_compliance_disclaimer — 免责声明表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_compliance_disclaimer (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 业务字段
    disclaimer_code     VARCHAR(64)     NOT NULL,
    disclaimer_name     VARCHAR(100)    NOT NULL,
    category            VARCHAR(50)     NOT NULL,
    content             TEXT            NOT NULL,
    content_type        VARCHAR(32)     NOT NULL DEFAULT 'TEXT',
    version             VARCHAR(20)     NOT NULL DEFAULT '1.0',
    is_mandatory        BOOLEAN         NOT NULL DEFAULT TRUE,
    display_position    VARCHAR(50),
    status              VARCHAR(32)     NOT NULL DEFAULT 'ACTIVE',

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
    CONSTRAINT uk_disclaimer_code UNIQUE (tenant_id, disclaimer_code, version)
);

CREATE INDEX IF NOT EXISTS idx_disclaimer_tenant   ON biz_compliance_disclaimer(tenant_id);
CREATE INDEX IF NOT EXISTS idx_disclaimer_category ON biz_compliance_disclaimer(tenant_id, category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_disclaimer_status   ON biz_compliance_disclaimer(tenant_id, status)   WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_compliance_disclaimer IS '免责声明表 — 法律免责条款';
COMMENT ON COLUMN biz_compliance_disclaimer.disclaimer_code IS '免责声明编码';
COMMENT ON COLUMN biz_compliance_disclaimer.disclaimer_name IS '免责声明名称';
COMMENT ON COLUMN biz_compliance_disclaimer.category IS '分类: MEDICAL/SERVICE/PRICE/TRAVEL';
COMMENT ON COLUMN biz_compliance_disclaimer.content IS '声明内容';
COMMENT ON COLUMN biz_compliance_disclaimer.is_mandatory IS '是否必须签署';
COMMENT ON COLUMN biz_compliance_disclaimer.display_position IS '展示位置: CONTRACT/INTAKE/BOOKING';


-- ============================================================
-- Part 5: biz_compliance_audit_log — 风控审计日志（只追加）
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_compliance_audit_log (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 业务字段
    audit_type          VARCHAR(50)     NOT NULL,
    event_type          VARCHAR(50)     NOT NULL,
    severity            VARCHAR(20)     NOT NULL DEFAULT 'INFO',
    source_type         VARCHAR(50),
    source_id           VARCHAR(64),
    case_id             VARCHAR(64),
    user_id             VARCHAR(64),
    user_name           VARCHAR(100),
    description         VARCHAR(500),
    detail              JSONB,
    client_ip           VARCHAR(50),
    user_agent          VARCHAR(500),

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

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant   ON biz_compliance_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_type     ON biz_compliance_audit_log(tenant_id, audit_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_event    ON biz_compliance_audit_log(tenant_id, event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON biz_compliance_audit_log(tenant_id, severity);
CREATE INDEX IF NOT EXISTS idx_audit_log_case     ON biz_compliance_audit_log(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user     ON biz_compliance_audit_log(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_time     ON biz_compliance_audit_log(tenant_id, created_at DESC);

COMMENT ON TABLE biz_compliance_audit_log IS '风控审计日志 — 合规事件记录（只追加）';
COMMENT ON COLUMN biz_compliance_audit_log.audit_type IS '审计类型: FORBIDDEN_WORD_HIT/SCRIPT_VIOLATION/UNAUTHORIZED_ACCESS';
COMMENT ON COLUMN biz_compliance_audit_log.event_type IS '事件类型: CHECK/WARN/BLOCK/ALERT';
COMMENT ON COLUMN biz_compliance_audit_log.severity IS '严重程度: CRITICAL/HIGH/MEDIUM/LOW/INFO';
COMMENT ON COLUMN biz_compliance_audit_log.source_type IS '来源类型: SCRIPT/MESSAGE/DOCUMENT';
COMMENT ON COLUMN biz_compliance_audit_log.source_id IS '来源 ID';
COMMENT ON COLUMN biz_compliance_audit_log.detail IS '详细信息（JSON）';

-- ⚠️ 审计日志只允许 INSERT 的 Trigger
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Compliance audit log is immutable. UPDATE/DELETE is not allowed.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_log_no_update
    BEFORE UPDATE OR DELETE ON biz_compliance_audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();


-- ============================================================
-- 表结构摘要
-- ============================================================
--
-- | 表名                              | 域         | 说明                    | 预留字段 |
-- |-----------------------------------|------------|------------------------|---------|
-- | biz_compliance_script_template    | 话术域     | 话术模板表              | 8       |
-- | biz_compliance_forbidden_word     | 风控域     | 禁止词表                | 8       |
-- | biz_compliance_script_usage_log   | 审计域     | 话术使用审计（只追加）  | 8       |
-- | biz_compliance_disclaimer         | 法务域     | 免责声明表              | 8       |
-- | biz_compliance_audit_log          | 审计域     | 风控审计日志（只追加）  | 8       |
--
-- 设计要点：
-- 1. 软删除使用现代模式（deleted_at IS NULL）
-- 2. 审计表（script_usage_log, audit_log）只允许 INSERT（带 Trigger 防护）
-- 3. 话术模板支持版本管理和变量占位符
-- 4. 禁止词支持正则表达式和严重程度分级
-- ============================================================
