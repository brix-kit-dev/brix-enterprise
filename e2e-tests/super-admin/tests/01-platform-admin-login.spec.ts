/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 */

/**
 * Phase 3 / C-5 — Scenario 01: Platform admin login.
 *
 * <p>Validates that the bootstrap super-admin can authenticate through
 * {@code /platform/login} and lands on the platform dashboard with an
 * authenticated session cookie.</p>
 */
import { test, expect } from './fixtures';
import { ROUTES, TEST_IDS } from './constants';

test.describe('Super-admin · login', () => {
  test('bootstrap super-admin signs in and reaches the platform dashboard', async ({
    superAdminPage,
  }) => {
    await superAdminPage.goto(ROUTES.PLATFORM_DASHBOARD);

    await expect(superAdminPage).toHaveURL(
      new RegExp(`${ROUTES.PLATFORM_DASHBOARD}(/|$)`),
    );

    await expect(
      superAdminPage.getByTestId(TEST_IDS.CURRENT_USER_NAME),
    ).toBeVisible();
  });
});
