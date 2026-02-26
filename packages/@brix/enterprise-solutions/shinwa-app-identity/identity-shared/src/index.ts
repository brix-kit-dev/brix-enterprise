/**
 * @file identity-shared module entry
 * @description Identity module cross-platform shared types, events, and constants
 * @module @shinwa/identity-shared
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
