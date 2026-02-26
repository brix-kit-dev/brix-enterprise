import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'types/index': 'src/types/index.ts',
    'events/index': 'src/events/index.ts',
    'constants/index': 'src/constants/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
});
