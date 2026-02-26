/**
 * @file Products Module UI Constants
 * @description UI metadata constants (labels, colors, icons) for the products module
 * @module @shinwa/products-ui-web/utils
 * @version 3.0.0
 *
 * [Architecture Note - R7.6]
 * This file contains runtime UI metadata constants.
 * Type definitions and permission strings are in @shinwa/products-shared/constants
 */

import type { ProductType, ProductStatus } from '@shinwa/products-shared';

// ============================================================================
// Product Type UI Constants
// ============================================================================

/**
 * Product Type Mapping
 * 
 * Provides display names, i18n keys, icons, and colors for types.
 */
export const PRODUCT_TYPE = {
  CHECKUP: {
    value: 'CHECKUP' as const satisfies ProductType,
    label: '体检套餐',
    labelKey: 'product.type.checkup',
    color: '#4CAF50',
    icon: 'medical_services',
  },
  TREATMENT: {
    value: 'TREATMENT' as const satisfies ProductType,
    label: '治疗套餐',
    labelKey: 'product.type.treatment',
    color: '#2196F3',
    icon: 'healing',
  },
  TRANSLATION: {
    value: 'TRANSLATION' as const satisfies ProductType,
    label: '翻译套餐',
    labelKey: 'product.type.translation',
    color: '#9C27B0',
    icon: 'translate',
  },
  TRANSPORT: {
    value: 'TRANSPORT' as const satisfies ProductType,
    label: '交通套餐',
    labelKey: 'product.type.transport',
    color: '#FF9800',
    icon: 'directions_car',
  },
  ACCOMMODATION: {
    value: 'ACCOMMODATION' as const satisfies ProductType,
    label: '住宿套餐',
    labelKey: 'product.type.accommodation',
    color: '#795548',
    icon: 'hotel',
  },
  COMPOSITE: {
    value: 'COMPOSITE' as const satisfies ProductType,
    label: '综合套餐',
    labelKey: 'product.type.composite',
    color: '#607D8B',
    icon: 'category',
  },
} as const;

/**
 * Product Type List
 */
export const PRODUCT_TYPE_LIST = Object.values(PRODUCT_TYPE);

// ============================================================================
// Product Status UI Constants
// ============================================================================

/**
 * Product Status Mapping
 * 
 * Provides display names, i18n keys, colors, and chip colors for statuses.
 */
export const PRODUCT_STATUS = {
  DRAFT: {
    value: 'DRAFT' as const satisfies ProductStatus,
    label: '草稿',
    labelKey: 'product.status.draft',
    color: '#9E9E9E',
    chipColor: 'default' as const,
  },
  PENDING_REVIEW: {
    value: 'PENDING_REVIEW' as const satisfies ProductStatus,
    label: '待审核',
    labelKey: 'product.status.pendingReview',
    color: '#FF9800',
    chipColor: 'warning' as const,
  },
  ACTIVE: {
    value: 'ACTIVE' as const satisfies ProductStatus,
    label: '上架',
    labelKey: 'product.status.active',
    color: '#4CAF50',
    chipColor: 'success' as const,
  },
  INACTIVE: {
    value: 'INACTIVE' as const satisfies ProductStatus,
    label: '下架',
    labelKey: 'product.status.inactive',
    color: '#F44336',
    chipColor: 'error' as const,
  },
  ARCHIVED: {
    value: 'ARCHIVED' as const satisfies ProductStatus,
    label: '归档',
    labelKey: 'product.status.archived',
    color: '#607D8B',
    chipColor: 'default' as const,
  },
} as const;

/**
 * Product Status List
 */
export const PRODUCT_STATUS_LIST = Object.values(PRODUCT_STATUS);
