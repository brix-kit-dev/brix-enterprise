/**
 * ESLint for this package: the platform preset of @brix-sdk/eslint-config-architecture (the rules written for
 * every file: the super-admin red lines and the role checks), with TypeScript parsed (standard-link queue
 * item 19, D162).
 */
import architecture from '@brix-sdk/eslint-config-architecture';

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  ...architecture.configs.platform,
];
