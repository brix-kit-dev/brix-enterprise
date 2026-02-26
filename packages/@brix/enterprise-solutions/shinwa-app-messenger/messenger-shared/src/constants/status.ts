/**
 * @fileoverview Messenger Module Constants
 * @description Permission codes, page IDs, and API endpoints
 * @version 3.0.0
 * @module @shinwa/messenger-shared/constants
 *
 * [Architecture Note - R7.6]
 * This file exports TYPES, permission strings, and API endpoints only (no runtime UI values).
 * Runtime constants (with labels, colors, icons) are in @shinwa/messenger-ui-web/src/utils/constants.ts
 */

// Re-export types from the types module
export type { MessageType, MessageStatus } from '../types';

// ============================================================================
// Permission Code Constants
// ============================================================================

/**
 * Messenger Module Permission Codes
 * @description Defines all permission codes for the messenger module, used for access control
 *
 * @remarks
 * Permission naming convention: `{module}:{resource}:{action}`
 * - Module: messenger
 * - Resource: message, broadcast, settings
 * - Action: view, create, update, delete, manage
 *
 * @example
 * ```typescript
 * import { MESSENGER_PERMISSIONS } from '@shinwa/messenger-shared/constants';
 * import { useAuth } from '@shinwa/platform-auth-web';
 *
 * const auth = useAuth();
 * if (auth.hasPermission(MESSENGER_PERMISSIONS.MESSAGE_CREATE)) {
 *   // Allow creating messages
 * }
 * ```
 */
export const MESSENGER_PERMISSIONS = {
  // ========== Message Permissions ==========

  /**
   * View messages
   * @description Allows viewing message list and message details
   */
  MESSAGE_VIEW: 'messenger:message:view',

  /**
   * Create messages
   * @description Allows sending new messages
   */
  MESSAGE_CREATE: 'messenger:message:create',

  /**
   * Update messages
   * @description Allows updating message status (mark as read, archive, etc.)
   */
  MESSAGE_UPDATE: 'messenger:message:update',

  /**
   * Delete messages
   * @description Allows deleting messages
   */
  MESSAGE_DELETE: 'messenger:message:delete',

  // ========== Broadcast Permissions ==========

  /**
   * View broadcasts
   * @description Allows viewing broadcast messages
   */
  BROADCAST_VIEW: 'messenger:broadcast:view',

  /**
   * Create broadcasts
   * @description Allows creating broadcast messages
   */
  BROADCAST_CREATE: 'messenger:broadcast:create',

  /**
   * Manage broadcasts
   * @description Allows managing all broadcast messages
   */
  BROADCAST_MANAGE: 'messenger:broadcast:manage',

  // ========== Settings Permissions ==========

  /**
   * View settings
   * @description Allows viewing messenger module settings
   */
  SETTINGS_VIEW: 'messenger:settings:view',

  /**
   * Update settings
   * @description Allows updating messenger module settings
   */
  SETTINGS_UPDATE: 'messenger:settings:update',

  // ========== Admin Permissions ==========

  /**
   * Message management
   * @description Admin permission, allows managing all messages
   */
  ADMIN_MANAGE: 'messenger:admin:manage',
} as const;

/**
 * Permission code type
 */
export type MessengerPermission = (typeof MESSENGER_PERMISSIONS)[keyof typeof MESSENGER_PERMISSIONS];

// ============================================================================
// Page ID Constants
// ============================================================================

/**
 * Messenger Module Page IDs
 * @description Defines unique identifiers for all pages in the messenger module, used for routing and permission association
 *
 * @remarks
 * Page ID naming convention: `{module}-{feature}-{page-type}`
 * - Page types: list, detail, create, edit, settings
 *
 * @example
 * ```typescript
 * import { MESSENGER_PAGE_IDS } from '@shinwa/messenger-shared/constants';
 *
 * // Use in route configuration
 * const route = {
 *   id: MESSENGER_PAGE_IDS.MESSAGE_LIST,
 *   path: '/messenger/messages',
 *   component: MessageListPage,
 * };
 * ```
 */
export const MESSENGER_PAGE_IDS = {
  // ========== Message Pages ==========

  /**
   * Message list page
   */
  MESSAGE_LIST: 'messenger-message-list',

  /**
   * Message detail page
   */
  MESSAGE_DETAIL: 'messenger-message-detail',

  /**
   * Send message page
   */
  MESSAGE_CREATE: 'messenger-message-create',

  // ========== Notification Pages ==========

  /**
   * Notification center page
   */
  NOTIFICATION_CENTER: 'messenger-notification-center',

  // ========== Broadcast Pages ==========

  /**
   * Broadcast list page
   */
  BROADCAST_LIST: 'messenger-broadcast-list',

  /**
   * Broadcast detail page
   */
  BROADCAST_DETAIL: 'messenger-broadcast-detail',

  /**
   * Create broadcast page
   */
  BROADCAST_CREATE: 'messenger-broadcast-create',

  // ========== Settings Pages ==========

  /**
   * Message settings page
   */
  SETTINGS: 'messenger-settings',

  // ========== Archive Pages ==========

  /**
   * Archived messages list page
   */
  ARCHIVE_LIST: 'messenger-archive-list',
} as const;

/**
 * Page ID type
 */
export type MessengerPageId = (typeof MESSENGER_PAGE_IDS)[keyof typeof MESSENGER_PAGE_IDS];

// ============================================================================
// API Endpoint Constants
// ============================================================================

/**
 * Messenger Module API Endpoints
 * @description Defines all API endpoint paths for the messenger module
 *
 * @example
 * ```typescript
 * import { MESSENGER_API_ENDPOINTS } from '@shinwa/messenger-shared/constants';
 *
 * const response = await fetch(MESSENGER_API_ENDPOINTS.MESSAGES);
 * ```
 */
export const MESSENGER_API_ENDPOINTS = {
  // ========== Message API ==========

  /**
   * Message list/create
   */
  MESSAGES: '/api/messenger/messages',

  /**
   * Message detail/update/delete
   * @param id Message ID
   */
  MESSAGE_DETAIL: (id: string) => `/api/messenger/messages/${id}`,

  /**
   * Mark as read
   */
  MARK_READ: '/api/messenger/messages/mark-read',

  /**
   * Batch archive
   */
  ARCHIVE: '/api/messenger/messages/archive',

  /**
   * Batch delete
   */
  DELETE_BATCH: '/api/messenger/messages/batch-delete',

  // ========== Notification API ==========

  /**
   * Notification list
   */
  NOTIFICATIONS: '/api/messenger/notifications',

  /**
   * Unread count statistics
   */
  UNREAD_COUNT: '/api/messenger/notifications/unread-count',

  // ========== Broadcast API ==========

  /**
   * Broadcast list/create
   */
  BROADCASTS: '/api/messenger/broadcasts',

  /**
   * Broadcast detail
   */
  BROADCAST_DETAIL: (id: string) => `/api/messenger/broadcasts/${id}`,

  // ========== WebSocket ==========

  /**
   * WebSocket connection endpoint
   */
  WEBSOCKET: '/ws/messenger',
} as const;
