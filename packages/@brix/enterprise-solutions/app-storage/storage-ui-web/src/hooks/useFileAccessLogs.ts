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
 * @file File Access Logs Hook
 * @description ViewModel layer hook for file access log management
 * @module @brix-sdk/enterprise-storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 MVVM architecture, this hook provides:
 * 1. Access log list fetching with pagination
 * 2. Filtering by action type, user, and date range
 * 3. Audit compliance data access
 *
 * Architecture Compliance (Red Line R3):
 * - All HTTP operations via Repository -> HttpCapability chain
 * - State management encapsulated in hook
 * - View layer receives reactive state only
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp } from '@brix-sdk/runtime-sdk-react';
import type {
  FileAccessLog,
  AccessLogQueryParams,
  AccessAction,
  PagedResponse,
} from '@brix-sdk/enterprise-storage-shared';
import { createFileRepository } from '../repositories';

// ============================================================================
// Hook Return Type
// ============================================================================

/**
 * File Access Logs Hook Return Type
 */
export interface UseFileAccessLogsResult {
  /** List of access log entries */
  logs: FileAccessLog[];

  /** Loading state */
  isLoading: boolean;

  /** Error object if request failed */
  error: Error | null;

  /** Pagination information */
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };

  /** Current filter parameters */
  params: AccessLogQueryParams;

  /** Refresh the log list */
  refresh: () => Promise<void>;

  /** Set page number (0-based) */
  setPage: (page: number) => void;

  /** Set page size */
  setPageSize: (size: number) => void;

  /** Filter by action type */
  filterByAction: (action: AccessAction | undefined) => void;

  /** Filter by user ID */
  filterByUser: (userId: string | undefined) => void;

  /** Filter by date range */
  filterByDateRange: (dateFrom: string | undefined, dateTo: string | undefined) => void;

  /** Clear all filters */
  clearFilters: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * File Access Logs Hook
 *
 * Manages file access log data for audit compliance.
 * Follows v3.0.4 ViewModel pattern.
 *
 * @param fileId - File ID to fetch access logs for
 * @param initialParams - Optional initial query parameters
 * @returns Access log state and operations
 *
 * @example
 * ```tsx
 * function FileDetailPage() {
 *   const { id } = useParams<{ id: string }>();
 *   const {
 *     logs,
 *     isLoading,
 *     pagination,
 *     setPage,
 *     filterByAction,
 *   } = useFileAccessLogs(id!);
 *
 *   return (
 *     <div>
 *       <AccessLogTable
 *         data={logs}
 *         loading={isLoading}
 *         pagination={pagination}
 *         onPageChange={setPage}
 *         onFilterAction={filterByAction}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function useFileAccessLogs(
  fileId: string,
  initialParams?: AccessLogQueryParams
): UseFileAccessLogsResult {
  // Obtain HttpCapability from RuntimeContext
  const http = useHttp();

  // State management
  const [logs, setLogs] = useState<FileAccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<AccessLogQueryParams>({
    page: 0,
    size: 20,
    ...initialParams,
  });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    total: 0,
    totalPages: 0,
  });

  // Create repository instance (memoized)
  const repository = useMemo(
    () => createFileRepository(http),
    [http]
  );

  // Load access logs
  const loadData = useCallback(async () => {
    if (!fileId) {
      setError(new Error('File ID is required'));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response: PagedResponse<FileAccessLog> = await repository.getAccessLogs(
        fileId,
        params
      );

      setLogs(response.content);
      setPagination({
        page: response.number,
        size: response.size,
        total: response.totalElements,
        totalPages: response.totalPages,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error(String(err));
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [repository, fileId, params]);

  // Reload when params or fileId change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh function
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Pagination controls
  const setPage = useCallback((page: number) => {
    setParams((prev: AccessLogQueryParams) => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setParams((prev: AccessLogQueryParams) => ({ ...prev, size, page: 0 }));
  }, []);

  // Filter functions
  const filterByAction = useCallback((action: AccessAction | undefined) => {
    setParams((prev: AccessLogQueryParams) => ({
      ...prev,
      action,
      page: 0,
    }));
  }, []);

  const filterByUser = useCallback((userId: string | undefined) => {
    setParams((prev: AccessLogQueryParams) => ({
      ...prev,
      userId,
      page: 0,
    }));
  }, []);

  const filterByDateRange = useCallback(
    (dateFrom: string | undefined, dateTo: string | undefined) => {
      setParams((prev: AccessLogQueryParams) => ({
        ...prev,
        dateFrom,
        dateTo,
        page: 0,
      }));
    },
    []
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setParams({
      page: 0,
      size: 20,
    });
  }, []);

  return {
    logs,
    isLoading,
    error,
    pagination,
    params,
    refresh,
    setPage,
    setPageSize,
    filterByAction,
    filterByUser,
    filterByDateRange,
    clearFilters,
  };
}
