/**
 * @file Contract Template Hooks (Web)
 * @description ViewModel layer — Business logic and state management for templates
 * @module @shinwa/contracts-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 blueprint MVVM architecture, Hooks serve as ViewModel layer:
 * 1. Encapsulate business logic and state management
 * 2. Obtain HttpCapability through useHttp()
 * 3. Call Repository layer to fetch data
 * 4. Provide reactive state and operations to View layer
 *
 * Architecture Red Lines:
 * - Hooks access data through Repository layer, direct fetch/axios use is forbidden
 * - Hooks contain no UI rendering logic
 * - HttpCapability is injected via useHttp()
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp } from '@brix/runtime-sdk-react';
import type {
  ContractTemplate,
  ContractTemplateSummary,
  ContractTemplateQueryParams,
  CreateContractTemplateRequest,
  UpdateContractTemplateRequest,
  TemplateStatus,
  PagedResponse,
} from '@shinwa/contracts-shared';
import { createContractTemplateRepository } from '../repositories';

// ============================================================================
// List Hook
// ============================================================================

/**
 * Contract Template List Hook Return Type
 */
export interface UseContractTemplateListResult {
  /** Template summary list */
  items: ContractTemplateSummary[];
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
  params: ContractTemplateQueryParams;
  /** Refresh list */
  refresh: () => Promise<void>;
  /** Set page number */
  setPage: (page: number) => void;
  /** Set page size */
  setPageSize: (size: number) => void;
  /** Search by keyword */
  search: (keyword: string) => void;
  /** Filter by status */
  filterByStatus: (status: TemplateStatus | undefined) => void;
  /** Filter by category */
  filterByCategory: (category: string | undefined) => void;
  /** Delete a template */
  deleteItem: (id: number) => Promise<void>;
  /** Activate a template */
  activateItem: (id: number) => Promise<void>;
  /** Archive a template */
  archiveItem: (id: number) => Promise<void>;
}

/**
 * Contract Template List Hook
 *
 * Encapsulates list data fetching, pagination, search, and filter logic.
 *
 * @returns List state and operation methods
 *
 * @example
 * ```tsx
 * const { items, isLoading, error, pagination, refresh, deleteItem } = useContractTemplateList();
 * ```
 */
export function useContractTemplateList(): UseContractTemplateListResult {
  // Get HttpCapability through useHttp
  const http = useHttp();

  // State
  const [items, setItems] = useState<ContractTemplateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<ContractTemplateQueryParams>({
    page: 0,
    size: 20,
  });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    total: 0,
    totalPages: 0,
  });

  // Create repository instance - memoized to prevent unnecessary recreation
  const repository = useMemo(() => createContractTemplateRepository(http), [http]);

  /**
   * Fetch template list from API
   */
  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await repository.list(params);
      setItems(response.content);
      setPagination({
        page: response.page,
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

  // Initial fetch and refetch on params change
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  /**
   * Refresh list data
   */
  const refresh = useCallback(async () => {
    await fetchList();
  }, [fetchList]);

  /**
   * Set page number
   */
  const setPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }));
  }, []);

  /**
   * Set page size
   */
  const setPageSize = useCallback((size: number) => {
    setParams(prev => ({ ...prev, size, page: 0 }));
  }, []);

  /**
   * Search by keyword
   */
  const search = useCallback((keyword: string) => {
    setParams(prev => ({ ...prev, keyword, page: 0 }));
  }, []);

  /**
   * Filter by status
   */
  const filterByStatus = useCallback((status: TemplateStatus | undefined) => {
    setParams(prev => ({ ...prev, status, page: 0 }));
  }, []);

  /**
   * Filter by category
   */
  const filterByCategory = useCallback((category: string | undefined) => {
    setParams(prev => ({ ...prev, category, page: 0 }));
  }, []);

  /**
   * Delete a template
   */
  const deleteItem = useCallback(async (id: number) => {
    await repository.delete(id);
    await refresh();
  }, [repository, refresh]);

  /**
   * Activate a template
   */
  const activateItem = useCallback(async (id: number) => {
    await repository.activate(id);
    await refresh();
  }, [repository, refresh]);

  /**
   * Archive a template
   */
  const archiveItem = useCallback(async (id: number) => {
    await repository.archive(id);
    await refresh();
  }, [repository, refresh]);

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
    deleteItem,
    activateItem,
    archiveItem,
  };
}

// ============================================================================
// Detail Hook
// ============================================================================

/**
 * Contract Template Detail Hook Return Type
 */
export interface UseContractTemplateDetailResult {
  /** Template data */
  template: ContractTemplate | null;
  /** Loading state */
  isLoading: boolean;
  /** Error object */
  error: Error | null;
  /** Refresh template data */
  refresh: () => Promise<void>;
  /** Update template */
  update: (request: UpdateContractTemplateRequest) => Promise<ContractTemplate>;
  /** Activate template */
  activate: () => Promise<ContractTemplate>;
  /** Archive template */
  archive: () => Promise<ContractTemplate>;
}

/**
 * Contract Template Detail Hook
 *
 * Fetches and manages single template data.
 *
 * @param id - Template ID
 * @returns Template data and operations
 *
 * @example
 * ```tsx
 * const { template, isLoading, error, activate, archive } = useContractTemplateDetail(123);
 * ```
 */
export function useContractTemplateDetail(id: number): UseContractTemplateDetailResult {
  const http = useHttp();

  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const repository = useMemo(() => createContractTemplateRepository(http), [http]);

  /**
   * Fetch template details
   */
  const fetchTemplate = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await repository.getById(id);
      setTemplate(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [repository, id]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  /**
   * Refresh template data
   */
  const refresh = useCallback(async () => {
    await fetchTemplate();
  }, [fetchTemplate]);

  /**
   * Update template
   */
  const update = useCallback(async (request: UpdateContractTemplateRequest): Promise<ContractTemplate> => {
    const updated = await repository.update(id, request);
    setTemplate(updated);
    return updated;
  }, [repository, id]);

  /**
   * Activate template
   */
  const activate = useCallback(async (): Promise<ContractTemplate> => {
    const updated = await repository.activate(id);
    setTemplate(updated);
    return updated;
  }, [repository, id]);

  /**
   * Archive template
   */
  const archive = useCallback(async (): Promise<ContractTemplate> => {
    const updated = await repository.archive(id);
    setTemplate(updated);
    return updated;
  }, [repository, id]);

  return {
    template,
    isLoading,
    error,
    refresh,
    update,
    activate,
    archive,
  };
}

// ============================================================================
// Create Hook
// ============================================================================

/**
 * Contract Template Create Hook Return Type
 */
export interface UseContractTemplateCreateResult {
  /** Create template */
  create: (request: CreateContractTemplateRequest) => Promise<ContractTemplate>;
  /** Creating state */
  isCreating: boolean;
  /** Error object */
  error: Error | null;
  /** Clear error */
  clearError: () => void;
}

/**
 * Contract Template Create Hook
 *
 * Handles template creation logic.
 *
 * @returns Create operation and state
 *
 * @example
 * ```tsx
 * const { create, isCreating, error } = useContractTemplateCreate();
 * const newTemplate = await create({ name: 'New Template', ... });
 * ```
 */
export function useContractTemplateCreate(): UseContractTemplateCreateResult {
  const http = useHttp();

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const repository = useMemo(() => createContractTemplateRepository(http), [http]);

  /**
   * Create a new template
   */
  const create = useCallback(async (request: CreateContractTemplateRequest): Promise<ContractTemplate> => {
    setIsCreating(true);
    setError(null);

    try {
      const created = await repository.create(request);
      return created;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [repository]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    create,
    isCreating,
    error,
    clearError,
  };
}
