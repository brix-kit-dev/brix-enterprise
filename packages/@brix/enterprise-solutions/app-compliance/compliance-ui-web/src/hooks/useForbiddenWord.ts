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
 * ViewModel hooks for forbidden word operations.
 * Provides React hooks that encapsulate forbidden word business logic
 * following the MVVM pattern in v3.0.4 Runtime Shell Architecture.
 * @module compliance-ui-web/hooks/useForbiddenWord
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useHttp } from '@brix-sdk/runtime-sdk-react';
import type {
  ForbiddenWord,
  ForbiddenWordListQueryParams,
  CreateForbiddenWordRequest,
  UpdateForbiddenWordRequest,
  ForbiddenWordSeverity,
  ForbiddenWordCategory,
} from '@brix-sdk/enterprise-compliance-shared';
import {
  createForbiddenWordRepository,
  type ForbiddenWordListResponse,
  type BulkImportRequest,
  type BulkImportResponse,
} from '../repositories';

/**
 * State interface for forbidden word list operations.
 */
export interface ForbiddenWordListState {
  /** Array of forbidden words for current page */
  data: ForbiddenWord[];
  /** Total count of matching words */
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
 * Filter configuration for forbidden word list.
 */
export interface ForbiddenWordFilters {
  /** Search keyword */
  keyword?: string;
  /** Filter by severity level */
  severity?: ForbiddenWordSeverity;
  /** Filter by category */
  category?: ForbiddenWordCategory;
  /** Filter by active status */
  isActive?: boolean;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Hook for managing forbidden word list with filtering and pagination.
 * @param initialFilters - Initial filter configuration
 * @param autoFetch - Whether to fetch on mount (default: true)
 * @returns Object containing list state and control methods
 * @example
 * ```typescript
 * const {
 *   state,
 *   fetchWords,
 *   setFilters,
 *   setPage,
 *   toggleStatus
 * } = useForbiddenWordList({ severity: ForbiddenWordSeverity.HIGH });
 * ```
 */
export function useForbiddenWordList(
  initialFilters?: ForbiddenWordFilters,
  autoFetch: boolean = true
) {
  const http = useHttp();
  const repository = useMemo(() => createForbiddenWordRepository(http), [http]);

  const [state, setState] = useState<ForbiddenWordListState>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 0,
    loading: false,
    error: null,
  });

  const [filters, setFilters] = useState<ForbiddenWordFilters>(initialFilters || {});

  /**
   * Fetches forbidden words with current filters and pagination.
   */
  const fetchWords = useCallback(
    async (page: number = state.page, pageSize: number = state.pageSize) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const params: ForbiddenWordListQueryParams = {
          ...filters,
          page,
          pageSize,
        };

        const response: ForbiddenWordListResponse = await repository.getForbiddenWords(params);

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
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch forbidden words';
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
    (newFilters: Partial<ForbiddenWordFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  /**
   * Navigates to a specific page.
   */
  const setPage = useCallback(
    (page: number) => {
      fetchWords(page, state.pageSize);
    },
    [fetchWords, state.pageSize]
  );

  /**
   * Changes the page size and resets to page 1.
   */
  const setPageSize = useCallback(
    (pageSize: number) => {
      fetchWords(1, pageSize);
    },
    [fetchWords]
  );

  /**
   * Refreshes current page data.
   */
  const refresh = useCallback(() => {
    fetchWords(state.page, state.pageSize);
  }, [fetchWords, state.page, state.pageSize]);

  /**
   * Toggles the active status of a forbidden word.
   */
  const toggleStatus = useCallback(
    async (id: string, isActive: boolean): Promise<boolean> => {
      try {
        const updated = await repository.toggleForbiddenWordStatus(id, isActive);
        setState((prev) => ({
          ...prev,
          data: prev.data.map((word) =>
            word.id === id ? updated : word
          ),
        }));
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
        setState((prev) => ({ ...prev, error: errorMessage }));
        return false;
      }
    },
    [repository]
  );

  /**
   * Deletes a forbidden word from the list.
   */
  const deleteWord = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await repository.deleteForbiddenWord(id);
        setState((prev) => ({
          ...prev,
          data: prev.data.filter((word) => word.id !== id),
          total: prev.total - 1,
        }));
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete word';
        setState((prev) => ({ ...prev, error: errorMessage }));
        return false;
      }
    },
    [repository]
  );

  /**
   * Resets filters and pagination to initial state.
   */
  const reset = useCallback(() => {
    setFilters(initialFilters || {});
    fetchWords(1, 50);
  }, [fetchWords, initialFilters]);

  // Auto-fetch on mount and filter changes
  useEffect(() => {
    if (autoFetch) {
      fetchWords(1, state.pageSize);
    }
  }, [filters]);

  return {
    state,
    filters,
    fetchWords,
    setFilters: updateFilters,
    setPage,
    setPageSize,
    refresh,
    reset,
    toggleStatus,
    deleteWord,
  };
}

/**
 * State interface for single forbidden word detail.
 */
export interface ForbiddenWordDetailState {
  /** Forbidden word data */
  data: ForbiddenWord | null;
  /** Loading state indicator */
  loading: boolean;
  /** Error message if operation failed */
  error: string | null;
  /** Usage statistics */
  stats: {
    totalDetections: number;
    detectionsLast7Days: number;
    detectionsLast30Days: number;
    lastDetectedAt?: string;
  } | null;
}

/**
 * Hook for fetching and managing a single forbidden word detail.
 * @param wordId - The unique identifier of the forbidden word
 * @param autoFetch - Whether to fetch on mount (default: true)
 * @returns Object containing word state and action methods
 */
export function useForbiddenWordDetail(wordId: string, autoFetch: boolean = true) {
  const http = useHttp();
  const repository = useMemo(() => createForbiddenWordRepository(http), [http]);

  const [state, setState] = useState<ForbiddenWordDetailState>({
    data: null,
    loading: false,
    error: null,
    stats: null,
  });

  /**
   * Fetches the forbidden word detail.
   */
  const fetchWord = useCallback(async () => {
    if (!wordId) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const word = await repository.getForbiddenWordById(wordId);
      setState((prev) => ({
        ...prev,
        data: word,
        loading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch forbidden word';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [repository, wordId]);

  /**
   * Fetches usage statistics for the word.
   */
  const fetchStats = useCallback(async () => {
    if (!wordId) return;

    try {
      const stats = await repository.getForbiddenWordStats(wordId);
      setState((prev) => ({ ...prev, stats }));
    } catch (error) {
    }
  }, [repository, wordId]);

  /**
   * Updates the forbidden word.
   */
  const update = useCallback(
    async (data: UpdateForbiddenWordRequest): Promise<boolean> => {
      if (!wordId) return false;

      try {
        const updated = await repository.updateForbiddenWord(wordId, data);
        setState((prev) => ({ ...prev, data: updated }));
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update word';
        setState((prev) => ({ ...prev, error: errorMessage }));
        return false;
      }
    },
    [repository, wordId]
  );

  /**
   * Toggles the active status.
   */
  const toggleStatus = useCallback(
    async (isActive: boolean): Promise<boolean> => {
      if (!wordId) return false;

      try {
        const updated = await repository.toggleForbiddenWordStatus(wordId, isActive);
        setState((prev) => ({ ...prev, data: updated }));
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to toggle status';
        setState((prev) => ({ ...prev, error: errorMessage }));
        return false;
      }
    },
    [repository, wordId]
  );

  /**
   * Deletes the forbidden word.
   */
  const deleteWord = useCallback(async (): Promise<boolean> => {
    if (!wordId) return false;

    try {
      await repository.deleteForbiddenWord(wordId);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete word';
      setState((prev) => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, [repository, wordId]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && wordId) {
      fetchWord();
    }
  }, [autoFetch, wordId]);

  return {
    state,
    fetchWord,
    fetchStats,
    update,
    toggleStatus,
    deleteWord,
    refresh: fetchWord,
  };
}

/**
 * State interface for forbidden word create/edit operations.
 */
export interface ForbiddenWordFormState {
  /** Whether form submission is in progress */
  submitting: boolean;
  /** Validation errors by field */
  validationErrors: Record<string, string>;
  /** General submission error */
  error: string | null;
}

/**
 * Hook for creating and updating forbidden words.
 * @returns Object containing form state and action methods
 */
export function useForbiddenWordForm() {
  const http = useHttp();
  const repository = useMemo(() => createForbiddenWordRepository(http), [http]);

  const [state, setState] = useState<ForbiddenWordFormState>({
    submitting: false,
    validationErrors: {},
    error: null,
  });

  /**
   * Creates a new forbidden word.
   */
  const create = useCallback(
    async (data: CreateForbiddenWordRequest): Promise<ForbiddenWord | null> => {
      setState((prev) => ({
        ...prev,
        submitting: true,
        error: null,
        validationErrors: {},
      }));

      try {
        const word = await repository.createForbiddenWord(data);
        setState((prev) => ({ ...prev, submitting: false }));
        return word;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create forbidden word';
        setState((prev) => ({
          ...prev,
          submitting: false,
          error: errorMessage,
        }));
        return null;
      }
    },
    [repository]
  );

  /**
   * Updates an existing forbidden word.
   */
  const update = useCallback(
    async (id: string, data: UpdateForbiddenWordRequest): Promise<ForbiddenWord | null> => {
      setState((prev) => ({
        ...prev,
        submitting: true,
        error: null,
        validationErrors: {},
      }));

      try {
        const word = await repository.updateForbiddenWord(id, data);
        setState((prev) => ({ ...prev, submitting: false }));
        return word;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update forbidden word';
        setState((prev) => ({
          ...prev,
          submitting: false,
          error: errorMessage,
        }));
        return null;
      }
    },
    [repository]
  );

  /**
   * Clears form state and errors.
   */
  const reset = useCallback(() => {
    setState({
      submitting: false,
      validationErrors: {},
      error: null,
    });
  }, []);

  /**
   * Sets a field validation error.
   */
  const setFieldError = useCallback((field: string, message: string) => {
    setState((prev) => ({
      ...prev,
      validationErrors: {
        ...prev.validationErrors,
        [field]: message,
      },
    }));
  }, []);

  /**
   * Clears a specific field error.
   */
  const clearFieldError = useCallback((field: string) => {
    setState((prev) => {
      const { [field]: _, ...rest } = prev.validationErrors;
      return { ...prev, validationErrors: rest };
    });
  }, []);

  return {
    state,
    create,
    update,
    reset,
    setFieldError,
    clearFieldError,
  };
}

/**
 * State interface for bulk import operations.
 */
export interface BulkImportState {
  /** Whether import is in progress */
  importing: boolean;
  /** Import result */
  result: BulkImportResponse | null;
  /** Error message if operation failed */
  error: string | null;
}

/**
 * Hook for bulk importing forbidden words.
 * @returns Object containing import state and methods
 */
export function useForbiddenWordBulkImport() {
  const http = useHttp();
  const repository = useMemo(() => createForbiddenWordRepository(http), [http]);

  const [state, setState] = useState<BulkImportState>({
    importing: false,
    result: null,
    error: null,
  });

  /**
   * Performs bulk import of forbidden words.
   */
  const importWords = useCallback(
    async (request: BulkImportRequest): Promise<BulkImportResponse | null> => {
      setState({ importing: true, result: null, error: null });

      try {
        const result = await repository.bulkImportForbiddenWords(request);
        setState({ importing: false, result, error: null });
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to import words';
        setState({ importing: false, result: null, error: errorMessage });
        return null;
      }
    },
    [repository]
  );

  /**
   * Resets import state.
   */
  const reset = useCallback(() => {
    setState({ importing: false, result: null, error: null });
  }, []);

  return {
    state,
    importWords,
    reset,
  };
}

/**
 * Hook for exporting forbidden words.
 * @returns Object containing export method and state
 */
export function useForbiddenWordExport() {
  const http = useHttp();
  const repository = useMemo(() => createForbiddenWordRepository(http), [http]);

  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Exports forbidden words to file.
   */
  const exportWords = useCallback(
    async (format: 'csv' | 'xlsx', filters?: ForbiddenWordFilters): Promise<void> => {
      setExporting(true);
      setError(null);

      try {
        const blob = await repository.exportForbiddenWords(format, filters);
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `forbidden-words-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setExporting(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to export words';
        setError(errorMessage);
        setExporting(false);
      }
    },
    [repository]
  );

  return {
    exporting,
    error,
    exportWords,
  };
}
