-- Flyway DDL for the legacy storage_file_metadata table and storage_access_log columns that Hibernate `ddl-auto: update` used to create.
-- Reproduces the definitions found on the shared database, so the host can run
-- with `ddl-auto: validate` (root blueprint BRX-RS-DATA-035). IF NOT EXISTS keeps
-- databases that already have them unchanged.

CREATE TABLE IF NOT EXISTS storage_file_metadata (
    id character varying(36) NOT NULL,
    business_type character varying(30) NOT NULL,
    content_type character varying(100) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    deleted boolean NOT NULL,
    deleted_at timestamp(6) without time zone,
    deleted_by character varying(64),
    entity_id character varying(64),
    file_extension character varying(20),
    file_size bigint NOT NULL,
    md5_hash character varying(32),
    original_name character varying(255) NOT NULL,
    remark character varying(500),
    storage_path character varying(500) NOT NULL,
    tenant_id character varying(64) NOT NULL,
    updated_at timestamp(6) without time zone,
    uploaded_by character varying(64) NOT NULL,
    CONSTRAINT storage_file_metadata_pkey PRIMARY KEY (id),
    CONSTRAINT storage_file_metadata_business_type_check CHECK (business_type IN ('MEDICAL_INTAKE', 'CONTRACT', 'REPORT', 'AVATAR', 'CERTIFICATE', 'BOOKING', 'OTHER'))
);
CREATE INDEX IF NOT EXISTS idx_file_md5 ON storage_file_metadata (tenant_id, md5_hash);
CREATE INDEX IF NOT EXISTS idx_file_uploader ON storage_file_metadata (tenant_id, uploaded_by);

ALTER TABLE storage_access_log ADD COLUMN IF NOT EXISTS access_time timestamp(6) without time zone NOT NULL;
ALTER TABLE storage_access_log ADD COLUMN IF NOT EXISTS client_ip character varying(50);
ALTER TABLE storage_access_log ADD COLUMN IF NOT EXISTS failure_reason character varying(500);
ALTER TABLE storage_access_log ADD COLUMN IF NOT EXISTS operator_id character varying(64) NOT NULL;
ALTER TABLE storage_access_log ADD COLUMN IF NOT EXISTS result character varying(20);
CREATE INDEX IF NOT EXISTS idx_access_log_operator ON storage_access_log (tenant_id, operator_id);
