/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Commercial use requires a valid Brix Enterprise license.
 */
/**
 * @file English translations for app-booking plugin
 * @module booking-ui-web/i18n/en-US
 * @version 3.3.0
 */

const enUS: Record<string, string> = {
  // Common
  'common.title': 'Booking Management',
  'common.booking': 'Booking',
  'common.loading': 'Loading...',
  'common.back': 'Back',
  'common.retry': 'Retry',

  // List page
  'list.title': 'Booking List',
  'list.searchPlaceholder': 'Search booking no./contact...',
  'list.createBtn': 'New Booking',
  'list.bookingNo': 'Booking No.',
  'list.resourceName': 'Resource',
  'list.bookedDate': 'Date',
  'list.timeSlot': 'Time Slot',
  'list.contactName': 'Contact',
  'list.contactPhone': 'Phone',
  'list.status': 'Status',
  'list.actions': 'Actions',
  'list.viewDetail': 'View Detail',
  'list.cancel': 'Cancel',
  'list.confirm': 'Confirm',
  'list.complete': 'Complete',
  'list.noShow': 'No Show',
  'list.reschedule': 'Reschedule',

  // Detail page
  'detail.title': 'Booking Detail',
  'detail.basicInfo': 'Basic Info',
  'detail.resourceInfo': 'Resource Info',
  'detail.contactInfo': 'Contact Info',
  'detail.statusInfo': 'Status Info',
  'detail.id': 'ID',
  'detail.bookingNo': 'Booking No.',
  'detail.resourceType': 'Resource Type',
  'detail.resourceName': 'Resource Name',
  'detail.bookedDate': 'Booked Date',
  'detail.startTime': 'Start Time',
  'detail.endTime': 'End Time',
  'detail.userId': 'User ID',
  'detail.contactName': 'Contact Name',
  'detail.contactPhone': 'Contact Phone',
  'detail.status': 'Status',
  'detail.sourceType': 'Source Type',
  'detail.sourceId': 'Source ID',
  'detail.remark': 'Remark',
  'detail.createdAt': 'Created At',
  'detail.updatedAt': 'Updated At',
  'detail.confirmedAt': 'Confirmed At',
  'detail.cancelledAt': 'Cancelled At',
  'detail.cancelReason': 'Cancel Reason',
  'detail.completedAt': 'Completed At',
  'detail.notFound': 'Data not found',

  // Create page
  'create.title': 'New Booking',
  'create.selectResource': 'Select Resource',
  'create.selectDate': 'Select Date',
  'create.selectTime': 'Select Time Slot',
  'create.contactInfo': 'Contact Information',
  'create.contactName': 'Contact Name',
  'create.contactPhone': 'Contact Phone',
  'create.remark': 'Remark',
  'create.submitBtn': 'Submit',
  'create.cancelBtn': 'Cancel',
  'create.migrating': 'This page is being migrated...',

  // Resource management
  'resource.title': 'Resource Management',
  'resource.list': 'Resource List',
  'resource.create': 'New Resource',
  'resource.edit': 'Edit Resource',
  'resource.resourceCode': 'Resource Code',
  'resource.resourceName': 'Resource Name',
  'resource.resourceType': 'Resource Type',
  'resource.description': 'Description',
  'resource.location': 'Location',
  'resource.capacity': 'Capacity',
  'resource.maxConcurrent': 'Max Concurrent',
  'resource.advanceDays': 'Advance Days',
  'resource.cancelDeadlineHours': 'Cancel Deadline (hours)',
  'resource.enabled': 'Enabled',
  'resource.enable': 'Enable',
  'resource.disable': 'Disable',
  'resource.migrating': 'This page is being migrated...',

  // Time slot
  'slot.available': 'Available',
  'slot.booked': 'Fully Booked',
  'slot.expired': 'Expired',
  'slot.remaining': 'Remaining',
  'slot.fewLeft': 'Few Left',
  'slot.noSlots': 'No available time slots',

  // Booking status
  'status.PENDING': 'Pending',
  'status.CONFIRMED': 'Confirmed',
  'status.COMPLETED': 'Completed',
  'status.CANCELLED': 'Cancelled',
  'status.NO_SHOW': 'No Show',

  // Resource types
  'resourceType.ROOM': 'Room',
  'resourceType.EQUIPMENT': 'Equipment',
  'resourceType.PERSON': 'Person',
  'resourceType.SERVICE': 'Service',
  'resourceType.OTHER': 'Other',

  // Messages
  'message.createSuccess': 'Booking created successfully',
  'message.confirmSuccess': 'Booking confirmed',
  'message.cancelSuccess': 'Booking cancelled',
  'message.completeSuccess': 'Booking completed',
  'message.rescheduleSuccess': 'Rescheduled successfully',
  'message.noShowSuccess': 'Marked as no show',

  // Calendar
  'calendar.today': 'Today',
  'calendar.more': 'More',
  'calendar.weekdays.0': 'Sun',
  'calendar.weekdays.1': 'Mon',
  'calendar.weekdays.2': 'Tue',
  'calendar.weekdays.3': 'Wed',
  'calendar.weekdays.4': 'Thu',
  'calendar.weekdays.5': 'Fri',
  'calendar.weekdays.6': 'Sat',
  'calendar.view': 'Calendar View',

  // Permissions
  'error.noConfirmPermission': 'You do not have permission to confirm bookings',
  'error.noCancelPermission': 'You do not have permission to cancel bookings',
  'error.noCompletePermission': 'You do not have permission to complete bookings',
  'error.noCreatePermission': 'You do not have permission to create bookings',

  // Actions
  'action.confirm': 'Confirm',
  'action.cancel': 'Cancel',
  'action.complete': 'Complete',
  'action.noShow': 'No Show',
  'action.reschedule': 'Reschedule',
  'action.search': 'Search',
  'action.create': 'New Booking',

  // Cancellation
  'prompt.cancelReason': 'Please enter cancellation reason',
  'cancellation.userCancel': 'User cancelled',
  'reschedule.hint': 'Reschedule mode: Please select a new booking time',
};

export default enUS;
