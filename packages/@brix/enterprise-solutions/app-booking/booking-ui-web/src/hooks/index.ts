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
 * @file Hooks layer unified entry point
 * @description ViewModel layer for frontend-backend separation architecture
 * @module booking-ui-web/hooks
 * @version 3.2.0
 * 
 * [v3.2 Architecture Notes]
 * The Hooks layer is the ViewModel layer implementation, responsible for:
 * - State management: Maintaining component state
 * - Business orchestration: Coordinating Repository calls and event publishing
 * - Cache management: Implementing data caching and invalidation strategies
 * 
 * @see v3.2-detailed-refactoring-plan.md Phase 5: Frontend-Backend Separation Refactoring
 */

// Booking List Hook
export { 
  useBookingList,
  type BookingListState,
  type BookingListActions,
} from './useBookingList';

// Booking Detail Hook
export {
  useBookingDetail,
  type BookingDetailState,
  type BookingDetailActions,
} from './useBookingDetail';

// Booking Create Hook
export {
  useBookingCreate,
  type BookingCreateState,
  type BookingCreateActions,
} from './useBookingCreate';

// Booking Calendar Hook
export {
  useBookingCalendar,
  type UseBookingCalendarParams,
  type BookingCalendarState,
  type BookingCalendarActions,
} from './useBookingCalendar';
