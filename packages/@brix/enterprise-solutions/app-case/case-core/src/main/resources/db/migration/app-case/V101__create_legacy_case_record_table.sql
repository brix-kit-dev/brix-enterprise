-- Flyway DDL for the legacy case_record table that Hibernate `ddl-auto: update` used to create.
-- Reproduces the definitions found on the shared database, so the host can run
-- with `ddl-auto: validate` (root blueprint BRX-RS-DATA-035). IF NOT EXISTS keeps
-- databases that already have them unchanged.

CREATE TABLE IF NOT EXISTS case_record (
    id character varying(36) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(36),
    description character varying(500),
    name character varying(100) NOT NULL,
    status character varying(20),
    tenant_id character varying(36) NOT NULL,
    updated_at timestamp(6) without time zone,
    updated_by character varying(36),
    CONSTRAINT case_record_pkey PRIMARY KEY (id)
);
