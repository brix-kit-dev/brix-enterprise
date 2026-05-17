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
 * 身份认证模块 - Mobile 类型定义
 * 
 * v3.0 Runtime Shell 架构
 * 
 * @author Brix Team
 * @since 3.0.0
 */

/**
 * 用户角色枚举
 */
export type UserRole = 'ADMIN' | 'MANAGER' | 'USER' | 'GUEST';

/**
 * 用户状态枚举
 */
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'DISABLED';

/**
 * 用户数据传输对象
 */
export interface UserDTO {
  /** 用户ID */
  userId: string;
  /** 租户ID */
  tenantId: string;
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phone?: string;
  /** 显示名称 */
  displayName?: string;
  /** 头像URL */
  avatarUrl?: string;
  /** 角色 */
  role: UserRole;
  /** 状态 */
  status: UserStatus;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 最后登录时间 */
  lastLoginAt?: string;
}

/**
 * 创建用户请求
 */
export interface CreateUserRequest {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phone?: string;
  /** 显示名称 */
  displayName?: string;
  /** 头像URL */
  avatarUrl?: string;
  /** 角色 */
  role: UserRole;
  /** 租户ID */
  tenantId: string;
}

/**
 * 更新用户请求
 */
export interface UpdateUserRequest {
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phone?: string;
  /** 显示名称 */
  displayName?: string;
  /** 头像URL */
  avatarUrl?: string;
  /** 角色 */
  role?: UserRole;
}

/**
 * 导航参数类型定义
 */
export type IdentityStackParamList = {
  UserList: undefined;
  UserDetail: { userId: string };
  UserCreate: { userId?: string } | undefined;
};

/**
 * 角色标签映射
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: '管理员',
  MANAGER: '经理',
  USER: '普通用户',
  GUEST: '访客',
};

/**
 * 状态标签映射
 */
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: '正常',
  INACTIVE: '未激活',
  LOCKED: '已锁定',
  DISABLED: '已禁用',
};

/**
 * 状态颜色映射
 */
export const USER_STATUS_COLORS: Record<UserStatus, string> = {
  ACTIVE: '#4caf50',
  INACTIVE: '#9e9e9e',
  LOCKED: '#ff9800',
  DISABLED: '#f44336',
};
