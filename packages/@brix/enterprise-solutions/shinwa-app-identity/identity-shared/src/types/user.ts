/**
 * @file User related type definitions
 * @description Core type definitions for user business, shared by Web and Mobile
 * @module @shinwa/identity-shared/types
 * @version 3.0.0
 */

// ============================================================================
// User Status Enum
// ============================================================================

/**
 * User Status
 */
export type UserStatus = 
  | 'ACTIVE'      // Active
  | 'INACTIVE'    // Inactive
  | 'LOCKED'      // Locked
  | 'DISABLED';   // Disabled

/**
 * User Role
 */
export type UserRole = 
  | 'ADMIN'       // Administrator
  | 'OPERATOR'    // Operator
  | 'USER';       // Regular user

// ============================================================================
// User Related Types
// ============================================================================

/**
 * User Data Transfer Object
 */
export interface User {
  /** User ID */
  id: string;
  /** Username */
  username: string;
  /** Email */
  email: string;
  /** Phone number */
  phone?: string;
  /** Display name */
  displayName: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** User status */
  status: UserStatus;
  /** Role list */
  roles: UserRole[];
  /** Tenant ID */
  tenantId?: string;
  /** Created at */
  createdAt: string;
  /** Updated at */
  updatedAt?: string;
  /** Last login at */
  lastLoginAt?: string;
}

/**
 * Create User Parameters
 */
export interface CreateUserParams {
  /** Username */
  username: string;
  /** Password */
  password: string;
  /** Email */
  email: string;
  /** Phone number */
  phone?: string;
  /** Display name */
  displayName: string;
  /** Role list */
  roles?: UserRole[];
}

/**
 * Update User Parameters
 */
export interface UpdateUserParams {
  /** Email */
  email?: string;
  /** Phone number */
  phone?: string;
  /** Display name */
  displayName?: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** Role list */
  roles?: UserRole[];
}

/**
 * User List Query Parameters
 */
export interface UserListQuery {
  /** Status filter */
  status?: UserStatus;
  /** Role filter */
  role?: UserRole;
  /** Keyword search */
  keyword?: string;
  /** Page number */
  page?: number;
  /** Page size */
  size?: number;
}

/**
 * Paged Response
 */
export interface PagedResponse<T> {
  /** Data content */
  content: T[];
  /** Total elements */
  totalElements: number;
  /** Total pages */
  totalPages: number;
  /** Current page */
  page: number;
  /** Page size */
  size: number;
}
