/**
 * ESLint for this plugin UI: the UI preset of @brix-sdk/eslint-config-architecture on the package's own files, with
 * TypeScript parsed (standard-link queue item 19, D162): red lines, Page/Hook/Repository layers, BrixUI and design
 * tokens, role literals and role checks, the super-admin red lines, accessibility warnings.
 */
const architecture = require('@brix-sdk/eslint-config-architecture');

module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  ...architecture.configs.ui,
  // Super-admin action surfaces declare data-testid, so the nightly Playwright suite never depends on translated
  // labels or role text.
  {
    files: ['src/pages/{TenantList,TenantCreate,TenantMembers}/**/*.{tsx,jsx}'],
    plugins: { '@brix-architecture': architecture.brixArchPlugin },
    rules: { '@brix-architecture/require-testid-on-action': 'error' },
  },
];
