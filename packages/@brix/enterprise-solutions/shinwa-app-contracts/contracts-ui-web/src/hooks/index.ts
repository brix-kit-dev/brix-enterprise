/**
 * @file Hooks Index
 * @description Re-exports all hooks from the contracts module
 * @module @shinwa/contracts-ui-web/hooks
 * @version 3.0.0
 *
 * Design Notes:
 * This barrel file provides a clean public API for all hooks.
 * Import hooks from this index rather than individual files.
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

// ============================================================================
// Contract Template Hooks
// ============================================================================
export {
  useContractTemplateList,
  useContractTemplateDetail,
  useContractTemplateCreate,
  type UseContractTemplateListResult,
  type UseContractTemplateDetailResult,
  type UseContractTemplateCreateResult,
} from './useContractTemplate';

// ============================================================================
// Contract Instance Hooks
// ============================================================================
export {
  useContractList,
  useContractDetail,
  useContractCreate,
  type UseContractListResult,
  type UseContractDetailResult,
  type UseContractCreateResult,
} from './useContract';
