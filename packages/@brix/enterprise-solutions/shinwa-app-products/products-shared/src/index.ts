/**
 * @file products-shared 模块入口
 * @description 产品套餐模块多端共享类型、事件、常量
 * @module @shinwa/products-shared
 * @version 3.0.0
 * 
 * 【模块说明】
 * 本模块定义产品套餐插件（products）的多端共享内容，包括：
 * - types/: 业务类型定义（DTO、枚举等）
 * - events/: 事件类型定义（事件名、Payload）
 * - constants/: 常量定义（状态、权限码等）
 * 
 * 【使用方式】
 * ```typescript
 * // 导入类型
 * import { Product, ProductType, ProductStatus } from '@shinwa/products-shared';
 * import type { CreateProductParams } from '@shinwa/products-shared/types';
 * 
 * // 导入事件
 * import { PRODUCT_EVENTS, ProductCreatedPayload } from '@shinwa/products-shared/events';
 * 
 * // 导入常量
 * import { PRODUCT_STATUS, PRODUCT_PERMISSIONS } from '@shinwa/products-shared/constants';
 * ```
 * 
 * 【v3.0 架构原则】
 * 1. 多端一致：Web 和 Mobile 使用相同类型定义
 * 2. 与后端对齐：类型与后端 DTO 保持一致
 * 3. 平台无关：不包含任何平台特定代码
 */

// 类型导出
export * from './types';

// 事件导出
export * from './events';

// 常量导出
export * from './constants';

// HTTP 客户端类型导出 (v3.2 shared 层纯类型化)
// 运行时函数已迁移至 products-ui-web/src/api/http-client.ts
export type { HttpClientParams, HttpError } from './http-client';
