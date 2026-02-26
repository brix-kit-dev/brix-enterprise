/**
 * @file Template Hooks
 * @description ViewModel layer for case template operations
 * @module @shinwa/case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 blueprint MVVM architecture.
 * This file provides hooks for template list, detail, and create operations.
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp } from '@brix/runtime-sdk-react';
import type { 
  CaseTemplateDTO,
  CaseTemplateSummary,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  PagedResponse,
  TemplateQueryParams,
} from '@shinwa/case-shared';
import { createTemplateRepository } from '../repositories';

// ============================================================================
// Template List Hook
// ============================================================================

/**
 * Template List Hook Result Type
 */
export interface UseTemplateListResult {
  /** Template list */
  items: CaseTemplateSummary[];
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
  /** Refresh list */
  refresh: () => Promise<void>;
  /** Set page number */
  setPage: (page: number) => void;
  /** Search by keyword */
  search: (keyword: string) => void;
  /** Filter by category */
  filterByCategory: (category: string | undefined) => void;
  /** Filter by active status */
  filterByActive: (isActive: boolean | undefined) => void;
  /** Delete a template */
  deleteItem: (id: number) => Promise<void>;
}

/**
 * Template List Hook
 *
 * @returns List state and operation methods
 */
export function useTemplateList(): UseTemplateListResult {
  const http = useHttp();

  // State
  const [items, setItems] = useState<CaseTemplateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<TemplateQueryParams>({
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
    () => createTemplateRepository(http),
    [http]
  );

  /**
   * Load data
   */
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response: PagedResponse<CaseTemplateSummary> = await repository.list(params);

      setItems(response.content);
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
  }, [repository, params]);

  // Reload on params change
  useEffect(() => {
    loadData();
  }, [loadData]);

  const setPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }));
  }, []);

  const search = useCallback((keyword: string) => {
    setParams(prev => ({ ...prev, keyword: keyword || undefined, page: 0 }));
  }, []);

  const filterByCategory = useCallback((category: string | undefined) => {
    setParams(prev => ({ ...prev, category, page: 0 }));
  }, []);

  const filterByActive = useCallback((isActive: boolean | undefined) => {
    setParams(prev => ({ ...prev, isActive, page: 0 }));
  }, []);

  const deleteItem = useCallback(async (id: number) => {
    try {
      await repository.delete(id);
      await loadData();
    } catch (err) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }, [repository, loadData]);

  return {
    items,
    isLoading,
    error,
    pagination,
    refresh: loadData,
    setPage,
    search,
    filterByCategory,
    filterByActive,
    deleteItem,
  };
}

// ============================================================================
// Template Detail Hook
// ============================================================================

/**
 * Template Detail Hook Result Type
 */
export interface UseTemplateDetailResult {
  /** Template data */
  item: CaseTemplateDTO | null;
  /** Loading state */
  isLoading: boolean;
  /** Error object */
  error: Error | null;
  /** Refresh detail */
  refresh: () => Promise<void>;
  /** Update template */
  updateItem: (data: UpdateTemplateRequest) => Promise<CaseTemplateDTO>;
  /** Delete template */
  deleteItem: () => Promise<void>;
  /** Activate template */
  activate: () => Promise<CaseTemplateDTO>;
  /** Deactivate template */
  deactivate: () => Promise<CaseTemplateDTO>;
}

/**
 * Template Detail Hook
 *
 * @param id - Template ID
 * @returns Detail state and operation methods
 */
export function useTemplateDetail(id: number | string): UseTemplateDetailResult {
  const http = useHttp();
  const numericId = typeof id === 'string' ? Number(id) : id;

  // State
  const [item, setItem] = useState<CaseTemplateDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Create Repository instance
  const repository = useMemo(
    () => createTemplateRepository(http),
    [http]
  );

  /**
   * Load detail
   */
  const loadDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await repository.getById(numericId);
      setItem(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [repository, numericId]);

  // Reload on ID change
  useEffect(() => {
    if (numericId) {
      loadDetail();
    }
  }, [numericId, loadDetail]);

  const updateItem = useCallback(async (data: UpdateTemplateRequest): Promise<CaseTemplateDTO> => {
    const updated = await repository.update(numericId, data);
    setItem(updated);
    return updated;
  }, [repository, numericId]);

  const deleteItem = useCallback(async () => {
    await repository.delete(numericId);
    setItem(null);
  }, [repository, numericId]);

  const activate = useCallback(async (): Promise<CaseTemplateDTO> => {
    const updated = await repository.activate(numericId);
    setItem(updated);
    return updated;
  }, [repository, numericId]);

  const deactivate = useCallback(async (): Promise<CaseTemplateDTO> => {
    const updated = await repository.deactivate(numericId);
    setItem(updated);
    return updated;
  }, [repository, numericId]);

  return {
    item,
    isLoading,
    error,
    refresh: loadDetail,
    updateItem,
    deleteItem,
    activate,
    deactivate,
  };
}

// ============================================================================
// Template Create Hook
// ============================================================================

/**
 * Template Create Hook Result Type
 */
export interface UseTemplateCreateResult {
  /** Submitting state */
  isSubmitting: boolean;
  /** Error object */
  error: Error | null;
  /** Create template */
  create: (data: CreateTemplateRequest) => Promise<CaseTemplateDTO>;
  /** Reset error */
  resetError: () => void;
}

/**
 * Template Create Hook
 *
 * @returns Create state and operation methods
 */
export function useTemplateCreate(): UseTemplateCreateResult {
  const http = useHttp();

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create Repository instance
  const repository = useMemo(
    () => createTemplateRepository(http),
    [http]
  );

  const create = useCallback(async (data: CreateTemplateRequest): Promise<CaseTemplateDTO> => {
    try {
      setIsSubmitting(true);
      setError(null);

      const created = await repository.create(data);
      return created;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [repository]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSubmitting,
    error,
    create,
    resetError,
  };
}

export default useTemplateList;
