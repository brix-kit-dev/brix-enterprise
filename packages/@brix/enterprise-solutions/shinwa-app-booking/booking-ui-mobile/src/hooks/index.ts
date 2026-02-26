/**
 * Hooks Module - ViewModel Layer for Booking Mobile
 * 
 * This module exports all hooks (ViewModels) for the booking mobile application.
 * Hooks follow the MVVM pattern, managing state and business logic
 * while keeping views purely presentational.
 * 
 * @module @shinwa/booking-ui-mobile/hooks
 * @since 3.1.0
 */

export { useBookings, type UseBookingsReturn, type BookingsState, type BookingsActions } from './useBookings';
export { useBookingDetail, type UseBookingDetailReturn, type BookingDetailState, type BookingDetailActions } from './useBookingDetail';
export { useBookingCreate, type UseBookingCreateReturn, type BookingCreateState, type BookingCreateActions } from './useBookingCreate';
