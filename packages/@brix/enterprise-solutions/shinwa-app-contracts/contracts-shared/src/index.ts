/**
 * @file contracts-shared module entry
 * @module @shinwa/contracts-shared
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
