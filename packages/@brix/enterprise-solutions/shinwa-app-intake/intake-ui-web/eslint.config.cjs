/**
 * Shinwa Intake UI — ESLint Architecture Guard Configuration
 * 
 * This configuration imports the shared @brix/eslint-config-architecture rules
 * that enforce the v3.0.4 Runtime Shell Architecture Blueprint red lines.
 * 
 * Architecture Red Lines Covered:
 *   Red Line 1 — Prohibit direct import of infrastructure adapters (@brix/infra-adapter-*)
 *   Red Line 3 — Prohibit direct use of HTTP client libraries (axios/fetch etc.)
 *   Red Line 6 — Prohibit direct access to localStorage/sessionStorage
 *   Red Line 7 — Prohibit console.log (allow warn/error)
 * 
 * Usage:
 *   Run `pnpm lint` to check for architecture violations.
 *   CI/CD pipeline will fail on any violations.
 * 
 * @see @brix/eslint-config-architecture for rule implementations
 * @see docs/v3.0.4-运行壳架构设计蓝图.md §9.1 Architecture Red Lines
 * @author Shinwa Team
 * @version 3.0.0-SNAPSHOT
 * @since 2026-02-24
 */
const architectureRules = require('@brix/eslint-config-architecture');

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
