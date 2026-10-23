-- Flyway DDL for the biz_partner columns that Hibernate `ddl-auto: update` used to create.
-- Reproduces the definitions found on the shared database, so the host can run
-- with `ddl-auto: validate` (root blueprint BRX-RS-DATA-035). IF NOT EXISTS keeps
-- databases that already have them unchanged.

ALTER TABLE biz_partner ADD COLUMN IF NOT EXISTS contact_email character varying(128);
ALTER TABLE biz_partner ADD COLUMN IF NOT EXISTS contact_name character varying(100);
ALTER TABLE biz_partner ADD COLUMN IF NOT EXISTS contact_phone character varying(32);
ALTER TABLE biz_partner ADD COLUMN IF NOT EXISTS deleted boolean;
ALTER TABLE biz_partner ADD COLUMN IF NOT EXISTS name character varying(200) NOT NULL;
ALTER TABLE biz_partner ADD COLUMN IF NOT EXISTS qualifications jsonb;
ALTER TABLE biz_partner ADD COLUMN IF NOT EXISTS service_area character varying(200);
