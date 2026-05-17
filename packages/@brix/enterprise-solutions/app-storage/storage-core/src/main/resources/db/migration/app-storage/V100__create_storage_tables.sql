-- ============================================================
-- Flyway Migration: V100__create_storage_tables.sql
-- Module: brix-app-storage (File Center Service)
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
-- 【v2.1 设计说明】
-- - 将"医疗资料"等高风险文件能力从医疗域剥离
-- - 形成通用文件中心，支持权限控制和访问审计
--
-- 核心表清单：
-- | 表名                        | 说明                     |
-- |-----------------------------|--------------------------|
-- | storage_bucket              | 存储桶配置表             |
-- | storage_file                | 文件元数据表             |
-- | storage_folder              | 文件夹表                 |
-- | storage_file_share          | 文件分享表               |
-- | storage_access_log          | 文件访问日志（只追加）   |
-- | storage_quota               | 存储配额表               |
-- ============================================================


-- ============================================================
-- Part 1: storage_bucket — 存储桶配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS storage_bucket (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 业务字段
    bucket_code         VARCHAR(64)     NOT NULL,
    bucket_name         VARCHAR(100)    NOT NULL,
    bucket_type         VARCHAR(50)     NOT NULL,
    storage_provider    VARCHAR(50)     NOT NULL DEFAULT 'MINIO',
    region              VARCHAR(50),
    endpoint            VARCHAR(512),
    access_key          VARCHAR(200),
    secret_key          VARCHAR(500),
    config              JSONB,
    description         VARCHAR(500),
    is_public           BOOLEAN         NOT NULL DEFAULT FALSE,
    is_default          BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    status              VARCHAR(32)     NOT NULL DEFAULT 'ACTIVE',

    -- 配额限制
    max_file_size       BIGINT,
    allowed_extensions  VARCHAR(500),
    quota_bytes         BIGINT,
    used_bytes          BIGINT          NOT NULL DEFAULT 0,

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
    CONSTRAINT uk_bucket_code UNIQUE (tenant_id, bucket_code)
);

CREATE INDEX IF NOT EXISTS idx_bucket_tenant   ON storage_bucket(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bucket_type     ON storage_bucket(tenant_id, bucket_type)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bucket_provider ON storage_bucket(storage_provider)         WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bucket_default  ON storage_bucket(tenant_id, is_default)    WHERE deleted_at IS NULL AND is_default = TRUE;

COMMENT ON TABLE storage_bucket IS '存储桶配置表 — 对象存储桶配置';
COMMENT ON COLUMN storage_bucket.bucket_code IS '桶编码';
COMMENT ON COLUMN storage_bucket.bucket_name IS '桶名称';
COMMENT ON COLUMN storage_bucket.bucket_type IS '桶类型: GENERAL/MEDICAL/CONTRACT/AVATAR/TEMP';
COMMENT ON COLUMN storage_bucket.storage_provider IS '存储提供商: MINIO/S3/OSS/COS/LOCAL';
COMMENT ON COLUMN storage_bucket.max_file_size IS '最大文件大小（字节）';
COMMENT ON COLUMN storage_bucket.allowed_extensions IS '允许的文件扩展名（逗号分隔）';
COMMENT ON COLUMN storage_bucket.quota_bytes IS '配额（字节）';
COMMENT ON COLUMN storage_bucket.used_bytes IS '已使用（字节）';


-- ============================================================
-- Part 2: storage_file — 文件元数据表
-- ============================================================
CREATE TABLE IF NOT EXISTS storage_file (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联信息
    bucket_id           VARCHAR(64)     NOT NULL,
    folder_id           VARCHAR(64),

    -- 文件信息
    file_key            VARCHAR(500)    NOT NULL,
    file_name           VARCHAR(300)    NOT NULL,
    original_name       VARCHAR(300)    NOT NULL,
    extension           VARCHAR(20),
    content_type        VARCHAR(100),
    file_size           BIGINT          NOT NULL,
    checksum            VARCHAR(64),
    checksum_type       VARCHAR(20)     DEFAULT 'MD5',

    -- 业务关联
    business_type       VARCHAR(50),
    business_id         VARCHAR(64),
    case_id             VARCHAR(64),
    category            VARCHAR(50),
    tags                JSONB,
    description         VARCHAR(500),

    -- 访问控制
    access_level        VARCHAR(32)     NOT NULL DEFAULT 'PRIVATE',
    owner_id            VARCHAR(64),
    owner_type          VARCHAR(32),
    permissions         JSONB,

    -- 状态
    status              VARCHAR(32)     NOT NULL DEFAULT 'ACTIVE',
    is_encrypted        BOOLEAN         NOT NULL DEFAULT FALSE,
    encryption_key_id   VARCHAR(64),

    -- 统计
    download_count      BIGINT          NOT NULL DEFAULT 0,
    view_count          BIGINT          NOT NULL DEFAULT 0,
    last_accessed_at    TIMESTAMPTZ,

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
    CONSTRAINT uk_file_key UNIQUE (bucket_id, file_key),
    CONSTRAINT fk_file_bucket FOREIGN KEY (bucket_id) REFERENCES storage_bucket(id)
);

CREATE INDEX IF NOT EXISTS idx_file_tenant        ON storage_file(tenant_id);
CREATE INDEX IF NOT EXISTS idx_file_bucket        ON storage_file(bucket_id)                        WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_file_folder        ON storage_file(folder_id)                        WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_file_business      ON storage_file(business_type, business_id)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_file_case          ON storage_file(case_id)                          WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_file_owner         ON storage_file(owner_type, owner_id)             WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_file_category      ON storage_file(tenant_id, category)              WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_file_status        ON storage_file(tenant_id, status)                WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_file_content_type  ON storage_file(tenant_id, content_type)          WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_file_checksum      ON storage_file(checksum)                         WHERE deleted_at IS NULL;

COMMENT ON TABLE storage_file IS '文件元数据表 — 文件中心核心表';
COMMENT ON COLUMN storage_file.bucket_id IS '关联 storage_bucket.id';
COMMENT ON COLUMN storage_file.folder_id IS '关联 storage_folder.id';
COMMENT ON COLUMN storage_file.file_key IS '存储路径/Key';
COMMENT ON COLUMN storage_file.file_name IS '存储文件名';
COMMENT ON COLUMN storage_file.original_name IS '原始文件名';
COMMENT ON COLUMN storage_file.content_type IS 'MIME 类型';
COMMENT ON COLUMN storage_file.file_size IS '文件大小（字节）';
COMMENT ON COLUMN storage_file.checksum IS '文件校验和';
COMMENT ON COLUMN storage_file.business_type IS '业务类型: MEDICAL_INTAKE/REPORT/CONTRACT/AVATAR/ATTACHMENT';
COMMENT ON COLUMN storage_file.access_level IS '访问级别: PUBLIC/PROTECTED/PRIVATE';
COMMENT ON COLUMN storage_file.status IS '状态: UPLOADING/ACTIVE/QUARANTINE/ARCHIVED/DELETED';
COMMENT ON COLUMN storage_file.is_encrypted IS '是否加密存储';


-- ============================================================
-- Part 3: storage_folder — 文件夹表
-- ============================================================
CREATE TABLE IF NOT EXISTS storage_folder (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联信息
    bucket_id           VARCHAR(64)     NOT NULL,
    parent_id           VARCHAR(64),

    -- 文件夹信息
    folder_name         VARCHAR(200)    NOT NULL,
    folder_path         VARCHAR(1000)   NOT NULL,
    level               INTEGER         NOT NULL DEFAULT 1,
    description         VARCHAR(500),

    -- 业务关联
    business_type       VARCHAR(50),
    business_id         VARCHAR(64),
    case_id             VARCHAR(64),

    -- 访问控制
    access_level        VARCHAR(32)     NOT NULL DEFAULT 'PRIVATE',
    owner_id            VARCHAR(64),
    permissions         JSONB,

    -- 统计
    file_count          INTEGER         NOT NULL DEFAULT 0,
    total_size          BIGINT          NOT NULL DEFAULT 0,

    -- 状态
    is_system           BOOLEAN         NOT NULL DEFAULT FALSE,
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
    CONSTRAINT uk_folder_path UNIQUE (bucket_id, folder_path),
    CONSTRAINT fk_folder_bucket FOREIGN KEY (bucket_id) REFERENCES storage_bucket(id)
);

CREATE INDEX IF NOT EXISTS idx_folder_tenant   ON storage_folder(tenant_id);
CREATE INDEX IF NOT EXISTS idx_folder_bucket   ON storage_folder(bucket_id)                     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_folder_parent   ON storage_folder(parent_id)                     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_folder_path     ON storage_folder(folder_path)                   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_folder_business ON storage_folder(business_type, business_id)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_folder_case     ON storage_folder(case_id)                       WHERE deleted_at IS NULL;

COMMENT ON TABLE storage_folder IS '文件夹表 — 虚拟文件夹结构';
COMMENT ON COLUMN storage_folder.bucket_id IS '关联 storage_bucket.id';
COMMENT ON COLUMN storage_folder.parent_id IS '父文件夹 ID';
COMMENT ON COLUMN storage_folder.folder_name IS '文件夹名称';
COMMENT ON COLUMN storage_folder.folder_path IS '完整路径';
COMMENT ON COLUMN storage_folder.level IS '层级';
COMMENT ON COLUMN storage_folder.access_level IS '访问级别: PUBLIC/PROTECTED/PRIVATE';
COMMENT ON COLUMN storage_folder.is_system IS '是否系统文件夹（不可删除）';


-- ============================================================
-- Part 4: storage_file_share — 文件分享表
-- ============================================================
CREATE TABLE IF NOT EXISTS storage_file_share (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联文件
    file_id             VARCHAR(64)     NOT NULL,
    folder_id           VARCHAR(64),

    -- 分享信息
    share_code          VARCHAR(64)     NOT NULL,
    share_url           VARCHAR(512),
    share_type          VARCHAR(32)     NOT NULL DEFAULT 'LINK',
    access_password     VARCHAR(100),
    is_password_protected BOOLEAN       NOT NULL DEFAULT FALSE,

    -- 有效期
    expires_at          TIMESTAMPTZ,
    max_downloads       INTEGER,
    max_views           INTEGER,

    -- 权限
    allow_download      BOOLEAN         NOT NULL DEFAULT TRUE,
    allow_preview       BOOLEAN         NOT NULL DEFAULT TRUE,

    -- 统计
    download_count      INTEGER         NOT NULL DEFAULT 0,
    view_count          INTEGER         NOT NULL DEFAULT 0,
    last_accessed_at    TIMESTAMPTZ,

    -- 状态
    status              VARCHAR(32)     NOT NULL DEFAULT 'ACTIVE',
    revoked_at          TIMESTAMPTZ,
    revoked_by          VARCHAR(64),

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
    CONSTRAINT uk_share_code UNIQUE (share_code),
    CONSTRAINT fk_share_file FOREIGN KEY (file_id) REFERENCES storage_file(id)
);

CREATE INDEX IF NOT EXISTS idx_share_tenant   ON storage_file_share(tenant_id);
CREATE INDEX IF NOT EXISTS idx_share_file     ON storage_file_share(file_id)                   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_share_folder   ON storage_file_share(folder_id)                 WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_share_status   ON storage_file_share(tenant_id, status)         WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_share_expires  ON storage_file_share(expires_at)                WHERE deleted_at IS NULL AND status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_share_creator  ON storage_file_share(created_by)                WHERE deleted_at IS NULL;

COMMENT ON TABLE storage_file_share IS '文件分享表 — 文件分享链接';
COMMENT ON COLUMN storage_file_share.file_id IS '关联 storage_file.id';
COMMENT ON COLUMN storage_file_share.folder_id IS '关联文件夹（分享整个文件夹时）';
COMMENT ON COLUMN storage_file_share.share_code IS '分享码';
COMMENT ON COLUMN storage_file_share.share_type IS '分享类型: LINK/USER/GROUP';
COMMENT ON COLUMN storage_file_share.expires_at IS '过期时间';
COMMENT ON COLUMN storage_file_share.max_downloads IS '最大下载次数';
COMMENT ON COLUMN storage_file_share.status IS '状态: ACTIVE/EXPIRED/REVOKED';


-- ============================================================
-- Part 5: storage_access_log — 文件访问日志（只追加）
-- ============================================================
CREATE TABLE IF NOT EXISTS storage_access_log (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联信息
    file_id             VARCHAR(64),
    folder_id           VARCHAR(64),
    bucket_id           VARCHAR(64),
    share_id            VARCHAR(64),

    -- 访问信息
    access_type         VARCHAR(32)     NOT NULL,
    access_method       VARCHAR(32),
    accessor_id         VARCHAR(64),
    accessor_type       VARCHAR(32),
    accessor_name       VARCHAR(100),
    accessor_ip         VARCHAR(50),
    user_agent          VARCHAR(500),
    referer             VARCHAR(512),

    -- 文件信息（冗余）
    file_name           VARCHAR(300),
    file_size           BIGINT,

    -- 结果
    status              VARCHAR(32)     NOT NULL,
    error_code          VARCHAR(50),
    error_message       VARCHAR(500),
    duration_ms         INTEGER,
    bytes_transferred   BIGINT,

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

CREATE INDEX IF NOT EXISTS idx_access_log_tenant   ON storage_access_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_access_log_file     ON storage_access_log(file_id);
CREATE INDEX IF NOT EXISTS idx_access_log_folder   ON storage_access_log(folder_id);
CREATE INDEX IF NOT EXISTS idx_access_log_bucket   ON storage_access_log(bucket_id);
CREATE INDEX IF NOT EXISTS idx_access_log_accessor ON storage_access_log(tenant_id, accessor_id);
CREATE INDEX IF NOT EXISTS idx_access_log_type     ON storage_access_log(tenant_id, access_type);
CREATE INDEX IF NOT EXISTS idx_access_log_time     ON storage_access_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_log_status   ON storage_access_log(tenant_id, status);

COMMENT ON TABLE storage_access_log IS '文件访问日志 — 文件操作审计（只追加）';
COMMENT ON COLUMN storage_access_log.file_id IS '关联 storage_file.id';
COMMENT ON COLUMN storage_access_log.folder_id IS '关联 storage_folder.id';
COMMENT ON COLUMN storage_access_log.access_type IS '操作类型: UPLOAD/DOWNLOAD/VIEW/DELETE/SHARE/MOVE/COPY';
COMMENT ON COLUMN storage_access_log.access_method IS '访问方式: API/WEB/SHARE_LINK/INTERNAL';
COMMENT ON COLUMN storage_access_log.accessor_type IS '访问者类型: USER/SYSTEM/ANONYMOUS';
COMMENT ON COLUMN storage_access_log.status IS '状态: SUCCESS/FAILED/DENIED';
COMMENT ON COLUMN storage_access_log.bytes_transferred IS '传输字节数';

-- ⚠️ 访问日志只允许 INSERT 的 Trigger
CREATE OR REPLACE FUNCTION prevent_storage_access_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Storage access log is immutable. UPDATE/DELETE is not allowed.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_storage_access_log_no_update
    BEFORE UPDATE OR DELETE ON storage_access_log
    FOR EACH ROW EXECUTE FUNCTION prevent_storage_access_log_mutation();


-- ============================================================
-- Part 6: storage_quota — 存储配额表
-- ============================================================
CREATE TABLE IF NOT EXISTS storage_quota (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联信息
    owner_type          VARCHAR(32)     NOT NULL,
    owner_id            VARCHAR(64)     NOT NULL,

    -- 配额信息
    quota_type          VARCHAR(50)     NOT NULL,
    quota_bytes         BIGINT          NOT NULL,
    used_bytes          BIGINT          NOT NULL DEFAULT 0,
    file_count_limit    INTEGER,
    file_count_used     INTEGER         NOT NULL DEFAULT 0,
    daily_upload_limit  BIGINT,
    daily_upload_used   BIGINT          NOT NULL DEFAULT 0,
    last_reset_at       TIMESTAMPTZ,

    -- 状态
    status              VARCHAR(32)     NOT NULL DEFAULT 'ACTIVE',
    warning_threshold   INTEGER         DEFAULT 80,
    is_exceeded         BOOLEAN         NOT NULL DEFAULT FALSE,

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
    CONSTRAINT uk_storage_quota UNIQUE (tenant_id, owner_type, owner_id, quota_type)
);

CREATE INDEX IF NOT EXISTS idx_quota_tenant   ON storage_quota(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quota_owner    ON storage_quota(owner_type, owner_id)         WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quota_exceeded ON storage_quota(tenant_id, is_exceeded)       WHERE deleted_at IS NULL AND is_exceeded = TRUE;

COMMENT ON TABLE storage_quota IS '存储配额表 — 用户/租户存储配额';
COMMENT ON COLUMN storage_quota.owner_type IS '所有者类型: TENANT/USER/DEPARTMENT/CASE';
COMMENT ON COLUMN storage_quota.owner_id IS '所有者 ID';
COMMENT ON COLUMN storage_quota.quota_type IS '配额类型: TOTAL/MEDICAL/CONTRACT';
COMMENT ON COLUMN storage_quota.quota_bytes IS '配额（字节）';
COMMENT ON COLUMN storage_quota.used_bytes IS '已使用（字节）';
COMMENT ON COLUMN storage_quota.warning_threshold IS '警告阈值（百分比）';
COMMENT ON COLUMN storage_quota.daily_upload_limit IS '每日上传限制（字节）';


-- ============================================================
-- 表结构摘要
-- ============================================================
--
-- | 表名                        | 域         | 说明                    | 预留字段 |
-- |-----------------------------|------------|------------------------|---------|
-- | storage_bucket              | 存储域     | 存储桶配置表            | 8       |
-- | storage_file                | 文件域     | 文件元数据表            | 8       |
-- | storage_folder              | 文件夹域   | 文件夹表                | 8       |
-- | storage_file_share          | 分享域     | 文件分享表              | 8       |
-- | storage_access_log          | 审计域     | 文件访问日志（只追加）  | 8       |
-- | storage_quota               | 配额域     | 存储配额表              | 8       |
--
-- 设计要点：
-- 1. 支持多存储提供商（MinIO/S3/OSS/COS/Local）
-- 2. 文件访问控制（PUBLIC/PROTECTED/PRIVATE）
-- 3. 访问日志只追加（带 Trigger 防护）
-- 4. 支持文件分享（带密码保护和过期时间）
-- 5. 配额管理（租户/用户/部门级别）
-- 6. 使用 storage_ 前缀区分存储域
-- ============================================================
