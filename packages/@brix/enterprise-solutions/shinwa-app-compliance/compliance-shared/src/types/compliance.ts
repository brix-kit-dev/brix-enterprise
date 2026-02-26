/**
 * @file Compliance Types Definition
 * @description Type definitions for compliance management module
 * @module @shinwa/compliance-shared
 * @version 3.0.0
 *
 * This file contains all TypeScript type definitions for:
 * - Script templates (sales/service话术模板)
 * - Forbidden words and phrases management
 * - Compliance checking results
 * - Audit records
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

// ============================================================================
// Enumerations
// ============================================================================

/**
 * Script template status enumeration
 */
export type ScriptTemplateStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'DEPRECATED' | 'ARCHIVED';

/**
 * Script template category enumeration
 */
export type ScriptCategory = 
  | 'OPENING'           // 开场白
  | 'INTRODUCTION'      // 产品介绍
  | 'OBJECTION_HANDLING'// 异议处理
  | 'CLOSING'           // 促成成交
  | 'FOLLOW_UP'         // 跟进回访
  | 'COMPLAINT_HANDLING'// 投诉处理
  | 'GENERIC';          // 通用话术

/**
 * Script applicable scenario enumeration
 */
export type ScriptScenario = 
  | 'PHONE_SALES'       // 电话销售
  | 'PHONE_SERVICE'     // 电话服务
  | 'ONLINE_CHAT'       // 在线客服
  | 'IN_PERSON'         // 面对面
  | 'EMAIL'             // 邮件沟通
  | 'ALL';              // 全渠道

/**
 * Forbidden word severity level
 */
export type ForbiddenWordSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Forbidden word category
 */
export type ForbiddenWordCategory =
  | 'LEGAL_RISK'        // 法律风险词
  | 'MISLEADING'        // 误导性用语
  | 'PROMISE'           // 虚假承诺
  | 'DISCRIMINATION'    // 歧视性用语
  | 'COMPETITOR'        // 竞品贬低
  | 'SENSITIVE'         // 敏感信息
  | 'PROFANITY';        // 不文明用语

/**
 * Compliance check result status
 */
export type ComplianceCheckStatus = 'PASS' | 'WARNING' | 'FAIL';

// ============================================================================
// Entity Interfaces
// ============================================================================

/**
 * Script template variable definition
 */
export interface ScriptVariable {
  /** Variable unique key */
  key: string;
  /** Display label */
  label: string;
  /** Description/help text */
  description?: string;
  /** Default value */
  defaultValue?: string;
  /** Order in form */
  order: number;
}

/**
 * Script template entity
 */
export interface ScriptTemplate {
  /** Unique identifier */
  id?: string;
  /** Template code */
  code: string;
  /** Template name */
  name: string;
  /** Category */
  category: ScriptCategory;
  /** Applicable scenario */
  scenario: ScriptScenario;
  /** Template content with variable placeholders */
  content: string;
  /** Variables definition */
  variables?: ScriptVariable[];
  /** Usage instruction/guidance */
  guidance?: string;
  /** Expected outcome description */
  expectedOutcome?: string;
  /** Status */
  status: ScriptTemplateStatus;
  /** Version number */
  version?: string;
  /** Tags for search */
  tags?: string[];
  /** Related product IDs */
  productIds?: string[];
  /** Usage count */
  usageCount?: number;
  /** Effectiveness rating (0-5) */
  effectivenessRating?: number;
  /** Review comments */
  reviewComments?: string;
  /** Creator user ID */
  createdBy?: string;
  /** Creation timestamp */
  createdAt?: Date;
  /** Last updater user ID */
  updatedBy?: string;
  /** Last update timestamp */
  updatedAt?: Date;
  /** Reviewer user ID */
  reviewedBy?: string;
  /** Review timestamp */
  reviewedAt?: Date;
}

/**
 * Forbidden word/phrase entity
 */
export interface ForbiddenWord {
  /** Unique identifier */
  id?: string;
  /** The forbidden word or phrase */
  word: string;
  /** Category */
  category: ForbiddenWordCategory;
  /** Severity level */
  severity: ForbiddenWordSeverity;
  /** Reason/explanation why this is forbidden */
  reason: string;
  /** Suggested alternative expressions */
  alternatives?: string[];
  /** Whether to match case-sensitively */
  caseSensitive?: boolean;
  /** Whether to match as whole word only */
  wholeWordOnly?: boolean;
  /** Regex pattern for complex matching */
  pattern?: string;
  /** Whether this rule is active */
  enabled: boolean;
  /** Creator user ID */
  createdBy?: string;
  /** Creation timestamp */
  createdAt?: Date;
  /** Last updater user ID */
  updatedBy?: string;
  /** Last update timestamp */
  updatedAt?: Date;
}

/**
 * Compliance check match result
 */
export interface ComplianceMatch {
  /** The matched forbidden word ID */
  forbiddenWordId: string;
  /** The matched text */
  matchedText: string;
  /** Position in the checked content (start index) */
  startIndex: number;
  /** Position in the checked content (end index) */
  endIndex: number;
  /** Severity level */
  severity: ForbiddenWordSeverity;
  /** Category of violation */
  category: ForbiddenWordCategory;
  /** Reason for this match */
  reason: string;
  /** Suggested alternatives */
  alternatives?: string[];
}

/**
 * Compliance check result
 */
export interface ComplianceCheckResult {
  /** Unique identifier */
  id?: string;
  /** Content that was checked */
  content: string;
  /** Overall status */
  status: ComplianceCheckStatus;
  /** Total number of issues found */
  issueCount: number;
  /** Critical issues count */
  criticalCount: number;
  /** High severity issues count */
  highCount: number;
  /** Medium severity issues count */
  mediumCount: number;
  /** Low severity issues count */
  lowCount: number;
  /** All matches found */
  matches: ComplianceMatch[];
  /** Check timestamp */
  checkedAt: Date;
  /** Checker user ID (if manual) */
  checkedBy?: string;
  /** Related entity type (e.g., 'SCRIPT', 'CONTRACT') */
  entityType?: string;
  /** Related entity ID */
  entityId?: string;
}

/**
 * Compliance audit record
 */
export interface ComplianceAuditRecord {
  /** Unique identifier */
  id?: string;
  /** Audit action type */
  action: 'CHECK' | 'APPROVE' | 'REJECT' | 'OVERRIDE';
  /** Related entity type */
  entityType: string;
  /** Related entity ID */
  entityId: string;
  /** Content snapshot at audit time */
  contentSnapshot?: string;
  /** Audit result/decision */
  result: 'PASS' | 'FAIL' | 'OVERRIDE';
  /** Issues found (if any) */
  issues?: ComplianceMatch[];
  /** Comment from auditor */
  comment?: string;
  /** Auditor user ID */
  auditorId: string;
  /** Auditor name */
  auditorName: string;
  /** Audit timestamp */
  auditedAt: Date;
}

// ============================================================================
// Query Parameter Interfaces
// ============================================================================

/**
 * Script template query parameters
 */
export interface ScriptTemplateQueryParams {
  /** Page number (1-based) */
  page?: number;
  /** Page size */
  size?: number;
  /** Search by name */
  name?: string;
  /** Search by code */
  code?: string;
  /** Filter by category */
  category?: ScriptCategory;
  /** Filter by scenario */
  scenario?: ScriptScenario;
  /** Filter by status */
  status?: ScriptTemplateStatus;
  /** Filter by tags */
  tags?: string[];
  /** Filter by product ID */
  productId?: string;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Forbidden word query parameters
 */
export interface ForbiddenWordQueryParams {
  /** Page number (1-based) */
  page?: number;
  /** Page size */
  size?: number;
  /** Search by word */
  word?: string;
  /** Filter by category */
  category?: ForbiddenWordCategory;
  /** Filter by severity */
  severity?: ForbiddenWordSeverity;
  /** Filter by enabled status */
  enabled?: boolean;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Compliance audit record query parameters
 */
export interface ComplianceAuditQueryParams {
  /** Page number (1-based) */
  page?: number;
  /** Page size */
  size?: number;
  /** Filter by entity type */
  entityType?: string;
  /** Filter by entity ID */
  entityId?: string;
  /** Filter by auditor ID */
  auditorId?: string;
  /** Filter by result */
  result?: 'PASS' | 'FAIL' | 'OVERRIDE';
  /** Date range start */
  dateFrom?: string;
  /** Date range end */
  dateTo?: string;
}

// ============================================================================
// Request/Response DTOs
// ============================================================================

/**
 * Create script template request
 */
export interface CreateScriptTemplateRequest {
  code: string;
  name: string;
  category: ScriptCategory;
  scenario: ScriptScenario;
  content: string;
  variables?: ScriptVariable[];
  guidance?: string;
  expectedOutcome?: string;
  tags?: string[];
  productIds?: string[];
}

/**
 * Update script template request
 */
export interface UpdateScriptTemplateRequest {
  name?: string;
  category?: ScriptCategory;
  scenario?: ScriptScenario;
  content?: string;
  variables?: ScriptVariable[];
  guidance?: string;
  expectedOutcome?: string;
  tags?: string[];
  productIds?: string[];
}

/**
 * Create forbidden word request
 */
export interface CreateForbiddenWordRequest {
  word: string;
  category: ForbiddenWordCategory;
  severity: ForbiddenWordSeverity;
  reason: string;
  alternatives?: string[];
  caseSensitive?: boolean;
  wholeWordOnly?: boolean;
  pattern?: string;
  enabled?: boolean;
}

/**
 * Update forbidden word request
 */
export interface UpdateForbiddenWordRequest {
  word?: string;
  category?: ForbiddenWordCategory;
  severity?: ForbiddenWordSeverity;
  reason?: string;
  alternatives?: string[];
  caseSensitive?: boolean;
  wholeWordOnly?: boolean;
  pattern?: string;
  enabled?: boolean;
}

/**
 * Compliance check request
 */
export interface ComplianceCheckRequest {
  /** Content to check */
  content: string;
  /** Related entity type (optional) */
  entityType?: string;
  /** Related entity ID (optional) */
  entityId?: string;
  /** Categories to check against (optional, all if not specified) */
  categories?: ForbiddenWordCategory[];
}

/**
 * Paginated response wrapper
 */
export interface PagedResponse<T> {
  /** Data items */
  content: T[];
  /** Current page number (1-based) */
  page: number;
  /** Page size */
  size: number;
  /** Total number of elements */
  totalElements: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether this is the first page */
  first: boolean;
  /** Whether this is the last page */
  last: boolean;
}
