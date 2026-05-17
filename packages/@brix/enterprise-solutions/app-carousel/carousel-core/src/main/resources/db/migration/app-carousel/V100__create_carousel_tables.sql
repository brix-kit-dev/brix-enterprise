-- ============================================================
-- Flyway Migration: V100__create_carousel_tables.sql
-- Module: brix-app-carousel (CMS/Carousel Service)
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
-- | 表名                    | 说明                     |
-- |-------------------------|--------------------------|
-- | cms_carousel            | 轮播组主表               |
-- | cms_carousel_item       | 轮播项表                 |
-- | cms_announcement        | 公告表                   |
-- | cms_content_category    | 内容分类表               |
-- | cms_content             | 内容/文章表              |
-- ============================================================


-- ============================================================
-- Part 1: cms_carousel — 轮播组主表
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_carousel (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 业务字段
    carousel_code       VARCHAR(64)     NOT NULL,
    carousel_name       VARCHAR(100)    NOT NULL,
    description         VARCHAR(500),
    position            VARCHAR(64)     NOT NULL,
    status              VARCHAR(32)     NOT NULL DEFAULT 'DRAFT',
    sort_order          INTEGER         NOT NULL DEFAULT 0,

    -- 展示配置
    auto_play           BOOLEAN         NOT NULL DEFAULT TRUE,
    interval_ms         INTEGER         DEFAULT 5000,
    show_dots           BOOLEAN         NOT NULL DEFAULT TRUE,
    show_arrows         BOOLEAN         NOT NULL DEFAULT TRUE,
    config              JSONB,

    -- 生效时间
    start_time          TIMESTAMPTZ,
    end_time            TIMESTAMPTZ,

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
    CONSTRAINT uk_carousel_code UNIQUE (tenant_id, carousel_code)
);

CREATE INDEX IF NOT EXISTS idx_carousel_tenant     ON cms_carousel(tenant_id);
CREATE INDEX IF NOT EXISTS idx_carousel_position   ON cms_carousel(tenant_id, position)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_carousel_status     ON cms_carousel(tenant_id, status)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_carousel_time       ON cms_carousel(tenant_id, start_time, end_time) WHERE deleted_at IS NULL;

COMMENT ON TABLE cms_carousel IS '轮播组主表 — 管理轮播位置和配置';
COMMENT ON COLUMN cms_carousel.id IS '主键 ID（应用层生成）';
COMMENT ON COLUMN cms_carousel.carousel_code IS '轮播编码（唯一标识）';
COMMENT ON COLUMN cms_carousel.carousel_name IS '轮播名称';
COMMENT ON COLUMN cms_carousel.position IS '展示位置: HOME_BANNER/HOME_AD/SERVICE_TOP/DETAIL_BOTTOM 等';
COMMENT ON COLUMN cms_carousel.status IS '状态: DRAFT/PUBLISHED/DISABLED';
COMMENT ON COLUMN cms_carousel.auto_play IS '是否自动播放';
COMMENT ON COLUMN cms_carousel.interval_ms IS '轮播间隔（毫秒）';
COMMENT ON COLUMN cms_carousel.config IS '扩展配置（JSON）';
COMMENT ON COLUMN cms_carousel.start_time IS '生效开始时间';
COMMENT ON COLUMN cms_carousel.end_time IS '生效结束时间';


-- ============================================================
-- Part 2: cms_carousel_item — 轮播项表
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_carousel_item (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联轮播组
    carousel_id         VARCHAR(64)     NOT NULL,

    -- 业务字段
    title               VARCHAR(200),
    subtitle            VARCHAR(300),
    description         VARCHAR(500),
    image_url           VARCHAR(512)    NOT NULL,
    image_alt           VARCHAR(200),
    mobile_image_url    VARCHAR(512),
    link_url            VARCHAR(512),
    link_target         VARCHAR(16)     DEFAULT '_self',
    sort_order          INTEGER         NOT NULL DEFAULT 0,
    status              VARCHAR(32)     NOT NULL DEFAULT 'ACTIVE',

    -- 生效时间
    start_time          TIMESTAMPTZ,
    end_time            TIMESTAMPTZ,

    -- 统计
    click_count         BIGINT          NOT NULL DEFAULT 0,
    view_count          BIGINT          NOT NULL DEFAULT 0,

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
    CONSTRAINT fk_carousel_item_carousel FOREIGN KEY (carousel_id) REFERENCES cms_carousel(id)
);

CREATE INDEX IF NOT EXISTS idx_carousel_item_carousel ON cms_carousel_item(carousel_id);
CREATE INDEX IF NOT EXISTS idx_carousel_item_tenant   ON cms_carousel_item(tenant_id);
CREATE INDEX IF NOT EXISTS idx_carousel_item_status   ON cms_carousel_item(tenant_id, status)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_carousel_item_sort     ON cms_carousel_item(carousel_id, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_carousel_item_time     ON cms_carousel_item(tenant_id, start_time, end_time) WHERE deleted_at IS NULL;

COMMENT ON TABLE cms_carousel_item IS '轮播项表 — 轮播组中的具体项目';
COMMENT ON COLUMN cms_carousel_item.carousel_id IS '关联 cms_carousel.id';
COMMENT ON COLUMN cms_carousel_item.title IS '标题';
COMMENT ON COLUMN cms_carousel_item.image_url IS '图片地址';
COMMENT ON COLUMN cms_carousel_item.mobile_image_url IS '移动端图片地址';
COMMENT ON COLUMN cms_carousel_item.link_url IS '跳转链接';
COMMENT ON COLUMN cms_carousel_item.link_target IS '跳转方式: _self/_blank';
COMMENT ON COLUMN cms_carousel_item.status IS '状态: ACTIVE/DISABLED';
COMMENT ON COLUMN cms_carousel_item.click_count IS '点击次数';
COMMENT ON COLUMN cms_carousel_item.view_count IS '展示次数';


-- ============================================================
-- Part 3: cms_announcement — 公告表
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_announcement (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 业务字段
    announcement_code   VARCHAR(64),
    title               VARCHAR(200)    NOT NULL,
    summary             VARCHAR(500),
    content             TEXT,
    content_type        VARCHAR(32)     NOT NULL DEFAULT 'TEXT',
    announcement_type   VARCHAR(32)     NOT NULL DEFAULT 'NOTICE',
    priority            INTEGER         NOT NULL DEFAULT 0,
    is_pinned           BOOLEAN         NOT NULL DEFAULT FALSE,
    status              VARCHAR(32)     NOT NULL DEFAULT 'DRAFT',

    -- 展示位置
    position            VARCHAR(64),
    target_audience     VARCHAR(64)     DEFAULT 'ALL',

    -- 生效时间
    publish_time        TIMESTAMPTZ,
    start_time          TIMESTAMPTZ,
    end_time            TIMESTAMPTZ,

    -- 统计
    view_count          BIGINT          NOT NULL DEFAULT 0,

    -- 附件/图片
    cover_image_url     VARCHAR(512),
    attachments         JSONB,

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

CREATE INDEX IF NOT EXISTS idx_announcement_tenant   ON cms_announcement(tenant_id);
CREATE INDEX IF NOT EXISTS idx_announcement_type     ON cms_announcement(tenant_id, announcement_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_announcement_status   ON cms_announcement(tenant_id, status)            WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_announcement_position ON cms_announcement(tenant_id, position)          WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_announcement_pinned   ON cms_announcement(tenant_id, is_pinned, priority DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_announcement_time     ON cms_announcement(tenant_id, start_time, end_time)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_announcement_publish  ON cms_announcement(tenant_id, publish_time DESC)        WHERE deleted_at IS NULL;

COMMENT ON TABLE cms_announcement IS '公告表 — 系统通知/公告/活动';
COMMENT ON COLUMN cms_announcement.id IS '主键 ID（应用层生成）';
COMMENT ON COLUMN cms_announcement.title IS '公告标题';
COMMENT ON COLUMN cms_announcement.content IS '公告内容';
COMMENT ON COLUMN cms_announcement.content_type IS '内容类型: TEXT/HTML/MARKDOWN';
COMMENT ON COLUMN cms_announcement.announcement_type IS '公告类型: NOTICE/ACTIVITY/MAINTENANCE/UPDATE';
COMMENT ON COLUMN cms_announcement.priority IS '优先级（数字越大越靠前）';
COMMENT ON COLUMN cms_announcement.is_pinned IS '是否置顶';
COMMENT ON COLUMN cms_announcement.status IS '状态: DRAFT/PUBLISHED/DISABLED/ARCHIVED';
COMMENT ON COLUMN cms_announcement.position IS '展示位置: HOME/SERVICE/ALL';
COMMENT ON COLUMN cms_announcement.target_audience IS '目标受众: ALL/PATIENT/EMPLOYEE';
COMMENT ON COLUMN cms_announcement.publish_time IS '发布时间';
COMMENT ON COLUMN cms_announcement.attachments IS '附件列表（JSON 数组）';


-- ============================================================
-- Part 4: cms_content_category — 内容分类表
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_content_category (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 业务字段
    category_code       VARCHAR(64)     NOT NULL,
    category_name       VARCHAR(100)    NOT NULL,
    description         VARCHAR(500),
    parent_id           VARCHAR(64),
    level               INTEGER         NOT NULL DEFAULT 1,
    path                VARCHAR(512),
    sort_order          INTEGER         NOT NULL DEFAULT 0,
    status              VARCHAR(32)     NOT NULL DEFAULT 'ACTIVE',
    icon                VARCHAR(255),
    cover_image_url     VARCHAR(512),

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
    CONSTRAINT uk_category_code UNIQUE (tenant_id, category_code)
);

CREATE INDEX IF NOT EXISTS idx_category_tenant   ON cms_content_category(tenant_id);
CREATE INDEX IF NOT EXISTS idx_category_parent   ON cms_content_category(parent_id)         WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_category_status   ON cms_content_category(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_category_path     ON cms_content_category(tenant_id, path)   WHERE deleted_at IS NULL;

COMMENT ON TABLE cms_content_category IS '内容分类表 — 文章/内容分类树';
COMMENT ON COLUMN cms_content_category.category_code IS '分类编码';
COMMENT ON COLUMN cms_content_category.category_name IS '分类名称';
COMMENT ON COLUMN cms_content_category.parent_id IS '父分类 ID';
COMMENT ON COLUMN cms_content_category.level IS '层级（1为顶级）';
COMMENT ON COLUMN cms_content_category.path IS '完整路径（如 /1/2/3/）';
COMMENT ON COLUMN cms_content_category.status IS '状态: ACTIVE/DISABLED';


-- ============================================================
-- Part 5: cms_content — 内容/文章表
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_content (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联分类
    category_id         VARCHAR(64),

    -- 业务字段
    content_code        VARCHAR(64),
    title               VARCHAR(200)    NOT NULL,
    subtitle            VARCHAR(300),
    summary             VARCHAR(500),
    content             TEXT,
    content_type        VARCHAR(32)     NOT NULL DEFAULT 'HTML',
    author              VARCHAR(100),
    source              VARCHAR(200),
    source_url          VARCHAR(512),

    -- 展示配置
    cover_image_url     VARCHAR(512),
    thumbnail_url       VARCHAR(512),
    tags                JSONB,
    keywords            VARCHAR(500),
    sort_order          INTEGER         NOT NULL DEFAULT 0,
    is_featured         BOOLEAN         NOT NULL DEFAULT FALSE,
    is_pinned           BOOLEAN         NOT NULL DEFAULT FALSE,
    status              VARCHAR(32)     NOT NULL DEFAULT 'DRAFT',

    -- 发布时间
    publish_time        TIMESTAMPTZ,
    start_time          TIMESTAMPTZ,
    end_time            TIMESTAMPTZ,

    -- 统计
    view_count          BIGINT          NOT NULL DEFAULT 0,
    like_count          BIGINT          NOT NULL DEFAULT 0,
    share_count         BIGINT          NOT NULL DEFAULT 0,

    -- SEO
    seo_title           VARCHAR(200),
    seo_description     VARCHAR(500),
    seo_keywords        VARCHAR(500),

    -- 附件
    attachments         JSONB,

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
    CONSTRAINT fk_content_category FOREIGN KEY (category_id) REFERENCES cms_content_category(id)
);

CREATE INDEX IF NOT EXISTS idx_content_tenant     ON cms_content(tenant_id);
CREATE INDEX IF NOT EXISTS idx_content_category   ON cms_content(category_id)                WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_content_status     ON cms_content(tenant_id, status)          WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_content_featured   ON cms_content(tenant_id, is_featured)     WHERE deleted_at IS NULL AND is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_content_pinned     ON cms_content(tenant_id, is_pinned)       WHERE deleted_at IS NULL AND is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_content_publish    ON cms_content(tenant_id, publish_time DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_content_time       ON cms_content(tenant_id, start_time, end_time) WHERE deleted_at IS NULL;

COMMENT ON TABLE cms_content IS '内容/文章表 — CMS 核心内容';
COMMENT ON COLUMN cms_content.category_id IS '关联 cms_content_category.id';
COMMENT ON COLUMN cms_content.title IS '标题';
COMMENT ON COLUMN cms_content.content IS '正文内容';
COMMENT ON COLUMN cms_content.content_type IS '内容类型: TEXT/HTML/MARKDOWN';
COMMENT ON COLUMN cms_content.author IS '作者';
COMMENT ON COLUMN cms_content.source IS '来源';
COMMENT ON COLUMN cms_content.tags IS '标签（JSON 数组）';
COMMENT ON COLUMN cms_content.is_featured IS '是否推荐';
COMMENT ON COLUMN cms_content.is_pinned IS '是否置顶';
COMMENT ON COLUMN cms_content.status IS '状态: DRAFT/PUBLISHED/DISABLED/ARCHIVED';
COMMENT ON COLUMN cms_content.view_count IS '浏览次数';
COMMENT ON COLUMN cms_content.like_count IS '点赞次数';
COMMENT ON COLUMN cms_content.attachments IS '附件列表（JSON 数组）';


-- ============================================================
-- 表结构摘要
-- ============================================================
--
-- | 表名                    | 域         | 说明                    | 预留字段 |
-- |-------------------------|------------|------------------------|---------|
-- | cms_carousel            | 轮播域     | 轮播组主表              | 8       |
-- | cms_carousel_item       | 轮播域     | 轮播项表                | 8       |
-- | cms_announcement        | 公告域     | 公告表                  | 8       |
-- | cms_content_category    | 内容域     | 内容分类表              | 8       |
-- | cms_content             | 内容域     | 内容/文章表             | 8       |
--
-- 设计要点：
-- 1. 软删除使用现代模式（deleted_at IS NULL）
-- 2. 轮播支持 PC/移动端不同图片
-- 3. 公告支持置顶和优先级排序
-- 4. 内容分类支持树形结构（parent_id + path）
-- 5. 所有表支持多租户（tenant_id）
-- 6. 时间字段统一使用 TIMESTAMPTZ 保留时区
-- ============================================================
