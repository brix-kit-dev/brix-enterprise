const tsParser = require('@typescript-eslint/parser');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: './tsconfig.json' },
    },
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          '@brix-sdk/platform-auth-web*',
          '@brix-sdk/platform-tenant-web*',
          '@brix-sdk/infra-adapter-*',
        ],
      }],
      'no-restricted-globals': ['error', {
        name: 'fetch',
        message: 'Host source must not perform transport work.',
      }],
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**', '*.config.*', 'rspack.config.*'],
  },
];
