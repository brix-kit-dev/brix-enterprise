/**
 * @file File List Hook
 * @description ViewModel layer hook for file list management
 * @module @shinwa/storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 MVVM architecture, this hook serves as the ViewModel layer:
 * 1. Encapsulates file list business logic and state management
 * 2. Obtains HttpCapability via useHttp() hook
 * 3. Calls Repository layer for data access
 * 4. Provides reactive state and operation methods to View layer
 *
 * Architecture Compliance (Red Line R3):
 * - Hooks access data via Repository layer, direct fetch/axios is forbidden
 * - Hooks do not contain UI rendering logic
 * - HttpCapability is injected via useHttp()
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp } from '@brix/runtime-sdk-react';
import type {
  FileSummary,
  FileQueryParams,
  FileStatus,
  FileCategory,
  PagedResponse,
} from '@shinwa/storage-shared';
import { createFileRepository } from '../repositories';

// ============================================================================
// Hook Return Type
// ============================================================================

/**
 * File List Hook Return Type
 *
 * Provides all state and operations needed for file list management.
 */
export interface UseFileListResult {
  /** List of file summaries */
  items: FileSummary[];

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
  params: FileQueryParams;

  /** Refresh the file list */
  refresh: () => Promise<void>;

  /** Set page number (0-based) */
  setPage: (page: number) => void;

  /** Set page size */
  setPageSize: (size: number) => void;

  /** Search by keyword */
  search: (keyword: string) => void;

  /** Filter by file status */
  filterByStatus: (status: FileStatus | undefined) => void;

  /** Filter by file category */
  filterByCategory: (category: FileCategory | undefined) => void;

  /** Filter by related entity */
  filterByEntity: (entityType: string | undefined, entityId: string | undefined) => void;

  /** Delete a file from the list */
  deleteItem: (id: string) => Promise<void>;

  /** Clear all filters */
  clearFilters: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * File List Hook
 *
 * Manages file list data fetching, pagination, filtering, and deletion.
 * Follows v3.0.4 ViewModel pattern.
 *
 * @param initialParams - Optional initial query parameters
 * @returns File list state and operations
 *
 * @example
 * ```tsx
 * function FileListPage() {
 *   const {
 *     items,
 *     isLoading,
 *     error,
 *     pagination,
 *     search,
 *     filterByCategory,
 *     deleteItem,
 *   } = useFileList();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorDisplay error={error} />;
 *
 *   return (
 *     <FileGrid
 *       files={items}
 *       onSearch={search}
 *       onFilterCategory={filterByCategory}
 *       onDelete={deleteItem}
 *     />
 *   );
 * }
 * ```
 */
export function useFileList(initialParams?: FileQueryParams): UseFileListResult {
  // Obtain HttpCapability from RuntimeContext via hook
  const http = useHttp();

  // State management
  const [items, setItems] = useState<FileSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<FileQueryParams>({
    page: 0,
    size: 20,
    sort: 'uploadedAt',
    direction: 'desc',
    ...initialParams,
  });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    total: 0,
    totalPages: 0,
  });

  // Create repository instance using factory pattern (memoized to avoid recreation)
  const repository = useMemo(
    () => createFileRepository(http),
    [http]
  );

  // Data loading function
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response: PagedResponse<FileSummary> = await repository.list(params);

      setItems(response.content);
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
  }, [repository, params]);

  // Reload when params change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh function
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Pagination controls
  const setPage = useCallback((page: number) => {
    setParams((prev: FileQueryParams) => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setParams((prev: FileQueryParams) => ({ ...prev, size, page: 0 }));
  }, []);

  // Search function
  const search = useCallback((keyword: string) => {
    setParams((prev: FileQueryParams) => ({
      ...prev,
      keyword: keyword || undefined,
      page: 0,
    }));
  }, []);

  // Filter functions
  const filterByStatus = useCallback((status: FileStatus | undefined) => {
    setParams((prev: FileQueryParams) => ({
      ...prev,
      status,
      page: 0,
    }));
  }, []);

  const filterByCategory = useCallback((category: FileCategory | undefined) => {
    setParams((prev: FileQueryParams) => ({
      ...prev,
      category,
      page: 0,
    }));
  }, []);

  const filterByEntity = useCallback(
    (entityType: string | undefined, entityId: string | undefined) => {
      setParams((prev: FileQueryParams) => ({
        ...prev,
        relatedEntityType: entityType,
        relatedEntityId: entityId,
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
      sort: 'uploadedAt',
      direction: 'desc',
    });
  }, []);

  // Delete file operation
  const deleteItem = useCallback(
    async (id: string) => {
      try {
        await repository.delete(id);
        // Remove from local state for immediate UI feedback
        setItems((prev: FileSummary[]) => prev.filter((item: FileSummary) => item.id !== id));
        // Update total count
        setPagination((prev: { page: number; size: number; total: number; totalPages: number }) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err : new Error(String(err));
        setError(errorMessage);
        throw errorMessage;
      }
    },
    [repository]
  );

  return {
    items,
    isLoading,
    error,
    pagination,
    params,
    refresh,
    setPage,
    setPageSize,
    search,
    filterByStatus,
    filterByCategory,
    filterByEntity,
    deleteItem,
    clearFilters,
  };
}
