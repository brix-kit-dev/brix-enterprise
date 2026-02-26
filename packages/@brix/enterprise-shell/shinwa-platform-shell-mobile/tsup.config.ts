import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'screens/index': 'src/screens/index.ts',
    'navigation/index': 'src/navigation/index.ts',
    'plugins/index': 'src/plugins/index.ts',
    'layouts/index': 'src/layouts/index.ts',
    'hooks/index': 'src/hooks/index.ts',
    'providers/index': 'src/providers/index.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-native', '@brix/platform-auth-mobile'],
  treeshake: true,
});
