/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 */

/**
 * Phase 3 / C-5 — Playwright configuration for the super-admin suite.
 *
 * <p>The suite runs against a real backend stack (Postgres + Redis + Spring
 * Boot host) per Decision D3 of the Phase 3 implementation plan.  Backend
 * lifecycle is owned by {@code stack:up} / {@code stack:down}, NOT by
 * {@code webServer} — the Java host has a long warm-up time and we keep it
 * outside Playwright's process tree so reruns are fast.</p>
 *
 * <p>The frontend dev-server (host-shell on :3001) IS managed by Playwright
 * via {@code webServer} so a developer running {@code pnpm test} from a
 * cold checkout gets a single command experience.</p>
 *
 * @see docs-dev/前端稳定性改造计划-v1.0.md §5.2
 */
import { defineConfig, devices } from '@playwright/test';
import { PORTS, BASE_URL } from './tests/constants';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  // Phase 3 §5.2 — fail fast in CI, retry once locally to absorb flakiness
  // from the real backend (login redirects, JIT warm-up).
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  fullyParallel: false, // tests share tenant state; serial keeps them deterministic.

  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: isCI
    ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list'], ['html', { open: 'on-failure' }]],

  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Frontend dev-server only — the Java backend is managed by `stack:up`.
  webServer: {
    command: `pnpm --filter host-shell-standalone-web run dev`,
    cwd: '../..',
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
    env: {
      // Point the frontend dev-server at the local containerised backend.
      BACKEND_URL: `http://localhost:${PORTS.BACKEND}`,
    },
  },
});
