-- ============================================================
-- Flyway Migration: V100__create_messenger_tables.sql
-- Module: brix-app-messenger (Notification & Messaging Service)
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
-- - v2.1 冻结：仅"通知记录 + 事件订阅 + 站内通知查询接口"
-- - 不对接短信/邮件/IM
--
-- 核心表清单：
-- | 表名                        | 说明                     |
-- |-----------------------------|--------------------------|
-- | msg_notification            | 通知记录表               |
-- | msg_notification_recipient  | 通知接收人表             |
-- | msg_subscription            | 事件订阅配置表           |
-- | msg_template                | 消息模板表               |
-- | msg_channel_config          | 渠道配置表               |
-- | msg_send_log                | 发送日志表（只追加）     |
-- ============================================================


-- ============================================================
-- Part 1: msg_notification — 通知记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS msg_notification (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联信息
    template_id         VARCHAR(64),
    case_id             VARCHAR(64),
    source_type         VARCHAR(50),
    source_id           VARCHAR(64),

    -- 业务字段
    notification_no     VARCHAR(64)     NOT NULL,
    title               VARCHAR(200)    NOT NULL,
    content             TEXT,
    content_type        VARCHAR(32)     NOT NULL DEFAULT 'TEXT',
    notification_type   VARCHAR(50)     NOT NULL,
    category            VARCHAR(50),
    priority            VARCHAR(20)     NOT NULL DEFAULT 'NORMAL',
    channels            JSONB,
    link_url            VARCHAR(512),
    link_type           VARCHAR(32),

    -- 发送控制
    scheduled_at        TIMESTAMPTZ,
    sent_at             TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    status              VARCHAR(32)     NOT NULL DEFAULT 'PENDING',

    -- 统计
    total_recipients    INTEGER         NOT NULL DEFAULT 0,
    success_count       INTEGER         NOT NULL DEFAULT 0,
    failure_count       INTEGER         NOT NULL DEFAULT 0,
    read_count          INTEGER         NOT NULL DEFAULT 0,

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
    CONSTRAINT uk_notification_no UNIQUE (tenant_id, notification_no)
);

CREATE INDEX IF NOT EXISTS idx_notification_tenant    ON msg_notification(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_type      ON msg_notification(tenant_id, notification_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notification_category  ON msg_notification(tenant_id, category)          WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notification_status    ON msg_notification(tenant_id, status)            WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notification_case      ON msg_notification(case_id)                      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notification_source    ON msg_notification(source_type, source_id)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notification_scheduled ON msg_notification(tenant_id, scheduled_at)      WHERE deleted_at IS NULL AND status = 'SCHEDULED';

COMMENT ON TABLE msg_notification IS '通知记录表 — 系统通知消息';
COMMENT ON COLUMN msg_notification.id IS '主键 ID（应用层生成）';
COMMENT ON COLUMN msg_notification.template_id IS '关联消息模板 ID';
COMMENT ON COLUMN msg_notification.case_id IS '关联 Case ID';
COMMENT ON COLUMN msg_notification.source_type IS '来源类型: SYSTEM/CASE/BOOKING/CONTRACT';
COMMENT ON COLUMN msg_notification.source_id IS '来源 ID';
COMMENT ON COLUMN msg_notification.notification_no IS '通知编号';
COMMENT ON COLUMN msg_notification.title IS '通知标题';
COMMENT ON COLUMN msg_notification.content IS '通知内容';
COMMENT ON COLUMN msg_notification.notification_type IS '类型: SYSTEM/REMINDER/ALERT/PROMOTION/INFO';
COMMENT ON COLUMN msg_notification.category IS '分类: CASE_UPDATE/PAYMENT/SCHEDULE/REPORT/GENERAL';
COMMENT ON COLUMN msg_notification.priority IS '优先级: URGENT/HIGH/NORMAL/LOW';
COMMENT ON COLUMN msg_notification.channels IS '发送渠道（JSON数组: IN_APP/EMAIL/SMS/PUSH）';
COMMENT ON COLUMN msg_notification.status IS '状态: PENDING/SCHEDULED/SENDING/SENT/FAILED/CANCELLED';


-- ============================================================
-- Part 2: msg_notification_recipient — 通知接收人表
-- ============================================================
CREATE TABLE IF NOT EXISTS msg_notification_recipient (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联通知
    notification_id     VARCHAR(64)     NOT NULL,

    -- 接收人信息
    recipient_type      VARCHAR(32)     NOT NULL,
    recipient_id        VARCHAR(64),
    recipient_name      VARCHAR(100),
    email               VARCHAR(200),
    phone               VARCHAR(32),
    device_token        VARCHAR(500),

    -- 发送状态
    channel             VARCHAR(32)     NOT NULL DEFAULT 'IN_APP',
    status              VARCHAR(32)     NOT NULL DEFAULT 'PENDING',
    sent_at             TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    read_at             TIMESTAMPTZ,
    error_message       VARCHAR(500),
    retry_count         INTEGER         NOT NULL DEFAULT 0,

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
    CONSTRAINT fk_recipient_notification FOREIGN KEY (notification_id) REFERENCES msg_notification(id)
);

CREATE INDEX IF NOT EXISTS idx_recipient_notification ON msg_notification_recipient(notification_id);
CREATE INDEX IF NOT EXISTS idx_recipient_tenant       ON msg_notification_recipient(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recipient_user         ON msg_notification_recipient(tenant_id, recipient_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recipient_status       ON msg_notification_recipient(tenant_id, status)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recipient_unread       ON msg_notification_recipient(tenant_id, recipient_id, read_at) WHERE deleted_at IS NULL AND read_at IS NULL;

COMMENT ON TABLE msg_notification_recipient IS '通知接收人表 — 每条通知的接收人';
COMMENT ON COLUMN msg_notification_recipient.notification_id IS '关联 msg_notification.id';
COMMENT ON COLUMN msg_notification_recipient.recipient_type IS '接收人类型: USER/CUSTOMER/GROUP/ROLE';
COMMENT ON COLUMN msg_notification_recipient.recipient_id IS '接收人 ID';
COMMENT ON COLUMN msg_notification_recipient.channel IS '渠道: IN_APP/EMAIL/SMS/PUSH';
COMMENT ON COLUMN msg_notification_recipient.status IS '状态: PENDING/SENT/DELIVERED/READ/FAILED';


-- ============================================================
-- Part 3: msg_subscription — 事件订阅配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS msg_subscription (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 业务字段
    subscription_code   VARCHAR(64)     NOT NULL,
    subscription_name   VARCHAR(200)    NOT NULL,
    event_type          VARCHAR(100)    NOT NULL,
    event_source        VARCHAR(50),
    description         VARCHAR(500),
    is_enabled          BOOLEAN         NOT NULL DEFAULT TRUE,
    is_system           BOOLEAN         NOT NULL DEFAULT FALSE,

    -- 订阅配置
    target_type         VARCHAR(50)     NOT NULL,
    target_selector     JSONB,
    channels            JSONB,
    template_id         VARCHAR(64),
    priority            VARCHAR(20)     NOT NULL DEFAULT 'NORMAL',

    -- 过滤条件
    filter_conditions   JSONB,
    throttle_seconds    INTEGER,

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
    CONSTRAINT uk_subscription_code UNIQUE (tenant_id, subscription_code)
);

CREATE INDEX IF NOT EXISTS idx_subscription_tenant  ON msg_subscription(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_event   ON msg_subscription(tenant_id, event_type)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_subscription_enabled ON msg_subscription(tenant_id, is_enabled)   WHERE deleted_at IS NULL AND is_enabled = TRUE;

COMMENT ON TABLE msg_subscription IS '事件订阅配置表 — 事件触发通知规则';
COMMENT ON COLUMN msg_subscription.subscription_code IS '订阅编码';
COMMENT ON COLUMN msg_subscription.subscription_name IS '订阅名称';
COMMENT ON COLUMN msg_subscription.event_type IS '事件类型: CaseCreated/PaymentConfirmed/ScheduleConfirmed';
COMMENT ON COLUMN msg_subscription.event_source IS '事件来源: case-service/booking-service';
COMMENT ON COLUMN msg_subscription.target_type IS '目标类型: CASE_OWNER/CASE_MANAGER/CUSTOMER/ROLE/GROUP';
COMMENT ON COLUMN msg_subscription.target_selector IS '目标选择器（JSON）';
COMMENT ON COLUMN msg_subscription.channels IS '发送渠道（JSON数组）';
COMMENT ON COLUMN msg_subscription.filter_conditions IS '过滤条件（JSON）';
COMMENT ON COLUMN msg_subscription.throttle_seconds IS '节流时间（秒）';


-- ============================================================
-- Part 4: msg_template — 消息模板表
-- ============================================================
CREATE TABLE IF NOT EXISTS msg_template (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 业务字段
    template_code       VARCHAR(64)     NOT NULL,
    template_name       VARCHAR(200)    NOT NULL,
    template_type       VARCHAR(50)     NOT NULL,
    channel             VARCHAR(32)     NOT NULL,
    language            VARCHAR(10)     NOT NULL DEFAULT 'zh-CN',
    title_template      VARCHAR(500),
    content_template    TEXT            NOT NULL,
    content_type        VARCHAR(32)     NOT NULL DEFAULT 'TEXT',
    variables           JSONB,
    version             VARCHAR(20)     NOT NULL DEFAULT '1.0',
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
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
    CONSTRAINT uk_msg_template_code UNIQUE (tenant_id, template_code, channel, language, version)
);

CREATE INDEX IF NOT EXISTS idx_msg_template_tenant   ON msg_template(tenant_id);
CREATE INDEX IF NOT EXISTS idx_msg_template_type     ON msg_template(tenant_id, template_type)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_msg_template_channel  ON msg_template(tenant_id, channel)         WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_msg_template_active   ON msg_template(tenant_id, is_active)       WHERE deleted_at IS NULL AND is_active = TRUE;

COMMENT ON TABLE msg_template IS '消息模板表 — 通知消息模板';
COMMENT ON COLUMN msg_template.template_code IS '模板编码';
COMMENT ON COLUMN msg_template.template_name IS '模板名称';
COMMENT ON COLUMN msg_template.template_type IS '类型: NOTIFICATION/REMINDER/ALERT/PROMOTION';
COMMENT ON COLUMN msg_template.channel IS '渠道: IN_APP/EMAIL/SMS/PUSH';
COMMENT ON COLUMN msg_template.language IS '语言: zh-CN/ja/en';
COMMENT ON COLUMN msg_template.title_template IS '标题模板（支持变量）';
COMMENT ON COLUMN msg_template.content_template IS '内容模板（支持变量）';
COMMENT ON COLUMN msg_template.variables IS '变量定义（JSON）';


-- ============================================================
-- Part 5: msg_channel_config — 渠道配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS msg_channel_config (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 业务字段
    channel_code        VARCHAR(64)     NOT NULL,
    channel_name        VARCHAR(100)    NOT NULL,
    channel_type        VARCHAR(32)     NOT NULL,
    provider            VARCHAR(50),
    is_enabled          BOOLEAN         NOT NULL DEFAULT FALSE,
    is_default          BOOLEAN         NOT NULL DEFAULT FALSE,
    priority            INTEGER         NOT NULL DEFAULT 0,

    -- 配置
    config              JSONB,
    credentials         JSONB,
    rate_limit          INTEGER,
    retry_config        JSONB,

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
    CONSTRAINT uk_channel_code UNIQUE (tenant_id, channel_code)
);

CREATE INDEX IF NOT EXISTS idx_channel_config_tenant  ON msg_channel_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_channel_config_type    ON msg_channel_config(tenant_id, channel_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_channel_config_enabled ON msg_channel_config(tenant_id, is_enabled)   WHERE deleted_at IS NULL AND is_enabled = TRUE;

COMMENT ON TABLE msg_channel_config IS '渠道配置表 — 消息发送渠道';
COMMENT ON COLUMN msg_channel_config.channel_code IS '渠道编码';
COMMENT ON COLUMN msg_channel_config.channel_name IS '渠道名称';
COMMENT ON COLUMN msg_channel_config.channel_type IS '渠道类型: IN_APP/EMAIL/SMS/PUSH/WECHAT';
COMMENT ON COLUMN msg_channel_config.provider IS '服务商: ALIYUN/TWILIO/SENDGRID';
COMMENT ON COLUMN msg_channel_config.config IS '渠道配置（JSON）';
COMMENT ON COLUMN msg_channel_config.credentials IS '凭证信息（加密存储）';
COMMENT ON COLUMN msg_channel_config.rate_limit IS '速率限制（条/秒）';
COMMENT ON COLUMN msg_channel_config.retry_config IS '重试配置（JSON）';


-- ============================================================
-- Part 6: msg_send_log — 发送日志表（只追加）
-- ============================================================
CREATE TABLE IF NOT EXISTS msg_send_log (
    -- 主键
    id                  VARCHAR(64)     NOT NULL PRIMARY KEY,

    -- 关联信息
    notification_id     VARCHAR(64),
    recipient_id        VARCHAR(64),
    channel_config_id   VARCHAR(64),

    -- 业务字段
    channel             VARCHAR(32)     NOT NULL,
    recipient_address   VARCHAR(200),
    request_body        TEXT,
    response_body       TEXT,
    status              VARCHAR(32)     NOT NULL,
    error_code          VARCHAR(50),
    error_message       VARCHAR(500),
    provider_msg_id     VARCHAR(200),
    
    -- 时间信息
    sent_at             TIMESTAMPTZ     NOT NULL,
    response_at         TIMESTAMPTZ,
    duration_ms         INTEGER,

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

CREATE INDEX IF NOT EXISTS idx_send_log_tenant       ON msg_send_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_send_log_notification ON msg_send_log(notification_id);
CREATE INDEX IF NOT EXISTS idx_send_log_channel      ON msg_send_log(tenant_id, channel);
CREATE INDEX IF NOT EXISTS idx_send_log_status       ON msg_send_log(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_send_log_time         ON msg_send_log(tenant_id, sent_at DESC);

COMMENT ON TABLE msg_send_log IS '发送日志表 — 消息发送记录（只追加）';
COMMENT ON COLUMN msg_send_log.notification_id IS '关联 msg_notification.id';
COMMENT ON COLUMN msg_send_log.recipient_id IS '关联接收人 ID';
COMMENT ON COLUMN msg_send_log.channel IS '发送渠道';
COMMENT ON COLUMN msg_send_log.recipient_address IS '接收地址（邮箱/手机号）';
COMMENT ON COLUMN msg_send_log.status IS '状态: SUCCESS/FAILED/REJECTED';
COMMENT ON COLUMN msg_send_log.provider_msg_id IS '服务商消息 ID';
COMMENT ON COLUMN msg_send_log.duration_ms IS '请求耗时（毫秒）';

-- ⚠️ 发送日志只允许 INSERT 的 Trigger
CREATE OR REPLACE FUNCTION prevent_send_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Send log is immutable. UPDATE/DELETE is not allowed.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_send_log_no_update
    BEFORE UPDATE OR DELETE ON msg_send_log
    FOR EACH ROW EXECUTE FUNCTION prevent_send_log_mutation();


-- ============================================================
-- 表结构摘要
-- ============================================================
--
-- | 表名                        | 域         | 说明                    | 预留字段 |
-- |-----------------------------|------------|------------------------|---------|
-- | msg_notification            | 通知域     | 通知记录表              | 8       |
-- | msg_notification_recipient  | 通知域     | 通知接收人表            | 8       |
-- | msg_subscription            | 订阅域     | 事件订阅配置表          | 8       |
-- | msg_template                | 模板域     | 消息模板表              | 8       |
-- | msg_channel_config          | 渠道域     | 渠道配置表              | 8       |
-- | msg_send_log                | 日志域     | 发送日志表（只追加）    | 8       |
--
-- 设计要点：
-- 1. v2.1 仅支持站内通知，渠道配置预留
-- 2. 事件订阅支持过滤和节流
-- 3. 发送日志只追加（带 Trigger 防护）
-- 4. 使用 msg_ 前缀区分消息域
-- ============================================================
