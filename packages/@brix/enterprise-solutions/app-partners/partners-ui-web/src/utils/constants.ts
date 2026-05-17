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
 * @file Partners Module UI Constants
 * @description UI metadata constants (labels, colors, icons) for the partners module
 * @module @brix-sdk/enterprise-partners-ui-web/utils
 * @version 3.0.0
 *
 * [Architecture Note - R7.6]
 * This file contains runtime UI metadata constants.
 * Type definitions and permission strings are in @brix-sdk/enterprise-partners-shared/constants
 */

import type { PartnerType, PartnerStatus } from '@brix-sdk/enterprise-partners-shared';

// ============================================================================
// Partner Type UI Constants
// ============================================================================

/**
 * Partner Type Mapping
 * 
 * Provides display names, icons, and colors for types
 */
export const PARTNER_TYPE = {
  HOSPITAL: {
    value: 'HOSPITAL' as const satisfies PartnerType,
    label: '医院',
    labelKey: 'partner.type.hospital',
    icon: 'local_hospital',
    color: 'primary',
  },
  CLINIC: {
    value: 'CLINIC' as const satisfies PartnerType,
    label: '诊所',
    labelKey: 'partner.type.clinic',
    icon: 'medical_services',
    color: 'info',
  },
  AGENCY: {
    value: 'AGENCY' as const satisfies PartnerType,
    label: '中介机构',
    labelKey: 'partner.type.agency',
    icon: 'business',
    color: 'secondary',
  },
  TRANSLATOR: {
    value: 'TRANSLATOR' as const satisfies PartnerType,
    label: '翻译服务',
    labelKey: 'partner.type.translator',
    icon: 'translate',
    color: 'success',
  },
  TRANSPORT: {
    value: 'TRANSPORT' as const satisfies PartnerType,
    label: '交通服务',
    labelKey: 'partner.type.transport',
    icon: 'directions_car',
    color: 'warning',
  },
  HOTEL: {
    value: 'HOTEL' as const satisfies PartnerType,
    label: '酒店住宿',
    labelKey: 'partner.type.hotel',
    icon: 'hotel',
    color: 'default',
  },
} as const;

/**
 * Partner Type List
 * 
 * Used for dropdown selections, form rendering, etc.
 */
export const PARTNER_TYPE_LIST = Object.values(PARTNER_TYPE);

// ============================================================================
// Partner Status UI Constants
// ============================================================================

/**
 * Partner Status Mapping
 * 
 * Provides display names and colors for statuses
 */
export const PARTNER_STATUS = {
  PENDING: {
    value: 'PENDING' as const satisfies PartnerStatus,
    label: '待审核',
    labelKey: 'partner.status.pending',
    color: 'warning',
    description: '合作申请已提交，等待审核',
  },
  ACTIVE: {
    value: 'ACTIVE' as const satisfies PartnerStatus,
    label: '已激活',
    labelKey: 'partner.status.active',
    color: 'success',
    description: '合作关系正常有效',
  },
  SUSPENDED: {
    value: 'SUSPENDED' as const satisfies PartnerStatus,
    label: '已暂停',
    labelKey: 'partner.status.suspended',
    color: 'error',
    description: '合作关系暂时中止',
  },
  TERMINATED: {
    value: 'TERMINATED' as const satisfies PartnerStatus,
    label: '已终止',
    labelKey: 'partner.status.terminated',
    color: 'default',
    description: '合作关系已永久终止',
  },
} as const;

/**
 * Partner Status List
 */
export const PARTNER_STATUS_LIST = Object.values(PARTNER_STATUS);

// ============================================================================
// Cooperation Level UI Constants
// ============================================================================

/**
 * Cooperation Level Mapping
 * 
 * Levels 1-5, 5 being the highest
 */
export const COOPERATION_LEVEL = {
  LEVEL_1: {
    value: 1,
    label: '普通合作',
    labelKey: 'partner.level.level1',
    color: 'default',
  },
  LEVEL_2: {
    value: 2,
    label: '银牌合作',
    labelKey: 'partner.level.level2',
    color: 'info',
  },
  LEVEL_3: {
    value: 3,
    label: '金牌合作',
    labelKey: 'partner.level.level3',
    color: 'warning',
  },
  LEVEL_4: {
    value: 4,
    label: '白金合作',
    labelKey: 'partner.level.level4',
    color: 'primary',
  },
  LEVEL_5: {
    value: 5,
    label: '战略合作',
    labelKey: 'partner.level.level5',
    color: 'success',
  },
} as const;

/**
 * Cooperation Level List
 */
export const COOPERATION_LEVEL_LIST = Object.values(COOPERATION_LEVEL);

// ============================================================================
// Credit Score UI Helpers
// ============================================================================

/**
 * Credit score rating information with UI metadata
 */
export interface CreditRatingInfo {
  level: 'excellent' | 'good' | 'normal' | 'poor';
  label: string;
  color: string;
}

/**
 * Get credit rating based on score
 * 
 * @param score - Credit score (0-100)
 * @returns Credit rating information with UI metadata
 */
export function getCreditRating(score: number): CreditRatingInfo {
  if (score >= 90) {
    return { level: 'excellent', label: '优秀', color: 'success' };
  }
  if (score >= 80) {
    return { level: 'good', label: '良好', color: 'primary' };
  }
  if (score >= 60) {
    return { level: 'normal', label: '一般', color: 'warning' };
  }
  return { level: 'poor', label: '较差', color: 'error' };
}
