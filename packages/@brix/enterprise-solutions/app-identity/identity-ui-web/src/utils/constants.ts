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
 * @file Identity Module UI Constants
 * @description UI metadata constants (labels, colors, icons) for the identity module
 * @module @brix-sdk/enterprise-identity-ui-web/utils
 * @version 3.0.0
 *
 * [Architecture Note - R7.6]
 * This file contains runtime UI metadata constants.
 * Type definitions and permission strings are in @brix-sdk/enterprise-identity-shared/constants
 */

import type { UserStatus, UserRole } from '@brix-sdk/enterprise-identity-shared';

// ============================================================================
// User Status UI Constants
// ============================================================================

/**
 * User Status Mapping
 * 
 * UI metadata for user statuses including display labels and colors.
 */
export const USER_STATUS = {
  ACTIVE: {
    value: 'ACTIVE' as const satisfies UserStatus,
    label: '活跃',
    labelKey: 'identity.status.active',
    color: 'success',
  },
  INACTIVE: {
    value: 'INACTIVE' as const satisfies UserStatus,
    label: '未激活',
    labelKey: 'identity.status.inactive',
    color: 'warning',
  },
  LOCKED: {
    value: 'LOCKED' as const satisfies UserStatus,
    label: '已锁定',
    labelKey: 'identity.status.locked',
    color: 'error',
  },
  DISABLED: {
    value: 'DISABLED' as const satisfies UserStatus,
    label: '已禁用',
    labelKey: 'identity.status.disabled',
    color: 'default',
  },
} as const;

/**
 * User Status List
 */
export const USER_STATUS_LIST = Object.values(USER_STATUS);

// ============================================================================
// User Role UI Constants
// ============================================================================

/**
 * User Role Mapping
 * 
 * UI metadata for user roles including display labels.
 */
export const USER_ROLE = {
  ADMIN: {
    value: 'ADMIN' as const satisfies UserRole,
    label: '管理员',
    labelKey: 'identity.role.admin',
  },
  OPERATOR: {
    value: 'OPERATOR' as const satisfies UserRole,
    label: '操作员',
    labelKey: 'identity.role.operator',
  },
  USER: {
    value: 'USER' as const satisfies UserRole,
    label: '普通用户',
    labelKey: 'identity.role.user',
  },
} as const;

/**
 * User Role List
 */
export const USER_ROLE_LIST = Object.values(USER_ROLE);
