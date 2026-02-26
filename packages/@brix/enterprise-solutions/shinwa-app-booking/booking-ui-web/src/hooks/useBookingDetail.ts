/**
 * @file Booking Detail ViewModel Hook
 * @description Manages booking detail page state and business logic
 * @module booking-ui-web/hooks/useBookingDetail
 * @version 3.2.0
 * 
 * [v3.2 Frontend-Backend Separation Architecture]
 * This Hook is the ViewModel layer implementation, responsible for:
 * 1. Loading and managing booking detail data
 * 2. Handling booking status change operations
 * 3. Publishing relevant events to notify other components
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp, useEventBus, useAuth } from '@brix/runtime-sdk-react';
import { createBookingRepository, type BookingRepository } from '../repositories';
import type { Booking, UpdateBookingParams, CancelBookingParams } from 'booking-shared';
import { BOOKING_EVENTS, BOOKING_PERMISSIONS } from 'booking-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Booking detail state
 */
export interface BookingDetailState {
  /** Booking data */
  booking: Booking | null;
  /** Whether loading */
  loading: boolean;
  /** Whether submitting */
  submitting: boolean;
  /** Error message */
  error: string | null;
  /** Permission state */
  permissions: {
    canEdit: boolean;
    canConfirm: boolean;
    canCancel: boolean;
    canComplete: boolean;
    canMarkNoShow: boolean;
  };
}

/**
 * Booking detail action methods
 */
export interface BookingDetailActions {
  /** Refresh booking data */
  refresh: () => Promise<void>;
  /** Update booking info */
  updateBooking: (params: UpdateBookingParams) => Promise<boolean>;
  /** Confirm booking */
  confirmBooking: () => Promise<boolean>;
  /** Cancel booking */
  cancelBooking: (reason: string) => Promise<boolean>;
  /** Complete booking */
  completeBooking: () => Promise<boolean>;
  /** Mark as no-show */
  markNoShow: () => Promise<boolean>;
}

/**
 * useBookingDetail Hook 返回类型
 */
export type UseBookingDetailResult = BookingDetailState & BookingDetailActions;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Booking Detail ViewModel Hook
 * 
 * [Features]
 * - Load booking detail by booking ID
 * - Provide booking info update functionality
 * - Provide booking status change functionality (confirm/cancel/complete/no-show)
 * - Subscribe to booking change events for automatic data refresh
 * 
 * @param bookingId - Booking ID
 * @returns Booking detail state and action methods
 */
export function useBookingDetail(bookingId: number): UseBookingDetailResult {
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
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Permission check
  const permissions = useMemo(() => ({
    canEdit: auth.hasPermission(BOOKING_PERMISSIONS.WRITE),
    canConfirm: auth.hasPermission(BOOKING_PERMISSIONS.CONFIRM),
    canCancel: auth.hasPermission(BOOKING_PERMISSIONS.CANCEL),
    canComplete: auth.hasPermission(BOOKING_PERMISSIONS.COMPLETE),
    canMarkNoShow: auth.hasPermission(BOOKING_PERMISSIONS.COMPLETE),
  }), [auth]);
  
  // ========================================================================
  // Data Loading
  // ========================================================================
  
  /**
   * Load booking detail
   */
  const fetchData = useCallback(async (): Promise<void> => {
    if (!repository || !bookingId) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await repository.getById(bookingId);
      setBooking(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load booking detail';
      setError(message);
      console.error('[useBookingDetail] Load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [repository, bookingId]);
  
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
    if (!eventBus || !bookingId) return;
    
    // Refresh after booking confirmed
    const unsubConfirm = eventBus.on(BOOKING_EVENTS.CONFIRMED, (payload: { id: number }) => {
      if (payload.id === bookingId) {
        fetchData();
      }
    });
    
    // Refresh after booking cancelled
    const unsubCancel = eventBus.on(BOOKING_EVENTS.CANCELLED, (payload: { id: number }) => {
      if (payload.id === bookingId) {
        fetchData();
      }
    });
    
    // Refresh after booking completed
    const unsubComplete = eventBus.on(BOOKING_EVENTS.COMPLETED, (payload: { id: number }) => {
      if (payload.id === bookingId) {
        fetchData();
      }
    });
    
    return () => {
      unsubConfirm?.();
      unsubCancel?.();
      unsubComplete?.();
    };
  }, [eventBus, bookingId, fetchData]);
  
  // ========================================================================
  // Action Methods
  // ========================================================================
  
  /** Refresh data */
  const refresh = useCallback(async (): Promise<void> => {
    await fetchData();
  }, [fetchData]);
  
  /** Update booking info */
  const updateBooking = useCallback(async (params: UpdateBookingParams): Promise<boolean> => {
    if (!repository || !bookingId) {
      setError('[useBookingDetail] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const updatedBooking = await repository.update(bookingId, params);
      setBooking(updatedBooking);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update booking';
      setError(message);
      console.error('[useBookingDetail] Update failed:', err);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, bookingId]);
  
  /** Confirm booking */
  const confirmBooking = useCallback(async (): Promise<boolean> => {
    if (!repository || !bookingId) {
      setError('[useBookingDetail] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const confirmedBooking = await repository.confirm(bookingId);
      setBooking(confirmedBooking);
      
      eventBus?.emit(BOOKING_EVENTS.CONFIRMED, {
        id: confirmedBooking.id,
        bookingNo: confirmedBooking.bookingNo,
        confirmedAt: new Date().toISOString(),
      });
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to confirm booking';
      setError(message);
      console.error('[useBookingDetail] Confirm failed:', err);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, bookingId, eventBus]);
  
  /** Cancel booking */
  const cancelBooking = useCallback(async (reason: string): Promise<boolean> => {
    if (!repository || !bookingId) {
      setError('[useBookingDetail] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      await repository.cancel(bookingId, { reason });
      
      eventBus?.emit(BOOKING_EVENTS.CANCELLED, {
        id: bookingId,
        bookingNo: booking?.bookingNo,
        reason,
        cancelledAt: new Date().toISOString(),
      });
      
      // Refresh data to get latest status
      await fetchData();
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel booking';
      setError(message);
      console.error('[useBookingDetail] Cancel failed:', err);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, bookingId, booking?.bookingNo, fetchData, eventBus]);
  
  /** Complete booking */
  const completeBooking = useCallback(async (): Promise<boolean> => {
    if (!repository || !bookingId) {
      setError('[useBookingDetail] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const completedBooking = await repository.complete(bookingId);
      setBooking(completedBooking);
      
      eventBus?.emit(BOOKING_EVENTS.COMPLETED, {
        id: completedBooking.id,
        bookingNo: completedBooking.bookingNo,
        completedAt: new Date().toISOString(),
      });
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete booking';
      setError(message);
      console.error('[useBookingDetail] Complete failed:', err);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, bookingId, eventBus]);
  
  /** Mark as no-show */
  const markNoShow = useCallback(async (): Promise<boolean> => {
    if (!repository || !bookingId) {
      setError('[useBookingDetail] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const markedBooking = await repository.markNoShow(bookingId);
      setBooking(markedBooking);
      
      eventBus?.emit(BOOKING_EVENTS.NO_SHOW, {
        id: markedBooking.id,
        bookingNo: markedBooking.bookingNo,
        markedAt: new Date().toISOString(),
      });
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark as no-show';
      setError(message);
      console.error('[useBookingDetail] Mark no-show failed:', err);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, bookingId, eventBus]);
  
  // ========================================================================
  // Return Results
  // ========================================================================
  
  return {
    // State
    booking,
    loading,
    submitting,
    error,
    permissions,
    
    // Actions
    refresh,
    updateBooking,
    confirmBooking,
    cancelBooking,
    completeBooking,
    markNoShow,
  };
}
