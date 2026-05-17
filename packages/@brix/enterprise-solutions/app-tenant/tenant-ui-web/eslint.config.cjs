/**
 * Tenant Management Plugin (tenant-ui-web) — ESLint Architecture Guard Configuration
 *
 * References the shared rule package {@code @brix-sdk/eslint-config-architecture},
 * enforcing the red-line rules defined in the v3.0.9 Runtime Shell Architecture Blueprint.
 *
 * Architecture red-line coverage:
 *   Red Line 1 — Plugins must not directly import infrastructure adapters (@brix-sdk/infra-adapter-*)
 *   Red Line 3 — Plugins must not use HTTP client libraries directly (axios/fetch)
 *   Red Line 6 — Plugins must not directly access localStorage/sessionStorage
 *   Red Line 7 — console.log is forbidden (console.warn/error allowed)
 *   Red Line 9 — Plugins must obtain UI components via useUI(), not import MUI/Ant Design directly
 *
 * @see @brix-sdk/eslint-config-architecture
 * @see docs/v3.0.9-运行壳架构设计蓝图.md §9.1 Architecture Red Lines
 */
const architectureRules = require('@brix-sdk/eslint-config-architecture');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  ...architectureRules,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    }
  },
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.js', '**/*.cjs', '**/*.mjs']
  }
];
