/**
 * @file Contract Instance Hooks (Web)
 * @description ViewModel layer — Business logic and state management for contracts
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
  Contract,
  ContractSummary,
  ContractQueryParams,
  CreateContractRequest,
  UpdateContractRequest,
  UpdateContractStatusRequest,
  ContractStatus,
  PagedResponse,
} from '@shinwa/contracts-shared';
import { createContractRepository } from '../repositories';

// ============================================================================
// List Hook
// ============================================================================

/**
 * Contract List Hook Return Type
 */
export interface UseContractListResult {
  /** Contract summary list */
  items: ContractSummary[];
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
  params: ContractQueryParams;
  /** Refresh list */
  refresh: () => Promise<void>;
  /** Set page number */
  setPage: (page: number) => void;
  /** Set page size */
  setPageSize: (size: number) => void;
  /** Search by keyword */
  search: (keyword: string) => void;
  /** Filter by status */
  filterByStatus: (status: ContractStatus | undefined) => void;
  /** Filter by template */
  filterByTemplate: (templateId: number | undefined) => void;
  /** Filter by party name */
  filterByParty: (partyName: string | undefined) => void;
  /** Filter by related case */
  filterByCase: (caseId: number | undefined) => void;
  /** Delete a contract */
  deleteItem: (id: number) => Promise<void>;
}

/**
 * Contract List Hook
 *
 * Encapsulates list data fetching, pagination, search, and filter logic.
 *
 * @returns List state and operation methods
 *
 * @example
 * ```tsx
 * const { items, isLoading, error, pagination, refresh, deleteItem } = useContractList();
 * ```
 */
export function useContractList(): UseContractListResult {
  // Get HttpCapability through useHttp
  const http = useHttp();

  // State
  const [items, setItems] = useState<ContractSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<ContractQueryParams>({
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
  const repository = useMemo(() => createContractRepository(http), [http]);

  /**
   * Fetch contract list from API
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
  const filterByStatus = useCallback((status: ContractStatus | undefined) => {
    setParams(prev => ({ ...prev, status, page: 0 }));
  }, []);

  /**
   * Filter by template
   */
  const filterByTemplate = useCallback((templateId: number | undefined) => {
    setParams(prev => ({ ...prev, templateId, page: 0 }));
  }, []);

  /**
   * Filter by party name
   */
  const filterByParty = useCallback((partyName: string | undefined) => {
    setParams(prev => ({ ...prev, partyName, page: 0 }));
  }, []);

  /**
   * Filter by related case
   */
  const filterByCase = useCallback((relatedCaseId: number | undefined) => {
    setParams(prev => ({ ...prev, relatedCaseId, page: 0 }));
  }, []);

  /**
   * Delete a contract
   */
  const deleteItem = useCallback(async (id: number) => {
    await repository.delete(id);
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
    filterByTemplate,
    filterByParty,
    filterByCase,
    deleteItem,
  };
}

// ============================================================================
// Detail Hook
// ============================================================================

/**
 * Contract Detail Hook Return Type
 */
export interface UseContractDetailResult {
  /** Contract data */
  contract: Contract | null;
  /** Loading state */
  isLoading: boolean;
  /** Error object */
  error: Error | null;
  /** Refresh contract data */
  refresh: () => Promise<void>;
  /** Update contract */
  update: (request: UpdateContractRequest) => Promise<Contract>;
  /** Update contract status */
  updateStatus: (request: UpdateContractStatusRequest) => Promise<Contract>;
  /** Approve contract */
  approve: (notes?: string) => Promise<Contract>;
  /** Sign contract as a party */
  sign: (partyId: number) => Promise<Contract>;
}

/**
 * Contract Detail Hook
 *
 * Fetches and manages single contract data.
 *
 * @param id - Contract ID
 * @returns Contract data and operations
 *
 * @example
 * ```tsx
 * const { contract, isLoading, error, approve, sign } = useContractDetail(123);
 * ```
 */
export function useContractDetail(id: number): UseContractDetailResult {
  const http = useHttp();

  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const repository = useMemo(() => createContractRepository(http), [http]);

  /**
   * Fetch contract details
   */
  const fetchContract = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await repository.getById(id);
      setContract(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [repository, id]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  /**
   * Refresh contract data
   */
  const refresh = useCallback(async () => {
    await fetchContract();
  }, [fetchContract]);

  /**
   * Update contract
   */
  const update = useCallback(async (request: UpdateContractRequest): Promise<Contract> => {
    const updated = await repository.update(id, request);
    setContract(updated);
    return updated;
  }, [repository, id]);

  /**
   * Update contract status
   */
  const updateStatus = useCallback(async (request: UpdateContractStatusRequest): Promise<Contract> => {
    const updated = await repository.updateStatus(id, request);
    setContract(updated);
    return updated;
  }, [repository, id]);

  /**
   * Approve contract
   */
  const approve = useCallback(async (notes?: string): Promise<Contract> => {
    const updated = await repository.approve(id, notes);
    setContract(updated);
    return updated;
  }, [repository, id]);

  /**
   * Sign contract as a party
   */
  const sign = useCallback(async (partyId: number): Promise<Contract> => {
    const updated = await repository.sign(id, partyId);
    setContract(updated);
    return updated;
  }, [repository, id]);

  return {
    contract,
    isLoading,
    error,
    refresh,
    update,
    updateStatus,
    approve,
    sign,
  };
}

// ============================================================================
// Create Hook
// ============================================================================

/**
 * Contract Create Hook Return Type
 */
export interface UseContractCreateResult {
  /** Create contract */
  create: (request: CreateContractRequest) => Promise<Contract>;
  /** Creating state */
  isCreating: boolean;
  /** Error object */
  error: Error | null;
  /** Clear error */
  clearError: () => void;
}

/**
 * Contract Create Hook
 *
 * Handles contract creation logic.
 *
 * @returns Create operation and state
 *
 * @example
 * ```tsx
 * const { create, isCreating, error } = useContractCreate();
 * const newContract = await create({ title: 'New Contract', ... });
 * ```
 */
export function useContractCreate(): UseContractCreateResult {
  const http = useHttp();

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const repository = useMemo(() => createContractRepository(http), [http]);

  /**
   * Create a new contract
   */
  const create = useCallback(async (request: CreateContractRequest): Promise<Contract> => {
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
