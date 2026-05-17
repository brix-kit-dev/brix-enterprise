-- ============================================================
-- Flyway Migration: V2__create_identity_tables.sql
-- Module: brix-app-identity (Layer 1 Plugin)
-- Version: 3.0.0
-- Date: 2026-02-12
--
-- 设计原则（对齐 platform-auth V1）：
-- 1. 每表 8 个预留字段（ext_varchar_1~5, ext_int_1, ext_json_1, ext_timestamp_1）
-- 2. 软删除（deleted + deleted_at）
-- 3. 统一审计字段（created_at, updated_at, created_by, updated_by）
-- 4. 多租户（tenant_id）
-- 5. VARCHAR(64) 主键（应用层生成）
--
-- 前置依赖：V1__create_auth_tables.sql（platform-auth 模块）
-- auth_user 由 V1 在 platform-auth 中创建，本脚本通过 FK 引用。
-- ============================================================


-- ============================================================
-- Part 1: identity_user_profile — 用户画像/身份扩展
-- ============================================================
CREATE TABLE IF NOT EXISTS identity_user_profile (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联 auth 域
    auth_user_id        VARCHAR(64)     NOT NULL,

    -- 身份类型（区分患者/员工/医生等）
    user_type           VARCHAR(32)     NOT NULL DEFAULT 'GENERAL',

    -- 画像信息
    display_name        VARCHAR(100),
    avatar_url          VARCHAR(512),
    gender              VARCHAR(16),
    birthday            DATE,
    locale              VARCHAR(16),
    timezone            VARCHAR(64),
    bio                 VARCHAR(500),

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(64),
    updated_by          VARCHAR(64),
    deleted             BOOLEAN         NOT NULL DEFAULT FALSE,
    deleted_at          TIMESTAMP,

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
    CONSTRAINT uk_identity_profile_auth_user UNIQUE (auth_user_id),
    CONSTRAINT fk_identity_profile_auth_user FOREIGN KEY (auth_user_id) REFERENCES auth_user(id)
);

CREATE INDEX IF NOT EXISTS idx_identity_profile_tenant    ON identity_user_profile(tenant_id);
CREATE INDEX IF NOT EXISTS idx_identity_profile_user_type ON identity_user_profile(user_type) WHERE deleted = FALSE;

COMMENT ON TABLE identity_user_profile IS '用户画像表 — 身份域扩展信息';
COMMENT ON COLUMN identity_user_profile.user_type IS '身份类型: GENERAL, PATIENT, EMPLOYEE, DOCTOR';
COMMENT ON COLUMN identity_user_profile.auth_user_id IS '关联 auth_user.id（一对一）';


-- ============================================================
-- Part 2: identity_social_connection — 第三方账号绑定
-- ============================================================
CREATE TABLE IF NOT EXISTS identity_social_connection (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联 auth 域
    auth_user_id        VARCHAR(64)     NOT NULL,

    -- 第三方信息
    provider            VARCHAR(32)     NOT NULL,
    provider_user_id    VARCHAR(255)    NOT NULL,

    -- 用户信息快照（来自第三方）
    nickname            VARCHAR(100),
    avatar_url          VARCHAR(512),
    email               VARCHAR(255),
    email_verified      BOOLEAN,

    -- Token 信息（AES-256-GCM 加密存储）
    access_token        TEXT,
    refresh_token       TEXT,
    id_token            TEXT,
    token_expires_at    TIMESTAMP,
    scope               VARCHAR(512),

    -- 附加数据
    raw_data            JSONB,

    -- 状态
    status              VARCHAR(32)     NOT NULL DEFAULT 'ACTIVE',
    bound_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at       TIMESTAMP,

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(64),
    updated_by          VARCHAR(64),
    deleted             BOOLEAN         NOT NULL DEFAULT FALSE,
    deleted_at          TIMESTAMP,

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
    CONSTRAINT uk_social_provider_user UNIQUE (provider, provider_user_id, tenant_id),
    CONSTRAINT fk_social_auth_user FOREIGN KEY (auth_user_id) REFERENCES auth_user(id)
);

CREATE INDEX IF NOT EXISTS idx_social_auth_user ON identity_social_connection(auth_user_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_social_provider  ON identity_social_connection(provider)     WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_social_tenant    ON identity_social_connection(tenant_id);

COMMENT ON TABLE identity_social_connection IS '第三方账号绑定表 — Google/GitHub/WeChat 等';
COMMENT ON COLUMN identity_social_connection.access_token  IS '提供商 Access Token（AES-GCM 加密）';
COMMENT ON COLUMN identity_social_connection.refresh_token IS '提供商 Refresh Token（AES-GCM 加密）';


-- ============================================================
-- Part 3: identity_patient_profile — 患者画像
-- ============================================================
CREATE TABLE IF NOT EXISTS identity_patient_profile (
    -- 主键
    id                      VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联用户画像
    user_profile_id         VARCHAR(64)     NOT NULL,

    -- 患者业务信息
    medical_record_no       VARCHAR(64),
    insurance_type          VARCHAR(32),
    insurance_no            VARCHAR(64),
    nationality             VARCHAR(64),
    passport_no             VARCHAR(64),
    preferred_language      VARCHAR(16),
    blood_type              VARCHAR(8),
    allergies               TEXT,
    medical_notes           TEXT,
    emergency_contact_name  VARCHAR(100),
    emergency_contact_phone VARCHAR(32),

    -- 多租户
    tenant_id               VARCHAR(64)     NOT NULL,

    -- 审计字段
    created_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by              VARCHAR(64),
    updated_by              VARCHAR(64),
    deleted                 BOOLEAN         NOT NULL DEFAULT FALSE,
    deleted_at              TIMESTAMP,

    -- 预留字段（8 个）
    ext_varchar_1           VARCHAR(255),
    ext_varchar_2           VARCHAR(255),
    ext_varchar_3           VARCHAR(255),
    ext_varchar_4           VARCHAR(255),
    ext_varchar_5           VARCHAR(255),
    ext_int_1               INTEGER,
    ext_json_1              JSONB,
    ext_timestamp_1         TIMESTAMP,

    -- 约束
    CONSTRAINT uk_patient_user_profile UNIQUE (user_profile_id),
    CONSTRAINT fk_patient_user_profile FOREIGN KEY (user_profile_id) REFERENCES identity_user_profile(id)
);

CREATE INDEX IF NOT EXISTS idx_patient_tenant     ON identity_patient_profile(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patient_medical_no ON identity_patient_profile(medical_record_no) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_patient_passport   ON identity_patient_profile(passport_no)       WHERE deleted = FALSE;

COMMENT ON TABLE identity_patient_profile IS '患者画像表 — 医疗中介患者专有信息';
COMMENT ON COLUMN identity_patient_profile.user_profile_id IS '关联 identity_user_profile.id（一对一）';


-- ============================================================
-- Part 4: identity_employee_profile — 员工画像
-- ============================================================
CREATE TABLE IF NOT EXISTS identity_employee_profile (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联用户画像
    user_profile_id     VARCHAR(64)     NOT NULL,

    -- 员工业务信息
    employee_no         VARCHAR(64),
    department          VARCHAR(100),
    position            VARCHAR(100),
    hire_date           DATE,
    work_phone          VARCHAR(32),
    work_email          VARCHAR(255),
    manager_id          VARCHAR(64),
    employee_status     VARCHAR(32)     NOT NULL DEFAULT 'ON_DUTY',

    -- 多租户
    tenant_id           VARCHAR(64)     NOT NULL,

    -- 审计字段
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(64),
    updated_by          VARCHAR(64),
    deleted             BOOLEAN         NOT NULL DEFAULT FALSE,
    deleted_at          TIMESTAMP,

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
    CONSTRAINT uk_employee_user_profile UNIQUE (user_profile_id),
    CONSTRAINT fk_employee_user_profile FOREIGN KEY (user_profile_id) REFERENCES identity_user_profile(id)
);

CREATE INDEX IF NOT EXISTS idx_employee_tenant      ON identity_employee_profile(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_no          ON identity_employee_profile(employee_no)      WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_employee_department  ON identity_employee_profile(department)       WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_employee_status      ON identity_employee_profile(employee_status)  WHERE deleted = FALSE;

COMMENT ON TABLE identity_employee_profile IS '员工画像表 — 医疗中介公司员工专有信息';
COMMENT ON COLUMN identity_employee_profile.employee_status IS '在职状态: ON_DUTY, ON_LEAVE, RESIGNED';


-- ============================================================
-- 表结构摘要
-- ============================================================
--
-- | 表名                          | 域       | 说明               | 预留字段 |
-- |-------------------------------|----------|--------------------|---------|
-- | identity_user_profile         | 身份域   | 用户画像表           | 8       |
-- | identity_social_connection    | 身份域   | 第三方账号绑定表      | 8       |
-- | identity_patient_profile      | 身份域   | 患者画像表           | 8       |
-- | identity_employee_profile     | 身份域   | 员工画像表           | 8       |
--
-- 前置依赖：auth_user 由 platform-auth V1__create_auth_tables.sql 创建
-- ============================================================
