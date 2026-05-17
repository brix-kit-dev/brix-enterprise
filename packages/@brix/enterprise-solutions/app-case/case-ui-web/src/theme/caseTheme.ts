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
 * @file Case Module Business-Semantic Theme Configuration
 * @description Business-domain color mappings for case management UI.
 *
 * Architecture Alignment (v3.0.9 Blueprint & Design Token Plan Phase 6):
 * - This file defines ONLY Layer 3 (Business Component Tokens) — colors that
 *   represent domain-specific knowledge the platform cannot predict.
 * - All platform-level visual tokens (palette, typography, shape, components)
 *   have been removed. Plugins MUST use `useTheme().tokens` from
 *   `@brix-sdk/runtime-sdk-react` to access Brix semantic design tokens.
 * - MUI-specific structures (palette.primary.main, shape.borderRadius,
 *   typography.h1, components.*, .MuiOutlinedInput-root) are prohibited
 *   in plugin code per Blueprint Constraint 9 (BrixUI Unified Governance).
 *
 * Retained Business-Domain Constants:
 * - CASE_STATUS_COLORS — case lifecycle status indicators (Draft, Pending, In Progress, etc.)
 * - NODE_STATUS_COLORS — workflow node state indicators (Pending, Active, Done, etc.)
 * - TEMPLATE_TYPE_COLORS — case template type badges (JP Checkup, JP Treatment)
 *
 * @module @brix-sdk/enterprise-case-ui-web/theme
 * @version 3.2.1
 * @author Brix Platform Team
 * @date 2026-03-29
 */

// ============================================================================
// Color Constants
// ============================================================================

/**
 * Case Status Color Mapping
 *
 * Provides consistent color theming for different case statuses.
 * Colors are derived from Figma design specifications.
 * Keys match CaseStatus enum values from case-shared.
 */
export const CASE_STATUS_COLORS: Record<string, { background: string; text: string; border: string }> = {
  DRAFT: {
    background: '#F3F4F6',
    text: '#6B7280',
    border: '#D1D5DB',
  },
  PENDING: {
    background: '#FEF3C7',
    text: '#D97706',
    border: '#F59E0B',
  },
  IN_PROGRESS: {
    background: '#DBEAFE',
    text: '#1D4ED8',
    border: '#3B82F6',
  },
  ON_HOLD: {
    background: '#E0E7FF',
    text: '#4338CA',
    border: '#6366F1',
  },
  COMPLETED: {
    background: '#D1FAE5',
    text: '#047857',
    border: '#10B981',
  },
  CANCELLED: {
    background: '#FEE2E2',
    text: '#DC2626',
    border: '#EF4444',
  },
};

/**
 * Case Node Status Color Mapping
 *
 * Colors for workflow node states in the progress stepper.
 * Keys match CaseNodeStatus enum values from case-shared.
 */
export const NODE_STATUS_COLORS: Record<string, { background: string; text: string; icon: string }> = {
  PENDING: {
    background: '#F9FAFB',
    text: '#9CA3AF',
    icon: '#D1D5DB',
  },
  ACTIVE: {
    background: '#EFF6FF',
    text: '#1D4ED8',
    icon: '#3B82F6',
  },
  DONE: {
    background: '#ECFDF5',
    text: '#047857',
    icon: '#10B981',
  },
  SKIPPED: {
    background: '#FFF7ED',
    text: '#C2410C',
    icon: '#F97316',
  },
  FAILED: {
    background: '#FEF2F2',
    text: '#DC2626',
    icon: '#EF4444',
  },
} as const;

/**
 * Template Type Color Mapping
 *
 * Visual distinction for different case template types.
 */
export const TEMPLATE_TYPE_COLORS: Record<string, { background: string; text: string; label: string }> = {
  JP_CHECKUP: {
    background: '#ECFEFF',
    text: '#0E7490',
    label: 'JP Checkup',
  },
  JP_TREATMENT: {
    background: '#F5F3FF',
    text: '#7C3AED',
    label: 'JP Treatment',
  },
};
