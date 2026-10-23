-- Flyway DDL for the legacy carousel and banner tables that Hibernate `ddl-auto: update` used to create.
-- Reproduces the definitions found on the shared database, so the host can run
-- with `ddl-auto: validate` (root blueprint BRX-RS-DATA-035). IF NOT EXISTS keeps
-- databases that already have them unchanged.

CREATE TABLE IF NOT EXISTS carousel (
    id bigserial NOT NULL,
    auto_play_interval integer,
    code character varying(64) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    description character varying(512),
    enabled boolean NOT NULL,
    name character varying(128) NOT NULL,
    "position" character varying(64),
    show_indicator boolean,
    show_navigation boolean,
    tenant_id character varying(64) NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT carousel_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_carousel_code ON carousel (code);

CREATE TABLE IF NOT EXISTS banner (
    id bigserial NOT NULL,
    action_type character varying(32),
    action_value character varying(512),
    action_value_app character varying(512),
    click_count bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    description character varying(1024),
    end_time timestamp(6) without time zone,
    image_url character varying(512),
    image_url_mobile character varying(512),
    platform character varying(32) NOT NULL,
    sort_order integer NOT NULL,
    start_time timestamp(6) without time zone,
    status character varying(32) NOT NULL,
    subtitle character varying(256),
    tenant_id character varying(64) NOT NULL,
    thumbnail_url character varying(512),
    title character varying(128) NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    view_count bigint NOT NULL,
    carousel_id bigint NOT NULL,
    CONSTRAINT banner_pkey PRIMARY KEY (id),
    CONSTRAINT banner_action_type_check CHECK (action_type IN ('NONE', 'LINK', 'ROUTE', 'POPUP', 'DEEP_LINK')),
    CONSTRAINT banner_platform_check CHECK (platform IN ('ALL', 'WEB', 'H5', 'IOS', 'ANDROID', 'MINI_PROGRAM')),
    CONSTRAINT banner_status_check CHECK (status IN ('DRAFT', 'ENABLED', 'DISABLED', 'EXPIRED')),
    CONSTRAINT fksbsjm380mdgngplqyo8ph9iuk FOREIGN KEY (carousel_id) REFERENCES carousel (id)
);
CREATE INDEX IF NOT EXISTS idx_banner_carousel ON banner (carousel_id);
CREATE INDEX IF NOT EXISTS idx_banner_platform ON banner (platform);
CREATE INDEX IF NOT EXISTS idx_banner_status ON banner (status);
