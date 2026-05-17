/**
 * @file ESLint Configuration for storage-ui-web
 * @description Extends architecture ESLint config with UI-specific rules
 * @module @brix-sdk/enterprise-storage-ui-web
 */
const architectureConfig = require('@brix-sdk/eslint-config-architecture');

module.exports = [
  ...architectureConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Enforce v3.0.4 front-end separation rules
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['axios', 'fetch', 'ky', 'got'],
              message: 'Direct HTTP clients are forbidden. Use HttpCapability via Repository layer.',
            },
          ],
        },
      ],
    },
  },
];
