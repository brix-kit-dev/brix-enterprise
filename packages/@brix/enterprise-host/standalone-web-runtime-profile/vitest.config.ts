import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const brixRoot = path.resolve(__dirname, '../../../../../brix');

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@brix-sdk/runtime-orchestrator-web': path.resolve(
        brixRoot,
        'packages/@brix/runtime-sdk/runtime-orchestrator-web/src/index.ts',
      ),
      '@brix-sdk/runtime-sdk-api-web': path.resolve(
        brixRoot,
        'packages/@brix/runtime-sdk/runtime-sdk-api-web/src/index.ts',
      ),
      '@brix-sdk/runtime-sdk-react': path.resolve(
        brixRoot,
        'packages/@brix/runtime-sdk/runtime-sdk-react/src/index.ts',
      ),
      '@brix-sdk/platform-auth-web/AuthCapabilityImpl': path.resolve(
        brixRoot,
        'packages/@brix/platform-commons/packages/client/platform-auth-web/src/AuthCapabilityImpl.ts',
      ),
      '@brix-sdk/platform-auth-web/BffSessionAuthState': path.resolve(
        brixRoot,
        'packages/@brix/platform-commons/packages/client/platform-auth-web/src/BffSessionAuthState.ts',
      ),
      '@brix-sdk/platform-auth-web': path.resolve(
        brixRoot,
        'packages/@brix/platform-commons/packages/client/platform-auth-web/src/index.ts',
      ),
      '@brix-sdk/platform-frame-web/theme/ThemeCapabilityImpl': path.resolve(
        brixRoot,
        'packages/@brix/platform-commons/packages/client/platform-frame-web/src/theme/ThemeCapabilityImpl.ts',
      ),
      '@brix-sdk/platform-frame-web/theme/presets/defaultPreset': path.resolve(
        brixRoot,
        'packages/@brix/platform-commons/packages/client/platform-frame-web/src/theme/presets/defaultPreset.ts',
      ),
      '@brix-sdk/platform-frame-web': path.resolve(
        brixRoot,
        'packages/@brix/platform-commons/packages/client/platform-frame-web/src/index.ts',
      ),
      '@brix-sdk/platform-i18n-web': path.resolve(
        brixRoot,
        'packages/@brix/platform-commons/packages/client/platform-i18n-web/src/index.ts',
      ),
      '@brix-sdk/platform-navigation-web': path.resolve(
        brixRoot,
        'packages/@brix/platform-commons/packages/client/platform-navigation-web/src/index.ts',
      ),
      '@brix-sdk/infra-adapter-http-web': path.resolve(
        brixRoot,
        'packages/@brix/infra-adapters/packages/web/infra-adapter-http-web/src/index.ts',
      ),
      '@brix-sdk/infra-adapter-ui-native': path.resolve(
        brixRoot,
        'packages/@brix/infra-adapters/packages/web/infra-adapter-ui-native/src/index.ts',
      ),
      '@brix-sdk/shared-runtime-web/router': path.resolve(
        brixRoot,
        'packages/@brix/shared-runtime/shared-runtime-web/src/router.ts',
      ),
    },
  },
});
