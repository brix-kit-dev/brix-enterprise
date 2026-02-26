/**
 * Repository for compliance check operations.
 * Provides data access methods for running compliance checks on text content
 * and retrieving audit records following the Repository pattern in
 * v3.0.4 Runtime Shell Architecture.
 * All HTTP calls are made through the HttpCapability to ensure proper
 * cross-cutting concerns handling (auth, logging, error handling).
 * @module compliance-ui-web/repositories/complianceCheckRepository
 */

import type { HttpCapability } from '@brix/runtime-sdk-react';
import type {
  ComplianceCheckResult,
  ComplianceAuditRecord,
  ComplianceCheckRequest,
} from '@shinwa/compliance-shared';
import { COMPLIANCE_API } from '@shinwa/compliance-shared';

/**
 * Query parameters for fetching audit records.
 */
export interface AuditRecordQueryParams {
  /** Start date for filtering (ISO format) */
  startDate?: string;
  /** End date for filtering (ISO format) */
  endDate?: string;
  /** Filter by check result (passed/failed) */
  passed?: boolean;
  /** Filter by content type */
  contentType?: string;
  /** Filter by operator ID */
  operatorId?: string;
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response structure for audit record queries.
 */
export interface AuditRecordListResponse {
  /** Array of audit record items for the current page */
  items: ComplianceAuditRecord[];
  /** Total count of all matching records */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages available */
  totalPages: number;
}

/**
 * Compliance statistics for dashboard display.
 */
export interface ComplianceStatistics {
  /** Total checks performed */
  totalChecks: number;
  /** Checks that passed compliance */
  passedChecks: number;
  /** Checks that failed compliance */
  failedChecks: number;
  /** Pass rate as percentage */
  passRate: number;
  /** Most common violations */
  topViolations: Array<{
    word: string;
    count: number;
    severity: string;
  }>;
  /** Checks by day for charting */
  checksByDay: Array<{
    date: string;
    total: number;
    passed: number;
    failed: number;
  }>;
}

/**
 * Compliance check repository factory function.
 * Creates a repository instance bound to the provided HttpCapability.
 * @param http - The HttpCapability instance injected from the runtime
 * @returns Repository object with compliance check operations
 */
export function createComplianceCheckRepository(http: HttpCapability) {
  return {
    /**
     * Performs a compliance check on the provided text content.
     * Detects forbidden words and returns matches with positions.
     * @param request - Compliance check request with text and options
     * @returns Promise resolving to detailed check results
     * @example
     * ```typescript
     * const result = await repository.checkCompliance({
     *   content: 'Sample text to check for compliance',
     *   contentType: 'SALES_SCRIPT',
     *   saveToAudit: true
     * });
     * if (!result.passed) {
     *   console.log('Violations found:', result.matches);
     * }
     * ```
     */
    async checkCompliance(request: ComplianceCheckRequest): Promise<ComplianceCheckResult> {
      return http.post<ComplianceCheckResult>(COMPLIANCE_API.COMPLIANCE_CHECK, request);
    },

    /**
     * Performs a quick compliance check without saving to audit log.
     * Used for real-time validation as user types.
     * @param content - Text content to check
     * @returns Promise resolving to simplified check result
     */
    async quickCheck(content: string): Promise<{
      passed: boolean;
      matchCount: number;
      highSeverityCount: number;
      matches: Array<{
        word: string;
        position: number;
        length: number;
        severity: string;
      }>;
    }> {
      return http.post(`${COMPLIANCE_API.COMPLIANCE_CHECK}/quick`, { content });
    },

    /**
     * Fetches paginated audit records of past compliance checks.
     * @param params - Query parameters for filtering and pagination
     * @returns Promise resolving to paginated audit record list
     */
    async getAuditRecords(params: AuditRecordQueryParams): Promise<AuditRecordListResponse> {
      const queryParams = new URLSearchParams();
      
      if (params.startDate) {
        queryParams.append('startDate', params.startDate);
      }
      if (params.endDate) {
        queryParams.append('endDate', params.endDate);
      }
      if (params.passed !== undefined) {
        queryParams.append('passed', String(params.passed));
      }
      if (params.contentType) {
        queryParams.append('contentType', params.contentType);
      }
      if (params.operatorId) {
        queryParams.append('operatorId', params.operatorId);
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
        ? `${COMPLIANCE_API.COMPLIANCE_AUDIT}?${queryString}` 
        : COMPLIANCE_API.COMPLIANCE_AUDIT;

      return http.get<AuditRecordListResponse>(url);
    },

    /**
     * Fetches a single audit record by its unique identifier.
     * @param id - Unique identifier of the audit record
     * @returns Promise resolving to the audit record entity
     */
    async getAuditRecordById(id: string): Promise<ComplianceAuditRecord> {
      const url = `${COMPLIANCE_API.COMPLIANCE_AUDIT}/${id}`;
      return http.get<ComplianceAuditRecord>(url);
    },

    /**
     * Fetches compliance statistics for dashboard display.
     * @param days - Number of days to include in statistics (default: 30)
     * @returns Promise resolving to comprehensive statistics
     */
    async getComplianceStatistics(days: number = 30): Promise<ComplianceStatistics> {
      return http.get<ComplianceStatistics>(`${COMPLIANCE_API.COMPLIANCE_CHECK}/statistics`, {
        params: { days },
      } as any);
    },

    /**
     * Exports audit records to downloadable format.
     * @param format - Export format ('csv' or 'xlsx')
     * @param filters - Optional filters to apply before export
     * @returns Promise resolving to blob for download
     */
    async exportAuditRecords(
      format: 'csv' | 'xlsx',
      filters?: AuditRecordQueryParams
    ): Promise<Blob> {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      
      if (filters?.startDate) {
        queryParams.append('startDate', filters.startDate);
      }
      if (filters?.endDate) {
        queryParams.append('endDate', filters.endDate);
      }
      if (filters?.passed !== undefined) {
        queryParams.append('passed', String(filters.passed));
      }

      const url = `${COMPLIANCE_API.COMPLIANCE_AUDIT}/export?${queryParams.toString()}`;
      return http.get<Blob>(url, {
        responseType: 'blob',
      } as any);
    },

    /**
     * Gets suggested alternative text for content with violations.
     * Uses configured alternatives from forbidden word definitions.
     * @param content - Original content with violations
     * @param checkResult - Previous check result to use for suggestions
     * @returns Promise resolving to suggested compliant alternative
     */
    async getSuggestedAlternative(
      content: string,
      checkResult: ComplianceCheckResult
    ): Promise<{
      suggestedContent: string;
      replacements: Array<{
        original: string;
        replacement: string;
        position: number;
      }>;
    }> {
      return http.post(`${COMPLIANCE_API.COMPLIANCE_CHECK}/suggest`, {
        content,
        matches: checkResult.matches,
      });
    },
  };
}

/**
 * Type definition for the compliance check repository instance.
 * Used for dependency injection and type-safe repository access.
 */
export type ComplianceCheckRepository = ReturnType<typeof createComplianceCheckRepository>;
