/**
 * Brix Intake UI — ESLint Architecture Guard Configuration
 * 
 * This configuration imports the shared @brix-sdk/eslint-config-architecture rules
 * that enforce the v3.0.4 Runtime Shell Architecture Blueprint red lines.
 * 
 * Architecture Red Lines Covered:
 *   Red Line 1 — Prohibit direct import of infrastructure adapters (@brix-sdk/infra-adapter-*)
 *   Red Line 3 — Prohibit direct use of HTTP client libraries (axios/fetch etc.)
 *   Red Line 6 — Prohibit direct access to localStorage/sessionStorage
 *   Red Line 7 — Prohibit console.log (allow warn/error)
 * 
 * Usage:
 *   Run `pnpm lint` to check for architecture violations.
 *   CI/CD pipeline will fail on any violations.
 * 
 * @see @brix-sdk/eslint-config-architecture for rule implementations
 * @see docs/README.md, the ACTIVE root blueprint §11.1 (the numbers above are from v3.0.4)
 * @author Brix Team
 * @version 3.0.0-SNAPSHOT
 * @since 2026-02-24
 */
const architectureRules = require('@brix-sdk/eslint-config-architecture');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  // Inherit all architecture guard rules from shared config
  ...architectureRules,
  
  // TypeScript/TSX specific configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    }
  },
  
  // Ignore patterns for build outputs and config files
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/*.js',
      '**/*.cjs',
      '**/*.mjs',
      '**/coverage/**',
      '**/.rspack/**'
    ]
  }
];
