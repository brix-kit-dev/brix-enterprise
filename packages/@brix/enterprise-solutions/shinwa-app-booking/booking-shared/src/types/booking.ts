/**
 * @file Booking module shared type definitions
 * @description Core type definitions for booking business, shared by Web and Mobile
 * @module @shinwa/booking-shared/types
 * @version 3.0.0
 * 
 * Design Notes:
 * This file defines the core business types for the booking module, following these principles:
 * 1. Consistent with backend DTOs
 * 2. Contains no platform-specific types
 * 3. Uses interfaces instead of classes for easy serialization
 * 
 * Type Categories:
 * - Booking related: Booking, BookingStatus, CreateBookingParams
 * - Resource related: Resource, ResourceType
 * - Time slot related: TimeSlot, TimeSlotStatus
 */

// ============================================================================
// Booking Status Enum
// ============================================================================

/**
 * Booking Status
 * 
 * Consistent with backend BookingStatus enum
 */
export type BookingStatus = 
  | 'PENDING'     // Pending confirmation
  | 'CONFIRMED'   // Confirmed
  | 'COMPLETED'   // Completed
  | 'CANCELLED'   // Cancelled
  | 'NO_SHOW';    // No-show

/**
 * Resource Type
 * 
 * Classification of bookable resources
 */
export type ResourceType = 
  | 'DOCTOR'           // Doctor
  | 'CONSULTANT'       // Consultant
  | 'MEETING_ROOM'     // Meeting room
  | 'EQUIPMENT'        // Equipment
  | 'CUSTOM';          // Custom

/**
 * Time Slot Status
 */
export type TimeSlotStatus = 
  | 'AVAILABLE'        // Available
  | 'BOOKED'           // Booked
  | 'BLOCKED'          // Blocked
  | 'PAST';            // Past

// ============================================================================
// Booking Related Types
// ============================================================================

/**
 * Booking Data Transfer Object
 * 
 * Consistent with backend BookingDTO
 */
export interface Booking {
  /** Booking ID */
  id: number;
  /** Booking number (business number) */
  bookingNo: string;
  /** Booking status */
  status: BookingStatus;
  /** Resource ID */
  resourceId: number;
  /** Resource name */
  resourceName: string;
  /** Resource type */
  resourceType: ResourceType;
  /** Booking date (ISO 8601 format: YYYY-MM-DD) */
  reservedDate: string;
  /** Start time (HH:mm format) */
  startTime: string;
  /** End time (HH:mm format) */
  endTime: string;
  /** Contact name */
  contactName: string;
  /** Contact phone */
  contactPhone: string;
  /** Remarks */
  remarks?: string;
  /** Created at (ISO 8601 format) */
  createdAt: string;
  /** Updated at (ISO 8601 format) */
  updatedAt?: string;
  /** Confirmed at (ISO 8601 format) */
  confirmedAt?: string;
  /** Cancelled at (ISO 8601 format) */
  cancelledAt?: string;
  /** Cancel reason */
  cancelReason?: string;
}

/**
 * Create Booking Parameters
 */
export interface CreateBookingParams {
  /** Resource ID */
  resourceId: number;
  /** Booking date (ISO 8601 format: YYYY-MM-DD) */
  reservedDate: string;
  /** Start time (HH:mm format) */
  startTime: string;
  /** End time (HH:mm format) */
  endTime: string;
  /** Contact name */
  contactName: string;
  /** Contact phone */
  contactPhone: string;
  /** Remarks */
  remarks?: string;
}

/**
 * Update Booking Parameters
 */
export interface UpdateBookingParams {
  /** Booking date (ISO 8601 format: YYYY-MM-DD) */
  reservedDate?: string;
  /** Start time (HH:mm format) */
  startTime?: string;
  /** End time (HH:mm format) */
  endTime?: string;
  /** Contact name */
  contactName?: string;
  /** Contact phone */
  contactPhone?: string;
  /** Remarks */
  remarks?: string;
}

/**
 * Cancel Booking Parameters
 */
export interface CancelBookingParams {
  /** Cancel reason */
  reason: string;
}

// ============================================================================
// Resource Related Types
// ============================================================================

/**
 * Bookable Resource
 */
export interface Resource {
  /** Resource ID */
  id: number;
  /** Resource name */
  name: string;
  /** Resource type */
  type: ResourceType;
  /** Resource description */
  description?: string;
  /** Service duration (minutes) */
  serviceDuration: number;
  /** Enabled */
  enabled: boolean;
  /** Avatar/image URL */
  avatarUrl?: string;
  /** Extended attributes */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Time Slot Related Types
// ============================================================================

/**
 * Time Slot
 */
export interface TimeSlot {
  /** Start time (HH:mm format) */
  startTime: string;
  /** End time (HH:mm format) */
  endTime: string;
  /** Time slot status */
  status: TimeSlotStatus;
  /** Booked count (if multi-person booking is supported) */
  bookedCount?: number;
  /** Maximum capacity */
  maxCapacity?: number;
}

/**
 * Date Time Slots
 */
export interface DateTimeSlots {
  /** Date (ISO 8601 format: YYYY-MM-DD) */
  date: string;
  /** Time slots for this date */
  slots: TimeSlot[];
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Booking List Query Parameters
 */
export interface BookingListQuery {
  /** Status filter */
  status?: BookingStatus;
  /** Resource ID filter */
  resourceId?: number;
  /** Start date */
  startDate?: string;
  /** End date */
  endDate?: string;
  /** Keyword search */
  keyword?: string;
  /** Page number (0-based) */
  page?: number;
  /** Page size */
  size?: number;
}

/**
 * Paged Response
 */
export interface PagedResponse<T> {
  /** Data content */
  content: T[];
  /** Total elements */
  totalElements: number;
  /** Total pages */
  totalPages: number;
  /** Current page */
  page: number;
  /** Page size */
  size: number;
}
