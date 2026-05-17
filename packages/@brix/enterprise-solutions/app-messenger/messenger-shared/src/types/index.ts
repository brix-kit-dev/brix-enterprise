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
 * @fileoverview 类型定义索引
 * @description 导出所有消息模块的类型定义
 * @version 3.0.0
 * @module @brix-sdk/enterprise-messenger-shared/types
 */

export type {
  // 基础类型
  MessageType,
  MessageStatus,
  // 数据传输对象
  MessageDTO,
  // 请求参数
  CreateMessageParams,
  UpdateMessageParams,
  MessageQueryParams,
  // 响应类型
  MessageListResponse,
  MessageDetailResponse,
} from './message';
