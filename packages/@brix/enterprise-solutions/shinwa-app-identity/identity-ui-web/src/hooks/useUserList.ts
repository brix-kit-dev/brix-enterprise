/**
 * @file User List ViewModel Hook
 * @description Manage user list page state and business logic
 * @module identity-ui-web/hooks/useUserList
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook is the ViewModel layer implementation, responsible for:
 * 1. Managing user list loading state, data, and pagination
 * 2. Handling search, filtering, and other business logic
 * 3. Subscribing to relevant events for automatic refresh
 * 
 * Usage:
 * ```tsx
 * function UserListPage() {
 *   const { 
 *     users, loading, error, pagination,
 *     refresh, search, setPage 
 *   } = useUserList();
 *   
 *   // Pure render logic
 * }
 * ```
 * 
 * Architecture Benefits:
 * - UI components focus only on rendering, without business logic
 * - Business logic is centrally managed for easier testing and maintenance
 * - State management is decoupled from views
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useHttp, useEventBus, useAuth } from '@brix/runtime-sdk-react';
import { createUserRepository, type UserRepository, type UserQueryParams } from '../repositories';
import type { User, PagedResponse, UserStatus, UserRole } from 'identity-shared';
import { IDENTITY_EVENTS, IDENTITY_PERMISSIONS } from 'identity-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Pagination state
 */
export interface PaginationState {
  /** Current page number (0-based) */
  page: number;
  /** Page size */
  size: number;
  /** Total element count */
  totalElements: number;
  /** Total page count */
  totalPages: number;
}

/**
 * User list state
 */
export interface UserListState {
  /** User list data */
  users: User[];
  /** Whether loading */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Pagination state */
  pagination: PaginationState;
  /** Current search keyword */
  keyword: string;
  /** Current status filter */
  statusFilter: UserStatus | null;
  /** Current role filter */
  roleFilter: UserRole | null;
  /** Permission state */
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

/**
 * User list action methods
 */
export interface UserListActions {
  /** Refresh list */
  refresh: () => Promise<void>;
  /** Set current page number */
  setPage: (page: number) => void;
  /** Set page size */
  setPageSize: (size: number) => void;
  /** Search */
  search: (keyword: string) => void;
  /** Filter by status */
  filterByStatus: (status: UserStatus | null) => void;
  /** Filter by role */
  filterByRole: (role: UserRole | null) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Delete user */
  deleteUser: (userId: string) => Promise<boolean>;
  /** Enable user */
  enableUser: (userId: string, reason?: string) => Promise<boolean>;
  /** Disable user */
  disableUser: (userId: string, reason?: string) => Promise<boolean>;
}

/**
 * useUserList Hook return type
 */
export type UseUserListResult = UserListState & UserListActions;

// ============================================================================
// Constants
// ============================================================================

/** Default page size */
const DEFAULT_PAGE_SIZE = 10;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * User List ViewModel Hook
 * 
 * Features:
 * - Manage user list data and loading state
 * - Support pagination, search, and filtering
 * - Subscribe to user change events for automatic list refresh
 * - Provide user status change operations
 * 
 * Event Subscriptions:
 * - user:created - Refresh list after user creation
 * - user:updated - Refresh list after user update
 * - user:deleted - Refresh list after user deletion
 * - user:status-changed - Refresh list after user status change
 * 
 * @returns User list state and action methods
 * 
 * @example
 * ```tsx
 * function UserListPage() {
 *   const { users, loading, search, pagination, setPage } = useUserList();
 *   
 *   return (
 *     <div>
 *       <SearchBox onSearch={search} />
 *       {loading ? <Spinner /> : <UserTable users={users} />}
 *       <Pagination 
 *         page={pagination.page} 
 *         total={pagination.totalPages}
 *         onChange={setPage}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function useUserList(): UseUserListResult {
  // ========================================================================
  // Dependency Acquisition
  // ========================================================================
  
  const http = useHttp();
  const eventBus = useEventBus();
  const auth = useAuth();
  
  // Repository instance (rebuilt when http changes)
  const repository = useMemo<UserRepository | null>(
    () => http ? createUserRepository(http) : null,
    [http]
  );
  
  // ========================================================================
  // State Definitions
  // ========================================================================
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | null>(null);
  
  // Permission check
  const permissions = useMemo(() => ({
    canCreate: auth.hasPermission(IDENTITY_PERMISSIONS.USER_CREATE),
    canEdit: auth.hasPermission(IDENTITY_PERMISSIONS.USER_UPDATE),
    canDelete: auth.hasPermission(IDENTITY_PERMISSIONS.USER_DELETE),
  }), [auth]);
  
  // Use ref to store latest state, avoiding useCallback dependency issues
  const stateRef = useRef({ keyword, statusFilter, roleFilter, pagination });
  stateRef.current = { keyword, statusFilter, roleFilter, pagination };
  
  // ========================================================================
  // Data Loading
  // ========================================================================
  
  /**
   * Load user list
   * 
   * Parameter Notes:
   * @param params - Query parameters that override current state
   */
  const fetchData = useCallback(async (params?: Partial<UserQueryParams>) => {
    if (!repository) {
      setError('[useUserList] HttpCapability not initialized');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const query: UserQueryParams = {
        page: params?.page ?? stateRef.current.pagination.page,
        size: params?.size ?? stateRef.current.pagination.size,
        keyword: (params?.keyword ?? stateRef.current.keyword) || undefined,
        status: (params?.status ?? stateRef.current.statusFilter) || undefined,
        role: (params?.role ?? stateRef.current.roleFilter) || undefined,
      };
      
      const response: PagedResponse<User> = await repository.list(query);
      
      setUsers(response.content);
      setPagination({
        page: response.page,
        size: response.size,
        totalElements: response.totalElements,
        totalPages: response.totalPages,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load user list';
      setError(message);
      console.error('[useUserList] Load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [repository]);
  
  // ========================================================================
  // Initial Load
  // ========================================================================
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // ========================================================================
  // Event Subscriptions - Auto Refresh
  // ========================================================================
  
  useEffect(() => {
    if (!eventBus) return;
    
    // Refresh list after user creation
    const unsubCreate = eventBus.on(IDENTITY_EVENTS.USER_CREATED, () => {
      fetchData({ page: 0 }); // Jump to first page to show newly created user
    });
    
    // Refresh current page after user update
    const unsubUpdate = eventBus.on(IDENTITY_EVENTS.USER_UPDATED, () => {
      fetchData();
    });
    
    // Refresh current page after user deletion
    const unsubDelete = eventBus.on(IDENTITY_EVENTS.USER_DELETED, () => {
      fetchData();
    });
    
    // Refresh current page after user status change
    const unsubStatus = eventBus.on(IDENTITY_EVENTS.USER_STATUS_CHANGED, () => {
      fetchData();
    });
    
    // Unsubscribe on component unmount
    return () => {
      unsubCreate?.();
      unsubUpdate?.();
      unsubDelete?.();
      unsubStatus?.();
    };
  }, [eventBus, fetchData]);
  
  // ========================================================================
  // Action Methods
  // ========================================================================
  
  /** Refresh list */
  const refresh = useCallback(async (): Promise<void> => {
    await fetchData();
  }, [fetchData]);
  
  /** Set page number */
  const setPage = useCallback((page: number): void => {
    setPagination(prev => ({ ...prev, page }));
    fetchData({ page });
  }, [fetchData]);
  
  /** Set page size */
  const setPageSize = useCallback((size: number): void => {
    setPagination(prev => ({ ...prev, size, page: 0 }));
    fetchData({ size, page: 0 });
  }, [fetchData]);
  
  /** Search */
  const searchFn = useCallback((kw: string): void => {
    setKeyword(kw);
    fetchData({ keyword: kw, page: 0 });
  }, [fetchData]);
  
  /** Filter by status */
  const filterByStatus = useCallback((status: UserStatus | null): void => {
    setStatusFilter(status);
    fetchData({ status: status || undefined, page: 0 });
  }, [fetchData]);
  
  /** Filter by role */
  const filterByRole = useCallback((role: UserRole | null): void => {
    setRoleFilter(role);
    fetchData({ role: role || undefined, page: 0 });
  }, [fetchData]);
  
  /** Clear all filters */
  const clearFilters = useCallback((): void => {
    setKeyword('');
    setStatusFilter(null);
    setRoleFilter(null);
    fetchData({ keyword: undefined, status: undefined, role: undefined, page: 0 });
  }, [fetchData]);
  
  /** Delete user */
  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    if (!repository) {
      setError('[useUserList] HttpCapability not initialized');
      return false;
    }
    
    try {
      await repository.delete(userId);
      // Publish delete event (triggers list refresh)
      eventBus?.emit(IDENTITY_EVENTS.USER_DELETED, { userId });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      setError(message);
      console.error('[useUserList] Delete user failed:', err);
      return false;
    }
  }, [repository, eventBus]);
  
  /** Enable user */
  const enableUser = useCallback(async (userId: string, reason?: string): Promise<boolean> => {
    if (!repository) {
      setError('[useUserList] HttpCapability not initialized');
      return false;
    }
    
    try {
      await repository.enable(userId, reason);
      // Publish status change event (triggers list refresh)
      eventBus?.emit(IDENTITY_EVENTS.USER_STATUS_CHANGED, { 
        userId, 
        newStatus: 'ACTIVE',
        reason,
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable user';
      setError(message);
      console.error('[useUserList] Enable user failed:', err);
      return false;
    }
  }, [repository, eventBus]);
  
  /** Disable user */
  const disableUser = useCallback(async (userId: string, reason?: string): Promise<boolean> => {
    if (!repository) {
      setError('[useUserList] HttpCapability not initialized');
      return false;
    }
    
    try {
      await repository.disable(userId, reason);
      // Publish status change event (triggers list refresh)
      eventBus?.emit(IDENTITY_EVENTS.USER_STATUS_CHANGED, { 
        userId, 
        newStatus: 'DISABLED',
        reason,
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable user';
      setError(message);
      console.error('[useUserList] Disable user failed:', err);
      return false;
    }
  }, [repository, eventBus]);
  
  // ========================================================================
  // Return Result
  // ========================================================================
  
  return {
    // 状态
    users,
    loading,
    error,
    pagination,
    keyword,
    statusFilter,
    roleFilter,
    permissions,
    
    // 操作
    refresh,
    setPage,
    setPageSize,
    search: searchFn,
    filterByStatus,
    filterByRole,
    clearFilters,
    deleteUser,
    enableUser,
    disableUser,
  };
}
