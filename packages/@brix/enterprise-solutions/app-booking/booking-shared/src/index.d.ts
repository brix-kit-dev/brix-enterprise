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
 * @file booking-shared 模块入口
 * @description 预约模块多端共享类型、事件、常量
 * @module @brix-sdk/enterprise-booking-shared
 * @version 3.0.0
 *
 * 【模块说明】
 * 本模块定义预约插件（booking）的多端共享内容，包括：
 * - types/: 业务类型定义
 * - events/: 事件类型定义
 * - constants/: 常量定义
 *
 * 【使用方式】
 * ```typescript
 * // 导入类型
 * import { Booking, BookingStatus } from '@brix-sdk/enterprise-booking-shared';
 * import type { CreateBookingParams } from '@brix-sdk/enterprise-booking-shared/types';
 *
 * // 导入事件
 * import { BOOKING_EVENTS, BookingCreatedPayload } from '@brix-sdk/enterprise-booking-shared/events';
 *
 * // 导入常量
 * import { BOOKING_STATUS, BOOKING_PAGE_IDS } from '@brix-sdk/enterprise-booking-shared/constants';
 * ```
 *
 * 【v3.0 架构原则】
 * 1. 多端一致：Web 和 Mobile 使用相同类型定义
 * 2. 与后端对齐：类型与后端 DTO 保持一致
 * 3. 平台无关：不包含任何平台特定代码
 */
export * from './types';
export * from './events';
export * from './constants';
