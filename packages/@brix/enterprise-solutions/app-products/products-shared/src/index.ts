/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * This software is proprietary to Brix Platform and is protected by
 * copyright laws and international treaty provisions. Unauthorized
 * reproduction or distribution of this software, or any portion of it,
 * may result in severe civil and criminal penalties.
 *
 * Commercial use requires a valid Brix Enterprise license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */
/**
 * @file products-shared 模块入口
 * @description 产品套餐模块多端共享类型、事件、常量
 * @module @brix-sdk/enterprise-products-shared
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
 * import { Product, ProductType, ProductStatus } from '@brix-sdk/enterprise-products-shared';
 * import type { CreateProductParams } from '@brix-sdk/enterprise-products-shared/types';
 * 
 * // 导入事件
 * import { PRODUCT_EVENTS, ProductCreatedPayload } from '@brix-sdk/enterprise-products-shared/events';
 * 
 * // 导入常量
 * import { PRODUCT_STATUS, PRODUCT_PERMISSIONS } from '@brix-sdk/enterprise-products-shared/constants';
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
