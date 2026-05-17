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
 * @file Booking module constant definitions
 * @description Status enums, permission codes, and other constants
 * @module @brix-sdk/enterprise-booking-shared/constants
 * @version 3.0.0
 */

// ============================================================================
// Booking Status Constants
// ============================================================================

/**
 * Booking Status Mapping
 * 
 * Provides display names and colors for statuses
 */
export const BOOKING_STATUS = {
  PENDING: {
    value: 'PENDING',
    label: '待确认',
    labelKey: 'booking.status.pending',
    color: 'warning',
  },
  CONFIRMED: {
    value: 'CONFIRMED',
    label: '已确认',
    labelKey: 'booking.status.confirmed',
    color: 'primary',
  },
  COMPLETED: {
    value: 'COMPLETED',
    label: '已完成',
    labelKey: 'booking.status.completed',
    color: 'success',
  },
  CANCELLED: {
    value: 'CANCELLED',
    label: '已取消',
    labelKey: 'booking.status.cancelled',
    color: 'error',
  },
  NO_SHOW: {
    value: 'NO_SHOW',
    label: '爽约',
    labelKey: 'booking.status.noShow',
    color: 'default',
  },
} as const;

/**
 * Resource Type Mapping
 */
export const RESOURCE_TYPE = {
  DOCTOR: {
    value: 'DOCTOR',
    label: '医生',
    labelKey: 'booking.resourceType.doctor',
    icon: 'medical_services',
  },
  CONSULTANT: {
    value: 'CONSULTANT',
    label: '顾问',
    labelKey: 'booking.resourceType.consultant',
    icon: 'support_agent',
  },
  MEETING_ROOM: {
    value: 'MEETING_ROOM',
    label: '会议室',
    labelKey: 'booking.resourceType.meetingRoom',
    icon: 'meeting_room',
  },
  EQUIPMENT: {
    value: 'EQUIPMENT',
    label: '设备',
    labelKey: 'booking.resourceType.equipment',
    icon: 'devices',
  },
  CUSTOM: {
    value: 'CUSTOM',
    label: '自定义',
    labelKey: 'booking.resourceType.custom',
    icon: 'category',
  },
} as const;

// ============================================================================
// Permission Constants
// ============================================================================

/**
 * Booking module permission codes
 * 
 * Consistent with permissions in ui-manifest.yaml
 */
export const BOOKING_PERMISSIONS = {
  /** View booking */
  READ: 'booking:read',
  /** Create booking */
  CREATE: 'booking:create',
  /** Edit booking */
  WRITE: 'booking:write',
  /** Delete booking */
  DELETE: 'booking:delete',
  /** Confirm booking */
  CONFIRM: 'booking:confirm',
  /** Cancel booking */
  CANCEL: 'booking:cancel',
  /** Mark complete */
  COMPLETE: 'booking:complete',
  /** Manage resources */
  MANAGE_RESOURCE: 'booking:manage_resource',
} as const;

// ============================================================================
// PageId Constants
// ============================================================================

/**
 * Booking module PageIds
 * 
 * Used for NavigationCapability.requestNavigate()
 * Consistent with pages[].pageId in ui-manifest.yaml
 */
export const BOOKING_PAGE_IDS = {
  /** Booking list */
  LIST: 'booking:list',
  /** Booking detail */
  DETAIL: 'booking:detail',
  /** Create booking */
  CREATE: 'booking:create',
  /** Calendar view */
  CALENDAR: 'booking:calendar',
  /** Resource management */
  RESOURCE_MANAGEMENT: 'booking:resource-management',
} as const;

// ============================================================================
// Menu ID Constants
// ============================================================================

/**
 * Booking module menu IDs
 */
export const BOOKING_MENU_IDS = {
  /** Booking management (parent menu) */
  ROOT: 'booking',
  /** Booking list */
  LIST: 'booking:list',
  /** Calendar view */
  CALENDAR: 'booking:calendar',
  /** Resource management */
  RESOURCE: 'booking:resource',
} as const;

// ============================================================================
// Default Configuration Constants
// ============================================================================

/**
 * Default pagination configuration
 */
export const DEFAULT_PAGINATION = {
  /** Default page number */
  PAGE: 0,
  /** Default page size */
  SIZE: 10,
  /** Available page size options */
  SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

/**
 * Time slot configuration
 */
export const TIME_SLOT_CONFIG = {
  /** Default duration (minutes) */
  DEFAULT_DURATION: 30,
  /** Minimum duration (minutes) */
  MIN_DURATION: 15,
  /** Maximum duration (minutes) */
  MAX_DURATION: 240,
  /** Work day start time */
  WORK_START: '08:00',
  /** Work day end time */
  WORK_END: '18:00',
} as const;
