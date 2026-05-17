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
 * @file Hooks Index
 * @description Re-exports all hooks from the contracts module
 * @module @brix-sdk/enterprise-contracts-ui-web/hooks
 * @version 3.0.0
 *
 * Design Notes:
 * This barrel file provides a clean public API for all hooks.
 * Import hooks from this index rather than individual files.
 *
 * @author Brix Team
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
