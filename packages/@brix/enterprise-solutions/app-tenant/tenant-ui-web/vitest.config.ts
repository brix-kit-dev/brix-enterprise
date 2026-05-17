/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 */

/**
 * Vitest configuration for tenant-ui-web (Phase 3 / C-5).
 *
 * <p>Tenant management plugin's ViewModel hooks are tested in isolation
 * by mocking the runtime-sdk-react capability hooks and the local
 * Repository factory. No real Module Federation / HTTP / EventBus runtime
 * is started by these tests — that integration is verified by the
 * super-admin e2e suite (Playwright).</p>
 *
 * <p>esbuild.jsx = 'automatic' lets test files use JSX without an explicit
 * `import React` (vitest's own transform pipeline; the production rspack
 * build still uses runtime: 'classic' as configured in rspack.config.ts).</p>
 */
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      // Mirror rspack.config.ts so test imports resolve identically to
      // the production bundler. Keeping these in lock-step prevents
      // "works in app, breaks in test" surprises.
      '@brix-sdk/tenant-shared': path.resolve(
        __dirname,
        '../tenant-shared/src/index.ts',
      ),
      'tenant-shared': path.resolve(
        __dirname,
        '../tenant-shared/src/index.ts',
      ),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/**/*.spec.ts',
      'src/**/*.spec.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        // Phase 3 covers ViewModel hooks only. Pages, repositories, and
        // index files are excluded from the gate; they will be picked up
        // in Phase 4 when the View → ViewModel → Repository split is
        // measured end-to-end.
        'src/hooks/**/*.ts',
        'src/hooks/**/*.tsx',
      ],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/*.spec.ts',
        'src/**/*.spec.tsx',
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        'src/**/index.ts',
      ],
      thresholds: {
        // Phase 3 exit gate per plan §5.1 — super-admin hooks ≥ 70% lines.
        lines: 70,
        statements: 70,
        functions: 70,
        branches: 55,
      },
    },
  },
});
