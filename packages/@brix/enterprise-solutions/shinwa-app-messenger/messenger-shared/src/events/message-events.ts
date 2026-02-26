/**
 * @fileoverview Messenger Event Definitions
 * @description Defines event types and payloads for the messenger module, used for event bus communication
 * @version 3.0.0
 * @module @shinwa/messenger-shared/events
 *
 * @example
 * ```typescript
 * import { MESSENGER_EVENTS, MessageSentPayload } from '@shinwa/messenger-shared/events';
 * import { useEventBus } from '@shinwa/platform-eventbus-web';
 *
 * const eventBus = useEventBus();
 *
 * // Publish message sent event
 * eventBus.emit(MESSENGER_EVENTS.MESSAGE_SENT, {
 *   messageId: 'msg-001',
 *   type: 'PRIVATE',
 *   senderId: 'user-001',
 *   receiverId: 'user-002',
 *   timestamp: new Date().toISOString(),
 * });
 *
 * // Subscribe to message received event
 * eventBus.on(MESSENGER_EVENTS.MESSAGE_RECEIVED, (payload: MessageReceivedPayload) => {
 *   console.log('New message received:', payload.messageId);
 * });
 * ```
 */

import type { MessageType } from '../types';

// ============================================================================
// Event Name Constants
// ============================================================================

/**
 * Messenger Module Event Constants
 * @description Defines all event names used by the messenger module, following naming convention: `messenger:{action}`
 *
 * @remarks
 * Event naming follows these rules:
 * - Use lowercase letters and colons as separators
 * - Format: `{module}:{action}` or `{module}:{entity}:{action}`
 * - Use past tense for completed actions
 */
export const MESSENGER_EVENTS = {
  /**
   * Message sent event
   * @description Triggered when a user successfully sends a message
   */
  MESSAGE_SENT: 'messenger:message:sent',

  /**
   * Message received event
   * @description Triggered when a new message is received (via push or polling)
   */
  MESSAGE_RECEIVED: 'messenger:message:received',

  /**
   * Message read event
   * @description Triggered when a message is marked as read
   */
  MESSAGE_READ: 'messenger:message:read',

  /**
   * Message archived event
   * @description Triggered when a message is archived
   */
  MESSAGE_ARCHIVED: 'messenger:message:archived',

  /**
   * Message deleted event
   * @description Triggered when a message is deleted (soft delete)
   */
  MESSAGE_DELETED: 'messenger:message:deleted',

  /**
   * Unread count changed event
   * @description Triggered when the unread message count changes
   */
  UNREAD_COUNT_CHANGED: 'messenger:unread:changed',

  /**
   * Message list refresh event
   * @description Triggered when the message list needs to be refreshed
   */
  LIST_REFRESH: 'messenger:list:refresh',

  /**
   * Connection status changed event
   * @description Triggered when WebSocket connection status changes
   */
  CONNECTION_STATUS_CHANGED: 'messenger:connection:changed',
} as const;

/**
 * Messenger event type
 * @description Union type of MESSENGER_EVENTS constant values
 */
export type MessengerEventType = (typeof MESSENGER_EVENTS)[keyof typeof MESSENGER_EVENTS];

// ============================================================================
// Event Payload Types
// ============================================================================

/**
 * Message sent event payload
 * @description Event data after a message is successfully sent
 */
export interface MessageSentPayload {
  /**
   * Message ID
   */
  messageId: string;

  /**
   * Message type
   */
  type: MessageType;

  /**
   * Sender ID
   */
  senderId: string;

  /**
   * Receiver ID
   * @description May be empty for broadcast messages
   */
  receiverId?: string;

  /**
   * Message title
   */
  title: string;

  /**
   * Sent timestamp
   * @description ISO 8601 format
   */
  timestamp: string;
}

/**
 * Message received event payload
 * @description Event data when a new message is received
 */
export interface MessageReceivedPayload {
  /**
   * Message ID
   */
  messageId: string;

  /**
   * Message type
   */
  type: MessageType;

  /**
   * Sender ID
   */
  senderId: string;

  /**
   * Sender name
   */
  senderName: string;

  /**
   * Sender avatar
   */
  senderAvatar?: string;

  /**
   * Message title
   */
  title: string;

  /**
   * Message content preview
   * @description First 100 characters of content
   */
  contentPreview: string;

  /**
   * Message priority
   */
  priority?: number;

  /**
   * Received timestamp
   */
  timestamp: string;
}

/**
 * Message read event payload
 * @description Event data when messages are marked as read
 */
export interface MessageReadPayload {
  /**
   * Message ID list
   * @description Supports batch marking as read
   */
  messageIds: string[];

  /**
   * Read timestamp
   */
  readAt: string;

  /**
   * Reader ID
   */
  readerId: string;
}

/**
 * Message archived event payload
 * @description Event data when messages are archived
 */
export interface MessageArchivedPayload {
  /**
   * Message ID list
   * @description Supports batch archiving
   */
  messageIds: string[];

  /**
   * Archived timestamp
   */
  archivedAt: string;

  /**
   * Operator ID
   */
  operatorId: string;
}

/**
 * Message deleted event payload
 * @description Event data when messages are deleted
 */
export interface MessageDeletedPayload {
  /**
   * Message ID list
   * @description Supports batch deletion
   */
  messageIds: string[];

  /**
   * Deleted timestamp
   */
  deletedAt: string;

  /**
   * Operator ID
   */
  operatorId: string;

  /**
   * Whether permanently deleted
   * @description true for physical delete, false for soft delete
   */
  permanent: boolean;
}

/**
 * Unread count changed event payload
 * @description Event data when unread message count changes
 */
export interface UnreadCountChangedPayload {
  /**
   * Current total unread count
   */
  total: number;

  /**
   * Unread count grouped by type
   */
  byType: Record<MessageType, number>;

  /**
   * Change type
   */
  changeType: 'increment' | 'decrement' | 'reset';

  /**
   * Change amount
   */
  changeAmount: number;
}

/**
 * Connection status changed event payload
 * @description Event data when WebSocket connection status changes
 */
export interface ConnectionStatusChangedPayload {
  /**
   * Connection status
   */
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

  /**
   * Error message
   * @description Only has value when status is 'error'
   */
  error?: string;

  /**
   * Reconnection count
   * @description Only has value when status is 'reconnecting'
   */
  retryCount?: number;

  /**
   * Status change timestamp
   */
  timestamp: string;
}

// ============================================================================
// Event Payload Mapping
// ============================================================================

/**
 * Messenger event payload mapping
 * @description Maps event names to their corresponding payload types, used for type-safe event handling
 *
 * @example
 * ```typescript
 * function handleEvent<T extends MessengerEventType>(
 *   event: T,
 *   payload: MessengerEventPayloadMap[T]
 * ) {
 *   // payload type is automatically inferred based on event
 * }
 * ```
 */
export interface MessengerEventPayloadMap {
  [MESSENGER_EVENTS.MESSAGE_SENT]: MessageSentPayload;
  [MESSENGER_EVENTS.MESSAGE_RECEIVED]: MessageReceivedPayload;
  [MESSENGER_EVENTS.MESSAGE_READ]: MessageReadPayload;
  [MESSENGER_EVENTS.MESSAGE_ARCHIVED]: MessageArchivedPayload;
  [MESSENGER_EVENTS.MESSAGE_DELETED]: MessageDeletedPayload;
  [MESSENGER_EVENTS.UNREAD_COUNT_CHANGED]: UnreadCountChangedPayload;
  [MESSENGER_EVENTS.LIST_REFRESH]: void;
  [MESSENGER_EVENTS.CONNECTION_STATUS_CHANGED]: ConnectionStatusChangedPayload;
}
