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
 * @file Contract Module Core Type Definitions
 * @description Core business types for contract management, shared by Web and Mobile
 * @module @brix-sdk/enterprise-contracts-shared/types
 * @version 3.0.0
 * 
 * Design Notes:
 * This file defines core business types for the contracts module following principles:
 * 1. Consistent with backend DTOs
 * 2. No platform-specific types
 * 3. Use interfaces instead of classes for serialization
 * 
 * Type Categories:
 * - Contract Status: ContractStatus, type union
 * - Contract Template: ContractTemplate, ContractTemplateVariable
 * - Contract Instance: Contract, ContractSummary, SignatureInfo
 * - Contract Participant: ContractParty, SignatureStatus
 * - Query/Request: pagination, filters, create/update DTOs
 * 
 * @author Brix Team
 * @date 2026-02-23
 */

// ============================================================================
// Contract Status Enums
// ============================================================================

/**
 * Contract Status
 * 
 * The lifecycle status of a contract instance.
 */
export type ContractStatus =
  | 'DRAFT'            // Draft - initial state, not yet submitted
  | 'PENDING_APPROVAL' // Pending approval - awaiting review
  | 'APPROVED'         // Approved - ready for signing
  | 'PENDING_SIGNATURE'// Pending signature - awaiting signatures
  | 'ACTIVE'           // Active - fully signed and in effect
  | 'EXPIRED'          // Expired - past end date
  | 'TERMINATED';      // Terminated - ended early

/**
 * Signature Status
 * 
 * The signature status of a contract party.
 */
export type SignatureStatus =
  | 'PENDING'    // Pending - not yet signed
  | 'SIGNED'     // Signed - signature completed
  | 'DECLINED'   // Declined - refused to sign
  | 'EXPIRED';   // Expired - signature window closed

/**
 * Contract Template Status
 */
export type TemplateStatus =
  | 'DRAFT'     // Draft - under development
  | 'ACTIVE'    // Active - available for use
  | 'ARCHIVED'; // Archived - no longer available

/**
 * Variable Type in contract templates
 */
export type TemplateVariableType =
  | 'TEXT'      // Plain text input
  | 'NUMBER'    // Numeric value
  | 'DATE'      // Date picker
  | 'SELECT'    // Dropdown selection
  | 'MULTI_SELECT' // Multiple selection
  | 'CURRENCY'; // Currency amount

// ============================================================================
// Contract Template Types
// ============================================================================

/**
 * Contract Template Variable Definition
 * 
 * Defines a variable placeholder in a contract template.
 */
export interface ContractTemplateVariable {
  /** Variable key/name (used in template content as {{variableName}}) */
  key: string;
  /** Display label */
  label: string;
  /** Variable type */
  type: TemplateVariableType;
  /** Whether this variable is required */
  required: boolean;
  /** Default value */
  defaultValue?: string;
  /** Options for SELECT/MULTI_SELECT types */
  options?: string[];
  /** Validation pattern (regex) */
  validationPattern?: string;
  /** Validation error message */
  validationMessage?: string;
  /** Description/help text */
  description?: string;
  /** Display order */
  order: number;
}

/**
 * Contract Template DTO
 * 
 * Represents a contract template used to generate contract instances.
 */
export interface ContractTemplate {
  /** Template ID (auto-generated) */
  id: number;
  /** Template code (business code, e.g., TPL-SERVICE-001) */
  code: string;
  /** Template name */
  name: string;
  /** Template description */
  description?: string;
  /** Template content (with {{variable}} placeholders) */
  content: string;
  /** Template status */
  status: TemplateStatus;
  /** Template version */
  version: string;
  /** Whether this is the active version */
  isActive: boolean;
  /** Variable definitions */
  variables: ContractTemplateVariable[];
  /** Category/type of contracts this template creates */
  category?: string;
  /** Creator user ID */
  createdBy: string;
  /** Creator name */
  createdByName?: string;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last modifier user ID */
  updatedBy?: string;
  /** Last modifier name */
  updatedByName?: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
}

/**
 * Contract Template Summary for list views
 */
export interface ContractTemplateSummary {
  /** Template ID */
  id: number;
  /** Template code */
  code: string;
  /** Template name */
  name: string;
  /** Template description */
  description?: string;
  /** Template status */
  status: TemplateStatus;
  /** Template version */
  version: string;
  /** Whether this is the active version */
  isActive: boolean;
  /** Number of variables */
  variableCount: number;
  /** Category */
  category?: string;
  /** Number of contracts created from this template */
  usageCount: number;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

// ============================================================================
// Contract Instance Types
// ============================================================================

/**
 * Contract Party Information
 * 
 * Represents a party (signer) in a contract.
 */
export interface ContractParty {
  /** Party ID */
  id: number;
  /** Party type (e.g., 'PARTY_A', 'PARTY_B', 'WITNESS') */
  partyType: string;
  /** Party name (individual or organization) */
  name: string;
  /** Contact person name */
  contactName?: string;
  /** Contact email */
  email?: string;
  /** Contact phone */
  phone?: string;
  /** Organization/company name */
  organization?: string;
  /** Signature status */
  signatureStatus: SignatureStatus;
  /** Signature timestamp (if signed) */
  signedAt?: string;
  /** Signature IP address */
  signedIp?: string;
  /** Order in signing flow */
  signOrder: number;
}

/**
 * Contract DTO
 * 
 * The main contract entity representing a contract instance.
 * Consistent with backend ContractDTO.
 */
export interface Contract {
  /** Contract ID (auto-generated) */
  id: number;
  /** Contract number (business number, e.g., CON-2026-0001) */
  contractNo: string;
  /** Contract title */
  title: string;
  /** Contract description */
  description?: string;
  /** Contract status */
  status: ContractStatus;
  /** Template ID used to create this contract */
  templateId: number;
  /** Template code */
  templateCode: string;
  /** Template name (snapshot at creation) */
  templateName: string;
  /** Template version used */
  templateVersion: string;
  /** Rendered contract content (with variables filled in) */
  content: string;
  /** Contract amount */
  amount?: number;
  /** Currency code (ISO 4217) */
  currency?: string;
  /** Contract start date (ISO 8601) */
  startDate?: string;
  /** Contract end date (ISO 8601) */
  endDate?: string;
  /** Contract parties */
  parties: ContractParty[];
  /** Variable values used to render this contract */
  variableValues: Record<string, string>;
  /** Related Case ID (if any) */
  relatedCaseId?: number;
  /** Related Case number */
  relatedCaseNo?: string;
  /** Approval notes */
  approvalNotes?: string;
  /** Approved by user ID */
  approvedBy?: string;
  /** Approved by user name */
  approvedByName?: string;
  /** Approval timestamp */
  approvedAt?: string;
  /** Creator user ID */
  createdBy: string;
  /** Creator name */
  createdByName?: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last modifier user ID */
  updatedBy?: string;
  /** Last modifier name */
  updatedByName?: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Contract Summary for list views
 */
export interface ContractSummary {
  /** Contract ID */
  id: number;
  /** Contract number */
  contractNo: string;
  /** Contract title */
  title: string;
  /** Contract status */
  status: ContractStatus;
  /** Template name */
  templateName: string;
  /** Party A name */
  partyAName: string;
  /** Party B name */
  partyBName: string;
  /** Contract amount */
  amount?: number;
  /** Currency */
  currency?: string;
  /** Start date */
  startDate?: string;
  /** End date */
  endDate?: string;
  /** Total parties count */
  partyCount: number;
  /** Signed parties count */
  signedCount: number;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Contract Template Query Parameters
 */
export interface ContractTemplateQueryParams {
  /** Page number (0-based) */
  page?: number;
  /** Page size */
  size?: number;
  /** Search keyword (name, code, description) */
  keyword?: string;
  /** Filter by status */
  status?: TemplateStatus;
  /** Filter by category */
  category?: string;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Contract Query Parameters
 */
export interface ContractQueryParams {
  /** Page number (0-based) */
  page?: number;
  /** Page size */
  size?: number;
  /** Search keyword (title, contractNo) */
  keyword?: string;
  /** Filter by status */
  status?: ContractStatus;
  /** Filter by template ID */
  templateId?: number;
  /** Filter by party name */
  partyName?: string;
  /** Filter by related case ID */
  relatedCaseId?: number;
  /** Start date from */
  startDateFrom?: string;
  /** Start date to */
  startDateTo?: string;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Create Contract Template Request
 */
export interface CreateContractTemplateRequest {
  /** Template code */
  code: string;
  /** Template name */
  name: string;
  /** Description */
  description?: string;
  /** Template content */
  content: string;
  /** Template version */
  version: string;
  /** Whether to activate immediately */
  isActive?: boolean;
  /** Variable definitions */
  variables: ContractTemplateVariable[];
  /** Category */
  category?: string;
}

/**
 * Update Contract Template Request
 */
export interface UpdateContractTemplateRequest {
  /** Template name */
  name?: string;
  /** Description */
  description?: string;
  /** Template content */
  content?: string;
  /** Template version */
  version?: string;
  /** Variable definitions */
  variables?: ContractTemplateVariable[];
  /** Category */
  category?: string;
}

/**
 * Create Contract Request
 */
export interface CreateContractRequest {
  /** Contract title */
  title: string;
  /** Description */
  description?: string;
  /** Template ID */
  templateId: number;
  /** Variable values to fill template */
  variableValues: Record<string, string>;
  /** Contract amount */
  amount?: number;
  /** Currency code */
  currency?: string;
  /** Start date */
  startDate?: string;
  /** End date */
  endDate?: string;
  /** Contract parties */
  parties: CreateContractPartyRequest[];
  /** Related case ID */
  relatedCaseId?: number;
}

/**
 * Create Contract Party Request
 */
export interface CreateContractPartyRequest {
  /** Party type */
  partyType: string;
  /** Party name */
  name: string;
  /** Contact person */
  contactName?: string;
  /** Email */
  email?: string;
  /** Phone */
  phone?: string;
  /** Organization */
  organization?: string;
  /** Sign order */
  signOrder: number;
}

/**
 * Update Contract Request
 */
export interface UpdateContractRequest {
  /** Contract title */
  title?: string;
  /** Description */
  description?: string;
  /** Variable values */
  variableValues?: Record<string, string>;
  /** Amount */
  amount?: number;
  /** Currency */
  currency?: string;
  /** Start date */
  startDate?: string;
  /** End date */
  endDate?: string;
}

/**
 * Update Contract Status Request
 */
export interface UpdateContractStatusRequest {
  /** Target status */
  status: ContractStatus;
  /** Approval/transition notes */
  notes?: string;
}

/**
 * Paginated Response
 */
export interface PagedResponse<T> {
  /** Content items */
  content: T[];
  /** Total elements count */
  totalElements: number;
  /** Total pages count */
  totalPages: number;
  /** Current page number (0-based) */
  page: number;
  /** Page size */
  size: number;
  /** Is first page */
  first: boolean;
  /** Is last page */
  last: boolean;
}

// ============================================================================
// Display Configuration Types
// ============================================================================

/**
 * Contract Status Display Configuration
 */
export interface ContractStatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

/**
 * Template Status Display Configuration
 */
export interface TemplateStatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}
