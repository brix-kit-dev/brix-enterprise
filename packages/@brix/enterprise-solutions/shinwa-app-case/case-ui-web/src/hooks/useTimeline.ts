/**
 * @file Timeline Hook
 * @description ViewModel layer for case timeline operations
 * @module @shinwa/case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 blueprint MVVM architecture.
 * This hook manages timeline events for a case.
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp } from '@brix/runtime-sdk-react';
import type { TimelineEventDTO, PagedResponse } from '@shinwa/case-shared';
import { createTimelineRepository, type TimelineQueryParams } from '../repositories';

// ============================================================================
// Hook Result Types
// ============================================================================

/**
 * Timeline Hook Result Type
 */
export interface UseTimelineResult {
  /** Timeline events */
  events: TimelineEventDTO[];
  /** Loading state */
  isLoading: boolean;
  /** Error object */
  error: Error | null;
  /** Has more events to load */
  hasMore: boolean;
  /** Pagination info */
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
  /** Refresh timeline */
  refresh: () => Promise<void>;
  /** Load more events (append to existing) */
  loadMore: () => Promise<void>;
  /** Filter by event type */
  filterByType: (type: string | undefined) => void;
  /** Filter by date range */
  filterByDateRange: (startDate: string | undefined, endDate: string | undefined) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Timeline Hook
 *
 * Encapsulates timeline data retrieval with pagination and filtering.
 *
 * @param caseId - Case ID to load timeline for
 * @returns Timeline state and operation methods
 *
 * @example
 * ```tsx
 * const { events, isLoading, hasMore, loadMore, filterByType } = useTimeline(caseId);
 * ```
 */
export function useTimeline(caseId: number | string): UseTimelineResult {
  const http = useHttp();
  const numericCaseId = typeof caseId === 'string' ? Number(caseId) : caseId;

  // State
  const [events, setEvents] = useState<TimelineEventDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<TimelineQueryParams>({
    page: 0,
    size: 20,
  });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    total: 0,
    totalPages: 0,
  });

  // Create Repository instance
  const repository = useMemo(
    () => createTimelineRepository(http),
    [http]
  );

  /**
   * Check if there are more events to load
   */
  const hasMore = useMemo(() => {
    return pagination.page < pagination.totalPages - 1;
  }, [pagination]);

  /**
   * Load timeline events
   */
  const loadEvents = useCallback(async (append: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const response: PagedResponse<TimelineEventDTO> = await repository.getEvents(
        numericCaseId,
        params
      );

      if (append) {
        setEvents(prev => [...prev, ...response.content]);
      } else {
        setEvents(response.content);
      }

      setPagination({
        page: response.number,
        size: response.size,
        total: response.totalElements,
        totalPages: response.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [repository, numericCaseId, params]);

  // Load on mount and params change
  useEffect(() => {
    if (numericCaseId) {
      loadEvents(false);
    }
  }, [numericCaseId, params]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Refresh timeline (reload from beginning)
   */
  const refresh = useCallback(async () => {
    setParams(prev => ({ ...prev, page: 0 }));
    await loadEvents(false);
  }, [loadEvents]);

  /**
   * Load more events (append mode)
   */
  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      setParams(prev => ({ ...prev, page: prev.page! + 1 }));
      await loadEvents(true);
    }
  }, [hasMore, isLoading, loadEvents]);

  /**
   * Filter by event type
   */
  const filterByType = useCallback((type: string | undefined) => {
    setParams(prev => ({ ...prev, type, page: 0 }));
    setEvents([]); // Clear for new filter
  }, []);

  /**
   * Filter by date range
   */
  const filterByDateRange = useCallback((
    startDate: string | undefined,
    endDate: string | undefined
  ) => {
    setParams(prev => ({ ...prev, startDate, endDate, page: 0 }));
    setEvents([]); // Clear for new filter
  }, []);

  return {
    events,
    isLoading,
    error,
    hasMore,
    pagination,
    refresh,
    loadMore,
    filterByType,
    filterByDateRange,
  };
}

export default useTimeline;
