/**
 * @file Calendar related type definitions
 * @description Type definitions for booking calendar
 * @module @shinwa/booking-shared/types
 * @version 3.0.0
 */

/**
 * Calendar View Mode
 */
export type CalendarViewMode = 
  | 'day'      // Day view
  | 'week'     // Week view
  | 'month';   // Month view

/**
 * Calendar Date Cell
 */
export interface CalendarCell {
  /** Date (ISO 8601 format: YYYY-MM-DD) */
  date: string;
  /** Is current month */
  isCurrentMonth: boolean;
  /** Is today */
  isToday: boolean;
  /** Is selected */
  isSelected: boolean;
  /** Is disabled */
  isDisabled: boolean;
  /** Booking count for this date */
  bookingCount: number;
}

/**
 * Calendar Selection Range
 */
export interface CalendarRange {
  /** Start date */
  startDate: string;
  /** End date */
  endDate: string;
}

/**
 * Calendar Event (for calendar component display)
 */
export interface CalendarEvent {
  /** Event ID (usually booking ID) */
  id: string;
  /** Title */
  title: string;
  /** Start time (ISO 8601 format) */
  start: string;
  /** End time (ISO 8601 format) */
  end: string;
  /** Color identifier */
  color?: string;
  /** Is all-day event */
  allDay?: boolean;
  /** Extended data */
  data?: Record<string, unknown>;
}
