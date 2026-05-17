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
 * @file Contract Module Event Definitions
 * @description Integration events for cross-plugin communication
 * @module @brix-sdk/enterprise-contracts-shared/events
 * @version 3.0.0
 * 
 * Design Notes:
 * Following v3.0.4 blueprint event model:
 * - Domain events for internal plugin communication
 * - Integration events for cross-plugin/cross-system communication
 * - Event payloads are serializable (no circular references)
 * 
 * @author Brix Team
 * @date 2026-02-23
 */

import type { ContractStatus, SignatureStatus } from '../types';

// ============================================================================
// Event Type Constants
// ============================================================================

/**
 * Contract Module Event Types
 */
export const CONTRACT_EVENTS = {
  // Template Events
  TEMPLATE_CREATED: 'contracts:template:created',
  TEMPLATE_UPDATED: 'contracts:template:updated',
  TEMPLATE_ACTIVATED: 'contracts:template:activated',
  TEMPLATE_ARCHIVED: 'contracts:template:archived',
  
  // Contract Instance Events
  CONTRACT_CREATED: 'contracts:contract:created',
  CONTRACT_UPDATED: 'contracts:contract:updated',
  CONTRACT_STATUS_CHANGED: 'contracts:contract:status-changed',
  CONTRACT_APPROVED: 'contracts:contract:approved',
  CONTRACT_REJECTED: 'contracts:contract:rejected',
  CONTRACT_SIGNED: 'contracts:contract:signed',
  CONTRACT_FULLY_SIGNED: 'contracts:contract:fully-signed',
  CONTRACT_EXPIRED: 'contracts:contract:expired',
  CONTRACT_TERMINATED: 'contracts:contract:terminated',
} as const;

// ============================================================================
// Template Event Payloads
// ============================================================================

/**
 * Contract Template Created Event Payload
 */
export interface ContractTemplateCreatedPayload {
  /** Template ID */
  templateId: number;
  /** Template code */
  templateCode: string;
  /** Template name */
  templateName: string;
  /** Template version */
  version: string;
  /** Creator user ID */
  createdBy: string;
  /** Timestamp (ISO 8601) */
  timestamp: string;
}

/**
 * Contract Template Updated Event Payload
 */
export interface ContractTemplateUpdatedPayload {
  /** Template ID */
  templateId: number;
  /** Template code */
  templateCode: string;
  /** Changed fields */
  changedFields: string[];
  /** Modifier user ID */
  updatedBy: string;
  /** Timestamp */
  timestamp: string;
}

/**
 * Contract Template Activated/Archived Event Payload
 */
export interface ContractTemplateStatusChangedPayload {
  /** Template ID */
  templateId: number;
  /** Template code */
  templateCode: string;
  /** Previous status */
  previousStatus: string;
  /** New status */
  newStatus: string;
  /** Actor user ID */
  changedBy: string;
  /** Timestamp */
  timestamp: string;
}

// ============================================================================
// Contract Instance Event Payloads
// ============================================================================

/**
 * Contract Created Event Payload
 */
export interface ContractCreatedPayload {
  /** Contract ID */
  contractId: number;
  /** Contract number */
  contractNo: string;
  /** Contract title */
  title: string;
  /** Template ID used */
  templateId: number;
  /** Template code */
  templateCode: string;
  /** Related case ID (if any) */
  relatedCaseId?: number;
  /** Contract amount */
  amount?: number;
  /** Currency */
  currency?: string;
  /** Creator user ID */
  createdBy: string;
  /** Timestamp */
  timestamp: string;
}

/**
 * Contract Status Changed Event Payload
 */
export interface ContractStatusChangedPayload {
  /** Contract ID */
  contractId: number;
  /** Contract number */
  contractNo: string;
  /** Previous status */
  previousStatus: ContractStatus;
  /** New status */
  newStatus: ContractStatus;
  /** Transition notes */
  notes?: string;
  /** Actor user ID */
  changedBy: string;
  /** Timestamp */
  timestamp: string;
}

/**
 * Contract Approved Event Payload
 */
export interface ContractApprovedPayload {
  /** Contract ID */
  contractId: number;
  /** Contract number */
  contractNo: string;
  /** Approval notes */
  approvalNotes?: string;
  /** Approver user ID */
  approvedBy: string;
  /** Approver name */
  approvedByName: string;
  /** Timestamp */
  timestamp: string;
}

/**
 * Contract Signed Event Payload
 * 
 * Emitted when a single party signs the contract.
 */
export interface ContractSignedPayload {
  /** Contract ID */
  contractId: number;
  /** Contract number */
  contractNo: string;
  /** Signing party ID */
  partyId: number;
  /** Party type */
  partyType: string;
  /** Party name */
  partyName: string;
  /** Signature status */
  signatureStatus: SignatureStatus;
  /** Total parties count */
  totalParties: number;
  /** Signed parties count */
  signedCount: number;
  /** Timestamp */
  timestamp: string;
}

/**
 * Contract Fully Signed Event Payload
 * 
 * Emitted when all parties have signed the contract.
 */
export interface ContractFullySignedPayload {
  /** Contract ID */
  contractId: number;
  /** Contract number */
  contractNo: string;
  /** Contract title */
  title: string;
  /** All party IDs */
  partyIds: number[];
  /** Contract start date */
  startDate?: string;
  /** Contract end date */
  endDate?: string;
  /** Timestamp */
  timestamp: string;
}

/**
 * Contract Expired Event Payload
 */
export interface ContractExpiredPayload {
  /** Contract ID */
  contractId: number;
  /** Contract number */
  contractNo: string;
  /** End date */
  endDate: string;
  /** Timestamp when expiration was detected */
  timestamp: string;
}

/**
 * Contract Terminated Event Payload
 */
export interface ContractTerminatedPayload {
  /** Contract ID */
  contractId: number;
  /** Contract number */
  contractNo: string;
  /** Termination reason */
  reason?: string;
  /** Terminator user ID */
  terminatedBy: string;
  /** Timestamp */
  timestamp: string;
}
