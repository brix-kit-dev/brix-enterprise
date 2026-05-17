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
 * ViewModel hooks for compliance check operations.
 * Provides React hooks that encapsulate compliance checking business logic
 * following the MVVM pattern in v3.0.4 Runtime Shell Architecture.
 * @module compliance-ui-web/hooks/useComplianceCheck
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useHttp } from '@brix-sdk/runtime-sdk-react';
import type {
  ComplianceCheckResult,
  ComplianceAuditRecord,
  ComplianceCheckRequest,
  ComplianceMatch,
} from '@brix-sdk/enterprise-compliance-shared';
import {
  createComplianceCheckRepository,
  type AuditRecordQueryParams,
  type AuditRecordListResponse,
  type ComplianceStatistics,
} from '../repositories';

/**
 * State interface for compliance check operations.
 */
export interface ComplianceCheckState {
  /** Whether check is in progress */
  checking: boolean;
  /** Most recent check result */
  result: ComplianceCheckResult | null;
  /** Error message if check failed */
  error: string | null;
}

/**
 * Hook for performing compliance checks on text content.
 * Provides both full check and quick (real-time) check capabilities.
 * @returns Object containing check state and methods
 * @example
 * ```typescript
 * const { state, checkContent, quickCheck } = useComplianceCheck();
 * 
 * // Full check with audit logging
 * await checkContent({
 *   content: 'Text to check',
 *   contentType: 'SALES_SCRIPT',
 *   saveToAudit: true
 * });
 * 
 * // Quick real-time check
 * const result = await quickCheck('Text to check');
 * ```
 */
export function useComplianceCheck() {
  const http = useHttp();
  const repository = useMemo(() => createComplianceCheckRepository(http), [http]);

  const [state, setState] = useState<ComplianceCheckState>({
    checking: false,
    result: null,
    error: null,
  });

  /**
   * Performs a full compliance check with optional audit logging.
   */
  const checkContent = useCallback(
    async (request: ComplianceCheckRequest): Promise<ComplianceCheckResult | null> => {
      setState((prev) => ({ ...prev, checking: true, error: null }));

      try {
        const result = await repository.checkCompliance(request);
        setState({ checking: false, result, error: null });
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Compliance check failed';
        setState((prev) => ({
          ...prev,
          checking: false,
          error: errorMessage,
        }));
        return null;
      }
    },
    [repository]
  );

  /**
   * Performs a quick check without audit logging.
   * Suitable for real-time validation as user types.
   */
  const quickCheck = useCallback(
    async (content: string): Promise<{
      passed: boolean;
      matchCount: number;
      highSeverityCount: number;
      matches: Array<{
        word: string;
        position: number;
        length: number;
        severity: string;
      }>;
    } | null> => {
      try {
        return await repository.quickCheck(content);
      } catch (error) {
        return null;
      }
    },
    [repository]
  );

  /**
   * Gets suggested alternative text for content with violations.
   */
  const getSuggestion = useCallback(
    async (
      content: string,
      checkResult: ComplianceCheckResult
    ): Promise<{
      suggestedContent: string;
      replacements: Array<{
        original: string;
        replacement: string;
        position: number;
      }>;
    } | null> => {
      try {
        return await repository.getSuggestedAlternative(content, checkResult);
      } catch (error) {
        return null;
      }
    },
    [repository]
  );

  /**
   * Clears the current check result.
   */
  const clearResult = useCallback(() => {
    setState({ checking: false, result: null, error: null });
  }, []);

  return {
    state,
    checkContent,
    quickCheck,
    getSuggestion,
    clearResult,
  };
}

/**
 * Configuration for real-time compliance checking.
 */
export interface RealTimeCheckConfig {
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Minimum content length to trigger check (default: 3) */
  minLength?: number;
  /** Whether to enable real-time checking (default: true) */
  enabled?: boolean;
}

/**
 * State interface for real-time compliance check.
 */
export interface RealTimeCheckState {
  /** Whether a check is pending */
  pending: boolean;
  /** Current text content being monitored */
  content: string;
  /** Check result with match positions */
  matches: Array<{
    word: string;
    position: number;
    length: number;
    severity: string;
  }>;
  /** Whether content passes compliance */
  passed: boolean;
  /** Count of high severity violations */
  highSeverityCount: number;
}

/**
 * Hook for real-time compliance checking as user types.
 * Includes debouncing to prevent excessive API calls.
 * @param config - Configuration options for real-time checking
 * @returns Object containing real-time check state and methods
 * @example
 * ```typescript
 * const { state, setContent, highlightedContent } = useRealTimeComplianceCheck({
 *   debounceMs: 300,
 *   minLength: 3
 * });
 * 
 * // In your input handler
 * const handleChange = (e) => {
 *   setContent(e.target.value);
 * };
 * ```
 */
export function useRealTimeComplianceCheck(config: RealTimeCheckConfig = {}) {
  const { debounceMs = 300, minLength = 3, enabled = true } = config;

  const http = useHttp();
  const repository = useMemo(() => createComplianceCheckRepository(http), [http]);
  const debounceRef = useRef<number | null>(null);

  const [state, setState] = useState<RealTimeCheckState>({
    pending: false,
    content: '',
    matches: [],
    passed: true,
    highSeverityCount: 0,
  });

  /**
   * Updates content and triggers debounced check.
   */
  const setContent = useCallback(
    (content: string) => {
      setState((prev) => ({ ...prev, content, pending: true }));

      // Clear existing debounce timer
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }

      // Skip check if disabled or content too short
      if (!enabled || content.length < minLength) {
        setState((prev) => ({
          ...prev,
          content,
          pending: false,
          matches: [],
          passed: true,
          highSeverityCount: 0,
        }));
        return;
      }

      // Set new debounce timer
      debounceRef.current = window.setTimeout(async () => {
        try {
          const result = await repository.quickCheck(content);
          if (result) {
            setState((prev) => ({
              ...prev,
              pending: false,
              matches: result.matches,
              passed: result.passed,
              highSeverityCount: result.highSeverityCount,
            }));
          } else {
            setState((prev) => ({ ...prev, pending: false }));
          }
        } catch (error) {
          setState((prev) => ({ ...prev, pending: false }));
        }
      }, debounceMs);
    },
    [repository, enabled, minLength, debounceMs]
  );

  /**
   * Generates highlighted HTML content with violations marked.
   */
  const getHighlightedContent = useCallback((): string => {
    if (state.matches.length === 0) {
      return state.content;
    }

    // Sort matches by position in reverse order for replacement
    const sortedMatches = [...state.matches].sort((a, b) => b.position - a.position);

    let result = state.content;
    for (const match of sortedMatches) {
      const before = result.substring(0, match.position);
      const matched = result.substring(match.position, match.position + match.length);
      const after = result.substring(match.position + match.length);
      
      const severityClass = `compliance-violation-${match.severity.toLowerCase()}`;
      result = `${before}<mark class="${severityClass}" data-word="${match.word}">${matched}</mark>${after}`;
    }

    return result;
  }, [state.content, state.matches]);

  /**
   * Clears the current state.
   */
  const clear = useCallback(() => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }
    setState({
      pending: false,
      content: '',
      matches: [],
      passed: true,
      highSeverityCount: 0,
    });
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    state,
    setContent,
    getHighlightedContent,
    clear,
  };
}

/**
 * State interface for audit record list.
 */
export interface AuditListState {
  /** Array of audit records for current page */
  data: ComplianceAuditRecord[];
  /** Total count of matching records */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total available pages */
  totalPages: number;
  /** Loading state indicator */
  loading: boolean;
  /** Error message if operation failed */
  error: string | null;
}

/**
 * Filter configuration for audit records.
 */
export interface AuditFilters {
  /** Start date (ISO format) */
  startDate?: string;
  /** End date (ISO format) */
  endDate?: string;
  /** Filter by pass/fail status */
  passed?: boolean;
  /** Filter by content type */
  contentType?: string;
  /** Filter by operator */
  operatorId?: string;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Hook for managing compliance audit records.
 * @param initialFilters - Initial filter configuration
 * @param autoFetch - Whether to fetch on mount (default: true)
 * @returns Object containing audit list state and methods
 */
export function useComplianceAuditList(
  initialFilters?: AuditFilters,
  autoFetch: boolean = true
) {
  const http = useHttp();
  const repository = useMemo(() => createComplianceCheckRepository(http), [http]);

  const [state, setState] = useState<AuditListState>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    loading: false,
    error: null,
  });

  const [filters, setFilters] = useState<AuditFilters>(initialFilters || {});

  /**
   * Fetches audit records with current filters and pagination.
   */
  const fetchRecords = useCallback(
    async (page: number = state.page, pageSize: number = state.pageSize) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const params: AuditRecordQueryParams = {
          ...filters,
          page,
          pageSize,
        };

        const response: AuditRecordListResponse = await repository.getAuditRecords(params);

        setState({
          data: response.items,
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
          totalPages: response.totalPages,
          loading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch audit records';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    },
    [repository, filters, state.page, state.pageSize]
  );

  /**
   * Updates filters and triggers a new fetch from page 1.
   */
  const updateFilters = useCallback(
    (newFilters: Partial<AuditFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  /**
   * Navigates to a specific page.
   */
  const setPage = useCallback(
    (page: number) => {
      fetchRecords(page, state.pageSize);
    },
    [fetchRecords, state.pageSize]
  );

  /**
   * Changes the page size and resets to page 1.
   */
  const setPageSize = useCallback(
    (pageSize: number) => {
      fetchRecords(1, pageSize);
    },
    [fetchRecords]
  );

  /**
   * Refreshes current page data.
   */
  const refresh = useCallback(() => {
    fetchRecords(state.page, state.pageSize);
  }, [fetchRecords, state.page, state.pageSize]);

  /**
   * Resets filters and pagination to initial state.
   */
  const reset = useCallback(() => {
    setFilters(initialFilters || {});
    fetchRecords(1, 20);
  }, [fetchRecords, initialFilters]);

  // Auto-fetch on mount and filter changes
  useEffect(() => {
    if (autoFetch) {
      fetchRecords(1, state.pageSize);
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    state,
    filters,
    fetchRecords,
    setFilters: updateFilters,
    setPage,
    setPageSize,
    refresh,
    reset,
  };
}

/**
 * Hook for compliance statistics dashboard.
 * @param days - Number of days to include (default: 30)
 * @param autoFetch - Whether to fetch on mount (default: true)
 * @returns Object containing statistics state and methods
 */
export function useComplianceStatistics(days: number = 30, autoFetch: boolean = true) {
  const http = useHttp();
  const repository = useMemo(() => createComplianceCheckRepository(http), [http]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<ComplianceStatistics | null>(null);

  /**
   * Fetches compliance statistics.
   */
  const fetchStatistics = useCallback(
    async (daysParam: number = days): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const stats = await repository.getComplianceStatistics(daysParam);
        setStatistics(stats);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch statistics';
        setError(errorMessage);
        setLoading(false);
      }
    },
    [repository, days]
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchStatistics(days);
    }
  }, [autoFetch, days]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    loading,
    error,
    statistics,
    fetchStatistics,
    refresh: () => fetchStatistics(days),
  };
}

/**
 * Hook for exporting audit records.
 * @returns Object containing export method and state
 */
export function useAuditExport() {
  const http = useHttp();
  const repository = useMemo(() => createComplianceCheckRepository(http), [http]);

  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Exports audit records to file.
   */
  const exportRecords = useCallback(
    async (format: 'csv' | 'xlsx', filters?: AuditFilters): Promise<void> => {
      setExporting(true);
      setError(null);

      try {
        const blob = await repository.exportAuditRecords(format, filters);
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `compliance-audit-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setExporting(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to export records';
        setError(errorMessage);
        setExporting(false);
      }
    },
    [repository]
  );

  return {
    exporting,
    error,
    exportRecords,
  };
}
