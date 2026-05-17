-- ============================================================
-- Flyway Migration: V101__add_tenant_id_to_contracts_entities.sql
-- Module: app-contracts
-- Phase 1.7: Add tenant_id column for multi-tenancy isolation
-- Date: 2026-06-01
--
-- NOTE (2026-04-29): The target tables (contract_party,
-- contract_sign_record, template_version) are JPA-entity tables that are
-- bootstrapped by Hibernate ddl-auto=update during the transitional
-- schema-migration period — they are NOT created by V100 (which only covers
-- biz_contract_* tables). Flyway runs BEFORE Hibernate (enforced by
-- EntityManagerFactoryDependsOnPostProcessor), so when this script runs the
-- target tables may not yet exist on a fresh database.
--
-- The defensive PL/pgSQL block below is therefore idempotent: it skips
-- silently when the table is absent (Hibernate will then create the table
-- with the tenant_id column already declared on the JPA entity), and runs
-- the ALTER on existing databases that pre-date the entity-level tenant_id
-- declaration. This preserves the original migration intent while remaining
-- safe across both fresh installs and existing databases.
-- ============================================================

DO $$
BEGIN
    IF to_regclass('public.contract_party') IS NOT NULL THEN
        ALTER TABLE contract_party ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);
        ALTER TABLE contract_party ALTER COLUMN tenant_id DROP DEFAULT;
        IF EXISTS (SELECT 1 FROM contract_party WHERE tenant_id IS NULL) THEN
            RAISE EXCEPTION 'contract_party.tenant_id requires an explicit tenant backfill before enabling NOT NULL';
        END IF;
        ALTER TABLE contract_party ALTER COLUMN tenant_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_contract_party_tenant ON contract_party (tenant_id);
    END IF;

    IF to_regclass('public.contract_sign_record') IS NOT NULL THEN
        ALTER TABLE contract_sign_record ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);
        ALTER TABLE contract_sign_record ALTER COLUMN tenant_id DROP DEFAULT;
        IF EXISTS (SELECT 1 FROM contract_sign_record WHERE tenant_id IS NULL) THEN
            RAISE EXCEPTION 'contract_sign_record.tenant_id requires an explicit tenant backfill before enabling NOT NULL';
        END IF;
        ALTER TABLE contract_sign_record ALTER COLUMN tenant_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_contract_sign_record_tenant ON contract_sign_record (tenant_id);
    END IF;

    IF to_regclass('public.template_version') IS NOT NULL THEN
        ALTER TABLE template_version ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);
        ALTER TABLE template_version ALTER COLUMN tenant_id DROP DEFAULT;
        IF EXISTS (SELECT 1 FROM template_version WHERE tenant_id IS NULL) THEN
            RAISE EXCEPTION 'template_version.tenant_id requires an explicit tenant backfill before enabling NOT NULL';
        END IF;
        ALTER TABLE template_version ALTER COLUMN tenant_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_template_version_tenant ON template_version (tenant_id);
    END IF;
END $$;
