import { defineConfig } from 'tsup';

/**
 * tsup 构建配置
 * 
 * 生成 ESM 和 CJS 格式的输出，以及类型声明文件。
 */
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'types/index': 'src/types/index.ts',
    'events/index': 'src/events/index.ts',
    'constants/index': 'src/constants/index.ts',
    'generated/index': 'src/generated/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
