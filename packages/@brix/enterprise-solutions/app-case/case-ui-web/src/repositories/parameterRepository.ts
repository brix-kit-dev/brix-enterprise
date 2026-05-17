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
 * @file Parameter Repository Implementation
 * @description Data access layer for case parameter-related API calls
 * @module @brix-sdk/enterprise-case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This repository handles CRUD operations for case parameters.
 * Parameters are key-value pairs associated with a case.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type { 
  CaseParameterDTO,
  SetParameterRequest,
} from '@brix-sdk/enterprise-case-shared';
import { CASE_API } from '@brix-sdk/enterprise-case-shared';

// ============================================================================
// Repository Interface
// ============================================================================

/**
 * Parameter Repository Interface
 */
export interface ParameterRepository {
  /**
   * Get all parameters for a case
   * 
   * @param caseId - Parent case ID
   * @returns Array of case parameters
   */
  getAll(caseId: number): Promise<CaseParameterDTO[]>;

  /**
   * Set a parameter value
   * 
   * @param caseId - Parent case ID
   * @param request - Parameter key-value to set
   * @returns Updated/created parameter
   */
  set(caseId: number, request: SetParameterRequest): Promise<CaseParameterDTO>;

  /**
   * Update a specific parameter
   * 
   * @param caseId - Parent case ID
   * @param key - Parameter key
   * @param value - New value
   * @returns Updated parameter
   */
  update(caseId: number, key: string, value: string): Promise<CaseParameterDTO>;
}

// ============================================================================
// Repository Factory
// ============================================================================

/**
 * Create a Parameter Repository instance
 *
 * @param http - HttpCapability instance from RuntimeContext
 * @returns ParameterRepository instance
 */
export function createParameterRepository(http: HttpCapability): ParameterRepository {
  return {
    /**
     * Get all parameters for a case
     */
    async getAll(caseId: number): Promise<CaseParameterDTO[]> {
      const response = await http.request<CaseParameterDTO[]>({
        url: CASE_API.PARAMETERS(caseId),
        method: 'GET',
      });
      return response.data;
    },

    /**
     * Set a parameter value (creates if not exists)
     */
    async set(caseId: number, request: SetParameterRequest): Promise<CaseParameterDTO> {
      const response = await http.request<CaseParameterDTO>({
        url: CASE_API.PARAMETER_SET(caseId),
        method: 'POST',
        data: request,
      });
      return response.data;
    },

    /**
     * Update a specific parameter
     */
    async update(caseId: number, key: string, value: string): Promise<CaseParameterDTO> {
      const response = await http.request<CaseParameterDTO>({
        url: CASE_API.PARAMETER_UPDATE(caseId, key),
        method: 'PUT',
        data: { value },
      });
      return response.data;
    },
  };
}
