-- ============================================================
-- Flyway Migration: V100__create_app_tenant_tables.sql
-- Module: brix-app-tenant
-- Version: 3.2.0-SNAPSHOT
-- Date: 2026-07-24
--
-- Owner: app-tenant plugin
-- Scope: tenant directory and tenant membership records owned by app-tenant
-- ============================================================

CREATE TABLE IF NOT EXISTS app_tenant_record (
    id                      BIGSERIAL       NOT NULL PRIMARY KEY,
    code                    VARCHAR(64)     NOT NULL,
    name                    VARCHAR(256)    NOT NULL,
    status                  VARCHAR(32)     NOT NULL DEFAULT 'PENDING_ACTIVATION',
    owner_identity_id       BIGINT          NOT NULL,
    contact_email           VARCHAR(320),
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_identity_id  BIGINT          NOT NULL,
    updated_by_identity_id  BIGINT          NOT NULL,
    CONSTRAINT uk_app_tenant_record_code UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_app_tenant_record_status
    ON app_tenant_record(status);

CREATE INDEX IF NOT EXISTS idx_app_tenant_record_owner
    ON app_tenant_record(owner_identity_id);

COMMENT ON TABLE app_tenant_record IS 'App-tenant owned tenant directory';
COMMENT ON COLUMN app_tenant_record.code IS 'Tenant code used by app-tenant APIs';
COMMENT ON COLUMN app_tenant_record.owner_identity_id IS 'Identity id recorded as initial tenant owner';

CREATE TABLE IF NOT EXISTS app_tenant_member (
    id              BIGSERIAL       NOT NULL PRIMARY KEY,
    tenant_id       BIGINT          NOT NULL,
    identity_id     BIGINT          NOT NULL,
    display_name    VARCHAR(256),
    email           VARCHAR(320),
    member_type     VARCHAR(32)     NOT NULL,
    status          VARCHAR(32)     NOT NULL DEFAULT 'ACTIVE',
    joined_at       TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_app_tenant_member_identity UNIQUE (tenant_id, identity_id),
    CONSTRAINT fk_app_tenant_member_tenant
        FOREIGN KEY (tenant_id) REFERENCES app_tenant_record(id)
);

CREATE INDEX IF NOT EXISTS idx_app_tenant_member_tenant
    ON app_tenant_member(tenant_id);

CREATE INDEX IF NOT EXISTS idx_app_tenant_member_identity
    ON app_tenant_member(identity_id);

COMMENT ON TABLE app_tenant_member IS 'App-tenant owned tenant membership directory';
COMMENT ON COLUMN app_tenant_member.tenant_id IS 'app_tenant_record.id';
COMMENT ON COLUMN app_tenant_member.identity_id IS 'Identity id referenced by app-tenant membership';
