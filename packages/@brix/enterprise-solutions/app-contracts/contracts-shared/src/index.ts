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
 * @file contracts-shared module entry
 * @module @brix-sdk/enterprise-contracts-shared
 * @version 3.0.4
 */

// Type exports
export * from './types';

// Event exports  
export * from './events';

// Constant exports
export * from './constants';

// HTTP client type exports (pure types only - v3.2 shared layer purification)
// Note: contracts plugin currently has no ui-web module, so http-client types are reserved for future use
export type { HttpClientParams, HttpError } from './http-client';
