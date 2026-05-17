/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 */

/**
 * Shared Playwright fixtures for the super-admin suite.
 *
 * <p>Provides a {@code superAdminPage} fixture that performs the bootstrap
 * login once per worker and reuses the storageState across tests, mirroring
 * the standard Playwright auth-state pattern.</p>
 */
import { test as base, expect, type Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

import {
  BASE_URL,
  BOOTSTRAP_ADMIN,
  ROUTES,
  STORAGE_STATE_FILE,
  TEST_IDS,
  resolveBootstrapPassword,
} from './constants';

interface SuperAdminFixtures {
  /** A page already authenticated as the bootstrap super-admin. */
  superAdminPage: Page;
}

/**
 * Performs an interactive login through the platform login page and persists
 * the storage state for reuse.
 *
 * <p>Phase 3 selectors are data-testid only so translated labels and visual
 * redesigns cannot change the automation contract.</p>
 */
async function performBootstrapLogin(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}${ROUTES.PLATFORM_LOGIN}`);

  await page.getByTestId(TEST_IDS.LOGIN_USERNAME).fill(BOOTSTRAP_ADMIN.username);
  await page.getByTestId(TEST_IDS.LOGIN_PASSWORD).fill(resolveBootstrapPassword());
  await page.getByTestId(TEST_IDS.LOGIN_SUBMIT).click();

  await expect(page).toHaveURL(new RegExp(`${ROUTES.PLATFORM_DASHBOARD}(/|$)`));
}

export const test = base.extend<SuperAdminFixtures>({
  superAdminPage: async ({ browser }, use) => {
    const stateFile = path.resolve(STORAGE_STATE_FILE);
    if (!fs.existsSync(stateFile)) {
      fs.mkdirSync(path.dirname(stateFile), { recursive: true });
      const tempContext = await browser.newContext();
      const tempPage = await tempContext.newPage();
      await performBootstrapLogin(tempPage);
      await tempContext.storageState({ path: stateFile });
      await tempContext.close();
    }

    const context = await browser.newContext({ storageState: stateFile });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
