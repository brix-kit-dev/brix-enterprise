-- ============================================================
-- Flyway Migration: V100__create_products_tables.sql
-- Module: brix-app-products (Service Package/Products Service)
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
-- - 从 med_package 通用化为产品/套餐
-- - 体检套餐/诊疗套餐/翻译服务/接送机服务均可作为 Package
--
-- 核心表清单：
-- | 表名                        | 说明                     |
-- |-----------------------------|--------------------------|
-- | biz_product_category        | 产品分类表               |
-- | biz_product                 | 产品/套餐主表            |
-- | biz_product_item            | 产品项目/包含内容表      |
-- | biz_product_pricing         | 产品定价表               |
-- | biz_product_media           | 产品媒体资源表           |
-- | biz_product_faq             | 产品常见问题表           |
-- ============================================================


-- ============================================================
-- Part 1: biz_product_category — 产品分类表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_product_category (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 业务字段
    category_code       VARCHAR(64)     NOT NULL,
    category_name       VARCHAR(100)    NOT NULL,
    category_name_jp    VARCHAR(100),
    category_name_en    VARCHAR(100),
    parent_id           VARCHAR(64),
    level               INTEGER         NOT NULL DEFAULT 1,
    path                VARCHAR(512),
    sort_order          INTEGER         NOT NULL DEFAULT 0,
    description         VARCHAR(500),
    icon                VARCHAR(255),
    cover_image_url     VARCHAR(512),
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
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
    CONSTRAINT uk_product_category_code UNIQUE (tenant_id, category_code)
);

CREATE INDEX IF NOT EXISTS idx_product_cat_tenant ON biz_product_category(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_cat_parent ON biz_product_category(parent_id)         WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_cat_path   ON biz_product_category(tenant_id, path)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_cat_active ON biz_product_category(tenant_id, is_active) WHERE deleted_at IS NULL AND is_active = TRUE;

COMMENT ON TABLE biz_product_category IS '产品分类表 — 产品/套餐分类树';
COMMENT ON COLUMN biz_product_category.category_code IS '分类编码';
COMMENT ON COLUMN biz_product_category.category_name IS '分类名称';
COMMENT ON COLUMN biz_product_category.parent_id IS '父分类 ID';
COMMENT ON COLUMN biz_product_category.level IS '层级（1为顶级）';
COMMENT ON COLUMN biz_product_category.path IS '完整路径（如 /1/2/3/）';


-- ============================================================
-- Part 2: biz_product — 产品/套餐主表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_product (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联信息
    category_id         VARCHAR(64),
    partner_id          VARCHAR(64),

    -- 业务字段
    product_code        VARCHAR(64)     NOT NULL,
    product_type        VARCHAR(50)     NOT NULL,
    product_name        VARCHAR(200)    NOT NULL,
    product_name_jp     VARCHAR(200),
    product_name_en     VARCHAR(200),
    short_name          VARCHAR(100),
    subtitle            VARCHAR(300),
    description         TEXT,
    highlights          JSONB,
    tags                JSONB,

    -- 服务信息
    medical_category    VARCHAR(50),
    duration_days       INTEGER,
    duration_hours      INTEGER,
    service_location    VARCHAR(200),
    service_region      VARCHAR(100),
    includes            TEXT,
    excludes            TEXT,
    requirements        TEXT,
    precautions         TEXT,

    -- 定价信息
    price_type          VARCHAR(32)     NOT NULL DEFAULT 'FIXED',
    base_price          DECIMAL(12,2),
    price_min           DECIMAL(12,2),
    price_max           DECIMAL(12,2),
    currency            VARCHAR(10)     NOT NULL DEFAULT 'JPY',
    price_unit          VARCHAR(50),
    price_note          VARCHAR(500),

    -- 展示信息
    cover_image_url     VARCHAR(512),
    thumbnail_url       VARCHAR(512),
    sort_order          INTEGER         NOT NULL DEFAULT 0,
    is_featured         BOOLEAN         NOT NULL DEFAULT FALSE,
    is_hot              BOOLEAN         NOT NULL DEFAULT FALSE,
    is_new              BOOLEAN         NOT NULL DEFAULT FALSE,

    -- 状态
    status              VARCHAR(32)     NOT NULL DEFAULT 'DRAFT',
    publish_at          TIMESTAMPTZ,
    unpublish_at        TIMESTAMPTZ,

    -- 统计
    view_count          BIGINT          NOT NULL DEFAULT 0,
    order_count         BIGINT          NOT NULL DEFAULT 0,

    -- SEO
    seo_title           VARCHAR(200),
    seo_description     VARCHAR(500),
    seo_keywords        VARCHAR(500),

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
    CONSTRAINT uk_product_code UNIQUE (tenant_id, product_code)
);

CREATE INDEX IF NOT EXISTS idx_product_tenant       ON biz_product(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_category     ON biz_product(category_id)                        WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_partner      ON biz_product(partner_id)                         WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_type         ON biz_product(tenant_id, product_type)            WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_med_category ON biz_product(tenant_id, medical_category)        WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_status       ON biz_product(tenant_id, status)                  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_featured     ON biz_product(tenant_id, is_featured)             WHERE deleted_at IS NULL AND is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_product_hot          ON biz_product(tenant_id, is_hot)                  WHERE deleted_at IS NULL AND is_hot = TRUE;
CREATE INDEX IF NOT EXISTS idx_product_price        ON biz_product(tenant_id, price_min, price_max)    WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_product IS '产品/套餐主表 — 体检套餐/诊疗套餐/翻译服务/接送机服务';
COMMENT ON COLUMN biz_product.id IS '主键 ID（应用层生成）';
COMMENT ON COLUMN biz_product.category_id IS '关联 biz_product_category.id';
COMMENT ON COLUMN biz_product.partner_id IS '关联合作方 ID';
COMMENT ON COLUMN biz_product.product_code IS '产品编码';
COMMENT ON COLUMN biz_product.product_type IS '类型: CHECKUP/TREATMENT/TRANSLATION/TRANSPORT/ACCOMMODATION/COMBO';
COMMENT ON COLUMN biz_product.medical_category IS '医疗分类: ONCOLOGY/COSMETIC/FERTILITY/REHAB/GENERAL';
COMMENT ON COLUMN biz_product.duration_days IS '预计天数';
COMMENT ON COLUMN biz_product.duration_hours IS '预计小时数（短时服务）';
COMMENT ON COLUMN biz_product.price_type IS '定价类型: FIXED/RANGE/NEGOTIABLE/QUOTE';
COMMENT ON COLUMN biz_product.highlights IS '亮点（JSON数组）';
COMMENT ON COLUMN biz_product.tags IS '标签（JSON数组）';
COMMENT ON COLUMN biz_product.status IS '状态: DRAFT/PENDING/PUBLISHED/UNPUBLISHED/ARCHIVED';


-- ============================================================
-- Part 3: biz_product_item — 产品项目/包含内容表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_product_item (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联产品
    product_id          VARCHAR(64)     NOT NULL,

    -- 业务字段
    item_code           VARCHAR(64)     NOT NULL,
    item_name           VARCHAR(200)    NOT NULL,
    item_name_jp        VARCHAR(200),
    item_name_en        VARCHAR(200),
    item_type           VARCHAR(50)     NOT NULL,
    category            VARCHAR(50),
    description         VARCHAR(500),
    is_optional         BOOLEAN         NOT NULL DEFAULT FALSE,
    is_included         BOOLEAN         NOT NULL DEFAULT TRUE,
    quantity            INTEGER         NOT NULL DEFAULT 1,
    unit                VARCHAR(32),
    sort_order          INTEGER         NOT NULL DEFAULT 0,

    -- 定价（可选项时）
    additional_price    DECIMAL(12,2),
    currency            VARCHAR(10)     DEFAULT 'JPY',

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
    CONSTRAINT uk_product_item UNIQUE (product_id, item_code),
    CONSTRAINT fk_product_item_product FOREIGN KEY (product_id) REFERENCES biz_product(id)
);

CREATE INDEX IF NOT EXISTS idx_product_item_product  ON biz_product_item(product_id);
CREATE INDEX IF NOT EXISTS idx_product_item_tenant   ON biz_product_item(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_item_type     ON biz_product_item(item_type)              WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_item_optional ON biz_product_item(product_id, is_optional) WHERE deleted_at IS NULL;

COMMENT ON TABLE biz_product_item IS '产品项目/包含内容表 — 套餐包含的具体项目';
COMMENT ON COLUMN biz_product_item.product_id IS '关联 biz_product.id';
COMMENT ON COLUMN biz_product_item.item_code IS '项目编码';
COMMENT ON COLUMN biz_product_item.item_name IS '项目名称';
COMMENT ON COLUMN biz_product_item.item_type IS '项目类型: EXAMINATION/TREATMENT/CONSULTATION/TRANSLATION/TRANSPORT/ACCOMMODATION/OTHER';
COMMENT ON COLUMN biz_product_item.is_optional IS '是否为可选项';
COMMENT ON COLUMN biz_product_item.is_included IS '是否包含在套餐内';
COMMENT ON COLUMN biz_product_item.additional_price IS '加购价格（可选项时）';


-- ============================================================
-- Part 4: biz_product_pricing — 产品定价表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_product_pricing (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联产品
    product_id          VARCHAR(64)     NOT NULL,

    -- 业务字段
    pricing_code        VARCHAR(64)     NOT NULL,
    pricing_name        VARCHAR(200)    NOT NULL,
    pricing_type        VARCHAR(50)     NOT NULL,
    price               DECIMAL(12,2)   NOT NULL,
    original_price      DECIMAL(12,2),
    currency            VARCHAR(10)     NOT NULL DEFAULT 'JPY',
    unit                VARCHAR(50),
    min_quantity        INTEGER         DEFAULT 1,
    max_quantity        INTEGER,
    description         VARCHAR(500),
    conditions          JSONB,
    is_default          BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    sort_order          INTEGER         NOT NULL DEFAULT 0,

    -- 有效期
    effective_from      TIMESTAMPTZ,
    effective_to        TIMESTAMPTZ,

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
    CONSTRAINT uk_product_pricing UNIQUE (product_id, pricing_code),
    CONSTRAINT fk_pricing_product FOREIGN KEY (product_id) REFERENCES biz_product(id)
);

CREATE INDEX IF NOT EXISTS idx_product_pricing_product ON biz_product_pricing(product_id);
CREATE INDEX IF NOT EXISTS idx_product_pricing_tenant  ON biz_product_pricing(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_pricing_type    ON biz_product_pricing(pricing_type)              WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_pricing_active  ON biz_product_pricing(product_id, is_active)     WHERE deleted_at IS NULL AND is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_product_pricing_default ON biz_product_pricing(product_id, is_default)    WHERE deleted_at IS NULL AND is_default = TRUE;

COMMENT ON TABLE biz_product_pricing IS '产品定价表 — 产品的多种定价方案';
COMMENT ON COLUMN biz_product_pricing.product_id IS '关联 biz_product.id';
COMMENT ON COLUMN biz_product_pricing.pricing_code IS '定价编码';
COMMENT ON COLUMN biz_product_pricing.pricing_name IS '定价名称';
COMMENT ON COLUMN biz_product_pricing.pricing_type IS '定价类型: STANDARD/MEMBER/EARLY_BIRD/GROUP/SEASONAL';
COMMENT ON COLUMN biz_product_pricing.price IS '价格';
COMMENT ON COLUMN biz_product_pricing.original_price IS '原价（划线价）';
COMMENT ON COLUMN biz_product_pricing.conditions IS '适用条件（JSON）';
COMMENT ON COLUMN biz_product_pricing.effective_from IS '生效开始时间';
COMMENT ON COLUMN biz_product_pricing.effective_to IS '生效结束时间';


-- ============================================================
-- Part 5: biz_product_media — 产品媒体资源表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_product_media (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联产品
    product_id          VARCHAR(64)     NOT NULL,

    -- 媒体信息
    media_type          VARCHAR(32)     NOT NULL,
    media_url           VARCHAR(512)    NOT NULL,
    thumbnail_url       VARCHAR(512),
    file_id             VARCHAR(64),
    title               VARCHAR(200),
    description         VARCHAR(500),
    alt_text            VARCHAR(200),
    duration_seconds    INTEGER,
    file_size           BIGINT,
    is_cover            BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
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
    CONSTRAINT fk_media_product FOREIGN KEY (product_id) REFERENCES biz_product(id)
);

CREATE INDEX IF NOT EXISTS idx_product_media_product ON biz_product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_tenant  ON biz_product_media(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_media_type    ON biz_product_media(media_type)            WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_media_cover   ON biz_product_media(product_id, is_cover)  WHERE deleted_at IS NULL AND is_cover = TRUE;

COMMENT ON TABLE biz_product_media IS '产品媒体资源表 — 产品的图片/视频';
COMMENT ON COLUMN biz_product_media.product_id IS '关联 biz_product.id';
COMMENT ON COLUMN biz_product_media.media_type IS '媒体类型: IMAGE/VIDEO/DOCUMENT/3D_TOUR';
COMMENT ON COLUMN biz_product_media.media_url IS '媒体 URL';
COMMENT ON COLUMN biz_product_media.thumbnail_url IS '缩略图 URL';
COMMENT ON COLUMN biz_product_media.file_id IS '文件中心 ID';
COMMENT ON COLUMN biz_product_media.is_cover IS '是否为封面';


-- ============================================================
-- Part 6: biz_product_faq — 产品常见问题表
-- ============================================================
CREATE TABLE IF NOT EXISTS biz_product_faq (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联产品
    product_id          VARCHAR(64)     NOT NULL,

    -- FAQ 信息
    question            VARCHAR(500)    NOT NULL,
    question_jp         VARCHAR(500),
    question_en         VARCHAR(500),
    answer              TEXT            NOT NULL,
    answer_jp           TEXT,
    answer_en           TEXT,
    category            VARCHAR(50),
    is_featured         BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    sort_order          INTEGER         NOT NULL DEFAULT 0,

    -- 统计
    view_count          BIGINT          NOT NULL DEFAULT 0,
    helpful_count       BIGINT          NOT NULL DEFAULT 0,

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
    CONSTRAINT fk_faq_product FOREIGN KEY (product_id) REFERENCES biz_product(id)
);

CREATE INDEX IF NOT EXISTS idx_product_faq_product  ON biz_product_faq(product_id);
CREATE INDEX IF NOT EXISTS idx_product_faq_tenant   ON biz_product_faq(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_faq_category ON biz_product_faq(category)                   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_faq_featured ON biz_product_faq(product_id, is_featured)    WHERE deleted_at IS NULL AND is_featured = TRUE;

COMMENT ON TABLE biz_product_faq IS '产品常见问题表 — 产品 FAQ';
COMMENT ON COLUMN biz_product_faq.product_id IS '关联 biz_product.id';
COMMENT ON COLUMN biz_product_faq.question IS '问题';
COMMENT ON COLUMN biz_product_faq.answer IS '回答';
COMMENT ON COLUMN biz_product_faq.category IS '分类: SERVICE/BOOKING/PAYMENT/PREPARATION/OTHER';
COMMENT ON COLUMN biz_product_faq.helpful_count IS '有帮助计数';


-- ============================================================
-- 表结构摘要
-- ============================================================
--
-- | 表名                        | 域         | 说明                    | 预留字段 |
-- |-----------------------------|------------|------------------------|---------|
-- | biz_product_category        | 分类域     | 产品分类表              | 8       |
-- | biz_product                 | 产品域     | 产品/套餐主表           | 8       |
-- | biz_product_item            | 产品域     | 产品项目/包含内容表     | 8       |
-- | biz_product_pricing         | 定价域     | 产品定价表              | 8       |
-- | biz_product_media           | 媒体域     | 产品媒体资源表          | 8       |
-- | biz_product_faq             | FAQ域      | 产品常见问题表          | 8       |
--
-- 设计要点：
-- 1. 通用化设计：体检/诊疗/翻译/接送等统一为 Product
-- 2. 支持多语言名称（中/日/英）
-- 3. 支持灵活定价（固定/范围/协商/询价）
-- 4. 分类支持树形结构（parent_id + path）
-- 5. 产品项目支持可选加购
-- ============================================================
