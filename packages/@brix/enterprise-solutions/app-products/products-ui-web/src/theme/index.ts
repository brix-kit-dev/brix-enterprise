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
 * @file Product Module Theme Configuration
 * @description Theme constants and utility functions for product display styling
 * @module @brix-sdk/enterprise-products-ui-web/theme
 * @version 3.2.0
 *
 * Design Notes:
 * This file provides centralized theme configuration for the product module,
 * following the v3.0.4 Architecture Blueprint for UI consistency.
 *
 * Key Features:
 * - Product type color mapping with backgrounds
 * - Product status indicator colors
 * - Medical category color configuration
 * - Reusable theme utility functions
 *
 * Styling Reference:
 * Based on Packages.tsx mockup design patterns using Tailwind-inspired colors.
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */

import type { ProductType, ProductStatus } from '@brix-sdk/enterprise-products-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Product type configuration including display label and colors
 */
export interface ProductTypeConfig {
  /** Display label (Chinese) */
  label: string;
  /** Primary color (text color) */
  color: string;
  /** Background color (for chips/badges) */
  bgColor: string;
  /** Icon name (Material Icons) */
  icon: string;
}

/**
 * Product status configuration including display label and colors
 */
export interface ProductStatusConfig {
  /** Display label (Chinese) */
  label: string;
  /** Primary color (text color) */
  color: string;
  /** Background color (for chips/badges) */
  bgColor: string;
}

/**
 * Medical category code types
 */
export type MedicalCategory =
  | 'ONCOLOGY'
  | 'COSMETIC'
  | 'FERTILITY'
  | 'REHAB'
  | 'GENERAL';

/**
 * Medical category configuration
 */
export interface MedicalCategoryConfig {
  /** Display label (Chinese) */
  label: string;
  /** Primary color (text color) */
  color: string;
  /** Background color */
  bgColor: string;
}

// ============================================================================
// Product Type Configuration
// ============================================================================

/**
 * Product type configuration mapping
 *
 * Color palette follows Tailwind CSS color system:
 * - CHECKUP: Cyan tones (health/wellness)
 * - TREATMENT: Violet tones (medical/professional)
 * - TRANSLATION: Blue tones (communication/service)
 * - TRANSPORT: Amber tones (mobility/travel)
 * - ACCOMMODATION: Emerald tones (hospitality)
 * - COMPOSITE: Slate tones (comprehensive)
 */
export const PRODUCT_TYPE_CONFIG: Record<ProductType, ProductTypeConfig> = {
  CHECKUP: {
    label: '精密体检',
    color: '#0e7490', // cyan-700
    bgColor: '#ecfeff', // cyan-50
    icon: 'LocalHospital',
  },
  TREATMENT: {
    label: '诊疗服务',
    color: '#6d28d9', // violet-700
    bgColor: '#f5f3ff', // violet-50
    icon: 'MedicalServices',
  },
  TRANSLATION: {
    label: '翻译服务',
    color: '#1d4ed8', // blue-700
    bgColor: '#eff6ff', // blue-50
    icon: 'Translate',
  },
  TRANSPORT: {
    label: '交通接送',
    color: '#b45309', // amber-700
    bgColor: '#fffbeb', // amber-50
    icon: 'DirectionsCar',
  },
  ACCOMMODATION: {
    label: '住宿服务',
    color: '#047857', // emerald-700
    bgColor: '#ecfdf5', // emerald-50
    icon: 'Hotel',
  },
  COMPOSITE: {
    label: '综合套餐',
    color: '#475569', // slate-600
    bgColor: '#f8fafc', // slate-50
    icon: 'Category',
  },
};

// ============================================================================
// Product Status Configuration
// ============================================================================

/**
 * Product status configuration mapping
 *
 * Status color semantics:
 * - DRAFT: Gray (neutral/inactive)
 * - PENDING_REVIEW: Amber (attention needed)
 * - ACTIVE: Emerald (positive/published)
 * - INACTIVE: Rose (stopped/hidden)
 * - ARCHIVED: Slate (historical)
 */
export const PRODUCT_STATUS_CONFIG: Record<ProductStatus, ProductStatusConfig> = {
  DRAFT: {
    label: '草稿',
    color: '#6b7280', // gray-500
    bgColor: '#f3f4f6', // gray-100
  },
  PENDING_REVIEW: {
    label: '待审核',
    color: '#d97706', // amber-600
    bgColor: '#fef3c7', // amber-100
  },
  ACTIVE: {
    label: '上架中',
    color: '#059669', // emerald-600
    bgColor: '#d1fae5', // emerald-100
  },
  INACTIVE: {
    label: '已下架',
    color: '#e11d48', // rose-600
    bgColor: '#ffe4e6', // rose-100
  },
  ARCHIVED: {
    label: '已归档',
    color: '#64748b', // slate-500
    bgColor: '#f1f5f9', // slate-100
  },
};

// ============================================================================
// Medical Category Configuration
// ============================================================================

/**
 * Medical category configuration mapping
 *
 * Category colors follow medical field semantics:
 * - ONCOLOGY: Red (critical care)
 * - COSMETIC: Pink (aesthetic)
 * - FERTILITY: Purple (reproductive)
 * - REHAB: Green (recovery)
 * - GENERAL: Gray (general)
 */
export const MEDICAL_CATEGORY_CONFIG: Record<MedicalCategory, MedicalCategoryConfig> = {
  ONCOLOGY: {
    label: '肿瘤科',
    color: '#b91c1c', // red-700
    bgColor: '#fef2f2', // red-50
  },
  COSMETIC: {
    label: '整形外科',
    color: '#be185d', // pink-700
    bgColor: '#fdf2f8', // pink-50
  },
  FERTILITY: {
    label: '生殖医学',
    color: '#7c3aed', // purple-700
    bgColor: '#faf5ff', // purple-50
  },
  REHAB: {
    label: '康复医学',
    color: '#15803d', // green-700
    bgColor: '#f0fdf4', // green-50
  },
  GENERAL: {
    label: '综合',
    color: '#64748b', // slate-500
    bgColor: '#f1f5f9', // slate-100
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get product type configuration
 *
 * Returns the configuration for a given product type,
 * or a default configuration if type is not found.
 *
 * @param type - Product type enum value
 * @returns Product type configuration object
 */
export function getProductTypeConfig(type: ProductType | string | undefined): ProductTypeConfig {
  if (!type || !(type in PRODUCT_TYPE_CONFIG)) {
    return {
      label: '其他',
      color: '#6b7280',
      bgColor: '#f3f4f6',
      icon: 'Category',
    };
  }
  return PRODUCT_TYPE_CONFIG[type as ProductType];
}

/**
 * Get product status configuration
 *
 * Returns the configuration for a given product status,
 * or a default configuration if status is not found.
 *
 * @param status - Product status enum value
 * @returns Product status configuration object
 */
export function getProductStatusConfig(status: ProductStatus | string | undefined): ProductStatusConfig {
  if (!status || !(status in PRODUCT_STATUS_CONFIG)) {
    return {
      label: '未知',
      color: '#9ca3af',
      bgColor: '#f9fafb',
    };
  }
  return PRODUCT_STATUS_CONFIG[status as ProductStatus];
}

/**
 * Get medical category configuration
 *
 * Returns the configuration for a given medical category,
 * or a default configuration if category is not found.
 *
 * @param category - Medical category code
 * @returns Medical category configuration object
 */
export function getMedicalCategoryConfig(category: MedicalCategory | string | undefined): MedicalCategoryConfig {
  if (!category || !(category in MEDICAL_CATEGORY_CONFIG)) {
    return {
      label: '综合',
      color: '#64748b',
      bgColor: '#f1f5f9',
    };
  }
  return MEDICAL_CATEGORY_CONFIG[category as MedicalCategory];
}

/**
 * Format price to Japanese Yen display format
 *
 * Converts numeric price to formatted display string.
 * Prices above 10,000 are displayed as "万" units.
 *
 * @param value - Price value in JPY
 * @param currency - Currency code (default: 'JPY')
 * @returns Formatted price string
 *
 * @example
 * formatPrice(500000) // '¥50万'
 * formatPrice(8000) // '¥8,000'
 */
export function formatPrice(value: number | undefined, currency = 'JPY'): string {
  if (value === undefined || value === null) {
    return '价格面议';
  }

  const symbols: Record<string, string> = {
    JPY: '¥',
    CNY: '¥',
    USD: '$',
  };
  const symbol = symbols[currency] || currency;

  // Display as "万" (10,000) units for large amounts
  if (value >= 10000 && currency === 'JPY') {
    return `${symbol}${(value / 10000).toFixed(0)}万`;
  }

  return `${symbol}${value.toLocaleString()}`;
}

/**
 * Format price range for display
 *
 * @param min - Minimum price
 * @param max - Maximum price
 * @param currency - Currency code
 * @returns Formatted price range string
 *
 * @example
 * formatPriceRange(300000, 800000) // '¥30万 ~ ¥80万'
 */
export function formatPriceRange(
  min: number | undefined,
  max: number | undefined,
  currency = 'JPY'
): string {
  if (min === undefined && max === undefined) {
    return '价格面议';
  }
  if (min !== undefined && max !== undefined) {
    return `${formatPrice(min, currency)} ~ ${formatPrice(max, currency)}`;
  }
  if (min !== undefined) {
    return `${formatPrice(min, currency)} 起`;
  }
  return `最高 ${formatPrice(max, currency)}`;
}

// ============================================================================
// Re-exports
// ============================================================================

export type { ProductType, ProductStatus };
