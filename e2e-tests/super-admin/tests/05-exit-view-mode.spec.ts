/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 */

/**
 * Phase 3 / C-5 — Scenario 05: Exit tenant view-mode.
 *
 * <p>Mirror of scenario 04 — confirms that the platform admin can leave the
 * impersonation context and that the banner disappears, returning the
 * navigation chrome to its platform-admin state.</p>
 */
import { test, expect } from './fixtures';
import { ROUTES, TEST_IDS } from './constants';

test.describe('Super-admin · exit view mode', () => {
  test('exits view-as-tenant mode and dismisses the banner', async ({
    superAdminPage,
  }) => {
    await superAdminPage.goto(ROUTES.TENANTS_LIST);

    // Enter view mode first so this spec is independent.
    await superAdminPage.getByTestId(TEST_IDS.TENANT_ROW_VIEW_AS).first().click();

    const banner = superAdminPage.getByTestId(TEST_IDS.VIEW_MODE_BANNER);
    await expect(banner).toBeVisible();

    await superAdminPage.getByTestId(TEST_IDS.VIEW_MODE_EXIT).click();

    await expect(banner).toBeHidden();
    await expect(superAdminPage).toHaveURL(new RegExp(`${ROUTES.PLATFORM_DASHBOARD}(/|$)`));
  });
});
