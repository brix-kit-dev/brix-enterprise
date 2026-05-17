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
 * @file Case Repository Implementation
 * @description Data access layer for case-related API calls
 * @module @brix-sdk/enterprise-case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Repository layer encapsulates all data access logic following v3.0.4 architecture:
 * 1. Calls HttpCapability to make HTTP requests
 * 2. Data format conversion
 * 3. Standardized error handling
 *
 * Architecture Compliance (Red Line R3):
 * - All HTTP requests go through HttpCapability
 * - Direct use of fetch/axios is forbidden
 * - HttpCapability is injected via RuntimeContext
 *
 * @see HttpCapability defined in @brix-sdk/runtime-sdk-api-web
 * @author Brix Team
 * @date 2026-02-23
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type { 
  CaseDTO,
  CaseSummary,
  CreateCaseRequest,
  UpdateCaseRequest,
  UpdateCaseStatusRequest,
  CaseQueryParams,
  PagedResponse,
} from '@brix-sdk/enterprise-case-shared';
import { CASE_API } from '@brix-sdk/enterprise-case-shared';

// ============================================================================
// Repository Interface
// ============================================================================

/**
 * Case Repository Interface
 * 
 * Defines the contract for case data access operations.
 */
export interface CaseRepository {
  /**
   * Get paginated list of cases
   * 
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated response containing case summaries
   */
  list(params?: CaseQueryParams): Promise<PagedResponse<CaseSummary>>;

  /**
   * Get case details by ID
   * 
   * @param id - Case ID
   * @returns Full case DTO
   */
  getById(id: number): Promise<CaseDTO>;

  /**
   * Create a new case
   * 
   * @param request - Case creation parameters
   * @returns Created case DTO
   */
  create(request: CreateCaseRequest): Promise<CaseDTO>;

  /**
   * Update an existing case
   * 
   * @param id - Case ID
   * @param request - Update parameters
   * @returns Updated case DTO
   */
  update(id: number, request: UpdateCaseRequest): Promise<CaseDTO>;

  /**
   * Update case status
   * 
   * @param id - Case ID
   * @param request - Status update parameters
   * @returns Updated case DTO
   */
  updateStatus(id: number, request: UpdateCaseStatusRequest): Promise<CaseDTO>;

  /**
   * Delete a case
   * 
   * @param id - Case ID
   */
  delete(id: number): Promise<void>;
}

// ============================================================================
// Repository Factory
// ============================================================================

/**
 * Create a Case Repository instance
 * 
 * Factory function that creates a repository instance with the provided
 * HttpCapability. This follows the v3.0.4 dependency injection pattern.
 *
 * @param http - HttpCapability instance from RuntimeContext
 * @returns CaseRepository instance
 *
 * @example
 * ```typescript
 * // In a React component or hook
 * const http = useHttp();
 * const repository = createCaseRepository(http);
 * const cases = await repository.list({ page: 0, size: 20 });
 * ```
 */
export function createCaseRepository(http: HttpCapability): CaseRepository {
  return {
    /**
     * Get paginated list of cases
     */
    async list(params?: CaseQueryParams): Promise<PagedResponse<CaseSummary>> {
      const response = await http.request<PagedResponse<CaseSummary>>({
        url: CASE_API.LIST,
        method: 'GET',
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
          sort: params?.sort,
          direction: params?.direction,
          status: params?.status,
          priority: params?.priority,
          templateId: params?.templateId,
          customerId: params?.customerId,
          assignedTo: params?.assignedTo,
          dateFrom: params?.dateFrom,
          dateTo: params?.dateTo,
          keyword: params?.keyword,
          tags: params?.tags?.join(','),
        },
      });
      return response.data;
    },

    /**
     * Get case details by ID
     */
    async getById(id: number): Promise<CaseDTO> {
      const response = await http.request<CaseDTO>({
        url: CASE_API.DETAIL(id),
        method: 'GET',
      });
      return response.data;
    },

    /**
     * Create a new case
     */
    async create(request: CreateCaseRequest): Promise<CaseDTO> {
      const response = await http.request<CaseDTO>({
        url: CASE_API.CREATE,
        method: 'POST',
        data: request,
      });
      return response.data;
    },

    /**
     * Update an existing case
     */
    async update(id: number, request: UpdateCaseRequest): Promise<CaseDTO> {
      const response = await http.request<CaseDTO>({
        url: CASE_API.UPDATE(id),
        method: 'PUT',
        data: request,
      });
      return response.data;
    },

    /**
     * Update case status
     */
    async updateStatus(id: number, request: UpdateCaseStatusRequest): Promise<CaseDTO> {
      const response = await http.request<CaseDTO>({
        url: CASE_API.UPDATE_STATUS(id),
        method: 'PATCH',
        data: request,
      });
      return response.data;
    },

    /**
     * Delete a case
     */
    async delete(id: number): Promise<void> {
      await http.request<void>({
        url: CASE_API.DELETE(id),
        method: 'DELETE',
      });
    },
  };
}
