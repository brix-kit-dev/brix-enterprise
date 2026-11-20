/**
 * ESLint for this plugin package: the UI preset of @brix-sdk/eslint-config-architecture on the package's own
 * files, with TypeScript parsed (standard-link queue item 19, D162).
 */
const architecture = require('@brix-sdk/eslint-config-architecture');

module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  ...architecture.configs.ui,
];
