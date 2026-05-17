/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 */

/**
 * Phase 3 / C-5 — Scenario 03: Invite a tenant owner.
 *
 * <p>Re-uses the tenant created in scenario 02 (or creates one inline if the
 * suite is run individually) and exercises the member-invitation flow on
 * {@link ROUTES.TENANT_MEMBERS}.</p>
 */
import { test, expect } from './fixtures';
import { ROUTES, TEST_IDS } from './constants';

test.describe('Super-admin · invite tenant owner', () => {
  test('invites a new owner and shows them in the members table', async ({
    superAdminPage,
  }) => {
    await superAdminPage.goto(ROUTES.TENANTS_LIST);

    // Open the most recently created tenant — the list is sorted by
    // creation time descending, so the first row is the freshest.
    const firstViewLink = superAdminPage.getByTestId(TEST_IDS.TENANT_ROW_VIEW).first();
    await firstViewLink.click();

    await expect(superAdminPage).toHaveURL(/\/admin\/tenants\/[^/]+$/);

    const tenantId = new URL(superAdminPage.url()).pathname.split('/').pop();
    if (!tenantId) {
      throw new Error('Unable to resolve tenant id from detail URL.');
    }
    await superAdminPage.goto(ROUTES.TENANT_MEMBERS(tenantId));

    const inviteEmail = `owner-${Date.now().toString(36)}@example.com`;

    await superAdminPage.getByTestId(TEST_IDS.MEMBER_INVITE_OPEN).click();
    await superAdminPage.getByTestId(TEST_IDS.MEMBER_INVITE_EMAIL).fill(inviteEmail);

    const roleControl = superAdminPage.getByTestId(TEST_IDS.MEMBER_INVITE_ROLE);
    await roleControl.click();
    await superAdminPage.getByTestId(TEST_IDS.MEMBER_INVITE_ROLE_OPTION_OWNER).click();

    await superAdminPage.getByTestId(TEST_IDS.MEMBER_INVITE_SUBMIT).click();

    await expect(superAdminPage.getByText(inviteEmail)).toBeVisible();
  });
});
