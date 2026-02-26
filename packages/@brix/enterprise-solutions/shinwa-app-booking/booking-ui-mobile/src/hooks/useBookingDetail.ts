/**
 * useBookingDetail Hook - ViewModel Layer for Booking Detail
 * 
 * This hook manages the state and business logic for a single booking view.
 * It handles fetching, updating, and actions like confirm/cancel.
 * 
 * @module @shinwa/booking-ui-mobile/hooks
 * @since 3.1.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttpCapability, useEventBus } from '@brix/runtime-sdk-react';
import type { Booking, BookingUpdateRequest } from '@shinwa/booking-shared';
import { createBookingRepository, type BookingRepository } from '../repositories';

/**
 * Booking detail state interface
 * 
 * 预约详情状态接口
 */
export interface BookingDetailState {
  /** Booking data */
  booking: Booking | null;
  /** Loading state indicator */
  loading: boolean;
  /** Submitting state (for actions) */
  submitting: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * Booking detail actions interface
 * 
 * 预约详情操作接口
 */
export interface BookingDetailActions {
  /** Refresh booking data */
  refresh: () => Promise<void>;
  /** Update booking details */
  update: (data: BookingUpdateRequest) => Promise<boolean>;
  /** Confirm the booking */
  confirm: () => Promise<boolean>;
  /** Cancel the booking */
  cancel: (reason?: string) => Promise<boolean>;
}

/**
 * Hook return type combining state and actions
 */
export type UseBookingDetailReturn = BookingDetailState & BookingDetailActions;

/**
 * useBookingDetail Hook
 * 
 * Provides state management and business logic for a single booking.
 * Automatically fetches data on mount and provides mutation actions.
 * 
 * 提供单个预约的状态管理和业务逻辑
 * 自动在挂载时获取数据，并提供修改操作
 * 
 * @param bookingId - The booking ID to fetch
 * @returns Combined state and actions object
 * 
 * @example
 * ```typescript
 * const { booking, loading, confirm, cancel } = useBookingDetail(bookingId);
 * 
 * if (loading) return <LoadingSpinner />;
 * if (!booking) return <NotFound />;
 * 
 * return (
 *   <BookingDetailView 
 *     booking={booking}
 *     onConfirm={confirm}
 *     onCancel={cancel}
 *   />
 * );
 * ```
 */
export function useBookingDetail(bookingId: string): UseBookingDetailReturn {
  const httpCapability = useHttpCapability();
  const eventBus = useEventBus();

  // State / 状态
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Repository instance / 仓库实例
  const repository: BookingRepository = useMemo(
    () => createBookingRepository(httpCapability),
    [httpCapability]
  );

  // Fetch booking detail / 获取预约详情
  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await repository.getBookingById(bookingId);
      setBooking(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch booking';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [repository, bookingId]);

  // Actions / 操作方法
  const refresh = useCallback(async () => {
    await fetchBooking();
  }, [fetchBooking]);

  const update = useCallback(async (data: BookingUpdateRequest): Promise<boolean> => {
    try {
      setSubmitting(true);
      setError(null);
      const updated = await repository.updateBooking(bookingId, data);
      setBooking(updated);
      eventBus.emit('booking.updated', { bookingId });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update booking';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, bookingId, eventBus]);

  const confirm = useCallback(async (): Promise<boolean> => {
    try {
      setSubmitting(true);
      setError(null);
      const confirmed = await repository.confirmBooking(bookingId);
      setBooking(confirmed);
      eventBus.emit('booking.confirmed', { bookingId });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to confirm booking';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, bookingId, eventBus]);

  const cancel = useCallback(async (reason?: string): Promise<boolean> => {
    try {
      setSubmitting(true);
      setError(null);
      await repository.cancelBooking(bookingId, reason);
      // Refresh to get updated status / 刷新以获取更新后的状态
      await fetchBooking();
      eventBus.emit('booking.cancelled', { bookingId });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel booking';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, bookingId, eventBus, fetchBooking]);

  // Initial fetch / 初始加载
  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    booking,
    loading,
    submitting,
    error,
    refresh,
    update,
    confirm,
    cancel
  };
}
