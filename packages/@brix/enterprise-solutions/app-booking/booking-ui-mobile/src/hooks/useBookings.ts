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
 * useBookings Hook - ViewModel Layer for Booking List
 * 
 * This hook manages the state and business logic for the booking list view.
 * It follows the MVVM pattern where the hook acts as the ViewModel,
 * orchestrating data fetching and state management.
 * 
 * @module @brix-sdk/enterprise-booking-ui-mobile/hooks
 * @since 3.1.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttpCapability, useEventBus } from '@brix-sdk/runtime-sdk-react';
import type { Booking, BookingListParams, BookingStatus } from '@brix-sdk/enterprise-booking-shared';
import { createBookingRepository, type BookingRepository } from '../repositories';

/**
 * Booking list state interface
 * 
 * 预约列表状态接口
 */
export interface BookingsState {
  /** List of bookings */
  bookings: Booking[];
  /** Loading state indicator */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Total number of bookings */
  total: number;
  /** Current page number */
  page: number;
  /** Page size */
  pageSize: number;
  /** Whether more pages are available */
  hasMore: boolean;
}

/**
 * Booking list actions interface
 * 
 * 预约列表操作接口
 */
export interface BookingsActions {
  /** Refresh the booking list */
  refresh: () => Promise<void>;
  /** Load more bookings (pagination) */
  loadMore: () => Promise<void>;
  /** Filter bookings by status */
  filterByStatus: (status: BookingStatus | null) => void;
  /** Filter bookings by date range */
  filterByDateRange: (startDate: string, endDate: string) => void;
  /** Clear all filters */
  clearFilters: () => void;
}

/**
 * Hook return type combining state and actions
 */
export type UseBookingsReturn = BookingsState & BookingsActions;

/**
 * useBookings Hook
 * 
 * Provides state management and business logic for the booking list.
 * Automatically fetches data on mount and handles pagination, filtering,
 * and real-time updates via EventBus.
 * 
 * 提供预约列表的状态管理和业务逻辑
 * 自动在挂载时获取数据，处理分页、筛选，并通过 EventBus 处理实时更新
 * 
 * @param initialPageSize - Initial page size (default: 10)
 * @returns Combined state and actions object
 * 
 * @example
 * ```typescript
 * const { bookings, loading, error, refresh, loadMore } = useBookings(20);
 * 
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error} />;
 * 
 * return (
 *   <BookingList 
 *     bookings={bookings} 
 *     onRefresh={refresh}
 *     onLoadMore={loadMore}
 *   />
 * );
 * ```
 */
export function useBookings(initialPageSize: number = 10): UseBookingsReturn {
  const httpCapability = useHttpCapability();
  const eventBus = useEventBus();

  // State / 状态
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(initialPageSize);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  // Repository instance / 仓库实例
  const repository: BookingRepository = useMemo(
    () => createBookingRepository(httpCapability),
    [httpCapability]
  );

  // Build query params / 构建查询参数
  const buildParams = useCallback(
    (pageNum: number): BookingListParams => ({
      page: pageNum,
      size: pageSize,
      ...(statusFilter && { status: statusFilter }),
      ...(dateRange && { startDate: dateRange.start, endDate: dateRange.end })
    }),
    [pageSize, statusFilter, dateRange]
  );

  // Fetch bookings / 获取预约列表
  const fetchBookings = useCallback(
    async (pageNum: number, append: boolean = false) => {
      try {
        setLoading(true);
        setError(null);

        const params = buildParams(pageNum);
        const response = await repository.getBookings(params);

        setBookings(prev => append ? [...prev, ...response.items] : response.items);
        setTotal(response.total);
        setPage(pageNum);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch bookings';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [repository, buildParams]
  );

  // Actions / 操作方法
  const refresh = useCallback(async () => {
    await fetchBookings(1, false);
  }, [fetchBookings]);

  const loadMore = useCallback(async () => {
    const hasMore = page * pageSize < total;
    if (hasMore && !loading) {
      await fetchBookings(page + 1, true);
    }
  }, [fetchBookings, page, pageSize, total, loading]);

  const filterByStatus = useCallback((status: BookingStatus | null) => {
    setStatusFilter(status);
    setPage(1);
  }, []);

  const filterByDateRange = useCallback((startDate: string, endDate: string) => {
    setDateRange({ start: startDate, end: endDate });
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setStatusFilter(null);
    setDateRange(null);
    setPage(1);
  }, []);

  // Initial fetch / 初始加载
  useEffect(() => {
    fetchBookings(1, false);
  }, [statusFilter, dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to booking events for real-time updates
  // 订阅预约事件以实现实时更新
  useEffect(() => {
    const unsubscribeCreated = eventBus.on('booking.created', () => {
      refresh();
    });

    const unsubscribeUpdated = eventBus.on('booking.updated', () => {
      refresh();
    });

    const unsubscribeCancelled = eventBus.on('booking.cancelled', () => {
      refresh();
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeCancelled();
    };
  }, [eventBus, refresh]);

  // Computed values / 计算属性
  const hasMore = page * pageSize < total;

  return {
    bookings,
    loading,
    error,
    total,
    page,
    pageSize,
    hasMore,
    refresh,
    loadMore,
    filterByStatus,
    filterByDateRange,
    clearFilters
  };
}
