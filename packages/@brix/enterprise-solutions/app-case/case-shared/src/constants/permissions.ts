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
 * @file Case Module Permission Constants
 * @description Permission codes for the case module
 * @module @brix-sdk/enterprise-case-shared/constants
 * @version 3.0.0
 * 
 * Design Notes:
 * Permission codes are used for:
 * 1. Backend authorization checks
 * 2. Frontend UI element visibility control
 * 3. Role-based access control configuration
 */

// ============================================================================
// Case Permission Codes
// ============================================================================

/**
 * Case Module Permissions
 */
export const CASE_PERMISSIONS = {
  // ========== Case CRUD ==========
  /** View case list */
  CASE_LIST: 'case:list',
  /** View case details */
  CASE_VIEW: 'case:view',
  /** Create new case */
  CASE_CREATE: 'case:create',
  /** Update case information */
  CASE_UPDATE: 'case:update',
  /** Delete case */
  CASE_DELETE: 'case:delete',
  
  // ========== Case Status ==========
  /** Change case status */
  CASE_STATUS_UPDATE: 'case:status:update',
  /** Cancel case */
  CASE_CANCEL: 'case:cancel',
  /** Complete case */
  CASE_COMPLETE: 'case:complete',
  
  // ========== Case Assignment ==========
  /** Assign case to operator */
  CASE_ASSIGN: 'case:assign',
  /** Reassign case */
  CASE_REASSIGN: 'case:reassign',
  
  // ========== Node Management ==========
  /** View node status */
  NODE_VIEW: 'case:node:view',
  /** Update node status */
  NODE_UPDATE: 'case:node:update',
  /** Skip node */
  NODE_SKIP: 'case:node:skip',
  /** Approve node (for approval-required nodes) */
  NODE_APPROVE: 'case:node:approve',
  
  // ========== Schedule Management ==========
  /** View schedule */
  SCHEDULE_VIEW: 'case:schedule:view',
  /** Edit schedule */
  SCHEDULE_EDIT: 'case:schedule:edit',
  
  // ========== Timeline ==========
  /** View timeline */
  TIMELINE_VIEW: 'case:timeline:view',
  
  // ========== Parameters ==========
  /** View parameters */
  PARAMETER_VIEW: 'case:parameter:view',
  /** Edit parameters */
  PARAMETER_EDIT: 'case:parameter:edit',
  
  // ========== Template Management ==========
  /** View template list */
  TEMPLATE_LIST: 'case:template:list',
  /** View template details */
  TEMPLATE_VIEW: 'case:template:view',
  /** Create template */
  TEMPLATE_CREATE: 'case:template:create',
  /** Update template */
  TEMPLATE_UPDATE: 'case:template:update',
  /** Delete template */
  TEMPLATE_DELETE: 'case:template:delete',
  /** Activate/deactivate template */
  TEMPLATE_ACTIVATE: 'case:template:activate',
  
  // ========== Export/Import ==========
  /** Export case data */
  CASE_EXPORT: 'case:export',
  /** Import case data */
  CASE_IMPORT: 'case:import',
} as const;

/**
 * Permission type union
 */
export type CasePermission = typeof CASE_PERMISSIONS[keyof typeof CASE_PERMISSIONS];

// ============================================================================
// Role-Permission Mappings (for reference)
// ============================================================================

/**
 * Default permission sets for common roles
 * 
 * Note: These are reference configurations. Actual role-permission
 * mapping is managed by the identity module.
 */
export const CASE_ROLE_PERMISSIONS = {
  /** Case viewer - read-only access */
  CASE_VIEWER: [
    CASE_PERMISSIONS.CASE_LIST,
    CASE_PERMISSIONS.CASE_VIEW,
    CASE_PERMISSIONS.NODE_VIEW,
    CASE_PERMISSIONS.SCHEDULE_VIEW,
    CASE_PERMISSIONS.TIMELINE_VIEW,
    CASE_PERMISSIONS.PARAMETER_VIEW,
  ],
  
  /** Case operator - can manage assigned cases */
  CASE_OPERATOR: [
    CASE_PERMISSIONS.CASE_LIST,
    CASE_PERMISSIONS.CASE_VIEW,
    CASE_PERMISSIONS.CASE_UPDATE,
    CASE_PERMISSIONS.NODE_VIEW,
    CASE_PERMISSIONS.NODE_UPDATE,
    CASE_PERMISSIONS.SCHEDULE_VIEW,
    CASE_PERMISSIONS.SCHEDULE_EDIT,
    CASE_PERMISSIONS.TIMELINE_VIEW,
    CASE_PERMISSIONS.PARAMETER_VIEW,
    CASE_PERMISSIONS.PARAMETER_EDIT,
  ],
  
  /** Case manager - full case access, can assign and approve */
  CASE_MANAGER: [
    CASE_PERMISSIONS.CASE_LIST,
    CASE_PERMISSIONS.CASE_VIEW,
    CASE_PERMISSIONS.CASE_CREATE,
    CASE_PERMISSIONS.CASE_UPDATE,
    CASE_PERMISSIONS.CASE_DELETE,
    CASE_PERMISSIONS.CASE_STATUS_UPDATE,
    CASE_PERMISSIONS.CASE_CANCEL,
    CASE_PERMISSIONS.CASE_COMPLETE,
    CASE_PERMISSIONS.CASE_ASSIGN,
    CASE_PERMISSIONS.CASE_REASSIGN,
    CASE_PERMISSIONS.NODE_VIEW,
    CASE_PERMISSIONS.NODE_UPDATE,
    CASE_PERMISSIONS.NODE_SKIP,
    CASE_PERMISSIONS.NODE_APPROVE,
    CASE_PERMISSIONS.SCHEDULE_VIEW,
    CASE_PERMISSIONS.SCHEDULE_EDIT,
    CASE_PERMISSIONS.TIMELINE_VIEW,
    CASE_PERMISSIONS.PARAMETER_VIEW,
    CASE_PERMISSIONS.PARAMETER_EDIT,
    CASE_PERMISSIONS.TEMPLATE_LIST,
    CASE_PERMISSIONS.TEMPLATE_VIEW,
    CASE_PERMISSIONS.CASE_EXPORT,
  ],
  
  /** Template administrator - can manage templates */
  TEMPLATE_ADMIN: [
    CASE_PERMISSIONS.TEMPLATE_LIST,
    CASE_PERMISSIONS.TEMPLATE_VIEW,
    CASE_PERMISSIONS.TEMPLATE_CREATE,
    CASE_PERMISSIONS.TEMPLATE_UPDATE,
    CASE_PERMISSIONS.TEMPLATE_DELETE,
    CASE_PERMISSIONS.TEMPLATE_ACTIVATE,
  ],
} as const;
