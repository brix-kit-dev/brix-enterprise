/**
 * @file Intake Tasks Hook
 * @description ViewModel layer for intake task list management
 * @module @shinwa/intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Follows v3.0.4 blueprint MVVM layered architecture, Hooks serve as ViewModel layer:
 * 1. Encapsulate business logic and state management
 * 2. Get HttpCapability through useHttp()
 * 3. Call Repository layer to fetch data
 * 4. Provide reactive state and operation methods to View layer
 *
 * Architecture Red Line:
 * - Hooks access data through Repository layer, direct fetch/axios use is forbidden
 * - Hooks do not contain UI rendering logic
 * - HttpCapability is injected through useHttp()
 *
 * @author Shinwa Team
 * @date 2026-06-10
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp } from '@brix/runtime-sdk-react';
import type {
  IntakeTask,
  IntakeTaskStatus,
  IntakeTaskPriority,
  IntakeTaskFilter,
  PageResponse,
} from '@shinwa/intake-shared';
import { createIntakeRepository } from '../repositories';

// ============================================================================
// List Hook Types
// ============================================================================

/**
 * Intake Task List Hook Return Type
 */
export interface UseIntakeTasksResult {
  /** Intake task list */
  tasks: IntakeTask[];
  /** Loading state */
  isLoading: boolean;
  /** Error object */
  error: Error | null;
  /** Pagination info */
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
  /** Current filter params */
  filter: IntakeTaskFilter;
  /** Refresh list */
  refresh: () => Promise<void>;
  /** Set page number */
  setPage: (page: number) => void;
  /** Set page size */
  setPageSize: (size: number) => void;
  /** Search by keyword */
  search: (keyword: string) => void;
  /** Filter by status */
  filterByStatus: (status: IntakeTaskStatus | undefined) => void;
  /** Filter by priority */
  filterByPriority: (priority: IntakeTaskPriority | undefined) => void;
  /** Filter by customer */
  filterByCustomer: (customerId: number | undefined) => void;
  /** Filter by reviewer */
  filterByReviewer: (reviewerId: string | undefined) => void;
  /** Activate a draft task */
  activateTask: (taskId: number) => Promise<void>;
  /** Cancel a task */
  cancelTask: (taskId: number) => Promise<void>;
  /** Delete a task */
  deleteTask: (taskId: number) => Promise<void>;
}

// ============================================================================
// List Hook Implementation
// ============================================================================

/**
 * Intake Tasks List Hook
 *
 * Encapsulates list data fetching, pagination, search, and filtering business logic.
 *
 * @param initialFilter - Optional initial filter parameters
 * @returns List state and operation methods
 *
 * @example
 * ```tsx
 * const { tasks, isLoading, error, pagination, refresh, deleteTask } = useIntakeTasks();
 *
 * // With initial filter
 * const { tasks } = useIntakeTasks({ status: 'ACTIVE', customerId: 123 });
 * ```
 */
export function useIntakeTasks(initialFilter?: IntakeTaskFilter): UseIntakeTasksResult {
  // Get HttpCapability through useHttp
  const http = useHttp();

  // State
  const [tasks, setTasks] = useState<IntakeTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<IntakeTaskFilter>({
    page: 0,
    size: 20,
    sort: 'createdAt',
    direction: 'desc',
    ...initialFilter,
  });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    total: 0,
    totalPages: 0,
  });

  // Create repository instance
  const repository = useMemo(() => createIntakeRepository(http), [http]);

  /**
   * Fetch task list from API
   */
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response: PageResponse<IntakeTask> = await repository.listTasks(filter);

      setTasks(response.content);
      setPagination({
        page: response.page,
        size: response.size,
        total: response.totalElements,
        totalPages: response.totalPages,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch intake tasks');
      setError(error);
      console.error('Failed to fetch intake tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [repository, filter]);

  // Fetch on mount and when filter changes
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /**
   * Refresh the task list
   */
  const refresh = useCallback(async () => {
    await fetchTasks();
  }, [fetchTasks]);

  /**
   * Set page number
   */
  const setPage = useCallback((page: number) => {
    setFilter((prev) => ({ ...prev, page }));
  }, []);

  /**
   * Set page size
   */
  const setPageSize = useCallback((size: number) => {
    setFilter((prev) => ({ ...prev, size, page: 0 }));
  }, []);

  /**
   * Search by keyword
   */
  const search = useCallback((keyword: string) => {
    setFilter((prev) => ({ ...prev, keyword: keyword || undefined, page: 0 }));
  }, []);

  /**
   * Filter by status
   */
  const filterByStatus = useCallback((status: IntakeTaskStatus | undefined) => {
    setFilter((prev) => ({ ...prev, status, page: 0 }));
  }, []);

  /**
   * Filter by priority (future enhancement)
   */
  const filterByPriority = useCallback((_priority: IntakeTaskPriority | undefined) => {
    // Priority filter can be added to API when needed
    setFilter((prev) => ({ ...prev, page: 0 }));
  }, []);

  /**
   * Filter by customer
   */
  const filterByCustomer = useCallback((customerId: number | undefined) => {
    setFilter((prev) => ({ ...prev, customerId, page: 0 }));
  }, []);

  /**
   * Filter by reviewer
   */
  const filterByReviewer = useCallback((reviewerId: string | undefined) => {
    setFilter((prev) => ({ ...prev, reviewerId, page: 0 }));
  }, []);

  /**
   * Activate a draft task
   */
  const activateTask = useCallback(
    async (taskId: number) => {
      try {
        await repository.activateTask(taskId);
        await fetchTasks();
      } catch (err) {
        console.error('Failed to activate task:', err);
        throw err;
      }
    },
    [repository, fetchTasks]
  );

  /**
   * Cancel a task
   */
  const cancelTask = useCallback(
    async (taskId: number) => {
      try {
        await repository.cancelTask(taskId);
        await fetchTasks();
      } catch (err) {
        console.error('Failed to cancel task:', err);
        throw err;
      }
    },
    [repository, fetchTasks]
  );

  /**
   * Delete a task
   */
  const deleteTask = useCallback(
    async (taskId: number) => {
      try {
        await repository.deleteTask(taskId);
        await fetchTasks();
      } catch (err) {
        console.error('Failed to delete task:', err);
        throw err;
      }
    },
    [repository, fetchTasks]
  );

  return {
    tasks,
    isLoading,
    error,
    pagination,
    filter,
    refresh,
    setPage,
    setPageSize,
    search,
    filterByStatus,
    filterByPriority,
    filterByCustomer,
    filterByReviewer,
    activateTask,
    cancelTask,
    deleteTask,
  };
}
