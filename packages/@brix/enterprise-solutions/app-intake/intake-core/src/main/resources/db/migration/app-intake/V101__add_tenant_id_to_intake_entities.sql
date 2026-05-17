-- ============================================================
-- Flyway Migration: V101__add_tenant_id_to_intake_entities.sql
-- Module: app-intake
-- Phase 1.7: Add tenant_id column for multi-tenancy isolation
-- Date: 2026-06-01
-- ============================================================

ALTER TABLE intake_task ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);
ALTER TABLE intake_task ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE intake_checklist_item ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);
ALTER TABLE intake_checklist_item ALTER COLUMN tenant_id DROP DEFAULT;

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM intake_task WHERE tenant_id IS NULL) THEN
		RAISE EXCEPTION 'intake_task.tenant_id requires an explicit tenant backfill before enabling NOT NULL';
	END IF;

	IF EXISTS (SELECT 1 FROM intake_checklist_item WHERE tenant_id IS NULL) THEN
		RAISE EXCEPTION 'intake_checklist_item.tenant_id requires an explicit tenant backfill before enabling NOT NULL';
	END IF;
END $$;

ALTER TABLE intake_task ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE intake_checklist_item ALTER COLUMN tenant_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_intake_task_tenant ON intake_task (tenant_id);
CREATE INDEX IF NOT EXISTS idx_checklist_item_tenant ON intake_checklist_item (tenant_id);
