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
 * @file Case Module Core Type Definitions
 * @description Core business types for case management, shared by Web and Mobile
 * @module @brix-sdk/enterprise-case-shared/types
 * @version 3.0.0
 * 
 * Design Notes:
 * This file defines core business types for the case module following principles:
 * 1. Consistent with backend DTOs
 * 2. No platform-specific types
 * 3. Use interfaces instead of classes for serialization
 * 
 * Type Categories:
 * - Case Core: Case, CaseStatus, CasePriority
 * - Case Node: CaseNode, CaseNodeStatus
 * - Schedule: ScheduleDay, ScheduleItem
 * - Timeline: TimelineEvent, TimelineEventType
 * - Template: CaseTemplate, CaseTemplateNode
 * - Parameters: CaseParameter, ParameterDefinition
 * 
 * @author Brix Team
 * @date 2026-02-23
 */

// ============================================================================
// Case Status Enums
// ============================================================================

/**
 * Case Status
 * 
 * The lifecycle status of a medical intermediary case.
 * Follows the state machine defined in backend CaseStatus enum.
 */
export type CaseStatus =
  | 'DRAFT'        // Draft - initial state, not yet submitted
  | 'PENDING'      // Pending - awaiting initial processing
  | 'IN_PROGRESS'  // In Progress - actively being worked on
  | 'ON_HOLD'      // On Hold - temporarily paused
  | 'COMPLETED'    // Completed - successfully finished
  | 'CANCELLED';   // Cancelled - terminated by user or system

/**
 * Case Priority
 * 
 * The urgency level of a case.
 */
export type CasePriority =
  | 'LOW'      // Low priority - standard processing
  | 'NORMAL'   // Normal priority - default level
  | 'HIGH'     // High priority - expedited processing
  | 'URGENT';  // Urgent - immediate attention required

// ============================================================================
// Case Node Status
// ============================================================================

/**
 * Case Node Status
 * 
 * The status of a workflow node within a case.
 */
export type CaseNodeStatus =
  | 'PENDING'     // Pending - not yet started
  | 'ACTIVE'      // Active - currently being processed
  | 'DONE'        // Done - successfully completed
  | 'SKIPPED'     // Skipped - intentionally bypassed
  | 'FAILED';     // Failed - encountered an error

/**
 * Case Node Type
 * 
 * The type of workflow node, determining its behavior and UI rendering.
 */
export type CaseNodeType =
  | 'PACKAGE_SELECT'    // Package selection node
  | 'INTAKE'            // Medical intake/document collection
  | 'APPOINTMENT'       // Appointment scheduling
  | 'ARRIVAL'           // Patient arrival confirmation
  | 'EXAMINATION'       // Medical examination
  | 'REPORT'            // Report generation
  | 'TRANSLATION'       // Translation service
  | 'FOLLOW_UP'         // Follow-up care
  | 'COMPLETION'        // Case completion
  | 'CUSTOM';           // Custom user-defined node

// ============================================================================
// Schedule Types
// ============================================================================

/**
 * Schedule Item Status
 * 
 * The status of an individual schedule item.
 */
export type ScheduleItemStatus =
  | 'SCHEDULED'   // Scheduled - planned but not started
  | 'IN_PROGRESS' // In Progress - currently ongoing
  | 'COMPLETED'   // Completed - finished successfully
  | 'CANCELLED'   // Cancelled - no longer happening
  | 'RESCHEDULED';// Rescheduled - moved to different time

/**
 * Schedule Item Type
 * 
 * The category of a schedule item.
 */
export type ScheduleItemType =
  | 'APPOINTMENT'   // Medical appointment
  | 'TRANSPORT'     // Transportation
  | 'ACCOMMODATION' // Hotel/accommodation
  | 'MEAL'          // Meal arrangement
  | 'TRANSLATION'   // Translation service
  | 'CUSTOM';       // Custom item

// ============================================================================
// Timeline Event Types
// ============================================================================

/**
 * Timeline Event Type
 * 
 * The type of timeline event, determining its display style and icon.
 */
export type TimelineEventType =
  | 'CASE_CREATED'       // Case was created
  | 'CASE_UPDATED'       // Case information was updated
  | 'STATUS_CHANGED'     // Case status changed
  | 'NODE_STARTED'       // Workflow node started
  | 'NODE_COMPLETED'     // Workflow node completed
  | 'PARAMETER_SET'      // Parameter was set/updated
  | 'FILE_UPLOADED'      // File was uploaded
  | 'DOCUMENT_SIGNED'    // Document was signed
  | 'SCHEDULE_UPDATED'   // Schedule was updated
  | 'NOTE_ADDED'         // Note/comment was added
  | 'ASSIGNMENT_CHANGED' // Case assignment changed
  | 'CUSTOM';            // Custom event type

// ============================================================================
// Case Core Types
// ============================================================================

/**
 * Case Data Transfer Object
 * 
 * The main case entity representing a medical intermediary service case.
 * Consistent with backend CaseDTO.
 */
export interface CaseDTO {
  /** Case ID (auto-generated) */
  id: number;
  /** Case number (business number, e.g., CASE-2026-0001) */
  caseNo: string;
  /** Case title/name */
  title: string;
  /** Case description */
  description?: string;
  /** Case status */
  status: CaseStatus;
  /** Case priority */
  priority: CasePriority;
  /** Template ID used to create this case */
  templateId: number;
  /** Template code for reference */
  templateCode: string;
  /** Template name (snapshot at creation time) */
  templateName: string;
  /** Customer ID (client receiving the service) */
  customerId: number;
  /** Customer name (snapshot for display) */
  customerName: string;
  /** Customer phone */
  customerPhone?: string;
  /** Package ID (selected medical package) */
  packageId?: number;
  /** Package code */
  packageCode?: string;
  /** Package name */
  packageName?: string;
  /** Assigned operator user ID */
  assignedTo?: string;
  /** Assigned operator name */
  assignedToName?: string;
  /** Supervisor user ID */
  supervisorId?: string;
  /** Supervisor name */
  supervisorName?: string;
  /** Estimated start date (ISO 8601 format: YYYY-MM-DD) */
  estimatedStartDate?: string;
  /** Estimated end date (ISO 8601 format: YYYY-MM-DD) */
  estimatedEndDate?: string;
  /** Actual start date */
  actualStartDate?: string;
  /** Actual end date */
  actualEndDate?: string;
  /** Total budget amount */
  budgetAmount?: number;
  /** Budget currency (ISO 4217 code, e.g., CNY, JPY) */
  budgetCurrency?: string;
  /** Current workflow node ID */
  currentNodeId?: number;
  /** Current workflow node code */
  currentNodeCode?: string;
  /** Workflow progress percentage (0-100) */
  progressPercent: number;
  /** Total number of nodes */
  totalNodes: number;
  /** Number of completed nodes */
  completedNodes: number;
  /** Tags for categorization */
  tags?: string[];
  /** Remarks/notes */
  remarks?: string;
  /** Created time (ISO 8601 format) */
  createdAt: string;
  /** Updated time (ISO 8601 format) */
  updatedAt?: string;
  /** Created by user ID */
  createdBy?: string;
  /** Updated by user ID */
  updatedBy?: string;
}

/**
 * Case Summary
 * 
 * Lightweight representation for list display and quick reference.
 */
export interface CaseSummary {
  /** Case ID */
  id: number;
  /** Case number */
  caseNo: string;
  /** Case title */
  title: string;
  /** Case status */
  status: CaseStatus;
  /** Case priority */
  priority: CasePriority;
  /** Customer name */
  customerName: string;
  /** Template name */
  templateName: string;
  /** Package name */
  packageName?: string;
  /** Assigned operator name */
  assignedToName?: string;
  /** Progress percentage */
  progressPercent: number;
  /** Estimated start date */
  estimatedStartDate?: string;
  /** Created time */
  createdAt: string;
}

// ============================================================================
// Case Node Types
// ============================================================================

/**
 * Case Node Data Transfer Object
 * 
 * Represents a workflow node within a case.
 */
export interface CaseNodeDTO {
  /** Node ID */
  id: number;
  /** Parent case ID */
  caseId: number;
  /** Node code (from template) */
  nodeCode: string;
  /** Node name */
  nodeName: string;
  /** Node type */
  nodeType: CaseNodeType;
  /** Node status */
  status: CaseNodeStatus;
  /** Sequence order (1-based) */
  sequence: number;
  /** Whether this node is optional */
  isOptional: boolean;
  /** Whether this node requires approval */
  requiresApproval: boolean;
  /** Approver user ID (if requires approval) */
  approverId?: string;
  /** Approver name */
  approverName?: string;
  /** Approval status */
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  /** Approval time */
  approvalTime?: string;
  /** Assigned handler user ID */
  assignedTo?: string;
  /** Assigned handler name */
  assignedToName?: string;
  /** Planned start time */
  plannedStartTime?: string;
  /** Planned end time */
  plannedEndTime?: string;
  /** Actual start time */
  actualStartTime?: string;
  /** Actual end time */
  actualEndTime?: string;
  /** Estimated duration in minutes */
  estimatedDurationMinutes?: number;
  /** Actual duration in minutes */
  actualDurationMinutes?: number;
  /** Remarks/notes */
  remarks?: string;
  /** Error message (if status is FAILED) */
  errorMessage?: string;
  /** Associated document IDs */
  documentIds?: number[];
  /** Created time */
  createdAt: string;
  /** Updated time */
  updatedAt?: string;
}

// ============================================================================
// Schedule Types
// ============================================================================

/**
 * Schedule Day Data Transfer Object
 * 
 * Represents a day in the case schedule.
 */
export interface ScheduleDayDTO {
  /** Day ID */
  id: number;
  /** Parent case ID */
  caseId: number;
  /** Day number (1-based) */
  dayNumber: number;
  /** Date (ISO 8601 format: YYYY-MM-DD) */
  date: string;
  /** Day title/label */
  title: string;
  /** Day description */
  description?: string;
  /** Is this a rest day */
  isRestDay: boolean;
  /** Items scheduled for this day */
  items: ScheduleItemDTO[];
  /** Created time */
  createdAt: string;
  /** Updated time */
  updatedAt?: string;
}

/**
 * Schedule Item Data Transfer Object
 * 
 * Represents an individual scheduled item within a day.
 */
export interface ScheduleItemDTO {
  /** Item ID */
  id: number;
  /** Parent day ID */
  dayId: number;
  /** Item type */
  itemType: ScheduleItemType;
  /** Item title */
  title: string;
  /** Item description */
  description?: string;
  /** Item status */
  status: ScheduleItemStatus;
  /** Start time (ISO 8601 format) */
  startTime: string;
  /** End time (ISO 8601 format) */
  endTime: string;
  /** Duration in minutes */
  durationMinutes: number;
  /** Location/venue */
  location?: string;
  /** Location address */
  address?: string;
  /** Associated partner ID (e.g., hospital, translator) */
  partnerId?: number;
  /** Associated partner name */
  partnerName?: string;
  /** Contact person */
  contactPerson?: string;
  /** Contact phone */
  contactPhone?: string;
  /** Associated node ID (links to workflow) */
  nodeId?: number;
  /** Sequence within the day */
  sequence: number;
  /** Remarks */
  remarks?: string;
  /** Created time */
  createdAt: string;
  /** Updated time */
  updatedAt?: string;
}

// ============================================================================
// Timeline Types
// ============================================================================

/**
 * Timeline Event Data Transfer Object
 * 
 * Represents an event in the case timeline (audit trail).
 */
export interface TimelineEventDTO {
  /** Event ID */
  id: number;
  /** Parent case ID */
  caseId: number;
  /** Event type */
  eventType: TimelineEventType;
  /** Event title */
  title: string;
  /** Event description/details */
  description?: string;
  /** Event timestamp (ISO 8601 format) */
  timestamp: string;
  /** User who triggered the event */
  userId?: string;
  /** User display name */
  userName?: string;
  /** Associated node ID (if applicable) */
  nodeId?: number;
  /** Associated node code */
  nodeCode?: string;
  /** Old value (for change tracking) */
  oldValue?: string;
  /** New value (for change tracking) */
  newValue?: string;
  /** Additional metadata as key-value pairs */
  metadata?: Record<string, string>;
}

// ============================================================================
// Case Parameter Types
// ============================================================================

/**
 * Parameter Value Type
 * 
 * The data type of a case parameter.
 */
export type ParameterValueType =
  | 'STRING'   // Text string
  | 'NUMBER'   // Numeric value
  | 'BOOLEAN'  // True/false
  | 'DATE'     // Date value
  | 'DATETIME' // Date and time
  | 'JSON'     // JSON object
  | 'FILE';    // File reference

/**
 * Case Parameter Data Transfer Object
 * 
 * Represents a parameter value for a case.
 */
export interface CaseParameterDTO {
  /** Parameter ID */
  id: number;
  /** Parent case ID */
  caseId: number;
  /** Parameter key/code */
  parameterKey: string;
  /** Parameter display name */
  parameterName: string;
  /** Parameter value (as string) */
  value: string;
  /** Value data type */
  valueType: ParameterValueType;
  /** Associated node code (if node-specific) */
  nodeCode?: string;
  /** Is this parameter required */
  isRequired: boolean;
  /** Is this parameter editable */
  isEditable: boolean;
  /** Validation rules (JSON string) */
  validationRules?: string;
  /** Last modified time */
  modifiedAt?: string;
  /** Last modified by */
  modifiedBy?: string;
}

/**
 * Parameter Definition
 * 
 * Template-level parameter definition for creating new parameters.
 */
export interface ParameterDefinition {
  /** Parameter key */
  key: string;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** Value type */
  valueType: ParameterValueType;
  /** Default value */
  defaultValue?: string;
  /** Is required */
  isRequired: boolean;
  /** Is editable after creation */
  isEditable: boolean;
  /** Associated node code (if node-specific) */
  nodeCode?: string;
  /** Validation rules */
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  /** Display order */
  displayOrder: number;
  /** Group name for UI grouping */
  group?: string;
}

// ============================================================================
// Case Template Types
// ============================================================================

/**
 * Case Template Data Transfer Object
 * 
 * Represents a case template for creating new cases.
 */
export interface CaseTemplateDTO {
  /** Template ID */
  id: number;
  /** Template code (unique identifier) */
  code: string;
  /** Template name */
  name: string;
  /** Template description */
  description?: string;
  /** Template category */
  category?: string;
  /** Is this template active */
  isActive: boolean;
  /** Default priority for cases created from this template */
  defaultPriority: CasePriority;
  /** Estimated total duration in days */
  estimatedDurationDays?: number;
  /** Template nodes */
  nodes: CaseTemplateNodeDTO[];
  /** Parameter definitions */
  parameters: ParameterDefinition[];
  /** Number of cases created from this template */
  usageCount: number;
  /** Created time */
  createdAt: string;
  /** Updated time */
  updatedAt?: string;
  /** Created by */
  createdBy?: string;
}

/**
 * Case Template Summary
 * 
 * Lightweight representation for template selection.
 */
export interface CaseTemplateSummary {
  /** Template ID */
  id: number;
  /** Template code */
  code: string;
  /** Template name */
  name: string;
  /** Template description */
  description?: string;
  /** Template category */
  category?: string;
  /** Is active */
  isActive: boolean;
  /** Number of nodes */
  nodeCount: number;
  /** Usage count */
  usageCount: number;
}

/**
 * Case Template Node Data Transfer Object
 * 
 * Represents a node definition within a template.
 */
export interface CaseTemplateNodeDTO {
  /** Node ID */
  id: number;
  /** Parent template ID */
  templateId: number;
  /** Node code (unique within template) */
  nodeCode: string;
  /** Node name */
  nodeName: string;
  /** Node type */
  nodeType: CaseNodeType;
  /** Sequence order */
  sequence: number;
  /** Is this node optional */
  isOptional: boolean;
  /** Does this node require approval */
  requiresApproval: boolean;
  /** Default approver role */
  defaultApproverRole?: string;
  /** Estimated duration in minutes */
  estimatedDurationMinutes?: number;
  /** Node description */
  description?: string;
  /** Instructions for the operator */
  instructions?: string;
  /** Required document types */
  requiredDocumentTypes?: string[];
}

// ============================================================================
// Operation Parameter Types
// ============================================================================

/**
 * Create Case Request
 */
export interface CreateCaseRequest {
  /** Template ID to use */
  templateId: number;
  /** Case title */
  title: string;
  /** Case description */
  description?: string;
  /** Priority */
  priority?: CasePriority;
  /** Customer ID */
  customerId: number;
  /** Package ID (optional) */
  packageId?: number;
  /** Assigned operator ID */
  assignedTo?: string;
  /** Supervisor ID */
  supervisorId?: string;
  /** Estimated start date */
  estimatedStartDate?: string;
  /** Estimated end date */
  estimatedEndDate?: string;
  /** Budget amount */
  budgetAmount?: number;
  /** Budget currency */
  budgetCurrency?: string;
  /** Initial parameter values */
  parameters?: Record<string, string>;
  /** Tags */
  tags?: string[];
  /** Remarks */
  remarks?: string;
}

/**
 * Update Case Request
 */
export interface UpdateCaseRequest {
  /** Case title */
  title?: string;
  /** Case description */
  description?: string;
  /** Priority */
  priority?: CasePriority;
  /** Package ID */
  packageId?: number;
  /** Assigned operator ID */
  assignedTo?: string;
  /** Supervisor ID */
  supervisorId?: string;
  /** Estimated start date */
  estimatedStartDate?: string;
  /** Estimated end date */
  estimatedEndDate?: string;
  /** Budget amount */
  budgetAmount?: number;
  /** Budget currency */
  budgetCurrency?: string;
  /** Tags */
  tags?: string[];
  /** Remarks */
  remarks?: string;
}

/**
 * Update Case Status Request
 */
export interface UpdateCaseStatusRequest {
  /** New status */
  status: CaseStatus;
  /** Reason for status change */
  reason?: string;
}

/**
 * Update Node Status Request
 */
export interface UpdateNodeStatusRequest {
  /** New status */
  status: CaseNodeStatus;
  /** Remarks */
  remarks?: string;
  /** Error message (if status is FAILED) */
  errorMessage?: string;
}

/**
 * Set Parameter Request
 */
export interface SetParameterRequest {
  /** Parameter key */
  key: string;
  /** Parameter value */
  value: string;
}

/**
 * Create Schedule Day Request
 */
export interface CreateScheduleDayRequest {
  /** Day number */
  dayNumber: number;
  /** Date */
  date: string;
  /** Day title */
  title: string;
  /** Description */
  description?: string;
  /** Is rest day */
  isRestDay?: boolean;
}

/**
 * Create Schedule Item Request
 */
export interface CreateScheduleItemRequest {
  /** Parent day ID */
  dayId: number;
  /** Item type */
  itemType: ScheduleItemType;
  /** Title */
  title: string;
  /** Description */
  description?: string;
  /** Start time */
  startTime: string;
  /** End time */
  endTime: string;
  /** Location */
  location?: string;
  /** Address */
  address?: string;
  /** Partner ID */
  partnerId?: number;
  /** Contact person */
  contactPerson?: string;
  /** Contact phone */
  contactPhone?: string;
  /** Associated node ID */
  nodeId?: number;
  /** Sequence */
  sequence?: number;
  /** Remarks */
  remarks?: string;
}

/**
 * Create Template Request
 */
export interface CreateTemplateRequest {
  /** Template code */
  code: string;
  /** Template name */
  name: string;
  /** Description */
  description?: string;
  /** Category */
  category?: string;
  /** Default priority */
  defaultPriority?: CasePriority;
  /** Estimated duration in days */
  estimatedDurationDays?: number;
  /** Node definitions */
  nodes: Omit<CaseTemplateNodeDTO, 'id' | 'templateId'>[];
  /** Parameter definitions */
  parameters?: ParameterDefinition[];
}

/**
 * Update Template Request
 */
export interface UpdateTemplateRequest {
  /** Template name */
  name?: string;
  /** Description */
  description?: string;
  /** Category */
  category?: string;
  /** Is active */
  isActive?: boolean;
  /** Default priority */
  defaultPriority?: CasePriority;
  /** Estimated duration in days */
  estimatedDurationDays?: number;
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Case Query Parameters
 */
export interface CaseQueryParams {
  /** Page number (0-based) */
  page?: number;
  /** Page size */
  size?: number;
  /** Sort field */
  sort?: string;
  /** Sort direction */
  direction?: 'ASC' | 'DESC';
  /** Filter by status */
  status?: CaseStatus;
  /** Filter by priority */
  priority?: CasePriority;
  /** Filter by template ID */
  templateId?: number;
  /** Filter by customer ID */
  customerId?: number;
  /** Filter by assigned user */
  assignedTo?: string;
  /** Filter by date range - start */
  dateFrom?: string;
  /** Filter by date range - end */
  dateTo?: string;
  /** Search keyword */
  keyword?: string;
  /** Filter by tags */
  tags?: string[];
}

/**
 * Template Query Parameters
 */
export interface TemplateQueryParams {
  /** Page number (0-based) */
  page?: number;
  /** Page size */
  size?: number;
  /** Filter by category */
  category?: string;
  /** Filter by active status */
  isActive?: boolean;
  /** Search keyword */
  keyword?: string;
}

// ============================================================================
// Common Response Types
// ============================================================================

/**
 * Paged Response
 * 
 * Standard pagination response wrapper.
 */
export interface PagedResponse<T> {
  /** Page content */
  content: T[];
  /** Total number of elements */
  totalElements: number;
  /** Total number of pages */
  totalPages: number;
  /** Current page number (0-based) */
  number: number;
  /** Page size */
  size: number;
  /** Is this the first page */
  first: boolean;
  /** Is this the last page */
  last: boolean;
  /** Number of elements in current page */
  numberOfElements: number;
  /** Is the content empty */
  empty: boolean;
}
