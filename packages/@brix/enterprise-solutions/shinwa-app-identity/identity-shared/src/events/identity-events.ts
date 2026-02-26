/**
 * @file Identity module event definitions
 * @description Define events published and subscribed by the identity module
 * @module @shinwa/identity-shared/events
 * @version 3.0.0
 * 
 * Design Notes:
 * Following the v3.0 Manifest-Driven architecture, event definitions are
 * consistent with the events declaration in ui-manifest.yaml.
 */

// ============================================================================
// Event Type Constants
// ============================================================================

/**
 * Identity module event type constants
 */
export const IDENTITY_EVENTS = {
  /** User created successfully */
  USER_CREATED: 'user:created',
  /** User selected */
  USER_SELECTED: 'user:selected',
  /** User status changed */
  USER_STATUS_CHANGED: 'user:status-changed',
  /** User updated */
  USER_UPDATED: 'user:updated',
  /** User deleted */
  USER_DELETED: 'user:deleted',
  /** User password reset */
  USER_PASSWORD_RESET: 'user:password-reset',
} as const;

/**
 * Identity event type union
 */
export type IdentityEventType = typeof IDENTITY_EVENTS[keyof typeof IDENTITY_EVENTS];

// ============================================================================
// Event Payload Types
// ============================================================================

/**
 * User Created Event Payload
 */
export interface UserCreatedPayload {
  /** User ID */
  userId: string;
  /** Username */
  username: string;
  /** Display name */
  displayName?: string;
  /** Role */
  role: string;
  /** Created at (ISO 8601 format) */
  createdAt: string;
}

/**
 * User Selected Event Payload
 * 
 * Important: This event is subscribed by booking and other modules
 */
export interface UserSelectedPayload {
  /** User ID */
  userId: string;
  /** Username */
  username: string;
  /** Display name */
  displayName?: string;
}

/**
 * User Status Changed Event Payload
 */
export interface UserStatusChangedPayload {
  /** User ID */
  userId: string;
  /** Username */
  username: string;
  /** Previous status */
  previousStatus: string;
  /** New status */
  newStatus: string;
  /** Change reason */
  reason: string;
  /** Changed at (ISO 8601 format) */
  changedAt: string;
}

/**
 * User Updated Event Payload
 */
export interface UserUpdatedPayload {
  /** User ID */
  userId: string;
  /** Username */
  username: string;
  /** Display name */
  displayName?: string;
  /** Updated fields */
  updatedFields: string[];
  /** Updated at (ISO 8601 format) */
  updatedAt: string;
}

/**
 * User Deleted Event Payload
 */
export interface UserDeletedPayload {
  /** User ID */
  userId: string;
  /** Username */
  username: string;
}

/**
 * User Password Reset Event Payload
 */
export interface UserPasswordResetPayload {
  /** User ID */
  userId: string;
  /** Reset at (ISO 8601 format) */
  resetAt: string;
}

// ============================================================================
// Event Mapping Types
// ============================================================================

/**
 * Identity Event Payload Map
 */
export interface IdentityEventPayloadMap {
  [IDENTITY_EVENTS.USER_CREATED]: UserCreatedPayload;
  [IDENTITY_EVENTS.USER_SELECTED]: UserSelectedPayload;
  [IDENTITY_EVENTS.USER_STATUS_CHANGED]: UserStatusChangedPayload;
  [IDENTITY_EVENTS.USER_UPDATED]: UserUpdatedPayload;
  [IDENTITY_EVENTS.USER_DELETED]: UserDeletedPayload;
  [IDENTITY_EVENTS.USER_PASSWORD_RESET]: UserPasswordResetPayload;
}
