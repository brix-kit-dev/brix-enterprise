/**
 * @fileoverview 消息模块共享包入口
 * @description 导出所有共享类型、事件和常量，供 Web/Mobile/Server 端使用
 * @version 3.0.0
 * @module @shinwa/messenger-shared
 *
 * @example
 * ```typescript
 * // 导入所有内容
 * import { MessageDTO, MESSENGER_EVENTS, MESSAGE_TYPE } from '@shinwa/messenger-shared';
 *
 * // 或分模块导入
 * import { MessageDTO } from '@shinwa/messenger-shared/types';
 * import { MESSENGER_EVENTS } from '@shinwa/messenger-shared/events';
 * import { MESSAGE_TYPE } from '@shinwa/messenger-shared/constants';
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
  MESSAGE_TYPE,
  MESSAGE_STATUS,
  MESSENGER_PERMISSIONS,
  MESSENGER_PAGE_IDS,
  MESSENGER_API_ENDPOINTS,
} from './constants';

// ============================================================================
// HTTP 客户端类型导出 (v3.2 shared 层纯类型化)
// 运行时函数已迁移至 messenger-ui-web/src/api/http-client.ts
// ============================================================================

export type { HttpClientParams, HttpError } from './http-client';
