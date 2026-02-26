/**
 * @file Partners Module Event Definitions
 * @description Defines event types published and subscribed by the partners module
 * @module @shinwa/partners-shared/events
 * @version 3.0.0
 * 
 * Design Notes:
 * Follows v3.0 Manifest-Driven architecture, event definitions are consistent
 * with events declaration in ui-manifest.yaml.
 * 
 * Event Naming Convention:
 * - Format: <plugin>:<action>
 * - Examples: partner:created, partner:activated
 * 
 * Architecture Red Lines:
 * ❌ Event payload must not contain functions
 * ❌ Event payload must not contain circular references
 * ✅ Event payload must be JSON serializable
 */

import type { PartnerType, PartnerStatus } from '../types/partner';

// ============================================================================
// Event Type Constants
// ============================================================================

/**
 * Partners Module Event Type Constants
 * 
 * Consistent with events.published in ui-manifest.yaml
 */
export const PARTNER_EVENTS = {
  /** Partner created successfully */
  CREATED: 'partner:created',
  /** Partner information updated */
  UPDATED: 'partner:updated',
  /** Partner activated */
  ACTIVATED: 'partner:activated',
  /** Partner suspended */
  SUSPENDED: 'partner:suspended',
  /** Partner terminated */
  TERMINATED: 'partner:terminated',
  /** Partner selected (UI interaction event) */
  SELECTED: 'partner:selected',
} as const;

/**
 * Partner event type union
 */
export type PartnerEventType = typeof PARTNER_EVENTS[keyof typeof PARTNER_EVENTS];

// ============================================================================
// Event Payload Types
// ============================================================================

/**
 * Partner Created Event Payload
 * 
 * Event type: partner:created
 * Trigger timing: After partner is successfully created
 * Scope: global (subscribable by all plugins)
 */
export interface PartnerCreatedPayload {
  /** Partner ID */
  id: number;
  /** Partner number */
  partnerNo: string;
  /** Partner name */
  name: string;
  /** Partner type */
  type: PartnerType;
  /** Contact person name */
  contactName: string;
  /** Contact phone */
  contactPhone: string;
  /** Created time (ISO 8601 format) */
  createdAt: string;
}

/**
 * Partner Updated Event Payload
 * 
 * Event type: partner:updated
 * Trigger timing: After partner information is updated
 * Scope: global
 */
export interface PartnerUpdatedPayload {
  /** Partner ID */
  id: number;
  /** Partner number */
  partnerNo: string;
  /** Partner name */
  name: string;
  /** Updated time (ISO 8601 format) */
  updatedAt: string;
  /** Updated by user ID */
  updatedBy: string;
  /** List of updated field names */
  updatedFields: string[];
}

/**
 * Partner Status Changed Event Payload
 * 
 * Event types: partner:activated, partner:suspended, partner:terminated
 * Trigger timing: After partner status changes
 * Scope: global
 */
export interface PartnerStatusChangedPayload {
  /** Partner ID */
  id: number;
  /** Partner number */
  partnerNo: string;
  /** Partner name */
  name: string;
  /** Previous status */
  previousStatus: PartnerStatus;
  /** New status */
  newStatus: PartnerStatus;
  /** Change reason */
  reason: string;
  /** Changed time (ISO 8601 format) */
  changedAt: string;
  /** Changed by user ID */
  changedBy: string;
}

/**
 * Partner Selected Event Payload
 * 
 * Event type: partner:selected
 * Trigger timing: When user selects a partner in the list
 * Scope: local (current plugin only)
 */
export interface PartnerSelectedPayload {
  /** Partner ID */
  id: number;
  /** Partner number */
  partnerNo: string;
  /** Partner name */
  name: string;
  /** Partner type */
  type: PartnerType;
  /** Partnership status */
  status: PartnerStatus;
}

// ============================================================================
// Event Payload Mapping Types
// ============================================================================

/**
 * Partner Event Payload Mapping
 * 
 * Used for type-safe event handling
 * 
 * @example
 * ```typescript
 * function handlePartnerEvent<K extends keyof PartnerEventPayloadMap>(
 *   event: K,
 *   payload: PartnerEventPayloadMap[K]
 * ) {
 *   // payload type is automatically inferred based on event
 * }
 * ```
 */
export interface PartnerEventPayloadMap {
  'partner:created': PartnerCreatedPayload;
  'partner:updated': PartnerUpdatedPayload;
  'partner:activated': PartnerStatusChangedPayload;
  'partner:suspended': PartnerStatusChangedPayload;
  'partner:terminated': PartnerStatusChangedPayload;
  'partner:selected': PartnerSelectedPayload;
}
