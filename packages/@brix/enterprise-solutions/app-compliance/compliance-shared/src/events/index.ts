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
 * @file Compliance Module Events
 * @description Event definitions for compliance management module
 * @module @brix-sdk/enterprise-compliance-shared
 * @version 3.0.0
 *
 * This file contains all custom event definitions for:
 * - Script template lifecycle events
 * - Forbidden word management events
 * - Compliance check events
 *
 * Usage: Import event names and create typed CustomEvent instances.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import type {
  ScriptTemplate,
  ForbiddenWord,
  ComplianceCheckResult,
  ComplianceMatch,
} from '../types';

// ============================================================================
// Event Name Constants
// ============================================================================

/**
 * Script template event names
 */
export const SCRIPT_EVENTS = {
  /** Script template created */
  CREATED: 'compliance:script:created',
  /** Script template updated */
  UPDATED: 'compliance:script:updated',
  /** Script template deleted */
  DELETED: 'compliance:script:deleted',
  /** Script template submitted for review */
  SUBMITTED_FOR_REVIEW: 'compliance:script:submitted-for-review',
  /** Script template approved */
  APPROVED: 'compliance:script:approved',
  /** Script template rejected */
  REJECTED: 'compliance:script:rejected',
  /** Script template published */
  PUBLISHED: 'compliance:script:published',
  /** Script template deprecated */
  DEPRECATED: 'compliance:script:deprecated',
  /** Script template archived */
  ARCHIVED: 'compliance:script:archived',
  /** Script template used */
  USED: 'compliance:script:used',
  /** Script template rated */
  RATED: 'compliance:script:rated',
} as const;

/**
 * Forbidden word event names
 */
export const FORBIDDEN_WORD_EVENTS = {
  /** Forbidden word created */
  CREATED: 'compliance:forbidden-word:created',
  /** Forbidden word updated */
  UPDATED: 'compliance:forbidden-word:updated',
  /** Forbidden word deleted */
  DELETED: 'compliance:forbidden-word:deleted',
  /** Forbidden word enabled */
  ENABLED: 'compliance:forbidden-word:enabled',
  /** Forbidden word disabled */
  DISABLED: 'compliance:forbidden-word:disabled',
  /** Forbidden words imported */
  IMPORTED: 'compliance:forbidden-word:imported',
  /** Forbidden words exported */
  EXPORTED: 'compliance:forbidden-word:exported',
} as const;

/**
 * Compliance check event names
 */
export const CHECK_EVENTS = {
  /** Compliance check started */
  STARTED: 'compliance:check:started',
  /** Compliance check completed */
  COMPLETED: 'compliance:check:completed',
  /** Compliance check failed (error) */
  FAILED: 'compliance:check:failed',
  /** Violation found during check */
  VIOLATION_FOUND: 'compliance:check:violation-found',
  /** Content passed compliance check */
  PASSED: 'compliance:check:passed',
  /** Real-time check triggered */
  REALTIME: 'compliance:check:realtime',
} as const;

/**
 * Audit event names
 */
export const AUDIT_EVENTS = {
  /** Audit record created */
  CREATED: 'compliance:audit:created',
  /** Override decision made */
  OVERRIDE: 'compliance:audit:override',
} as const;

// ============================================================================
// Event Payload Interfaces
// ============================================================================

/**
 * Script template event payload
 */
export interface ScriptTemplateEventPayload {
  /** Script template data */
  script: ScriptTemplate;
  /** Previous state (for updates) */
  previousState?: ScriptTemplate;
  /** Actor user ID */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Script template rejection payload
 */
export interface ScriptRejectionPayload {
  /** Script template data */
  script: ScriptTemplate;
  /** Rejection reason */
  reason: string;
  /** Reviewer user ID */
  reviewerId: string;
  /** Reviewer name */
  reviewerName: string;
}

/**
 * Script template usage payload
 */
export interface ScriptUsagePayload {
  /** Script template ID */
  scriptId: string;
  /** Script template code */
  scriptCode: string;
  /** User who used the script */
  userId: string;
  /** Context where script was used */
  context?: string;
  /** Related entity (e.g., case ID, contract ID) */
  relatedEntityId?: string;
}

/**
 * Script template rating payload
 */
export interface ScriptRatingPayload {
  /** Script template ID */
  scriptId: string;
  /** Rating value (1-5) */
  rating: number;
  /** User who rated */
  userId: string;
  /** Optional feedback */
  feedback?: string;
}

/**
 * Forbidden word event payload
 */
export interface ForbiddenWordEventPayload {
  /** Forbidden word data */
  forbiddenWord: ForbiddenWord;
  /** Previous state (for updates) */
  previousState?: ForbiddenWord;
  /** Actor user ID */
  userId?: string;
}

/**
 * Forbidden word import payload
 */
export interface ForbiddenWordImportPayload {
  /** Number of words imported */
  importCount: number;
  /** Number of words skipped (duplicates) */
  skippedCount: number;
  /** Import source description */
  source?: string;
  /** Actor user ID */
  userId?: string;
}

/**
 * Compliance check event payload
 */
export interface ComplianceCheckEventPayload {
  /** Check result */
  result: ComplianceCheckResult;
  /** Time taken in milliseconds */
  durationMs?: number;
  /** Requester user ID */
  userId?: string;
}

/**
 * Compliance check started payload
 */
export interface ComplianceCheckStartedPayload {
  /** Content being checked (truncated for privacy) */
  contentPreview: string;
  /** Content length */
  contentLength: number;
  /** Related entity type */
  entityType?: string;
  /** Related entity ID */
  entityId?: string;
  /** Requester user ID */
  userId?: string;
}

/**
 * Violation found payload
 */
export interface ViolationFoundPayload {
  /** The match that was found */
  match: ComplianceMatch;
  /** Content being checked (truncated) */
  contentPreview: string;
  /** Related entity type */
  entityType?: string;
  /** Related entity ID */
  entityId?: string;
}

/**
 * Real-time check payload
 */
export interface RealtimeCheckPayload {
  /** Content being checked */
  content: string;
  /** Cursor position in content */
  cursorPosition?: number;
  /** Matches found */
  matches: ComplianceMatch[];
  /** Field identifier */
  fieldId?: string;
}

// ============================================================================
// Event Type Mapping
// ============================================================================

/**
 * Complete event type mapping for type-safe event handling
 */
export interface ComplianceEventMap {
  // Script events
  [SCRIPT_EVENTS.CREATED]: ScriptTemplateEventPayload;
  [SCRIPT_EVENTS.UPDATED]: ScriptTemplateEventPayload;
  [SCRIPT_EVENTS.DELETED]: ScriptTemplateEventPayload;
  [SCRIPT_EVENTS.SUBMITTED_FOR_REVIEW]: ScriptTemplateEventPayload;
  [SCRIPT_EVENTS.APPROVED]: ScriptTemplateEventPayload;
  [SCRIPT_EVENTS.REJECTED]: ScriptRejectionPayload;
  [SCRIPT_EVENTS.PUBLISHED]: ScriptTemplateEventPayload;
  [SCRIPT_EVENTS.DEPRECATED]: ScriptTemplateEventPayload;
  [SCRIPT_EVENTS.ARCHIVED]: ScriptTemplateEventPayload;
  [SCRIPT_EVENTS.USED]: ScriptUsagePayload;
  [SCRIPT_EVENTS.RATED]: ScriptRatingPayload;

  // Forbidden word events
  [FORBIDDEN_WORD_EVENTS.CREATED]: ForbiddenWordEventPayload;
  [FORBIDDEN_WORD_EVENTS.UPDATED]: ForbiddenWordEventPayload;
  [FORBIDDEN_WORD_EVENTS.DELETED]: ForbiddenWordEventPayload;
  [FORBIDDEN_WORD_EVENTS.ENABLED]: ForbiddenWordEventPayload;
  [FORBIDDEN_WORD_EVENTS.DISABLED]: ForbiddenWordEventPayload;
  [FORBIDDEN_WORD_EVENTS.IMPORTED]: ForbiddenWordImportPayload;
  [FORBIDDEN_WORD_EVENTS.EXPORTED]: { count: number; format: string };

  // Check events
  [CHECK_EVENTS.STARTED]: ComplianceCheckStartedPayload;
  [CHECK_EVENTS.COMPLETED]: ComplianceCheckEventPayload;
  [CHECK_EVENTS.FAILED]: { error: string; contentLength?: number };
  [CHECK_EVENTS.VIOLATION_FOUND]: ViolationFoundPayload;
  [CHECK_EVENTS.PASSED]: { contentLength: number; entityType?: string; entityId?: string };
  [CHECK_EVENTS.REALTIME]: RealtimeCheckPayload;

  // Audit events
  [AUDIT_EVENTS.CREATED]: { recordId: string; entityType: string; entityId: string };
  [AUDIT_EVENTS.OVERRIDE]: { recordId: string; reason: string; auditorId: string };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a typed compliance event
 */
export function createComplianceEvent<K extends keyof ComplianceEventMap>(
  eventName: K,
  payload: ComplianceEventMap[K]
): CustomEvent<ComplianceEventMap[K]> {
  return new CustomEvent(eventName, {
    detail: payload,
    bubbles: true,
    cancelable: true,
  });
}
