/**
 * Repository for forbidden word operations.
 * Provides data access methods for forbidden word management following the
 * Repository pattern in v3.0.4 Runtime Shell Architecture.
 * All HTTP calls are made through the HttpCapability to ensure proper
 * cross-cutting concerns handling (auth, logging, error handling).
 * @module compliance-ui-web/repositories/forbiddenWordRepository
 */

import type { HttpCapability } from '@brix/runtime-sdk-react';
import type {
  ForbiddenWord,
  ForbiddenWordListQueryParams,
  CreateForbiddenWordRequest,
  UpdateForbiddenWordRequest,
} from '@shinwa/compliance-shared';
import { COMPLIANCE_API } from '@shinwa/compliance-shared';

/**
 * Paginated response structure for forbidden word list queries.
 */
export interface ForbiddenWordListResponse {
  /** Array of forbidden word items for the current page */
  items: ForbiddenWord[];
  /** Total count of all matching forbidden words */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages available */
  totalPages: number;
}

/**
 * Bulk import request structure for importing multiple forbidden words.
 */
export interface BulkImportRequest {
  /** Array of forbidden word entries to import */
  words: Array<{
    word: string;
    category: string;
    severity: string;
    description?: string;
    suggestedAlternatives?: string[];
  }>;
  /** Whether to skip duplicates or throw error */
  skipDuplicates?: boolean;
}

/**
 * Bulk import response with success and failure counts.
 */
export interface BulkImportResponse {
  /** Total words processed */
  totalProcessed: number;
  /** Successfully imported count */
  successCount: number;
  /** Failed import count */
  failedCount: number;
  /** Skipped duplicate count */
  skippedCount: number;
  /** Details of failed imports */
  failures: Array<{
    word: string;
    reason: string;
  }>;
}

/**
 * Forbidden word repository factory function.
 * Creates a repository instance bound to the provided HttpCapability.
 * @param http - The HttpCapability instance injected from the runtime
 * @returns Repository object with forbidden word CRUD operations
 */
export function createForbiddenWordRepository(http: HttpCapability) {
  return {
    /**
     * Fetches a paginated list of forbidden words based on query parameters.
     * Supports filtering by severity, category, active status, and keyword search.
     * @param params - Query parameters for filtering and pagination
     * @returns Promise resolving to paginated forbidden word list response
     * @example
     * ```typescript
     * const response = await repository.getForbiddenWords({
     *   severity: ForbiddenWordSeverity.HIGH,
     *   isActive: true,
     *   page: 1,
     *   pageSize: 50
     * });
     * ```
     */
    async getForbiddenWords(params: ForbiddenWordListQueryParams): Promise<ForbiddenWordListResponse> {
      const queryParams = new URLSearchParams();
      
      if (params.keyword) {
        queryParams.append('keyword', params.keyword);
      }
      if (params.severity) {
        queryParams.append('severity', params.severity);
      }
      if (params.category) {
        queryParams.append('category', params.category);
      }
      if (params.isActive !== undefined) {
        queryParams.append('isActive', String(params.isActive));
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
        ? `${COMPLIANCE_API.FORBIDDEN_WORDS}?${queryString}` 
        : COMPLIANCE_API.FORBIDDEN_WORDS;

      return http.get<ForbiddenWordListResponse>(url);
    },

    /**
     * Fetches a single forbidden word by its unique identifier.
     * Returns full details including alternatives and usage statistics.
     * @param id - Unique identifier of the forbidden word
     * @returns Promise resolving to the forbidden word entity
     * @throws Error if word is not found (404)
     */
    async getForbiddenWordById(id: string): Promise<ForbiddenWord> {
      const url = COMPLIANCE_API.FORBIDDEN_WORD_DETAIL.replace(':id', id);
      return http.get<ForbiddenWord>(url);
    },

    /**
     * Creates a new forbidden word entry.
     * Validates that the word doesn't already exist in the system.
     * @param data - Forbidden word creation data (word, severity, category, etc.)
     * @returns Promise resolving to the created forbidden word with generated ID
     * @throws Error if word already exists in the system
     */
    async createForbiddenWord(data: CreateForbiddenWordRequest): Promise<ForbiddenWord> {
      return http.post<ForbiddenWord>(COMPLIANCE_API.FORBIDDEN_WORDS, data);
    },

    /**
     * Updates an existing forbidden word entry.
     * Can update severity, category, alternatives, and active status.
     * @param id - Unique identifier of the forbidden word to update
     * @param data - Partial update data for the forbidden word
     * @returns Promise resolving to the updated forbidden word
     * @throws Error if word is not found
     */
    async updateForbiddenWord(id: string, data: UpdateForbiddenWordRequest): Promise<ForbiddenWord> {
      const url = COMPLIANCE_API.FORBIDDEN_WORD_DETAIL.replace(':id', id);
      return http.put<ForbiddenWord>(url, data);
    },

    /**
     * Deletes a forbidden word by its unique identifier.
     * This is a soft delete - word can be restored from audit records.
     * @param id - Unique identifier of the forbidden word to delete
     * @returns Promise resolving when deletion is complete
     */
    async deleteForbiddenWord(id: string): Promise<void> {
      const url = COMPLIANCE_API.FORBIDDEN_WORD_DETAIL.replace(':id', id);
      return http.delete<void>(url);
    },

    /**
     * Toggles the active status of a forbidden word.
     * Inactive words are not used in compliance checks.
     * @param id - Unique identifier of the forbidden word
     * @param isActive - New active status
     * @returns Promise resolving to the updated forbidden word
     */
    async toggleForbiddenWordStatus(id: string, isActive: boolean): Promise<ForbiddenWord> {
      const url = `${COMPLIANCE_API.FORBIDDEN_WORD_DETAIL.replace(':id', id)}/status`;
      return http.patch<ForbiddenWord>(url, { isActive });
    },

    /**
     * Bulk imports multiple forbidden words from a file or list.
     * Supports CSV or direct array input with duplicate handling.
     * @param request - Bulk import request with word list and options
     * @returns Promise resolving to import result with success/failure counts
     */
    async bulkImportForbiddenWords(request: BulkImportRequest): Promise<BulkImportResponse> {
      return http.post<BulkImportResponse>(COMPLIANCE_API.FORBIDDEN_WORDS_BULK_IMPORT, request);
    },

    /**
     * Exports forbidden words to downloadable format.
     * Supports CSV and Excel export formats.
     * @param format - Export format ('csv' or 'xlsx')
     * @param filters - Optional filters to apply before export
     * @returns Promise resolving to blob URL for download
     */
    async exportForbiddenWords(
      format: 'csv' | 'xlsx',
      filters?: ForbiddenWordListQueryParams
    ): Promise<Blob> {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      
      if (filters?.severity) {
        queryParams.append('severity', filters.severity);
      }
      if (filters?.category) {
        queryParams.append('category', filters.category);
      }
      if (filters?.isActive !== undefined) {
        queryParams.append('isActive', String(filters.isActive));
      }

      const url = `${COMPLIANCE_API.FORBIDDEN_WORDS_EXPORT}?${queryParams.toString()}`;
      return http.get<Blob>(url, {
        responseType: 'blob',
      } as any);
    },

    /**
     * Fetches all unique categories used by forbidden words.
     * Useful for building filter dropdowns.
     * @returns Promise resolving to array of category names with counts
     */
    async getForbiddenWordCategories(): Promise<Array<{
      category: string;
      count: number;
    }>> {
      return http.get(`${COMPLIANCE_API.FORBIDDEN_WORDS}/categories`);
    },

    /**
     * Gets usage statistics for a forbidden word.
     * Shows how many times it was detected in compliance checks.
     * @param id - Unique identifier of the forbidden word
     * @returns Promise resolving to usage statistics
     */
    async getForbiddenWordStats(id: string): Promise<{
      totalDetections: number;
      detectionsLast7Days: number;
      detectionsLast30Days: number;
      lastDetectedAt?: string;
    }> {
      const url = `${COMPLIANCE_API.FORBIDDEN_WORD_DETAIL.replace(':id', id)}/stats`;
      return http.get(url);
    },
  };
}

/**
 * Type definition for the forbidden word repository instance.
 * Used for dependency injection and type-safe repository access.
 */
export type ForbiddenWordRepository = ReturnType<typeof createForbiddenWordRepository>;
