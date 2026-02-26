import { defineConfig } from 'tsup';

/**
 * tsup 构建配置
 * 
 * @description booking-shared 多端共享模块的构建配置
 * @version 3.0.0
 * 
 * 【设计说明】
 * 本模块包含 booking 插件的多端共享类型定义：
 * - types/: 业务类型定义（Booking、Resource、TimeSlot 等）
 * - events/: 事件类型定义（booking:created 等）
 * - constants/: 常量定义（状态枚举等）
 * 
 * 这些定义被 booking-web 和 booking-mobile 共同引用，
 * 确保多端类型一致性。
 */
export default defineConfig({
  entry: [
    'src/index.ts',
    'src/types/index.ts',
    'src/events/index.ts',
    'src/constants/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
