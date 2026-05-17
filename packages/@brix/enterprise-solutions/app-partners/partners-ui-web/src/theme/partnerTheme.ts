/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 */
/**
 * @file Partner Module Business-Semantic Theme Configuration
 * @description Business-domain color mappings for partner management UI.
 *
 * Architecture Alignment (v3.0.9 Blueprint & Design Token Plan Phase 6):
 * - This file defines ONLY Layer 3 (Business Component Tokens) — colors that
 *   represent domain-specific knowledge the platform cannot predict.
 * - All platform-level visual tokens (palette, typography, shape, spacing)
 *   have been removed. Plugins MUST use `useTheme().tokens` from
 *   `@brix-sdk/runtime-sdk-react` to access Brix semantic design tokens.
 * - MUI-specific structures (palette.primary.main, shape.borderRadius,
 *   typography.h5, components.*) are prohibited in plugin code per
 *   Blueprint Constraint 9 (BrixUI Unified Governance).
 *
 * Retained Business-Domain Constants:
 * - PARTNER_TYPE_COLORS — visual distinction per partner type (Hospital, Hotel, etc.)
 * - PARTNER_STATUS_COLORS — lifecycle status indicators (Draft, Active, Suspended, etc.)
 * - getPartnerTypeConfig() / getPartnerStatusConfig() — safe lookup helpers
 *
 * Color Reference (from Partners.tsx Figma mockup):
 * - HOSPITAL: Red theme (bg-red-50, text-red-600)
 * - TRANSLATOR: Blue theme (bg-blue-50, text-blue-600)
 * - HOTEL: Violet theme (bg-violet-50, text-violet-600)
 * - TRANSPORT: Amber theme (bg-amber-50, text-amber-600)
 * - OTHER: Gray theme (bg-gray-100, text-gray-600)
 *
 * @module @brix-sdk/enterprise-partners-ui-web/theme
 * @version 3.2.1
 * @author Brix Platform Team
 * @date 2026-03-29
 */

import type { PartnerType, PartnerStatus } from '../types';

// ============================================================================
// Partner Type Color Configuration
// ============================================================================

/**
 * Partner Type Color Mapping
 *
 * Visual distinction for different partner types following Figma design.
 * Each type has background color for chips/badges and text color for labels.
 */
export const PARTNER_TYPE_COLORS: Record<PartnerType, {
  background: string;
  text: string;
  labelKey: string;
  iconBg: string;
}> = {
  HOSPITAL: {
    background: '#FEE2E2', // red-100
    text: '#DC2626',       // red-600
    labelKey: 'themeType.HOSPITAL',
    iconBg: '#FEF2F2',     // red-50
  },
  HOTEL: {
    background: '#EDE9FE', // violet-100
    text: '#7C3AED',       // violet-600
    labelKey: 'themeType.HOTEL',
    iconBg: '#F5F3FF',     // violet-50
  },
  TRANSPORT: {
    background: '#FEF3C7', // amber-100
    text: '#D97706',       // amber-600
    labelKey: 'themeType.TRANSPORT',
    iconBg: '#FFFBEB',     // amber-50
  },
  TRANSLATION: {
    background: '#DBEAFE', // blue-100
    text: '#2563EB',       // blue-600
    labelKey: 'themeType.TRANSLATION',
    iconBg: '#EFF6FF',     // blue-50
  },
  OTHER: {
    background: '#F3F4F6', // gray-100
    text: '#4B5563',       // gray-600
    labelKey: 'themeType.OTHER',
    iconBg: '#F9FAFB',     // gray-50
  },
};

// ============================================================================
// Partner Status Color Configuration
// ============================================================================

/**
 * Partner Status Color Mapping
 *
 * Visual indicators for partnership lifecycle status.
 */
export const PARTNER_STATUS_COLORS: Record<PartnerStatus, {
  background: string;
  text: string;
  dot: string;
  labelKey: string;
}> = {
  DRAFT: {
    background: '#F3F4F6', // gray-100
    text: '#6B7280',       // gray-500
    dot: '#9CA3AF',        // gray-400
    labelKey: 'themeStatus.DRAFT',
  },
  ACTIVE: {
    background: '#D1FAE5', // emerald-100
    text: '#047857',       // emerald-700
    dot: '#10B981',        // emerald-500
    labelKey: 'themeStatus.ACTIVE',
  },
  SUSPENDED: {
    background: '#FEF3C7', // amber-100
    text: '#B45309',       // amber-700
    dot: '#F59E0B',        // amber-500
    labelKey: 'themeStatus.SUSPENDED',
  },
  TERMINATED: {
    background: '#FEE2E2', // red-100
    text: '#B91C1C',       // red-700
    dot: '#EF4444',        // red-500
    labelKey: 'themeStatus.TERMINATED',
  },
};

/**
 * Get partner type configuration
 *
 * Safe lookup with fallback to OTHER for unrecognized types.
 *
 * @param type - Partner type enum value
 * @returns Type color configuration for badges and icons
 */
export function getPartnerTypeConfig(type: PartnerType) {
  return PARTNER_TYPE_COLORS[type] ?? PARTNER_TYPE_COLORS.OTHER;
}

/**
 * Get partner status configuration
 *
 * Safe lookup with fallback to DRAFT for unrecognized statuses.
 *
 * @param status - Partner status enum value
 * @returns Status color configuration for indicators and labels
 */
export function getPartnerStatusConfig(status: PartnerStatus) {
  return PARTNER_STATUS_COLORS[status] ?? PARTNER_STATUS_COLORS.DRAFT;
}
