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
 * @file storage-shared Module Entry Point
 * @description Exports shared types, events, and constants for file storage module
 * @module @brix-sdk/enterprise-storage-shared
 * @version 3.0.4
 *
 * Design Notes:
 * This module serves as the frontend-backend contract layer following v3.0.4:
 * - Types: DTO definitions, query params, response types
 * - Events: Integration event definitions for cross-plugin communication
 * - Constants: API endpoints, status values, permissions
 *
 * Architecture Compliance:
 * - Pure TypeScript types, no runtime dependencies except shared contracts
 * - Framework-agnostic (usable by React, Angular, Vue, or backend)
 *
 * @author Brix Team
 * @date 2026-02-23
 */

// Type Exports
export * from './types';

// Event Exports
export * from './events';

// Constant Exports
export * from './constants';

// HTTP Client Type Exports (v3.2 shared layer pure types)
export type { HttpClientParams, HttpError } from './http-client';
