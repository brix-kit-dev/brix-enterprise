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
 * @file Partners Module Constants
 * @description Permission codes, page IDs, and menu IDs
 * @module @brix-sdk/enterprise-partners-shared/constants
 * @version 3.0.0
 *
 * [Architecture Note - R7.6]
 * This file exports TYPES, permission strings, page IDs, and configuration constants only.
 * Runtime UI constants (with labels, colors, icons) are in @brix-sdk/enterprise-partners-ui-web/src/utils/constants.ts
 */

// Re-export types from the types module
export type { PartnerType, PartnerStatus } from '../types';

// ============================================================================
// Permission Constants
// ============================================================================

/**
 * Partners Module Permission Codes
 * 
 * Consistent with permissions in ui-manifest.yaml
 */
export const PARTNER_PERMISSIONS = {
  /** View partner */
  READ: 'partner:read',
  /** Create partner */
  CREATE: 'partner:create',
  /** Edit partner */
  WRITE: 'partner:write',
  /** Delete partner */
  DELETE: 'partner:delete',
  /** Approve partner */
  APPROVE: 'partner:approve',
  /** Activate partner */
  ACTIVATE: 'partner:activate',
  /** Suspend partner */
  SUSPEND: 'partner:suspend',
  /** Terminate partnership */
  TERMINATE: 'partner:terminate',
  /** Export partner data */
  EXPORT: 'partner:export',
  /** Import partner data */
  IMPORT: 'partner:import',
} as const;

// ============================================================================
// PageId Constants
// ============================================================================

/**
 * Partners Module PageId
 * 
 * Used for NavigationCapability.requestNavigate()
 * Consistent with pages[].pageId in ui-manifest.yaml
 */
export const PARTNER_PAGE_IDS = {
  /** Partner list */
  LIST: 'partner:list',
  /** Partner detail */
  DETAIL: 'partner:detail',
  /** Create partner */
  CREATE: 'partner:create',
  /** Edit partner */
  EDIT: 'partner:edit',
  /** Partner approval */
  APPROVE: 'partner:approve',
} as const;

// ============================================================================
// Menu ID Constants
// ============================================================================

/**
 * Partners Module Menu IDs
 */
export const PARTNER_MENU_IDS = {
  /** Partner management (parent menu) */
  ROOT: 'partner',
  /** Partner list */
  LIST: 'partner:list',
  /** Pending approval list */
  PENDING: 'partner:pending',
  /** Partner analytics */
  ANALYTICS: 'partner:analytics',
} as const;

// ============================================================================
// Credit Score Constants
// ============================================================================

/**
 * Credit score thresholds (configuration only, no UI labels)
 * 
 * Use getCreditRating() from @brix-sdk/enterprise-partners-ui-web/utils for UI display
 */
export const CREDIT_SCORE_RANGE = {
  /** Good credit threshold */
  GOOD_THRESHOLD: 80,
  /** Normal credit threshold */
  NORMAL_THRESHOLD: 60,
  /** Poor credit threshold */
  POOR_THRESHOLD: 40,
  /** Minimum score */
  MIN: 0,
  /** Maximum score */
  MAX: 100,
} as const;

