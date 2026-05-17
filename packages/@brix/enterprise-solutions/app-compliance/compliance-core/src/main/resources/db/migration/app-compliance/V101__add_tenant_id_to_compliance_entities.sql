-- ============================================================
-- Flyway Migration: V101__add_tenant_id_to_compliance_entities.sql
-- Module: app-compliance
-- Phase 1.7: Add tenant_id column for multi-tenancy isolation
-- Date: 2026-06-01
-- ============================================================

ALTER TABLE compliance_script_template ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);
ALTER TABLE compliance_script_template ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE compliance_forbidden_word ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);
ALTER TABLE compliance_forbidden_word ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE compliance_check_result ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);
ALTER TABLE compliance_check_result ALTER COLUMN tenant_id DROP DEFAULT;

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM compliance_script_template WHERE tenant_id IS NULL) THEN
		RAISE EXCEPTION 'compliance_script_template.tenant_id requires an explicit tenant backfill before enabling NOT NULL';
	END IF;

	IF EXISTS (SELECT 1 FROM compliance_forbidden_word WHERE tenant_id IS NULL) THEN
		RAISE EXCEPTION 'compliance_forbidden_word.tenant_id requires an explicit tenant backfill before enabling NOT NULL';
	END IF;

	IF EXISTS (SELECT 1 FROM compliance_check_result WHERE tenant_id IS NULL) THEN
		RAISE EXCEPTION 'compliance_check_result.tenant_id requires an explicit tenant backfill before enabling NOT NULL';
	END IF;
END $$;

ALTER TABLE compliance_script_template ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE compliance_forbidden_word ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE compliance_check_result ALTER COLUMN tenant_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_script_template_tenant ON compliance_script_template (tenant_id);
CREATE INDEX IF NOT EXISTS idx_forbidden_word_tenant ON compliance_forbidden_word (tenant_id);
CREATE INDEX IF NOT EXISTS idx_check_result_tenant ON compliance_check_result (tenant_id);
