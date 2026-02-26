/**
 * @file Booking List ViewModel Hook
 * @description Manages booking list page state and business logic
 * @module booking-ui-web/hooks/useBookingList
 * @version 3.2.0
 * 
 * [v3.2 Frontend-Backend Separation Architecture]
 * This Hook is the ViewModel layer implementation, responsible for:
 * 1. Managing booking list loading state, data, and pagination
 * 2. Handling search, filtering, date range, and other business logic
 * 3. Subscribing to relevant events for automatic refresh
 * 
 * [Usage]
 * ```tsx
 * function BookingListPage() {
 *   const { 
 *     bookings, loading, error, pagination,
 *     refresh, search, filterByStatus, setPage 
 *   } = useBookingList();
 *   
 *   // Pure rendering logic
 * }
 * ```
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useHttp, useEventBus, useAuth } from '@brix/runtime-sdk-react';
import { createBookingRepository, type BookingRepository, type BookingQueryParams } from '../repositories';
import type { Booking, BookingStatus, PagedResponse } from 'booking-shared';
import { BOOKING_EVENTS, BOOKING_PERMISSIONS } from 'booking-shared';

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
  /** Total elements count */
  totalElements: number;
  /** Total pages count */
  totalPages: number;
}

/**
 * Date range
 */
export interface DateRange {
  /** Start date (YYYY-MM-DD format) */
  from: string | null;
  /** End date (YYYY-MM-DD format) */
  to: string | null;
}

/**
 * Booking list state
 */
export interface BookingListState {
  /** Booking list data */
  bookings: Booking[];
  /** Whether loading */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Pagination state */
  pagination: PaginationState;
  /** Current search keyword */
  keyword: string;
  /** Current status filter */
  statusFilter: BookingStatus | null;
  /** Current resource filter */
  resourceFilter: number | null;
  /** Date range filter */
  dateRange: DateRange;
  /** Permission state */
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canConfirm: boolean;
    canCancel: boolean;
    canComplete: boolean;
  };
}

/**
 * Booking list action methods
 */
export interface BookingListActions {
  /** Refresh list */
  refresh: () => Promise<void>;
  /** Set current page */
  setPage: (page: number) => void;
  /** Set page size */
  setPageSize: (size: number) => void;
  /** Search */
  search: (keyword: string) => void;
  /** Filter by status */
  filterByStatus: (status: BookingStatus | null) => void;
  /** Filter by resource */
  filterByResource: (resourceId: number | null) => void;
  /** Filter by date range */
  filterByDateRange: (range: DateRange) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Confirm booking */
  confirmBooking: (id: number) => Promise<boolean>;
  /** Cancel booking */
  cancelBooking: (id: number, reason: string) => Promise<boolean>;
  /** Complete booking */
  completeBooking: (id: number) => Promise<boolean>;
  /** Mark as no-show */
  markNoShow: (id: number) => Promise<boolean>;
}

/**
 * useBookingList Hook 返回类型
 */
export type UseBookingListResult = BookingListState & BookingListActions;

// ============================================================================
// Constants
// ============================================================================

/** Default page size */
const DEFAULT_PAGE_SIZE = 10;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Booking List ViewModel Hook
 * 
 * [Features]
 * - Manages booking list data and loading state
 * - Supports pagination, search, status filtering, date range filtering
 * - Subscribes to booking change events for automatic list refresh
 * - Provides booking status change operations
 * 
 * [Event Subscriptions]
 * - booking:created - Refresh list after booking created
 * - booking:confirmed - Refresh list after booking confirmed
 * - booking:cancelled - Refresh list after booking cancelled
 * - booking:completed - Refresh list after booking completed
 * 
 * @returns Booking list state and action methods
 */
export function useBookingList(): UseBookingListResult {
  // ========================================================================
  // Dependency Injection
  // ========================================================================
  
  const http = useHttp();
  const eventBus = useEventBus();
  const auth = useAuth();
  
  // Repository 实例
  const repository = useMemo<BookingRepository | null>(
    () => http ? createBookingRepository(http) : null,
    [http]
  );
  
  // ========================================================================
  // State Definitions
  // ========================================================================
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | null>(null);
  const [resourceFilter, setResourceFilter] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  
  // Permission check
  const permissions = useMemo(() => ({
    canCreate: auth.hasPermission(BOOKING_PERMISSIONS.CREATE),
    canEdit: auth.hasPermission(BOOKING_PERMISSIONS.WRITE),
    canConfirm: auth.hasPermission(BOOKING_PERMISSIONS.CONFIRM),
    canCancel: auth.hasPermission(BOOKING_PERMISSIONS.CANCEL),
    canComplete: auth.hasPermission(BOOKING_PERMISSIONS.COMPLETE),
  }), [auth]);
  
  // Use ref to store latest state
  const stateRef = useRef({ 
    keyword, statusFilter, resourceFilter, dateRange, pagination 
  });
  stateRef.current = { keyword, statusFilter, resourceFilter, dateRange, pagination };
  
  // ========================================================================
  // Data Loading
  // ========================================================================
  
  /**
   * Load booking list
   */
  const fetchData = useCallback(async (params?: Partial<BookingQueryParams>) => {
    if (!repository) {
      setError('[useBookingList] HttpCapability 未初始化');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const current = stateRef.current;
      const query: BookingQueryParams = {
        page: params?.page ?? current.pagination.page,
        size: params?.size ?? current.pagination.size,
        keyword: (params?.keyword ?? current.keyword) || undefined,
        status: (params?.status ?? current.statusFilter) || undefined,
        resourceId: (params?.resourceId ?? current.resourceFilter) || undefined,
        dateFrom: current.dateRange.from || undefined,
        dateTo: current.dateRange.to || undefined,
      };
      
      const response: PagedResponse<Booking> = await repository.list(query);
      
      setBookings(response.content);
      setPagination({
        page: response.page,
        size: response.size,
        totalElements: response.totalElements,
        totalPages: response.totalPages,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load booking list';
      setError(message);
      console.error('[useBookingList] Load failed:', err);
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
  // Event Subscription - Auto Refresh
  // ========================================================================
  
  useEffect(() => {
    if (!eventBus) return;
    
    const unsubCreate = eventBus.on(BOOKING_EVENTS.CREATED, () => {
      fetchData({ page: 0 });
    });
    
    const unsubConfirm = eventBus.on(BOOKING_EVENTS.CONFIRMED, () => {
      fetchData();
    });
    
    const unsubCancel = eventBus.on(BOOKING_EVENTS.CANCELLED, () => {
      fetchData();
    });
    
    const unsubComplete = eventBus.on(BOOKING_EVENTS.COMPLETED, () => {
      fetchData();
    });
    
    const unsubNoShow = eventBus.on(BOOKING_EVENTS.NO_SHOW, () => {
      fetchData();
    });
    
    return () => {
      unsubCreate?.();
      unsubConfirm?.();
      unsubCancel?.();
      unsubComplete?.();
      unsubNoShow?.();
    };
  }, [eventBus, fetchData]);
  
  // ========================================================================
  // Action Methods
  // ========================================================================
  
  /** Refresh list */
  const refresh = useCallback(async (): Promise<void> => {
    await fetchData();
  }, [fetchData]);
  
  /** Set page */
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
  const filterByStatus = useCallback((status: BookingStatus | null): void => {
    setStatusFilter(status);
    fetchData({ status: status || undefined, page: 0 });
  }, [fetchData]);
  
  /** Filter by resource */
  const filterByResource = useCallback((resourceId: number | null): void => {
    setResourceFilter(resourceId);
    fetchData({ resourceId: resourceId || undefined, page: 0 });
  }, [fetchData]);
  
  /** Filter by date range */
  const filterByDateRange = useCallback((range: DateRange): void => {
    setDateRange(range);
    // Date range change requires re-query
    fetchData({ page: 0 });
  }, [fetchData]);
  
  /** Clear all filters */
  const clearFilters = useCallback((): void => {
    setKeyword('');
    setStatusFilter(null);
    setResourceFilter(null);
    setDateRange({ from: null, to: null });
    fetchData({ 
      keyword: undefined, 
      status: undefined, 
      resourceId: undefined, 
      page: 0 
    });
  }, [fetchData]);
  
  /** Confirm booking */
  const confirmBooking = useCallback(async (id: number): Promise<boolean> => {
    if (!repository) {
      setError('[useBookingList] HttpCapability not initialized');
      return false;
    }
    
    try {
      const booking = await repository.confirm(id);
      eventBus?.emit(BOOKING_EVENTS.CONFIRMED, {
        id: booking.id,
        bookingNo: booking.bookingNo,
        confirmedAt: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to confirm booking';
      setError(message);
      console.error('[useBookingList] Confirm booking failed:', err);
      return false;
    }
  }, [repository, eventBus]);
  
  /** Cancel booking */
  const cancelBooking = useCallback(async (id: number, reason: string): Promise<boolean> => {
    if (!repository) {
      setError('[useBookingList] HttpCapability not initialized');
      return false;
    }
    
    try {
      await repository.cancel(id, { reason });
      eventBus?.emit(BOOKING_EVENTS.CANCELLED, {
        id,
        reason,
        cancelledAt: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel booking';
      setError(message);
      console.error('[useBookingList] Cancel booking failed:', err);
      return false;
    }
  }, [repository, eventBus]);
  
  /** Complete booking */
  const completeBooking = useCallback(async (id: number): Promise<boolean> => {
    if (!repository) {
      setError('[useBookingList] HttpCapability not initialized');
      return false;
    }
    
    try {
      const booking = await repository.complete(id);
      eventBus?.emit(BOOKING_EVENTS.COMPLETED, {
        id: booking.id,
        bookingNo: booking.bookingNo,
        completedAt: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete booking';
      setError(message);
      console.error('[useBookingList] Complete booking failed:', err);
      return false;
    }
  }, [repository, eventBus]);
  
  /** Mark as no-show */
  const markNoShow = useCallback(async (id: number): Promise<boolean> => {
    if (!repository) {
      setError('[useBookingList] HttpCapability not initialized');
      return false;
    }
    
    try {
      const booking = await repository.markNoShow(id);
      eventBus?.emit(BOOKING_EVENTS.NO_SHOW, {
        id: booking.id,
        bookingNo: booking.bookingNo,
        markedAt: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark as no-show';
      setError(message);
      console.error('[useBookingList] Mark no-show failed:', err);
      return false;
    }
  }, [repository, eventBus]);
  
  // ========================================================================
  // Return Results
  // ========================================================================
  
  return {
    // State
    bookings,
    loading,
    error,
    pagination,
    keyword,
    statusFilter,
    resourceFilter,
    dateRange,
    permissions,
    
    // Actions
    refresh,
    setPage,
    setPageSize,
    search: searchFn,
    filterByStatus,
    filterByResource,
    filterByDateRange,
    clearFilters,
    confirmBooking,
    cancelBooking,
    completeBooking,
    markNoShow,
  };
}
