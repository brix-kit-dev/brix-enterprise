/**
 * Repository for script template operations.
 * Provides data access methods for script template management following the
 * Repository pattern in v3.0.4 Runtime Shell Architecture.
 * All HTTP calls are made through the HttpCapability to ensure proper
 * cross-cutting concerns handling (auth, logging, error handling).
 * @module compliance-ui-web/repositories/scriptTemplateRepository
 */

import type { HttpCapability } from '@brix/runtime-sdk-react';
import type {
  ScriptTemplate,
  ScriptTemplateListQueryParams,
  CreateScriptTemplateRequest,
  UpdateScriptTemplateRequest,
} from '@shinwa/compliance-shared';
import { COMPLIANCE_API } from '@shinwa/compliance-shared';

/**
 * Paginated response structure for script template list queries.
 */
export interface ScriptTemplateListResponse {
  /** Array of script template items for the current page */
  items: ScriptTemplate[];
  /** Total count of all matching script templates */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages available */
  totalPages: number;
}

/**
 * Script template repository factory function.
 * Creates a repository instance bound to the provided HttpCapability.
 * @param http - The HttpCapability instance injected from the runtime
 * @returns Repository object with script template CRUD operations
 */
export function createScriptTemplateRepository(http: HttpCapability) {
  return {
    /**
     * Fetches a paginated list of script templates based on query parameters.
     * Supports filtering by status, category, scenario, keyword search, and pagination.
     * @param params - Query parameters for filtering and pagination
     * @returns Promise resolving to paginated script template list response
     * @example
     * ```typescript
     * const response = await repository.getScriptTemplates({
     *   category: ScriptCategory.PRODUCT_INTRODUCTION,
     *   status: ScriptTemplateStatus.PUBLISHED,
     *   page: 1,
     *   pageSize: 20
     * });
     * ```
     */
    async getScriptTemplates(params: ScriptTemplateListQueryParams): Promise<ScriptTemplateListResponse> {
      const queryParams = new URLSearchParams();
      
      if (params.keyword) {
        queryParams.append('keyword', params.keyword);
      }
      if (params.status) {
        queryParams.append('status', params.status);
      }
      if (params.category) {
        queryParams.append('category', params.category);
      }
      if (params.scenario) {
        queryParams.append('scenario', params.scenario);
      }
      if (params.page !== undefined) {
        queryParams.append('page', String(params.page));
      }
      if (params.pageSize !== undefined) {
        queryParams.append('pageSize', String(params.pageSize));
      }
      if (params.sortBy) {
        queryParams.append('sortBy', params.sortBy);
      }
      if (params.sortOrder) {
        queryParams.append('sortOrder', params.sortOrder);
      }

      const queryString = queryParams.toString();
      const url = queryString 
        ? `${COMPLIANCE_API.SCRIPT_TEMPLATES}?${queryString}` 
        : COMPLIANCE_API.SCRIPT_TEMPLATES;

      return http.get<ScriptTemplateListResponse>(url);
    },

    /**
     * Fetches a single script template by its unique identifier.
     * Returns full template details including content, variables, and metadata.
     * @param id - Unique identifier of the script template
     * @returns Promise resolving to the script template entity
     * @throws Error if template is not found (404)
     */
    async getScriptTemplateById(id: string): Promise<ScriptTemplate> {
      const url = COMPLIANCE_API.SCRIPT_TEMPLATE_DETAIL.replace(':id', id);
      return http.get<ScriptTemplate>(url);
    },

    /**
     * Creates a new script template with the provided data.
     * The template is created in DRAFT status by default.
     * @param data - Script template creation data (name, content, category, etc.)
     * @returns Promise resolving to the created script template with generated ID
     */
    async createScriptTemplate(data: CreateScriptTemplateRequest): Promise<ScriptTemplate> {
      return http.post<ScriptTemplate>(COMPLIANCE_API.SCRIPT_TEMPLATES, data);
    },

    /**
     * Updates an existing script template with new data.
     * Only templates in DRAFT or ARCHIVED status can be directly updated.
     * Published templates must be archived first before editing.
     * @param id - Unique identifier of the script template to update
     * @param data - Partial update data for the script template
     * @returns Promise resolving to the updated script template
     * @throws Error if template is not found or cannot be updated
     */
    async updateScriptTemplate(id: string, data: UpdateScriptTemplateRequest): Promise<ScriptTemplate> {
      const url = COMPLIANCE_API.SCRIPT_TEMPLATE_DETAIL.replace(':id', id);
      return http.put<ScriptTemplate>(url, data);
    },

    /**
     * Deletes a script template by its unique identifier.
     * Only templates in DRAFT status can be deleted.
     * Published or archived templates must be archived first.
     * @param id - Unique identifier of the script template to delete
     * @returns Promise resolving when deletion is complete
     * @throws Error if template cannot be deleted due to status constraints
     */
    async deleteScriptTemplate(id: string): Promise<void> {
      const url = COMPLIANCE_API.SCRIPT_TEMPLATE_DETAIL.replace(':id', id);
      return http.delete<void>(url);
    },

    /**
     * Publishes a script template, making it available for use.
     * Only templates in DRAFT status with valid content can be published.
     * This triggers compliance validation before publishing.
     * @param id - Unique identifier of the script template to publish
     * @returns Promise resolving to the published script template
     * @throws Error if template fails compliance validation
     */
    async publishScriptTemplate(id: string): Promise<ScriptTemplate> {
      const url = COMPLIANCE_API.SCRIPT_TEMPLATE_PUBLISH.replace(':id', id);
      return http.post<ScriptTemplate>(url, {});
    },

    /**
     * Archives a script template, removing it from active use.
     * Archived templates can be restored or deleted later.
     * @param id - Unique identifier of the script template to archive
     * @returns Promise resolving to the archived script template
     */
    async archiveScriptTemplate(id: string): Promise<ScriptTemplate> {
      const url = COMPLIANCE_API.SCRIPT_TEMPLATE_ARCHIVE.replace(':id', id);
      return http.post<ScriptTemplate>(url, {});
    },

    /**
     * Retrieves submission history for a script template.
     * Includes all publish attempts with validation results.
     * @param id - Unique identifier of the script template
     * @returns Promise resolving to array of submission history records
     */
    async getScriptTemplateHistory(id: string): Promise<Array<{
      id: string;
      action: 'CREATED' | 'UPDATED' | 'PUBLISHED' | 'ARCHIVED';
      operatorId: string;
      operatorName: string;
      timestamp: string;
      details?: string;
    }>> {
      const url = COMPLIANCE_API.SCRIPT_TEMPLATE_HISTORY.replace(':id', id);
      return http.get(url);
    },

    /**
     * Creates a copy of an existing script template.
     * Useful for creating variations based on existing templates.
     * The copy is created in DRAFT status with a new unique identifier.
     * @param id - Unique identifier of the template to copy
     * @param newName - Name for the copied template
     * @returns Promise resolving to the newly created template copy
     */
    async copyScriptTemplate(id: string, newName: string): Promise<ScriptTemplate> {
      const url = COMPLIANCE_API.SCRIPT_TEMPLATE_COPY.replace(':id', id);
      return http.post<ScriptTemplate>(url, { name: newName });
    },

    /**
     * Validates script template content for compliance.
     * Checks against forbidden words and compliance rules without saving.
     * @param content - Script content to validate
     * @returns Promise resolving to validation result with any found issues
     */
    async validateScriptContent(content: string): Promise<{
      isValid: boolean;
      issues: Array<{
        type: 'FORBIDDEN_WORD' | 'FORMAT_ERROR' | 'LENGTH_EXCEEDED';
        message: string;
        position?: number;
        length?: number;
      }>;
    }> {
      return http.post(`${COMPLIANCE_API.SCRIPT_TEMPLATES}/validate`, { content });
    },
  };
}

/**
 * Type definition for the script template repository instance.
 * Used for dependency injection and type-safe repository access.
 */
export type ScriptTemplateRepository = ReturnType<typeof createScriptTemplateRepository>;
