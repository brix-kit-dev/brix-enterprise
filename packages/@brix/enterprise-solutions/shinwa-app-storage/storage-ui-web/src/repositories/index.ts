/**
 * @file Repository Layer Index
 * @description Exports all repository implementations and interfaces
 * @module @shinwa/storage-ui-web
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
 * @author Shinwa Team
 * @date 2026-02-23
 */

// File Repository
export { createFileRepository, type FileRepository } from './fileRepository';

// Re-export query param types for convenience
export type {
  FileQueryParams,
  AccessLogQueryParams,
} from '@shinwa/storage-shared';
