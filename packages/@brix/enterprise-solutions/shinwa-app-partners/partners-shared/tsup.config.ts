import { defineConfig } from 'tsup';

/**
 * tsup 构建配置
 * 
 * @description partners-shared 多端共享模块的构建配置
 * @version 3.0.0
 * 
 * 【设计说明】
 * 本模块包含 partners 插件的多端共享类型定义：
 * - types/: 业务类型定义（Partner、PartnerType 等）
 * - events/: 事件类型定义（partner:created 等）
 * - constants/: 常量定义（状态枚举、权限代码等）
 * 
 * 这些定义被 partners-web 和 partners-mobile 共同引用，
 * 确保多端类型一致性。
 */
export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'types/index': 'src/types/index.ts',
    'events/index': 'src/events/index.ts',
    'constants/index': 'src/constants/index.ts',
    'generated/index': 'src/generated/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
