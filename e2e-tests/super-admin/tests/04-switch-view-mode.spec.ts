/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 */

/**
 * Phase 3 / C-5 — Scenario 04: Switch to tenant view-mode.
 *
 * <p>Asserts that the platform admin can enter "view-as-tenant" mode for an
 * existing tenant and that the chrome correctly indicates the impersonation
 * banner is active (Phase 2 §4 RoleGuard contract).</p>
 */
import { test, expect } from './fixtures';
import { ROUTES, TEST_IDS } from './constants';

test.describe('Super-admin · switch view mode', () => {
  test('enters view-as-tenant mode and shows the impersonation banner', async ({
    superAdminPage,
  }) => {
    await superAdminPage.goto(ROUTES.TENANTS_LIST);

    await superAdminPage.getByTestId(TEST_IDS.TENANT_ROW_VIEW_AS).first().click();
    await expect(superAdminPage.getByTestId(TEST_IDS.VIEW_MODE_BANNER)).toBeVisible();
  });
});
