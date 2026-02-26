/**
 * @file Identity Module Status & Permission Constants
 * @description Type-only exports and permission code strings
 * @module @shinwa/identity-shared/constants
 * @version 3.0.0
 *
 * [Architecture Note - R7.6]
 * This file exports TYPES and permission strings only (no runtime UI values).
 * Runtime constants (with labels, colors, icons) are in @shinwa/identity-ui-web/src/utils/constants.ts
 */

// Re-export types from the types module
export type { UserStatus, UserRole } from '../types';

// ============================================================================
// Permission Constants
// ============================================================================

/**
 * Identity module permission codes
 * 
 * Consistent with permissions in ui-manifest.yaml
 */
export const IDENTITY_PERMISSIONS = {
  /** View user */
  USER_READ: 'user:read',
  /** Create user */
  USER_CREATE: 'user:create',
  /** Update user */
  USER_UPDATE: 'user:update',
  /** Delete user */
  USER_DELETE: 'user:delete',
  /** Manage user status (lock, disable, enable, etc.) */
  USER_STATUS_MANAGE: 'user:status:manage',
  /** Reset user password */
  USER_PASSWORD_RESET: 'user:password:reset',
} as const;

// ============================================================================
// PageId Constants
// ============================================================================

/**
 * Identity module PageIds
 */
export const IDENTITY_PAGE_IDS = {
  /** User list */
  USER_LIST: 'identity:user-list',
  /** User detail */
  USER_DETAIL: 'identity:user-detail',
  /** Create user */
  USER_CREATE: 'identity:user-create',
  /** Edit user */
  USER_EDIT: 'identity:user-edit',
} as const;

// ============================================================================
// Menu ID Constants
// ============================================================================

/**
 * Identity module menu IDs
 */
export const IDENTITY_MENU_IDS = {
  /** Identity (parent menu) */
  ROOT: 'identity',
  /** User management */
  USER_LIST: 'identity:user-list',
} as const;
