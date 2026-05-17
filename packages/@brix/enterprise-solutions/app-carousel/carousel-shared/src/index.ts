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
 * @file carousel-shared module entry
 * @description Carousel module cross-platform shared types, events, and constants
 * @module @brix-sdk/enterprise-carousel-shared
 * @version 3.0.0
 * 
 * Module Overview:
 * This module defines the cross-platform shared content for the carousel plugin, including:
 * - types/: Business type definitions (DTO, enums, etc.)
 * - events/: Event type definitions (event names, Payloads)
 * - constants/: Constant definitions (status, permission codes, etc.)
 * 
 * Usage:
 * ```typescript
 * // Import types
 * import { CarouselDTO, BannerDTO, Platform } from '@brix-sdk/enterprise-carousel-shared';
 * import type { CreateCarouselParams } from '@brix-sdk/enterprise-carousel-shared/types';
 * 
 * // Import events
 * import { CAROUSEL_EVENTS, BannerClickedPayload } from '@brix-sdk/enterprise-carousel-shared/events';
 * 
 * // Import constants
 * import { BANNER_STATUS, CAROUSEL_PERMISSIONS } from '@brix-sdk/enterprise-carousel-shared/constants';
 * ```
 * 
 * v3.0 Architecture Principles:
 * 1. Cross-platform consistency: Web and Mobile use the same type definitions
 * 2. Backend alignment: Types are consistent with backend DTOs
 * 3. Platform-agnostic: Contains no platform-specific code
 * 
 * Architecture Red Lines:
 * ❌ This module must not depend on any UI framework (React, Vue, etc.)
 * ❌ This module must not depend on any platform-specific API
 * ✅ Only contains pure TypeScript types and constants
 */

// Type exports
export * from './types';

// Event exports
export * from './events';

// Constant exports
export * from './constants';

// HTTP client type exports (pure types only - v3.2 shared layer purification)
// Runtime functions (setHttpCapability, httpCapabilityClient) have been migrated to carousel-ui-web/src/api/http-client.ts
export type { HttpClientParams, HttpError } from './http-client';
