/**
 * @file Case Module Event Definitions
 * @description Defines event types published and subscribed by the case module
 * @module @shinwa/case-shared/events
 * @version 3.0.0
 * 
 * Design Notes:
 * Follows v3.0 Manifest-Driven architecture, event definitions are consistent
 * with events declaration in ui-manifest.yaml.
 * 
 * Event Naming Convention:
 * - Format: <module>:<entity>:<action>
 * - Examples: case:case:created, case:node:completed
 * 
 * Architecture Red Lines:
 * ❌ Event payload must not contain functions
 * ❌ Event payload must not contain circular references
 * ✅ Event payload must be JSON serializable
 * 
 * @author Shinwa Team
 * @date 2026-02-23
 */

import type { 
  CaseStatus, 
  CasePriority, 
  CaseNodeStatus, 
  CaseNodeType 
} from '../types';

// ============================================================================
// Event Type Constants
// ============================================================================

/**
 * Case Module Event Type Constants
 * 
 * Consistent with events.published in ui-manifest.yaml
 */
export const CASE_EVENTS = {
  // ========== Case Lifecycle Events ==========
  /** Case created */
  CASE_CREATED: 'case:case:created',
  /** Case updated */
  CASE_UPDATED: 'case:case:updated',
  /** Case status changed */
  CASE_STATUS_CHANGED: 'case:case:statusChanged',
  /** Case assigned */
  CASE_ASSIGNED: 'case:case:assigned',
  /** Case completed */
  CASE_COMPLETED: 'case:case:completed',
  /** Case cancelled */
  CASE_CANCELLED: 'case:case:cancelled',
  /** Case deleted */
  CASE_DELETED: 'case:case:deleted',
  
  // ========== Node Events ==========
  /** Node started */
  NODE_STARTED: 'case:node:started',
  /** Node completed */
  NODE_COMPLETED: 'case:node:completed',
  /** Node failed */
  NODE_FAILED: 'case:node:failed',
  /** Node skipped */
  NODE_SKIPPED: 'case:node:skipped',
  
  // ========== Schedule Events ==========
  /** Schedule day created */
  SCHEDULE_DAY_CREATED: 'case:schedule:dayCreated',
  /** Schedule day updated */
  SCHEDULE_DAY_UPDATED: 'case:schedule:dayUpdated',
  /** Schedule item created */
  SCHEDULE_ITEM_CREATED: 'case:schedule:itemCreated',
  /** Schedule item updated */
  SCHEDULE_ITEM_UPDATED: 'case:schedule:itemUpdated',
  
  // ========== Parameter Events ==========
  /** Parameter set */
  PARAMETER_SET: 'case:parameter:set',
  
  // ========== Template Events ==========
  /** Template created */
  TEMPLATE_CREATED: 'case:template:created',
  /** Template updated */
  TEMPLATE_UPDATED: 'case:template:updated',
  /** Template activated */
  TEMPLATE_ACTIVATED: 'case:template:activated',
  /** Template deactivated */
  TEMPLATE_DEACTIVATED: 'case:template:deactivated',
  
  // ========== UI Interaction Events ==========
  /** Case selected (UI event) */
  CASE_SELECTED: 'case:ui:caseSelected',
  /** Node selected (UI event) */
  NODE_SELECTED: 'case:ui:nodeSelected',
} as const;

/**
 * Case event type union
 */
export type CaseEventType = typeof CASE_EVENTS[keyof typeof CASE_EVENTS];

// ============================================================================
// Event Payload Types
// ============================================================================

/**
 * Case Created Event Payload
 */
export interface CaseCreatedPayload {
  /** Case ID */
  id: number;
  /** Case number */
  caseNo: string;
  /** Case title */
  title: string;
  /** Template ID */
  templateId: number;
  /** Template code */
  templateCode: string;
  /** Customer ID */
  customerId: number;
  /** Customer name */
  customerName: string;
  /** Priority */
  priority: CasePriority;
  /** Created time */
  createdAt: string;
  /** Created by */
  createdBy?: string;
}

/**
 * Case Updated Event Payload
 */
export interface CaseUpdatedPayload {
  /** Case ID */
  id: number;
  /** Case number */
  caseNo: string;
  /** Updated fields */
  updatedFields: string[];
  /** Updated time */
  updatedAt: string;
  /** Updated by */
  updatedBy?: string;
}

/**
 * Case Status Changed Event Payload
 */
export interface CaseStatusChangedPayload {
  /** Case ID */
  id: number;
  /** Case number */
  caseNo: string;
  /** Old status */
  oldStatus: CaseStatus;
  /** New status */
  newStatus: CaseStatus;
  /** Reason for change */
  reason?: string;
  /** Changed time */
  changedAt: string;
  /** Changed by */
  changedBy?: string;
}

/**
 * Case Assigned Event Payload
 */
export interface CaseAssignedPayload {
  /** Case ID */
  id: number;
  /** Case number */
  caseNo: string;
  /** Previous assignee ID */
  previousAssignee?: string;
  /** Previous assignee name */
  previousAssigneeName?: string;
  /** New assignee ID */
  newAssignee: string;
  /** New assignee name */
  newAssigneeName: string;
  /** Assigned time */
  assignedAt: string;
  /** Assigned by */
  assignedBy?: string;
}

/**
 * Case Completed Event Payload
 */
export interface CaseCompletedPayload {
  /** Case ID */
  id: number;
  /** Case number */
  caseNo: string;
  /** Customer ID */
  customerId: number;
  /** Customer name */
  customerName: string;
  /** Actual start date */
  actualStartDate?: string;
  /** Actual end date (completion date) */
  actualEndDate: string;
  /** Total duration in days */
  totalDurationDays?: number;
  /** Completed by */
  completedBy?: string;
}

/**
 * Case Cancelled Event Payload
 */
export interface CaseCancelledPayload {
  /** Case ID */
  id: number;
  /** Case number */
  caseNo: string;
  /** Cancellation reason */
  reason: string;
  /** Cancelled time */
  cancelledAt: string;
  /** Cancelled by */
  cancelledBy?: string;
}

/**
 * Node Started Event Payload
 */
export interface NodeStartedPayload {
  /** Case ID */
  caseId: number;
  /** Case number */
  caseNo: string;
  /** Node ID */
  nodeId: number;
  /** Node code */
  nodeCode: string;
  /** Node name */
  nodeName: string;
  /** Node type */
  nodeType: CaseNodeType;
  /** Started time */
  startedAt: string;
  /** Started by */
  startedBy?: string;
}

/**
 * Node Completed Event Payload
 */
export interface NodeCompletedPayload {
  /** Case ID */
  caseId: number;
  /** Case number */
  caseNo: string;
  /** Node ID */
  nodeId: number;
  /** Node code */
  nodeCode: string;
  /** Node name */
  nodeName: string;
  /** Node type */
  nodeType: CaseNodeType;
  /** Actual duration in minutes */
  actualDurationMinutes?: number;
  /** Completed time */
  completedAt: string;
  /** Completed by */
  completedBy?: string;
  /** Is this the last node in the case? */
  isLastNode: boolean;
}

/**
 * Node Failed Event Payload
 */
export interface NodeFailedPayload {
  /** Case ID */
  caseId: number;
  /** Case number */
  caseNo: string;
  /** Node ID */
  nodeId: number;
  /** Node code */
  nodeCode: string;
  /** Node name */
  nodeName: string;
  /** Error message */
  errorMessage: string;
  /** Failed time */
  failedAt: string;
}

/**
 * Node Skipped Event Payload
 */
export interface NodeSkippedPayload {
  /** Case ID */
  caseId: number;
  /** Case number */
  caseNo: string;
  /** Node ID */
  nodeId: number;
  /** Node code */
  nodeCode: string;
  /** Node name */
  nodeName: string;
  /** Skip reason */
  reason?: string;
  /** Skipped time */
  skippedAt: string;
  /** Skipped by */
  skippedBy?: string;
}

/**
 * Parameter Set Event Payload
 */
export interface ParameterSetPayload {
  /** Case ID */
  caseId: number;
  /** Case number */
  caseNo: string;
  /** Parameter key */
  parameterKey: string;
  /** Parameter name */
  parameterName: string;
  /** Old value */
  oldValue?: string;
  /** New value */
  newValue: string;
  /** Set time */
  setAt: string;
  /** Set by */
  setBy?: string;
}

/**
 * Template Created Event Payload
 */
export interface TemplateCreatedPayload {
  /** Template ID */
  id: number;
  /** Template code */
  code: string;
  /** Template name */
  name: string;
  /** Category */
  category?: string;
  /** Number of nodes */
  nodeCount: number;
  /** Created time */
  createdAt: string;
  /** Created by */
  createdBy?: string;
}

/**
 * Case Selected UI Event Payload
 * 
 * This is a UI interaction event, used for inter-component communication.
 */
export interface CaseSelectedPayload {
  /** Case ID */
  id: number;
  /** Case number */
  caseNo: string;
  /** Case title */
  title: string;
  /** Case status */
  status: CaseStatus;
}

/**
 * Node Selected UI Event Payload
 */
export interface NodeSelectedPayload {
  /** Case ID */
  caseId: number;
  /** Node ID */
  nodeId: number;
  /** Node code */
  nodeCode: string;
  /** Node name */
  nodeName: string;
  /** Node status */
  status: CaseNodeStatus;
}
