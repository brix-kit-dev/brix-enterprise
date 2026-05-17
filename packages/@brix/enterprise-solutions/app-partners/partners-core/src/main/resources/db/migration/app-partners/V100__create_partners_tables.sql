-- ============================================================
-- Flyway Migration: V100__create_partners_tables.sql
-- Module: brix-app-partners (Partner Catalog Service)
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
-- - 从 med_hospital 通用化为合作方目录
-- - 医院/体检机构/翻译机构/酒店/车辆公司均可作为 Partner
--
-- 核心表清单：
-- | 表名                        | 说明                     |
-- |-----------------------------|--------------------------|
-- | biz_partner                 | 合作方主表               |
-- | biz_partner_contact         | 合作方联系人表           |
-- | biz_partner_certification   | 合作方资质证书表         |
-- | biz_partner_service         | 合作方服务能力表         |
-- | biz_partner_contract        | 合作方合作协议表         |
-- | biz_partner_rating          | 合作方评价表             |
-- ============================================================


-- ============================================================
-- Part 1: biz_partner — 合作方主表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_partner (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 业务字段
    partner_code        VARCHAR(64)     NOT NULL,
    partner_type        VARCHAR(50)     NOT NULL,
    partner_level       VARCHAR(32),
    name_cn             VARCHAR(200)    NOT NULL,
    name_jp             VARCHAR(200),
    name_en             VARCHAR(200),
    short_name          VARCHAR(100),
    description         TEXT,
    logo_url            VARCHAR(512),
    cover_image_url     VARCHAR(512),

    -- 地址信息
    country             VARCHAR(50),
    region              VARCHAR(100),
    city                VARCHAR(100),
    district            VARCHAR(100),
    address             TEXT,
    address_jp          TEXT,
    postal_code         VARCHAR(20),
    latitude            DECIMAL(10,7),
    longitude           DECIMAL(10,7),

    -- 联系信息
    phone               VARCHAR(32),
    fax                 VARCHAR(32),
    email               VARCHAR(200),
    website             VARCHAR(512),

    -- 业务信息
    business_license    VARCHAR(100),
    tax_number          VARCHAR(50),
    legal_representative VARCHAR(100),
    established_date    DATE,
    scale               VARCHAR(50),
    employee_count      INTEGER,

    -- 状态
    status              VARCHAR(32)     NOT NULL DEFAULT 'PENDING',
    is_verified         BOOLEAN         NOT NULL DEFAULT FALSE,
    verified_at         TIMESTAMPTZ,
    is_featured         BOOLEAN         NOT NULL DEFAULT FALSE,
    sort_order          INTEGER         NOT NULL DEFAULT 0,

    -- 配置
    config              JSONB,
    tags                JSONB,

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
    CONSTRAINT uk_partner_code UNIQUE (tenant_id, partner_code)
);

CREATE INDEX IF NOT EXISTS idx_partner_tenant   ON biz_partner(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_type     ON biz_partner(tenant_id, partner_type)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partner_level    ON biz_partner(tenant_id, partner_level)  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partner_status   ON biz_partner(tenant_id, status)         WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partner_region   ON biz_partner(tenant_id, region)         WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partner_city     ON biz_partner(tenant_id, city)           WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partner_verified ON biz_partner(tenant_id, is_verified)    WHERE deleted_at IS NULL AND is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_partner_featured ON biz_partner(tenant_id, is_featured)    WHERE deleted_at IS NULL AND is_featured = TRUE;

COMMENT ON TABLE biz_partner IS '合作方主表 — 医院/翻译机构/酒店/车辆等合作方';
COMMENT ON COLUMN biz_partner.id IS '主键 ID（应用层生成）';
COMMENT ON COLUMN biz_partner.partner_code IS '合作方编码';
COMMENT ON COLUMN biz_partner.partner_type IS '类型: HOSPITAL/CLINIC/TRANSLATOR/HOTEL/TRANSPORT/TRAVEL_AGENCY/OTHER';
COMMENT ON COLUMN biz_partner.partner_level IS '等级: PREMIUM/STANDARD/BASIC';
COMMENT ON COLUMN biz_partner.name_cn IS '中文名称';
COMMENT ON COLUMN biz_partner.name_jp IS '日文名称';
COMMENT ON COLUMN biz_partner.name_en IS '英文名称';
COMMENT ON COLUMN biz_partner.status IS '状态: PENDING/ACTIVE/SUSPENDED/TERMINATED';
COMMENT ON COLUMN biz_partner.is_verified IS '是否已认证';
COMMENT ON COLUMN biz_partner.is_featured IS '是否推荐';
COMMENT ON COLUMN biz_partner.tags IS '标签（JSON数组）';


-- ============================================================
-- Part 2: biz_partner_contact — 合作方联系人表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_partner_contact (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联合作方
    partner_id          VARCHAR(64)     NOT NULL,

    -- 联系人信息
    contact_name        VARCHAR(100)    NOT NULL,
    contact_name_jp     VARCHAR(100),
    contact_name_en     VARCHAR(100),
    title               VARCHAR(100),
    department          VARCHAR(100),
    phone               VARCHAR(32),
    mobile              VARCHAR(32),
    email               VARCHAR(200),
    wechat              VARCHAR(100),
    line_id             VARCHAR(100),
    is_primary          BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
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
    CONSTRAINT fk_contact_partner FOREIGN KEY (partner_id) REFERENCES biz_partner(id)
);

CREATE INDEX IF NOT EXISTS idx_partner_contact_partner ON biz_partner_contact(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_contact_tenant  ON biz_partner_contact(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_contact_primary ON biz_partner_contact(partner_id, is_primary) WHERE deleted_at IS NULL AND is_primary = TRUE;

COMMENT ON TABLE biz_partner_contact IS '合作方联系人表 — 合作方的联系人信息';
COMMENT ON COLUMN biz_partner_contact.partner_id IS '关联 biz_partner.id';
COMMENT ON COLUMN biz_partner_contact.contact_name IS '联系人姓名';
COMMENT ON COLUMN biz_partner_contact.title IS '职位';
COMMENT ON COLUMN biz_partner_contact.department IS '部门';
COMMENT ON COLUMN biz_partner_contact.is_primary IS '是否主要联系人';


-- ============================================================
-- Part 3: biz_partner_certification — 合作方资质证书表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_partner_certification (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联合作方
    partner_id          VARCHAR(64)     NOT NULL,

    -- 资质信息
    cert_type           VARCHAR(50)     NOT NULL,
    cert_name           VARCHAR(200)    NOT NULL,
    cert_no             VARCHAR(100),
    issuer              VARCHAR(200),
    issue_date          DATE,
    expiry_date         DATE,
    cert_level          VARCHAR(50),
    description         VARCHAR(500),
    status              VARCHAR(32)     NOT NULL DEFAULT 'VALID',

    -- 文件信息
    file_id             VARCHAR(64),
    file_url            VARCHAR(512),

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
    CONSTRAINT fk_cert_partner FOREIGN KEY (partner_id) REFERENCES biz_partner(id)
);

CREATE INDEX IF NOT EXISTS idx_partner_cert_partner ON biz_partner_certification(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_cert_tenant  ON biz_partner_certification(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_cert_type    ON biz_partner_certification(cert_type)         WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partner_cert_expiry  ON biz_partner_certification(expiry_date)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partner_cert_status  ON biz_partner_certification(tenant_id, status) WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_partner_certification IS '合作方资质证书表 — 合作方的资质认证';
COMMENT ON COLUMN biz_partner_certification.partner_id IS '关联 biz_partner.id';
COMMENT ON COLUMN biz_partner_certification.cert_type IS '资质类型: MEDICAL_LICENSE/BUSINESS_LICENSE/ISO/JCI/TRANSLATION_CERT';
COMMENT ON COLUMN biz_partner_certification.cert_name IS '资质名称';
COMMENT ON COLUMN biz_partner_certification.cert_no IS '证书编号';
COMMENT ON COLUMN biz_partner_certification.issuer IS '发证机构';
COMMENT ON COLUMN biz_partner_certification.cert_level IS '认证等级';
COMMENT ON COLUMN biz_partner_certification.status IS '状态: VALID/EXPIRED/REVOKED';


-- ============================================================
-- Part 4: biz_partner_service — 合作方服务能力表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_partner_service (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联合作方
    partner_id          VARCHAR(64)     NOT NULL,

    -- 服务信息
    service_code        VARCHAR(64)     NOT NULL,
    service_name        VARCHAR(200)    NOT NULL,
    service_type        VARCHAR(50)     NOT NULL,
    category            VARCHAR(50),
    description         TEXT,
    capacity            INTEGER,
    unit                VARCHAR(32),
    lead_time_days      INTEGER,
    is_available        BOOLEAN         NOT NULL DEFAULT TRUE,
    sort_order          INTEGER         NOT NULL DEFAULT 0,

    -- 服务配置
    service_config      JSONB,
    pricing_info        JSONB,
    availability        JSONB,

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
    CONSTRAINT uk_partner_service UNIQUE (partner_id, service_code),
    CONSTRAINT fk_service_partner FOREIGN KEY (partner_id) REFERENCES biz_partner(id)
);

CREATE INDEX IF NOT EXISTS idx_partner_svc_partner   ON biz_partner_service(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_svc_tenant    ON biz_partner_service(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_svc_type      ON biz_partner_service(tenant_id, service_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partner_svc_category  ON biz_partner_service(tenant_id, category)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partner_svc_available ON biz_partner_service(partner_id, is_available) WHERE deleted_at IS NULL AND is_available = TRUE;

COMMENT ON TABLE biz_partner_service IS '合作方服务能力表 — 合作方可提供的服务';
COMMENT ON COLUMN biz_partner_service.partner_id IS '关联 biz_partner.id';
COMMENT ON COLUMN biz_partner_service.service_code IS '服务编码';
COMMENT ON COLUMN biz_partner_service.service_name IS '服务名称';
COMMENT ON COLUMN biz_partner_service.service_type IS '服务类型: CHECKUP/TREATMENT/TRANSLATION/ACCOMMODATION/TRANSPORT';
COMMENT ON COLUMN biz_partner_service.category IS '分类: ONCOLOGY/COSMETIC/FERTILITY/REHAB';
COMMENT ON COLUMN biz_partner_service.capacity IS '服务容量（每日/每月）';
COMMENT ON COLUMN biz_partner_service.lead_time_days IS '提前预约天数';
COMMENT ON COLUMN biz_partner_service.pricing_info IS '定价信息（JSON）';
COMMENT ON COLUMN biz_partner_service.availability IS '可用性配置（JSON）';


-- ============================================================
-- Part 5: biz_partner_contract — 合作方合作协议表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_partner_contract (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联合作方
    partner_id          VARCHAR(64)     NOT NULL,

    -- 协议信息
    contract_no         VARCHAR(64)     NOT NULL,
    contract_name       VARCHAR(200)    NOT NULL,
    contract_type       VARCHAR(50)     NOT NULL,
    start_date          DATE            NOT NULL,
    end_date            DATE,
    is_auto_renew       BOOLEAN         NOT NULL DEFAULT FALSE,
    renew_notice_days   INTEGER,
    status              VARCHAR(32)     NOT NULL DEFAULT 'DRAFT',

    -- 协议条款
    terms               TEXT,
    commission_rate     DECIMAL(5,2),
    settlement_cycle    VARCHAR(50),
    payment_terms       VARCHAR(200),

    -- 文件信息
    file_id             VARCHAR(64),
    file_url            VARCHAR(512),

    -- 签署信息
    signed_at           TIMESTAMPTZ,
    signed_by           VARCHAR(64),
    partner_signer      VARCHAR(100),

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
    CONSTRAINT uk_partner_contract_no UNIQUE (tenant_id, contract_no),
    CONSTRAINT fk_partner_contract_partner FOREIGN KEY (partner_id) REFERENCES biz_partner(id)
);

CREATE INDEX IF NOT EXISTS idx_partner_ctr_partner  ON biz_partner_contract(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_ctr_tenant   ON biz_partner_contract(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_ctr_status   ON biz_partner_contract(tenant_id, status)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partner_ctr_end_date ON biz_partner_contract(tenant_id, end_date)     WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_partner_contract IS '合作方合作协议表 — 与合作方的合作协议';
COMMENT ON COLUMN biz_partner_contract.partner_id IS '关联 biz_partner.id';
COMMENT ON COLUMN biz_partner_contract.contract_no IS '协议编号';
COMMENT ON COLUMN biz_partner_contract.contract_type IS '协议类型: PARTNERSHIP/AGENCY/COMMISSION';
COMMENT ON COLUMN biz_partner_contract.start_date IS '开始日期';
COMMENT ON COLUMN biz_partner_contract.end_date IS '结束日期';
COMMENT ON COLUMN biz_partner_contract.is_auto_renew IS '是否自动续约';
COMMENT ON COLUMN biz_partner_contract.commission_rate IS '佣金比例（%）';
COMMENT ON COLUMN biz_partner_contract.status IS '状态: DRAFT/ACTIVE/EXPIRED/TERMINATED';


-- ============================================================
-- Part 6: biz_partner_rating — 合作方评价表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_partner_rating (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联信息
    partner_id          VARCHAR(64)     NOT NULL,
    case_id             VARCHAR(64),
    customer_id         VARCHAR(64),

    -- 评价信息
    rating_type         VARCHAR(50)     NOT NULL,
    overall_score       DECIMAL(3,1)    NOT NULL,
    service_score       DECIMAL(3,1),
    quality_score       DECIMAL(3,1),
    communication_score DECIMAL(3,1),
    punctuality_score   DECIMAL(3,1),
    title               VARCHAR(200),
    content             TEXT,
    pros                VARCHAR(500),
    cons                VARCHAR(500),
    is_anonymous        BOOLEAN         NOT NULL DEFAULT FALSE,
    is_public           BOOLEAN         NOT NULL DEFAULT TRUE,
    status              VARCHAR(32)     NOT NULL DEFAULT 'PENDING',

    -- 审核信息
    reviewed_at         TIMESTAMPTZ,
    reviewed_by         VARCHAR(64),
    review_comment      VARCHAR(500),

    -- 回复信息
    reply_content       TEXT,
    replied_at          TIMESTAMPTZ,
    replied_by          VARCHAR(64),

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
    CONSTRAINT fk_rating_partner FOREIGN KEY (partner_id) REFERENCES biz_partner(id)
);

CREATE INDEX IF NOT EXISTS idx_partner_rating_partner   ON biz_partner_rating(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_rating_tenant    ON biz_partner_rating(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_rating_case      ON biz_partner_rating(case_id)                  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partner_rating_customer  ON biz_partner_rating(tenant_id, customer_id)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partner_rating_status    ON biz_partner_rating(tenant_id, status)        WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partner_rating_score     ON biz_partner_rating(partner_id, overall_score DESC) WHERE deleted_at IS NULL AND status = 'APPROVED';

COMMENT ON TABLE biz_partner_rating IS '合作方评价表 — 客户对合作方的评价';
COMMENT ON COLUMN biz_partner_rating.partner_id IS '关联 biz_partner.id';
COMMENT ON COLUMN biz_partner_rating.case_id IS '关联 Case ID';
COMMENT ON COLUMN biz_partner_rating.customer_id IS '评价客户 ID';
COMMENT ON COLUMN biz_partner_rating.rating_type IS '评价类型: SERVICE/FACILITY/OVERALL';
COMMENT ON COLUMN biz_partner_rating.overall_score IS '综合评分（1-5）';
COMMENT ON COLUMN biz_partner_rating.status IS '状态: PENDING/APPROVED/REJECTED/HIDDEN';
COMMENT ON COLUMN biz_partner_rating.reply_content IS '合作方回复内容';


-- ============================================================
-- 表结构摘要
-- ============================================================
--
-- | 表名                        | 域         | 说明                    | 预留字段 |
-- |-----------------------------|------------|------------------------|---------|
-- | biz_partner                 | 合作方域   | 合作方主表              | 8       |
-- | biz_partner_contact         | 合作方域   | 合作方联系人表          | 8       |
-- | biz_partner_certification   | 资质域     | 合作方资质证书表        | 8       |
-- | biz_partner_service         | 服务域     | 合作方服务能力表        | 8       |
-- | biz_partner_contract        | 协议域     | 合作方合作协议表        | 8       |
-- | biz_partner_rating          | 评价域     | 合作方评价表            | 8       |
--
-- 设计要点：
-- 1. 通用化设计：医院/翻译/酒店/车辆等统一为 Partner
-- 2. 支持多语言名称（中/日/英）
-- 3. 支持地理位置（经纬度）
-- 4. 资质证书独立管理，支持过期提醒
-- 5. 服务能力可配置容量和可用性
-- ============================================================
