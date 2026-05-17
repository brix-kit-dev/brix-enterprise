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
 * @file Repository Layer Index
 * @description Exports all repository implementations and interfaces
 * @module @brix-sdk/enterprise-storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This barrel file exports all repository implementations.
 * Repository layer responsibilities:
 * 1. Encapsulate all HTTP API calls
 * 2. Use HttpCapability for network requests (v3.0.4 compliance)
 * 3. Handle request/response data transformation
 * 4. Provide typed interfaces for hooks layer
 *
 * @author Brix Team
 * @date 2026-02-23
 */

// File Repository
export { createFileRepository, type FileRepository } from './fileRepository';

// Re-export query param types for convenience
export type {
  FileQueryParams,
  AccessLogQueryParams,
} from '@brix-sdk/enterprise-storage-shared';
