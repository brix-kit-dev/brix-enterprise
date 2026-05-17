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
 * @file Repository Index
 * @description Re-exports all repository factories and types
 * @module @brix-sdk/enterprise-contracts-ui-web/repositories
 * @version 3.0.0
 * 
 * Design Notes:
 * This barrel file provides a clean public API for all repositories.
 * Import repositories from this index rather than individual files.
 * 
 * @author Brix Team
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
} from '@brix-sdk/enterprise-contracts-shared';
