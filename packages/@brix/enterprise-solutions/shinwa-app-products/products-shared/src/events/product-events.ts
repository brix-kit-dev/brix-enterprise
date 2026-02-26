/**
 * @file Products Module Event Definitions
 * @description Defines event types published and subscribed by the products module
 * @module @shinwa/products-shared/events
 * @version 3.0.0
 * 
 * Design Notes:
 * Follows v3.0 Manifest-Driven architecture, event definitions are consistent
 * with events declaration in ui-manifest.yaml.
 * 
 * Event Naming Convention:
 * - Format: <plugin>:<action>
 * - Examples: product:created, product:status_changed
 * 
 * Architecture Red Lines:
 * ❌ Event payload must not contain functions
 * ❌ Event payload must not contain circular references
 * ✅ Event payload must be JSON serializable
 */

// ============================================================================
// Event Type Constants
// ============================================================================

/**
 * Products Module Event Type Constants
 * 
 * Consistent with events.published in ui-manifest.yaml.
 */
export const PRODUCT_EVENTS = {
  /** Product created successfully */
  CREATED: 'product:created',
  /** Product updated successfully */
  UPDATED: 'product:updated',
  /** Product deleted successfully */
  DELETED: 'product:deleted',
  /** Product published */
  ACTIVATED: 'product:activated',
  /** Product unpublished */
  DEACTIVATED: 'product:deactivated',
  /** Product approved */
  APPROVED: 'product:approved',
  /** Product rejected */
  REJECTED: 'product:rejected',
  /** Product archived */
  ARCHIVED: 'product:archived',
  /** Product selected (UI interaction) */
  SELECTED: 'product:selected',
  /** Product viewed */
  VIEWED: 'product:viewed',
} as const;

/**
 * Product event type union
 */
export type ProductEventType = typeof PRODUCT_EVENTS[keyof typeof PRODUCT_EVENTS];

// ============================================================================
// Event Payload Types
// ============================================================================

/**
 * Product Created Event Payload
 * 
 * Event type: product:created
 * Trigger timing: After product is successfully created
 */
export interface ProductCreatedPayload {
  /** Product ID */
  id: number;
  /** Product name */
  name: string;
  /** Product type */
  type: string;
  /** Partner ID */
  partnerId: number;
}

/**
 * Product Updated Event Payload
 * 
 * Event type: product:updated
 * Trigger timing: After product is updated
 */
export interface ProductUpdatedPayload {
  /** Product ID */
  id: number;
  /** Product name */
  name: string;
  /** Updated field names */
  updatedFields: string[];
}

/**
 * Product Deleted Event Payload
 * 
 * Event type: product:deleted
 * Trigger timing: After product is deleted
 */
export interface ProductDeletedPayload {
  /** Product ID */
  id: number;
  /** Product name */
  name: string;
}

/**
 * Product Status Changed Event Payload
 * 
 * Applicable to: activated, deactivated, approved, rejected, archived
 */
export interface ProductStatusChangedPayload {
  /** Product ID */
  id: number;
  /** Product name */
  name: string;
  /** Old status */
  oldStatus: string;
  /** New status */
  newStatus: string;
  /** Operation reason (e.g., rejection reason) */
  reason?: string;
}

/**
 * Product Selected Event Payload
 * 
 * Event type: product:selected
 * Trigger timing: When user selects product in list
 */
export interface ProductSelectedPayload {
  /** Product ID */
  id: number;
  /** Product name */
  name: string;
  /** Product type */
  type: string;
}

/**
 * Product Viewed Event Payload
 * 
 * Event type: product:viewed
 * Trigger timing: When user views product detail
 */
export interface ProductViewedPayload {
  /** Product ID */
  id: number;
  /** Product name */
  name: string;
  /** View timestamp */
  timestamp: number;
}
