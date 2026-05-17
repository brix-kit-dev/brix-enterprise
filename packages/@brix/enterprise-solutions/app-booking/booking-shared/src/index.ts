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
 * @file booking-shared module entry
 * @description Booking module cross-platform shared types, events, and constants
 * @module @brix-sdk/enterprise-booking-shared
 * @version 3.0.0
 * 
 * Module Overview:
 * This module defines the cross-platform shared content for the booking plugin, including:
 * - types/: Business type definitions
 * - events/: Event type definitions
 * - constants/: Constant definitions
 * - generated/: OpenAPI auto-generated types and Repository (Phase 5.2)
 * - http-client: HttpCapability adapter
 * 
 * Usage:
 * ```typescript
 * // Import types
 * import { Booking, BookingStatus } from '@brix-sdk/enterprise-booking-shared';
 * import type { CreateBookingParams } from '@brix-sdk/enterprise-booking-shared/types';
 * 
 * // Import events
 * import { BOOKING_EVENTS, BookingCreatedPayload } from '@brix-sdk/enterprise-booking-shared/events';
 * 
 * // Import constants
 * import { BOOKING_STATUS, BOOKING_PAGE_IDS } from '@brix-sdk/enterprise-booking-shared/constants';
 * 
 * // Import auto-generated Repository (Phase 5.2)
 * import { BookingRepository } from '@brix-sdk/enterprise-booking-shared/generated';
 * 
 * // Set up HttpCapability
 * import { setHttpCapability } from '@brix-sdk/enterprise-booking-shared';
 * ```
 * 
 * v3.0 Architecture Principles:
 * 1. Cross-platform consistency: Web and Mobile use the same type definitions
 * 2. Backend alignment: Types are consistent with backend DTOs
 * 3. Platform-agnostic: Contains no platform-specific code
 */

// Type exports
export * from './types';

// Event exports
export * from './events';

// Constant exports
export * from './constants';

// HttpCapability type exports (pure types only - v3.2 shared layer purification)
// Runtime functions (setHttpCapability, httpCapabilityClient) have been migrated to booking-ui-web/src/api/http-client.ts
export type { HttpClientParams, HttpError } from './http-client';
