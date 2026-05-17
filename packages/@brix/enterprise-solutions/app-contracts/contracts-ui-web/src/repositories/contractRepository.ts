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
 * @file Contract Repository Implementation
 * @description Data access layer for contract instance-related API calls
 * @module @brix-sdk/enterprise-contracts-ui-web
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
 * - HttpCapability is injected via factory function
 *
 * @see HttpCapability defined in @brix-sdk/runtime-sdk-api-web
 * @author Brix Team
 * @date 2026-02-23
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type {
  Contract,
  ContractSummary,
  ContractQueryParams,
  CreateContractRequest,
  UpdateContractRequest,
  UpdateContractStatusRequest,
  PagedResponse,
} from '@brix-sdk/enterprise-contracts-shared';
import { CONTRACTS_API } from '@brix-sdk/enterprise-contracts-shared';

// ============================================================================
// Repository Interface
// ============================================================================

/**
 * Contract Repository Interface
 * 
 * Defines the contract for contract instance data access operations.
 * All methods return Promises for async operation.
 */
export interface ContractRepository {
  /**
   * Get paginated list of contracts
   * 
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated response containing contract summaries
   */
  list(params?: ContractQueryParams): Promise<PagedResponse<ContractSummary>>;

  /**
   * Get contract details by ID
   * 
   * @param id - Contract ID
   * @returns Full contract DTO with parties and content
   */
  getById(id: number): Promise<Contract>;

  /**
   * Create a new contract instance
   * 
   * @param request - Contract creation parameters
   * @returns Created contract DTO
   */
  create(request: CreateContractRequest): Promise<Contract>;

  /**
   * Update an existing contract
   * 
   * @param id - Contract ID
   * @param request - Update parameters
   * @returns Updated contract DTO
   */
  update(id: number, request: UpdateContractRequest): Promise<Contract>;

  /**
   * Update contract status
   * 
   * @param id - Contract ID
   * @param request - Status update parameters
   * @returns Updated contract DTO
   */
  updateStatus(id: number, request: UpdateContractStatusRequest): Promise<Contract>;

  /**
   * Approve a contract
   * 
   * @param id - Contract ID
   * @param notes - Approval notes (optional)
   * @returns Updated contract DTO
   */
  approve(id: number, notes?: string): Promise<Contract>;

  /**
   * Sign a contract as a specific party
   * 
   * @param contractId - Contract ID
   * @param partyId - Signing party ID
   * @returns Updated contract DTO
   */
  sign(contractId: number, partyId: number): Promise<Contract>;

  /**
   * Delete a contract (only for DRAFT status)
   * 
   * @param id - Contract ID
   */
  delete(id: number): Promise<void>;
}

// ============================================================================
// Repository Factory
// ============================================================================

/**
 * Create a Contract Repository instance
 * 
 * Factory function that creates a repository instance with the provided
 * HttpCapability. This follows the Dependency Injection pattern required
 * by v3.0.4 architecture - repositories don't directly depend on HTTP
 * implementations, but receive them through factory injection.
 * 
 * @param http - HttpCapability instance from RuntimeContext
 * @returns ContractRepository implementation
 * 
 * @example
 * ```typescript
 * // In a React Hook (ViewModel layer)
 * const http = useHttp();
 * const repo = createContractRepository(http);
 * const contracts = await repo.list({ page: 0, size: 20 });
 * ```
 */
export function createContractRepository(http: HttpCapability): ContractRepository {
  return {
    /**
     * List contracts with pagination and filtering
     */
    async list(params?: ContractQueryParams): Promise<PagedResponse<ContractSummary>> {
      const queryParams: Record<string, string> = {};
      
      if (params) {
        if (params.page !== undefined) queryParams.page = String(params.page);
        if (params.size !== undefined) queryParams.size = String(params.size);
        if (params.keyword) queryParams.keyword = params.keyword;
        if (params.status) queryParams.status = params.status;
        if (params.templateId !== undefined) queryParams.templateId = String(params.templateId);
        if (params.partyName) queryParams.partyName = params.partyName;
        if (params.relatedCaseId !== undefined) queryParams.relatedCaseId = String(params.relatedCaseId);
        if (params.startDateFrom) queryParams.startDateFrom = params.startDateFrom;
        if (params.startDateTo) queryParams.startDateTo = params.startDateTo;
        if (params.sortBy) queryParams.sortBy = params.sortBy;
        if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
      }

      return http.get<PagedResponse<ContractSummary>>(
        CONTRACTS_API.CONTRACTS,
        queryParams as Record<string, unknown>
      );
    },

    /**
     * Get contract by ID with full details
     */
    async getById(id: number): Promise<Contract> {
      return http.get<Contract>(
        CONTRACTS_API.CONTRACT_BY_ID(id)
      );
    },

    /**
     * Create a new contract instance
     */
    async create(request: CreateContractRequest): Promise<Contract> {
      return http.post<Contract>(
        CONTRACTS_API.CONTRACTS,
        request
      );
    },

    /**
     * Update an existing contract
     */
    async update(id: number, request: UpdateContractRequest): Promise<Contract> {
      return http.put<Contract>(
        CONTRACTS_API.CONTRACT_BY_ID(id),
        request
      );
    },

    /**
     * Update contract status
     */
    async updateStatus(id: number, request: UpdateContractStatusRequest): Promise<Contract> {
      return http.put<Contract>(
        CONTRACTS_API.CONTRACT_STATUS(id),
        request
      );
    },

    /**
     * Approve a contract
     */
    async approve(id: number, notes?: string): Promise<Contract> {
      return http.post<Contract>(
        CONTRACTS_API.CONTRACT_APPROVE(id),
        { notes }
      );
    },

    /**
     * Sign a contract as a specific party
     */
    async sign(contractId: number, partyId: number): Promise<Contract> {
      return http.post<Contract>(
        CONTRACTS_API.CONTRACT_SIGN(contractId, partyId)
      );
    },

    /**
     * Delete a contract
     */
    async delete(id: number): Promise<void> {
      await http.delete(CONTRACTS_API.CONTRACT_BY_ID(id));
    },
  };
}
