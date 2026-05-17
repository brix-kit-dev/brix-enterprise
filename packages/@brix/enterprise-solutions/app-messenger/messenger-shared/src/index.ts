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
 * @fileoverview 消息模块共享包入口
 * @description 导出所有共享类型、事件和常量，供 Web/Mobile/Server 端使用
 * @version 3.0.0
 * @module @brix-sdk/enterprise-messenger-shared
 *
 * @example
 * ```typescript
 * // 导入所有内容
 * import { MessageDTO, MESSENGER_EVENTS, MESSAGE_TYPE } from '@brix-sdk/enterprise-messenger-shared';
 *
 * // 或分模块导入
 * import { MessageDTO } from '@brix-sdk/enterprise-messenger-shared/types';
 * import { MESSENGER_EVENTS } from '@brix-sdk/enterprise-messenger-shared/events';
 * import { MESSAGE_TYPE } from '@brix-sdk/enterprise-messenger-shared/constants';
 * ```
 */

// ============================================================================
// 类型定义导出
// ============================================================================

export type {
  MessageType,
  MessageStatus,
  MessageDTO,
  CreateMessageParams,
  UpdateMessageParams,
  MessageQueryParams,
  MessageListResponse,
  MessageDetailResponse,
} from './types';

// ============================================================================
// 事件定义导出
// ============================================================================

export {
  MESSENGER_EVENTS,
  type MessengerEventType,
  type MessageSentPayload,
  type MessageReceivedPayload,
  type MessageReadPayload,
  type MessageArchivedPayload,
  type MessageDeletedPayload,
  type MessengerEventPayloadMap,
} from './events';

// ============================================================================
// 常量定义导出
// ============================================================================

export {
  MESSENGER_PERMISSIONS,
  MESSENGER_PAGE_IDS,
  MESSENGER_API_ENDPOINTS,
} from './constants';

// ============================================================================
// HTTP 客户端类型导出 (v3.2 shared 层纯类型化)
// 运行时函数已迁移至 messenger-ui-web/src/api/http-client.ts
// ============================================================================

export type { HttpClientParams, HttpError } from './http-client';
