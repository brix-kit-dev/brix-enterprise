/**
 * User identity module type definitions
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */

/**
 * User role enum
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  USER = 'USER',
  GUEST = 'GUEST',
}

/**
 * User status enum
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
  DISABLED = 'DISABLED',
  DELETED = 'DELETED',
}

/**
 * User information DTO
 */
export interface UserDTO {
  id: number;
  userId: string;
  username: string;
  tenantId: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  displayName?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

/**
 * Create user request
 */
export interface CreateUserRequest {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  displayName?: string;
  avatarUrl?: string;
  role?: UserRole;
  tenantId: string;
}

/**
 * Update user request
 */
export interface UpdateUserRequest {
  email?: string;
  phone?: string;
  displayName?: string;
  avatarUrl?: string;
  role?: UserRole;
}

/**
 * Paginated response
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  first: boolean;
  last: boolean;
}

/**
 * User role display name mapping
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: '超级管理员',
  [UserRole.ADMIN]: '管理员',
  [UserRole.OPERATOR]: '操作员',
  [UserRole.USER]: '普通用户',
  [UserRole.GUEST]: '访客',
};

/**
 * User status display name mapping
 */
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: '正常',
  [UserStatus.INACTIVE]: '未激活',
  [UserStatus.LOCKED]: '已锁定',
  [UserStatus.DISABLED]: '已禁用',
  [UserStatus.DELETED]: '已删除',
};

/**
 * User status color mapping
 */
export const USER_STATUS_COLORS: Record<UserStatus, 'success' | 'warning' | 'error' | 'default'> = {
  [UserStatus.ACTIVE]: 'success',
  [UserStatus.INACTIVE]: 'warning',
  [UserStatus.LOCKED]: 'error',
  [UserStatus.DISABLED]: 'error',
  [UserStatus.DELETED]: 'default',
};
