/**
 * @file Repository Index
 * @description Re-exports all repository factories and types
 * @module @shinwa/contracts-ui-web/repositories
 * @version 3.0.0
 * 
 * Design Notes:
 * This barrel file provides a clean public API for all repositories.
 * Import repositories from this index rather than individual files.
 * 
 * @author Shinwa Team
 * @date 2026-02-23
 */

// ============================================================================
// Contract Template Repository
// ============================================================================
export { createContractTemplateRepository } from './contractTemplateRepository';
export type { ContractTemplateRepository } from './contractTemplateRepository';

// ============================================================================
// Contract Repository
// ============================================================================
export { createContractRepository } from './contractRepository';
export type { ContractRepository } from './contractRepository';

// ============================================================================
// Re-export query params from shared for convenience
// ============================================================================
export type { 
  ContractTemplateQueryParams,
  ContractQueryParams,
} from '@shinwa/contracts-shared';
