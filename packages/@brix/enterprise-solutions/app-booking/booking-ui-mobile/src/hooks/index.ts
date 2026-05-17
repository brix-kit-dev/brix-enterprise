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
 * Hooks Module - ViewModel Layer for Booking Mobile
 * 
 * This module exports all hooks (ViewModels) for the booking mobile application.
 * Hooks follow the MVVM pattern, managing state and business logic
 * while keeping views purely presentational.
 * 
 * @module @brix-sdk/enterprise-booking-ui-mobile/hooks
 * @since 3.1.0
 */

export { useBookings, type UseBookingsReturn, type BookingsState, type BookingsActions } from './useBookings';
export { useBookingDetail, type UseBookingDetailReturn, type BookingDetailState, type BookingDetailActions } from './useBookingDetail';
export { useBookingCreate, type UseBookingCreateReturn, type BookingCreateState, type BookingCreateActions } from './useBookingCreate';
