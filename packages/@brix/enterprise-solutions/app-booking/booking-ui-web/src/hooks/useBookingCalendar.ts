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
 * @file Booking Calendar ViewModel Hook
 * @description Manages booking calendar component state and data fetching
 * @module booking-ui-web/hooks/useBookingCalendar
 * @version 3.2.0
 * 
 * [v3.2 Frontend-Backend Separation Architecture]
 * This Hook is the ViewModel layer implementation for BookingCalendar component.
 * It abstracts data fetching logic from the component, allowing the component
 * to focus on pure rendering.
 * 
 * [Usage]
 * ```tsx
 * function BookingCalendar({ resourceId, sourceType, sourceId }) {
 *   const { bookings, loading, error, refresh } = useBookingCalendar({
 *     currentDate: new Date(),
 *     resourceId,
 *     sourceType,
 *     sourceId,
 *   });
 *   
 *   // Pure rendering logic
 * }
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp } from '@brix-sdk/runtime-sdk-react';
import { createBookingRepository, type BookingRepository } from '../repositories';
import type { Booking, BookingStatus } from 'booking-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Hook parameters
 */
export interface UseBookingCalendarParams {
  /** Current calendar date (used to filter by month) */
  currentDate: Date;
  /** Resource ID for filtering bookings (optional) */
  resourceId?: number;
  /** Source type for filtering (e.g., 'case', 'contract') */
  sourceType?: string;
  /** Source ID for filtering */
  sourceId?: number;
}

/**
 * Booking calendar state
 */
export interface BookingCalendarState {
  /** Booking list data (filtered by month and resource) */
  bookings: Booking[];
  /** Whether loading */
  loading: boolean;
  /** Error message */
  error: string | null;
}

/**
 * Booking calendar actions
 */
export interface BookingCalendarActions {
  /** Refresh booking data */
  refresh: () => Promise<void>;
}

/**
 * useBookingCalendar Hook return type
 */
export type UseBookingCalendarResult = BookingCalendarState & BookingCalendarActions;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Booking Calendar ViewModel Hook
 * 
 * Fetches bookings based on provided filters and manages loading state.
 * The component can focus on rendering logic while this hook handles data.
 * 
 * [Data Fetching Strategy]
 * - If sourceType and sourceId are provided: fetch by source
 * - Otherwise: fetch current user's bookings
 * - Results are filtered by current month and optional resourceId
 * 
 * @param params - Hook parameters including date and filters
 * @returns Booking calendar state and actions
 */
export function useBookingCalendar(params: UseBookingCalendarParams): UseBookingCalendarResult {
  const { currentDate, resourceId, sourceType, sourceId } = params;
  
  // ========================================================================
  // Dependency Injection
  // ========================================================================
  
  const http = useHttp();
  
  // Create repository instance
  const repository: BookingRepository = useMemo(
    () => createBookingRepository(http),
    [http]
  );
  
  // ========================================================================
  // State
  // ========================================================================
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ========================================================================
  // Data Fetching
  // ========================================================================
  
  /**
   * Fetch booking data based on current filters
   */
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data: Booking[];
      
      // Determine fetch strategy
      if (sourceType && sourceId) {
        // Fetch by source (e.g., bookings related to a specific case/contract)
        data = await repository.getBySource(sourceType, sourceId);
      } else {
        // Fetch current user's bookings
        data = await repository.getMyBookings();
      }
      
      // Filter by current month
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      let filtered = data.filter(booking => {
        const bookingDate = new Date(booking.reservedDate);
        return bookingDate.getFullYear() === year && bookingDate.getMonth() === month;
      });
      
      // Further filter by resourceId if specified
      if (resourceId !== undefined) {
        filtered = filtered.filter(booking => booking.resourceId === resourceId);
      }
      
      setBookings(filtered);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load bookings';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [repository, currentDate, resourceId, sourceType, sourceId]);
  
  // ========================================================================
  // Effects
  // ========================================================================
  
  // Fetch data when filters change
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);
  
  // ========================================================================
  // Actions
  // ========================================================================
  
  /**
   * Manually refresh booking data
   */
  const refresh = useCallback(async () => {
    await fetchBookings();
  }, [fetchBookings]);
  
  // ========================================================================
  // Return
  // ========================================================================
  
  return {
    bookings,
    loading,
    error,
    refresh,
  };
}
