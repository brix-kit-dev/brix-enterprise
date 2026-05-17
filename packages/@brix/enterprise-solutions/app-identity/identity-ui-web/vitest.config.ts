/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 */

/**
 * Vitest configuration for identity-ui-web (Phase 3 / C-5).
 *
 * <p>Mirrors tenant-ui-web's vitest config: jsdom environment, automatic
 * JSX transform, scoped coverage on the hooks/ directory only. The
 * `identity-shared` alias replicates the rspack alias so tests resolve
 * the workspace package's source rather than its dist output.</p>
 */
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      // Match tsconfig.json `paths` and rspack alias for identity-shared.
      // Both the bare-spec ("identity-shared") and the scoped name
      // ("@brix-sdk/enterprise-identity-shared") map to the source entry.
      'identity-shared': path.resolve(
        __dirname,
        '../identity-shared/src/index.ts',
      ),
      '@brix-sdk/enterprise-identity-shared': path.resolve(
        __dirname,
        '../identity-shared/src/index.ts',
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
        lines: 70,
        statements: 70,
        functions: 70,
        branches: 55,
      },
    },
  },
});
