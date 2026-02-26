/**
 * @file Contract Template Repository Implementation
 * @description Data access layer for contract template-related API calls
 * @module @shinwa/contracts-ui-web
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
 * @see HttpCapability defined in @brix/runtime-sdk-api-web
 * @author Shinwa Team
 * @date 2026-02-23
 */

import type { HttpCapability } from '@brix/runtime-sdk-api-web';
import type {
  ContractTemplate,
  ContractTemplateSummary,
  ContractTemplateQueryParams,
  CreateContractTemplateRequest,
  UpdateContractTemplateRequest,
  PagedResponse,
} from '@shinwa/contracts-shared';
import { CONTRACTS_API } from '@shinwa/contracts-shared';

// ============================================================================
// Repository Interface
// ============================================================================

/**
 * Contract Template Repository Interface
 * 
 * Defines the contract for template data access operations.
 * All methods return Promises for async operation.
 */
export interface ContractTemplateRepository {
  /**
   * Get paginated list of contract templates
   * 
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated response containing template summaries
   */
  list(params?: ContractTemplateQueryParams): Promise<PagedResponse<ContractTemplateSummary>>;

  /**
   * Get contract template details by ID
   * 
   * @param id - Template ID
   * @returns Full template DTO with variable definitions
   */
  getById(id: number): Promise<ContractTemplate>;

  /**
   * Create a new contract template
   * 
   * @param request - Template creation parameters
   * @returns Created template DTO
   */
  create(request: CreateContractTemplateRequest): Promise<ContractTemplate>;

  /**
   * Update an existing contract template
   * 
   * @param id - Template ID
   * @param request - Update parameters
   * @returns Updated template DTO
   */
  update(id: number, request: UpdateContractTemplateRequest): Promise<ContractTemplate>;

  /**
   * Activate a contract template (make it available for use)
   * 
   * @param id - Template ID
   * @returns Updated template DTO
   */
  activate(id: number): Promise<ContractTemplate>;

  /**
   * Archive a contract template (make it unavailable)
   * 
   * @param id - Template ID
   * @returns Updated template DTO
   */
  archive(id: number): Promise<ContractTemplate>;

  /**
   * Delete a contract template (only for DRAFT status)
   * 
   * @param id - Template ID
   */
  delete(id: number): Promise<void>;
}

// ============================================================================
// Repository Factory
// ============================================================================

/**
 * Create a Contract Template Repository instance
 * 
 * Factory function that creates a repository instance with the provided
 * HttpCapability. This follows the Dependency Injection pattern required
 * by v3.0.4 architecture - repositories don't directly depend on HTTP
 * implementations, but receive them through factory injection.
 * 
 * @param http - HttpCapability instance from RuntimeContext
 * @returns ContractTemplateRepository implementation
 * 
 * @example
 * ```typescript
 * // In a React Hook (ViewModel layer)
 * const http = useHttp();
 * const repo = createContractTemplateRepository(http);
 * const templates = await repo.list({ page: 0, size: 20 });
 * ```
 */
export function createContractTemplateRepository(http: HttpCapability): ContractTemplateRepository {
  return {
    /**
     * List contract templates with pagination and filtering
     */
    async list(params?: ContractTemplateQueryParams): Promise<PagedResponse<ContractTemplateSummary>> {
      const queryParams: Record<string, string> = {};
      
      if (params) {
        if (params.page !== undefined) queryParams.page = String(params.page);
        if (params.size !== undefined) queryParams.size = String(params.size);
        if (params.keyword) queryParams.keyword = params.keyword;
        if (params.status) queryParams.status = params.status;
        if (params.category) queryParams.category = params.category;
        if (params.sortBy) queryParams.sortBy = params.sortBy;
        if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
      }

      const response = await http.get<PagedResponse<ContractTemplateSummary>>(
        CONTRACTS_API.TEMPLATES,
        { params: queryParams }
      );

      return response.data;
    },

    /**
     * Get template by ID with full details
     */
    async getById(id: number): Promise<ContractTemplate> {
      const response = await http.get<ContractTemplate>(
        CONTRACTS_API.TEMPLATE_BY_ID(id)
      );

      return response.data;
    },

    /**
     * Create a new contract template
     */
    async create(request: CreateContractTemplateRequest): Promise<ContractTemplate> {
      const response = await http.post<ContractTemplate>(
        CONTRACTS_API.TEMPLATES,
        request
      );

      return response.data;
    },

    /**
     * Update an existing contract template
     */
    async update(id: number, request: UpdateContractTemplateRequest): Promise<ContractTemplate> {
      const response = await http.put<ContractTemplate>(
        CONTRACTS_API.TEMPLATE_BY_ID(id),
        request
      );

      return response.data;
    },

    /**
     * Activate a contract template
     */
    async activate(id: number): Promise<ContractTemplate> {
      const response = await http.post<ContractTemplate>(
        CONTRACTS_API.TEMPLATE_ACTIVATE(id)
      );

      return response.data;
    },

    /**
     * Archive a contract template
     */
    async archive(id: number): Promise<ContractTemplate> {
      const response = await http.post<ContractTemplate>(
        CONTRACTS_API.TEMPLATE_ARCHIVE(id)
      );

      return response.data;
    },

    /**
     * Delete a contract template
     */
    async delete(id: number): Promise<void> {
      await http.delete(CONTRACTS_API.TEMPLATE_BY_ID(id));
    },
  };
}
