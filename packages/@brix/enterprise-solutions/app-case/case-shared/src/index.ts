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
 * @file Case Module Shared Package Entry
 * @description Main entry point for @brix-sdk/enterprise-case-shared package
 * @module @brix-sdk/enterprise-case-shared
 * @version 3.0.0
 * 
 * This package contains shared type definitions, constants, and events
 * used by both Web and Mobile frontends of the case module.
 * 
 * Architecture Notes:
 * - Types: Business entity interfaces (DTOs, requests, responses)
 * - Constants: Enum mappings, API endpoints, permissions
 * - Events: Event type constants and payload interfaces
 * 
 * @author Brix Team
 * @date 2026-02-23
 */

// ============================================================================
// Type Exports
// ============================================================================
export * from './types';

// ============================================================================
// Constant Exports
// ============================================================================
export * from './constants';

// ============================================================================
// Event Exports
// ============================================================================
export * from './events';
