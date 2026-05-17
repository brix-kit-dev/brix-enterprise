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
 * @file identity-shared module entry
 * @description Identity module cross-platform shared types, events, and constants
 * @module @brix-sdk/enterprise-identity-shared
 * @version 3.0.0
 */

// Type exports
export * from './types';

// Event exports
export * from './events';

// Constant exports
export * from './constants';

// HTTP client type exports (pure types only - v3.2 shared layer purification)
// Runtime functions (setHttpCapability, httpCapabilityClient) have been migrated to identity-ui-web/src/api/http-client.ts
export type { HttpClientParams, HttpError } from './http-client';
