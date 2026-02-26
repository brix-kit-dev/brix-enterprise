/**
 * @fileoverview 事件定义索引
 * @description 导出所有消息模块的事件定义
 * @version 3.0.0
 * @module @shinwa/messenger-shared/events
 */

export {
  // 事件常量
  MESSENGER_EVENTS,
  // 事件类型
  type MessengerEventType,
  // 事件载荷类型
  type MessageSentPayload,
  type MessageReceivedPayload,
  type MessageReadPayload,
  type MessageArchivedPayload,
  type MessageDeletedPayload,
  type UnreadCountChangedPayload,
  type ConnectionStatusChangedPayload,
  // 事件载荷映射
  type MessengerEventPayloadMap,
} from './message-events';
