import { defineConfig } from 'tsup';

/**
 * tsup 构建配置
 * 
 * @description identity-shared 多端共享模块的构建配置
 * @version 3.0.0
 */
export default defineConfig({
  entry: [
    'src/index.ts',
    'src/types/index.ts',
    'src/events/index.ts',
    'src/constants/index.ts',
    'src/generated/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
