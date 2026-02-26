/**
 * @file Case 模块 Hooks（Web）
 * @description ViewModel 层 — 业务逻辑和状态管理
 * @module @shinwa/case-ui-web
 * @version 3.0.0-SNAPSHOT
 *
 * 由 @brix/create-brix 2026-02-23 自动生成
 *
 * 【设计说明】
 * 遵循 v3.0.4 蓝图 MVVM 分层架构，Hooks 作为 ViewModel 层：
 * 1. 封装业务逻辑和状态管理
 * 2. 通过 useHttp() 获取 HttpCapability
 * 3. 调用 Repository 层获取数据
 * 4. 向 View 层提供响应式状态和操作方法
 *
 * 【架构红线】
 * - Hooks 通过 Repository 层访问数据，禁止直接使用 fetch/axios
 * - Hooks 不包含 UI 渲染逻辑
 * - HttpCapability 通过 useHttp() 注入
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp } from '@brix/runtime-sdk-react';
import type { 
  CaseDTO, 
  CaseSummary,
  CreateCaseRequest, 
  UpdateCaseRequest, 
  PagedResponse,
  CaseStatus,
  CasePriority,
} from '@shinwa/case-shared';
import { createCaseRepository, type CaseQueryParams } from '../repositories';

// ============================================================================
// 列表 Hook
// ============================================================================

/**
 * Case 模块 列表 Hook 返回类型
 */
export interface UseCaseListResult {
  /** Case summary list */
  items: CaseSummary[];
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
  params: CaseQueryParams;
  /** Refresh list */
  refresh: () => Promise<void>;
  /** Set page number */
  setPage: (page: number) => void;
  /** Set page size */
  setPageSize: (size: number) => void;
  /** Search by keyword */
  search: (keyword: string) => void;
  /** Filter by status */
  filterByStatus: (status: CaseStatus | undefined) => void;
  /** Filter by priority */
  filterByPriority: (priority: CasePriority | undefined) => void;
  /** Filter by customer */
  filterByCustomer: (customerId: number | undefined) => void;
  /** Delete a case */
  deleteItem: (id: number) => Promise<void>;
}

/**
 * Case 模块 列表 Hook
 *
 * 封装列表数据获取、分页、搜索、筛选等业务逻辑。
 *
 * @returns 列表状态和操作方法
 *
 * @example
 * ```tsx
 * const { items, isLoading, error, pagination, refresh, deleteItem } = useCaseList();
 * ```
 */
export function useCaseList(): UseCaseListResult {
  // 通过 useHttp 获取 HttpCapability
  const http = useHttp();

  // State
  const [items, setItems] = useState<CaseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<CaseQueryParams>({
    page: 0,
    size: 20,
  });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    total: 0,
    totalPages: 0,
  });

  // 创建 Repository 实例（使用 useMemo 避免重复创建）
  const repository = useMemo(
    () => createCaseRepository(http),
    [http]
  );

  // Load data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response: PagedResponse<CaseSummary> = await repository.list(params);

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

  // Refresh
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Set page number
  const setPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }));
  }, []);

  // Set page size
  const setPageSize = useCallback((size: number) => {
    setParams(prev => ({ ...prev, size, page: 0 }));
  }, []);

  // Search by keyword
  const search = useCallback((keyword: string) => {
    setParams(prev => ({ ...prev, keyword: keyword || undefined, page: 0 }));
  }, []);

  // Filter by status
  const filterByStatus = useCallback((status: CaseStatus | undefined) => {
    setParams(prev => ({ ...prev, status, page: 0 }));
  }, []);

  // Filter by priority
  const filterByPriority = useCallback((priority: CasePriority | undefined) => {
    setParams(prev => ({ ...prev, priority, page: 0 }));
  }, []);

  // Filter by customer
  const filterByCustomer = useCallback((customerId: number | undefined) => {
    setParams(prev => ({ ...prev, customerId, page: 0 }));
  }, []);

  // Delete item
  const deleteItem = useCallback(async (id: number) => {
    try {
      await repository.delete(id);
      // Refresh list after deletion
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
    params,
    refresh,
    setPage,
    setPageSize,
    search,
    filterByStatus,
    filterByPriority,
    filterByCustomer,
    deleteItem,
  };
}

// ============================================================================
// 详情 Hook
// ============================================================================

/**
 * Case Detail Hook Result Type
 */
export interface UseCaseDetailResult {
  /** Full case detail data */
  item: CaseDTO | null;
  /** Loading state */
  isLoading: boolean;
  /** Error object */
  error: Error | null;
  /** Refresh detail */
  refresh: () => Promise<void>;
  /** Update case */
  updateItem: (data: UpdateCaseRequest) => Promise<CaseDTO>;
  /** Delete case */
  deleteItem: () => Promise<void>;
}

/**
 * Case Detail Hook
 *
 * Encapsulates detail retrieval, update, and delete logic.
 *
 * @param id - Case ID
 * @returns Detail state and operation methods
 *
 * @example
 * ```tsx
 * const { item, isLoading, error, updateItem, deleteItem } = useCaseDetail(id);
 * ```
 */
export function useCaseDetail(id: number | string): UseCaseDetailResult {
  const http = useHttp();
  const numericId = typeof id === 'string' ? Number(id) : id;

  // State
  const [item, setItem] = useState<CaseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Create Repository instance
  const repository = useMemo(
    () => createCaseRepository(http),
    [http]
  );

  // Load detail
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

  // Update
  const updateItem = useCallback(async (data: UpdateCaseRequest): Promise<CaseDTO> => {
    try {
      const updated = await repository.update(numericId, data);
      setItem(updated);
      return updated;
    } catch (err) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }, [repository, numericId]);

  // Delete
  const deleteItem = useCallback(async () => {
    try {
      await repository.delete(numericId);
      setItem(null);
    } catch (err) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }, [repository, numericId]);

  return {
    item,
    isLoading,
    error,
    refresh: loadDetail,
    updateItem,
    deleteItem,
  };
}

// ============================================================================
// 创建/编辑 Hook
// ============================================================================

/**
 * Case Create Hook Result Type
 */
export interface UseCaseCreateResult {
  /** Submitting state */
  isSubmitting: boolean;
  /** Error object */
  error: Error | null;
  /** Create a new case */
  create: (data: CreateCaseRequest) => Promise<CaseDTO>;
  /** Reset error state */
  resetError: () => void;
}

/**
 * Case Create Hook
 *
 * Encapsulates case creation logic.
 *
 * @returns Create state and operation methods
 *
 * @example
 * ```tsx
 * const { isSubmitting, error, create } = useCaseCreate();
 * const handleSubmit = async (data) => {
 *   const created = await create(data);
 *   navigate(`/case/${created.id}`);
 * };
 * ```
 */
export function useCaseCreate(): UseCaseCreateResult {
  const http = useHttp();

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create Repository instance
  const repository = useMemo(
    () => createCaseRepository(http),
    [http]
  );

  // Create
  const create = useCallback(async (data: CreateCaseRequest): Promise<CaseDTO> => {
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

  // Reset error
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

// ============================================================================
// 导出
// ============================================================================

// 默认导出列表 Hook（向后兼容）
export default useCaseList;
