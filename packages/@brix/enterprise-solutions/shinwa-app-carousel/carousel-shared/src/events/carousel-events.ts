/**
 * @file Carousel module event definitions
 * @description Define events published and subscribed by the carousel module
 * @module @shinwa/carousel-shared/events
 * @version 3.0.0
 * 
 * Design Notes:
 * Following the v3.0 Manifest-Driven architecture, event definitions are
 * consistent with the events declaration in ui-manifest.yaml.
 * 
 * Event Naming Convention:
 * - Format: <plugin>:<action>
 * - Example: carousel:banner_clicked, carousel:banner_viewed
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
 * Carousel module event type constants
 * 
 * Consistent with events.published in ui-manifest.yaml.
 */
export const CAROUSEL_EVENTS = {
  /** Carousel created successfully */
  CAROUSEL_CREATED: 'carousel:carousel_created',
  /** Carousel updated successfully */
  CAROUSEL_UPDATED: 'carousel:carousel_updated',
  /** Carousel deleted successfully */
  CAROUSEL_DELETED: 'carousel:carousel_deleted',
  /** Banner created successfully */
  BANNER_CREATED: 'carousel:banner_created',
  /** Banner updated successfully */
  BANNER_UPDATED: 'carousel:banner_updated',
  /** Banner deleted successfully */
  BANNER_DELETED: 'carousel:banner_deleted',
  /** Banner clicked */
  BANNER_CLICKED: 'carousel:banner_clicked',
  /** Banner viewed */
  BANNER_VIEWED: 'carousel:banner_viewed',
  /** Banner status changed */
  BANNER_STATUS_CHANGED: 'carousel:banner_status_changed',
} as const;

/**
 * Carousel event type union
 */
export type CarouselEventType = typeof CAROUSEL_EVENTS[keyof typeof CAROUSEL_EVENTS];

// ============================================================================
// Event Payload Types
// ============================================================================

/**
 * Carousel Created Event Payload
 * 
 * Event type: carousel:carousel_created
 * Trigger timing: After carousel is successfully created
 */
export interface CarouselCreatedPayload {
  /** Carousel ID */
  id: number;
  /** Carousel code */
  code: string;
  /** Carousel name */
  name: string;
}

/**
 * Carousel Updated Event Payload
 * 
 * Event type: carousel:carousel_updated
 * Trigger timing: After carousel is updated
 */
export interface CarouselUpdatedPayload {
  /** Carousel ID */
  id: number;
  /** Carousel code */
  code: string;
  /** Carousel name */
  name: string;
  /** Updated field names */
  updatedFields: string[];
}

/**
 * Carousel Deleted Event Payload
 * 
 * Event type: carousel:carousel_deleted
 * Trigger timing: After carousel is deleted
 */
export interface CarouselDeletedPayload {
  /** Carousel ID */
  id: number;
  /** Carousel code */
  code: string;
}

/**
 * Banner Created Event Payload
 * 
 * Event type: carousel:banner_created
 * Trigger timing: After banner is successfully created
 */
export interface BannerCreatedPayload {
  /** Banner ID */
  id: number;
  /** Parent carousel ID */
  carouselId: number;
  /** Banner title */
  title: string;
  /** Platform */
  platform: string;
}

/**
 * Banner Updated Event Payload
 * 
 * Event type: carousel:banner_updated
 * Trigger timing: After banner is updated
 */
export interface BannerUpdatedPayload {
  /** Banner ID */
  id: number;
  /** Parent carousel ID */
  carouselId: number;
  /** Banner title */
  title: string;
  /** Updated field names */
  updatedFields: string[];
}

/**
 * Banner Deleted Event Payload
 * 
 * Event type: carousel:banner_deleted
 * Trigger timing: After banner is deleted
 */
export interface BannerDeletedPayload {
  /** Banner ID */
  id: number;
  /** Parent carousel ID */
  carouselId: number;
}

/**
 * Banner Clicked Event Payload
 * 
 * Event type: carousel:banner_clicked
 * Trigger timing: When user clicks banner
 * Scope: global (subscribable by all plugins)
 */
export interface BannerClickedPayload {
  /** Banner ID */
  id: number;
  /** Parent carousel code */
  carouselCode: string;
  /** Banner title */
  title: string;
  /** Action type */
  actionType: string;
  /** Action value */
  actionValue?: string;
  /** Click timestamp */
  timestamp: number;
}

/**
 * Banner Viewed Event Payload
 * 
 * Event type: carousel:banner_viewed
 * Trigger timing: When banner enters visible area
 * Scope: global
 */
export interface BannerViewedPayload {
  /** Banner ID */
  id: number;
  /** Parent carousel code */
  carouselCode: string;
  /** Banner title */
  title: string;
  /** View timestamp */
  timestamp: number;
}

/**
 * Banner Status Changed Event Payload
 * 
 * Event type: carousel:banner_status_changed
 * Trigger timing: After banner status is changed
 */
export interface BannerStatusChangedPayload {
  /** Banner ID */
  id: number;
  /** Parent carousel ID */
  carouselId: number;
  /** Old status */
  oldStatus: string;
  /** New status */
  newStatus: string;
}
