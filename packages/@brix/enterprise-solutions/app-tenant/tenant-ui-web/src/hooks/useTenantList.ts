/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 * 
 * @fileoverview useTenantList - ViewModel Hook for Tenant List Page
 * 
 * Follows the Frontend Three-Layer Separation pattern (v3.0.9 Section 7.5)
 * View → ViewModel (this hook) → Repository
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp, useEventBus, useNavigation } from '@brix-sdk/runtime-sdk-react';
import { createTenantAdminRepository } from '../repositories';
import type { TenantDTO, TenantListQuery, TenantStatus, PagedResponse } from '@brix-sdk/tenant-shared';
import { TenantEvents } from '@brix-sdk/tenant-shared';

/**
 * Tenant List ViewModel State
 */
export interface TenantListState {
  /** Tenant list */
  tenants: TenantDTO[];
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Current page (1-based) */
  page: number;
  /** Page size */
  pageSize: number;
  /** Total count */
  total: number;
  /** Total pages */
  totalPages: number;
  /** Search keyword */
  keyword: string;
  /** Status filter */
  statusFilter: TenantStatus | null;
  /** Sort configuration */
  sortBy: TenantListQuery['sortBy'];
  sortOrder: TenantListQuery['sortOrder'];
}

/**
 * Tenant List ViewModel Actions
 */
export interface TenantListActions {
  /** Refresh tenant list */
  refresh: () => Promise<void>;
  /** Change page */
  setPage: (page: number) => void;
  /** Change page size */
  setPageSize: (pageSize: number) => void;
  /** Search by keyword */
  search: (keyword: string) => void;
  /** Filter by status */
  filterByStatus: (status: TenantStatus | null) => void;
  /** Sort tenants */
  sort: (sortBy: TenantListQuery['sortBy'], sortOrder: TenantListQuery['sortOrder']) => void;
  /** Navigate to tenant detail */
  viewTenant: (tenantId: string) => void;
  /** Navigate to create page */
  createTenant: () => void;
  /** Activate tenant */
  activateTenant: (tenantId: string) => Promise<void>;
  /** Suspend tenant */
  suspendTenant: (tenantId: string, reason?: string) => Promise<void>;
  /** Terminate tenant */
  terminateTenant: (tenantId: string, reason: string) => Promise<void>;
}

/**
 * useTenantList Hook - ViewModel for Tenant List Page
 * 
 * @example
 * ```tsx
 * function TenantListPage() {
 *   const { state, actions } = useTenantList();
 *   
 *   return (
 *     <TenantTable
 *       data={state.tenants}
 *       loading={state.isLoading}
 *       onView={actions.viewTenant}
 *       onActivate={actions.activateTenant}
 *     />
 *   );
 * }
 * ```
 */
export function useTenantList(): { state: TenantListState; actions: TenantListActions } {
  // =========================================
  // Capabilities (via contract)
  // =========================================
  const http = useHttp();
  const eventBus = useEventBus();
  const navigation = useNavigation();
  
  // =========================================
  // Repository (injected via factory)
  // =========================================
  const repository = useMemo(() => createTenantAdminRepository(http), [http]);
  
  // =========================================
  // State
  // =========================================
  const [tenants, setTenants] = useState<TenantDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | null>(null);
  const [sortBy, setSortBy] = useState<TenantListQuery['sortBy']>('createdAt');
  const [sortOrder, setSortOrder] = useState<TenantListQuery['sortOrder']>('desc');
  
  // =========================================
  // Data Fetching
  // =========================================
  const fetchTenants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const query: TenantListQuery = {
        page,
        pageSize,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      };
      
      const response: PagedResponse<TenantDTO> = await repository.getTenants(query);
      
      setTenants(response.items);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tenants');
    } finally {
      setIsLoading(false);
    }
  }, [repository, page, pageSize, keyword, statusFilter, sortBy, sortOrder]);
  
  // Initial fetch and refetch on query change
  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);
  
  // =========================================
  // Event Subscriptions
  // =========================================
  useEffect(() => {
    const subscribe = eventBus.on as unknown as (
      eventType: string,
      handler: (payload?: unknown) => void
    ) => void | (() => void);
    // Refresh list when tenant events occur
    const unsubscribes = [
      subscribe(TenantEvents.TENANT_CREATED, fetchTenants),
      subscribe(TenantEvents.TENANT_ACTIVATED, fetchTenants),
      subscribe(TenantEvents.TENANT_SUSPENDED, fetchTenants),
      subscribe(TenantEvents.TENANT_TERMINATED, fetchTenants),
    ];
    
    return () => {
      unsubscribes.forEach((unsub) => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
    };
  }, [eventBus, fetchTenants]);

  const navigateTo = useCallback((path: string) => {
    if (navigation.requestNavigate) {
      void navigation.requestNavigate(path);
      return;
    }
    navigation.navigate(path);
  }, [navigation]);
  
  // =========================================
  // Actions
  // =========================================
  const actions: TenantListActions = useMemo(() => ({
    refresh: fetchTenants,
    
    setPage: (newPage: number) => {
      setPage(newPage);
    },
    
    setPageSize: (newPageSize: number) => {
      setPageSize(newPageSize);
      setPage(1); // Reset to first page
    },
    
    search: (newKeyword: string) => {
      setKeyword(newKeyword);
      setPage(1);
    },
    
    filterByStatus: (status: TenantStatus | null) => {
      setStatusFilter(status);
      setPage(1);
    },
    
    sort: (newSortBy: TenantListQuery['sortBy'], newSortOrder: TenantListQuery['sortOrder']) => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
    },
    
    viewTenant: (tenantId: string) => {
      navigateTo(`/admin/tenants/${tenantId}`);
    },
    
    createTenant: () => {
      navigateTo('/admin/tenants/create');
    },
    
    activateTenant: async (tenantId: string) => {
      try {
        await repository.activateTenant(tenantId);
        eventBus.emit(TenantEvents.TENANT_ACTIVATED, { tenantId });
      } catch (err) {
        throw err;
      }
    },
    
    suspendTenant: async (tenantId: string, reason?: string) => {
      try {
        await repository.suspendTenant(tenantId, reason);
        eventBus.emit(TenantEvents.TENANT_SUSPENDED, { tenantId, reason });
      } catch (err) {
        throw err;
      }
    },
    
    terminateTenant: async (tenantId: string, reason: string) => {
      try {
        await repository.terminateTenant(tenantId, reason);
        eventBus.emit(TenantEvents.TENANT_TERMINATED, { tenantId, reason });
      } catch (err) {
        throw err;
      }
    },
  }), [fetchTenants, navigateTo, repository, eventBus]);
  
  // =========================================
  // Return ViewModel
  // =========================================
  const state: TenantListState = {
    tenants,
    isLoading,
    error,
    page,
    pageSize,
    total,
    totalPages,
    keyword,
    statusFilter,
    sortBy,
    sortOrder,
  };
  
  return { state, actions };
}

export default useTenantList;
