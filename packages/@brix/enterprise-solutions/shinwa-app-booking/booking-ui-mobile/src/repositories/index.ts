/**
 * Repositories Module - Data Access Layer for Booking Mobile
 * 
 * This module exports all repository implementations and interfaces
 * for the booking mobile application. Repositories follow the clean
 * architecture pattern, isolating data access from business logic.
 * 
 * @module @shinwa/booking-ui-mobile/repositories
 * @since 3.1.0
 */

export {
  type BookingRepository,
  createBookingRepository
} from './BookingRepository';
