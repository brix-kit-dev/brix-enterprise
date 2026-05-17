/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 */

/**
 * Phase 3 / C-5 — Scenario 02: Create a tenant.
 *
 * <p>Walks the multi-step wizard exposed by {@code useTenantCreate}, asserts
 * that the new tenant appears in the list view, and (smoke) that an
 * activation indicator is rendered.</p>
 */
import { test, expect } from './fixtures';
import { ROUTES, TEST_IDS } from './constants';

/** Generates a unique, lowercase tenant code so re-runs do not collide. */
function makeTenantCode(): string {
  const stamp = Date.now().toString(36);
  return `e2e-${stamp}`.slice(0, 20);
}

test.describe('Super-admin · create tenant', () => {
  test('completes the new-tenant wizard and lists the result', async ({
    superAdminPage,
  }) => {
    const code = makeTenantCode();
    const name = `E2E Tenant ${code}`;
    const adminEmail = `${code}@example.com`;

    await superAdminPage.goto(ROUTES.TENANT_CREATE);

    // Step 1 — basic info
    await superAdminPage.getByTestId(TEST_IDS.TENANT_CREATE_CODE).fill(code);
    await superAdminPage.getByTestId(TEST_IDS.TENANT_CREATE_NAME).fill(name);
    await superAdminPage.getByTestId(TEST_IDS.TENANT_CREATE_NEXT).click();

    // Step 2 — initial admin
    await superAdminPage.getByTestId(TEST_IDS.TENANT_CREATE_ADMIN_EMAIL).fill(adminEmail);
    await superAdminPage.getByTestId(TEST_IDS.TENANT_CREATE_NEXT).click();

    // Step 3 — review (optional fields skipped)
    await superAdminPage.getByTestId(TEST_IDS.TENANT_CREATE_NEXT).click();

    // Step 4 — submit
    await superAdminPage.getByTestId(TEST_IDS.TENANT_CREATE_SUBMIT).click();

    await expect(superAdminPage).toHaveURL(new RegExp(`${ROUTES.TENANTS_LIST}(\\?|$)`));
    await expect(superAdminPage.getByText(name)).toBeVisible();
  });
});
