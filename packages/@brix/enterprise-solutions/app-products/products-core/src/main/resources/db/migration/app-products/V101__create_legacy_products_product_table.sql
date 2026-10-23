-- Flyway DDL for the legacy products_product table that Hibernate `ddl-auto: update` used to create.
-- Reproduces the definitions found on the shared database, so the host can run
-- with `ddl-auto: validate` (root blueprint BRX-RS-DATA-035). IF NOT EXISTS keeps
-- databases that already have them unchanged.

CREATE TABLE IF NOT EXISTS products_product (
    id bigserial NOT NULL,
    category_id bigint,
    code character varying(50),
    cover_image character varying(500),
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(100),
    currency character varying(10),
    deleted boolean,
    description text,
    duration character varying(100),
    images text,
    name character varying(100) NOT NULL,
    original_price numeric(12,2),
    partner_id bigint NOT NULL,
    price numeric(12,2),
    price_range character varying(100),
    remarks character varying(500),
    sales_count integer,
    service_items text,
    sort_order integer,
    status character varying(30) NOT NULL,
    tags character varying(500),
    tenant_id character varying(50) NOT NULL,
    type character varying(30) NOT NULL,
    updated_at timestamp(6) without time zone,
    view_count integer,
    CONSTRAINT products_product_pkey PRIMARY KEY (id),
    CONSTRAINT products_product_status_check CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'INACTIVE', 'ARCHIVED')),
    CONSTRAINT products_product_type_check CHECK (type IN ('CHECKUP', 'TREATMENT', 'TRANSLATION', 'TRANSPORT', 'ACCOMMODATION', 'COMPOSITE'))
);
