/**
 * @file 自动生成代码入口 - 预约模块
 * @description 由 orval 从 OpenAPI 规范自动生成的类型和 Repository
 * @module @shinwa/booking-shared/generated
 * @version 3.0.4
 *
 * 【⚠️ 警告 - 自动生成文件】
 * 本目录下文件由 orval 自动生成，请勿手动修改！
 * 如需更新，请修改后端 Controller/DTO 后执行：
 *
 *   pnpm run generate:api
 *
 * 【生成流程】
 * 1. 后端修改 Controller/DTO
 * 2. mvn springdoc-openapi:generate → booking-api/openapi.json
 * 3. pnpm run generate:api → 本目录下文件
 *
 * 【目录结构】
 * generated/
 *   ├── index.ts                 ← 统一导出（本文件）
 *   ├── types/                   ← DTO 类型定义
 *   │   └── *.generated.ts
 *   └── repositories/            ← API Repository 客户端
 *       └── *.generated.ts
 *
 * 【首次运行】
 * 在 OpenAPI 规范文件生成前，本文件仅包含占位导出。
 * 执行 `pnpm run generate:api` 后会自动填充实际导出。
 */

// ============================================================================
// 占位导出（在 OpenAPI 规范生成后会被替换）
// ============================================================================

/**
 * 占位：类型定义将在 generate:api 后导出
 *
 * 预期导出：
 * - BookingDTO
 * - CreateBookingRequest
 * - UpdateBookingRequest
 * - BookableResourceDTO
 * - CreateResourceRequest
 * - 等其他 DTO 类型...
 */
// export * from './types';  // TODO: 在 generate:api 后取消注释

/**
 * 占位：Repository 将在 generate:api 后导出
 *
 * 预期导出：
 * - useGetBookings (React Query hook)
 * - useCreateBooking (React Query mutation)
 * - useGetBookableResources
 * - 等其他 API 客户端方法...
 */
// export * from './repositories';  // TODO: 在 generate:api 后取消注释

/**
 * 标记：表示尚未执行代码生成
 *
 * 开发时先检查此标记，确保已执行 generate:api
 */
export const GENERATED_CODE_PENDING = true;

/**
 * 版本信息
 */
export const GENERATED_VERSION = {
  /** 生成时间戳（占位） */
  generatedAt: null as string | null,
  /** OpenAPI 规范版本（占位） */
  openapiVersion: null as string | null,
  /** orval 版本 */
  orvalVersion: '7.9.0',
};
