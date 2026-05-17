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
 * @file Booking module event definitions
 * @description Define events published and subscribed by the booking module
 * @module @brix-sdk/enterprise-booking-shared/events
 * @version 3.0.0
 * 
 * Design Notes:
 * Following the v3.0 Manifest-Driven architecture, event definitions are
 * consistent with the events declaration in ui-manifest.yaml.
 * 
 * Event Naming Convention:
 * - Format: <plugin>:<action>
 * - Example: booking:created, booking:cancelled
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
 * Booking module event type constants
 * 
 * Consistent with events.published in ui-manifest.yaml
 */
export const BOOKING_EVENTS = {
  /** Booking created successfully */
  CREATED: 'booking:created',
  /** Booking confirmed */
  CONFIRMED: 'booking:confirmed',
  /** Booking cancelled */
  CANCELLED: 'booking:cancelled',
  /** Booking completed */
  COMPLETED: 'booking:completed',
  /** Booking no-show */
  NO_SHOW: 'booking:no_show',
  /** Booking selected (UI interaction event) */
  SELECTED: 'booking:selected',
} as const;

/**
 * Booking event type union
 */
export type BookingEventType = typeof BOOKING_EVENTS[keyof typeof BOOKING_EVENTS];

// ============================================================================
// Event Payload Types
// ============================================================================

/**
 * Booking Created Event Payload
 * 
 * Event type: booking:created
 * Trigger timing: After booking is successfully created
 * Scope: global (subscribable by all plugins)
 */
export interface BookingCreatedPayload {
  /** Booking ID */
  id: number;
  /** Booking number */
  bookingNo: string;
  /** Customer ID */
  customerId: string;
  /** Resource ID */
  resourceId: number;
  /** Resource name */
  resourceName: string;
  /** Booking date */
  date: string;
  /** Start time */
  startTime: string;
  /** End time */
  endTime: string;
}

/**
 * Booking Confirmed Event Payload
 * 
 * Event type: booking:confirmed
 * Trigger timing: After booking is confirmed
 * Scope: global
 */
export interface BookingConfirmedPayload {
  /** Booking ID */
  id: number;
  /** Booking number */
  bookingNo: string;
  /** Confirmed at (ISO 8601 format) */
  confirmedAt: string;
  /** Confirmed by ID */
  confirmedBy: string;
}

/**
 * Booking Cancelled Event Payload
 * 
 * Event type: booking:cancelled
 * Trigger timing: After booking is cancelled
 * Scope: global
 */
export interface BookingCancelledPayload {
  /** Booking ID */
  id: number;
  /** Booking number */
  bookingNo: string;
  /** Cancel reason */
  reason: string;
  /** Cancelled at (ISO 8601 format) */
  cancelledAt: string;
  /** Cancelled by ID */
  cancelledBy: string;
}

/**
 * Booking Completed Event Payload
 * 
 * Event type: booking:completed
 * Trigger timing: After booking service is completed
 * Scope: global
 */
export interface BookingCompletedPayload {
  /** Booking ID */
  id: number;
  /** Booking number */
  bookingNo: string;
  /** Completed at (ISO 8601 format) */
  completedAt: string;
}

/**
 * Booking No-Show Event Payload
 * 
 * Event type: booking:no_show
 * Trigger timing: When customer does not arrive on time
 * Scope: global
 */
export interface BookingNoShowPayload {
  /** Booking ID */
  id: number;
  /** Booking number */
  bookingNo: string;
  /** Marked at (ISO 8601 format) */
  markedAt: string;
}

/**
 * Booking Selected Event Payload
 * 
 * Event type: booking:selected
 * Trigger timing: When user selects a booking in UI (e.g. list click, calendar click)
 * Scope: global (for cross-module communication)
 * 
 * Use Cases:
 * - Calendar view booking click
 * - List view booking selection
 * - Other modules need to know the currently selected booking
 */
export interface BookingSelectedPayload {
  /** Booking ID */
  bookingId: number;
  /** Resource ID */
  resourceId: number;
  /** Resource name */
  resourceName: string;
}

// ============================================================================
// Subscribed External Event Types
// ============================================================================

/**
 * User Selected Event Payload (from identity plugin)
 * 
 * Event type: user:selected
 * Source plugin: identity
 * Purpose: When a user is selected in other modules, booking module can filter bookings for that user
 */
export interface UserSelectedPayload {
  /** User ID */
  userId: string;
  /** User name */
  userName: string;
}

// ============================================================================
// Event Mapping Types (for type-safe event handling)
// ============================================================================

/**
 * Booking Event Payload Map
 * 
 * Provides type-safe event subscription
 */
export interface BookingEventPayloadMap {
  [BOOKING_EVENTS.CREATED]: BookingCreatedPayload;
  [BOOKING_EVENTS.CONFIRMED]: BookingConfirmedPayload;
  [BOOKING_EVENTS.CANCELLED]: BookingCancelledPayload;
  [BOOKING_EVENTS.COMPLETED]: BookingCompletedPayload;
  [BOOKING_EVENTS.NO_SHOW]: BookingNoShowPayload;
  [BOOKING_EVENTS.SELECTED]: BookingSelectedPayload;
}
