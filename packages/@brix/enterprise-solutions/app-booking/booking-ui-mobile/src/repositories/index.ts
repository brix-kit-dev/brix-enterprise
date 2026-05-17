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
 * Repositories Module - Data Access Layer for Booking Mobile
 * 
 * This module exports all repository implementations and interfaces
 * for the booking mobile application. Repositories follow the clean
 * architecture pattern, isolating data access from business logic.
 * 
 * @module @brix-sdk/enterprise-booking-ui-mobile/repositories
 * @since 3.1.0
 */

export {
  type BookingRepository,
  createBookingRepository
} from './BookingRepository';
