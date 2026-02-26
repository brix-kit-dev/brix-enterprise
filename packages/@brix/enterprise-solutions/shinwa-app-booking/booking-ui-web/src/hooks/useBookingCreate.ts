/**
 * @file Booking Create ViewModel Hook
 * @description Manages booking creation page state and business logic
 * @module booking-ui-web/hooks/useBookingCreate
 * @version 3.2.0
 * 
 * [v3.2 Frontend-Backend Separation Architecture]
 * This Hook is the ViewModel layer implementation, responsible for:
 * 1. Managing booking creation form state
 * 2. Loading available resource list
 * 3. Querying available time slots
 * 4. Submitting new bookings and publishing events
 */

import { useState, useCallback, useMemo } from 'react';
import { useHttp, useEventBus, useNavigation } from '@brix/runtime-sdk-react';
import { createBookingRepository, createResourceRepository, type BookingRepository, type ResourceRepository } from '../repositories';
import type { Booking, CreateBookingParams, TimeSlot, Resource } from 'booking-shared';
import { BOOKING_EVENTS, BOOKING_PAGE_IDS } from 'booking-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Booking create state
 */
export interface BookingCreateState {
  /** Whether submitting */
  submitting: boolean;
  /** Error message */
  error: string | null;
  /** Available resource list */
  resources: Resource[];
  /** Resources loading */
  resourcesLoading: boolean;
  /** Available time slots list */
  availableSlots: TimeSlot[];
  /** Slots loading */
  slotsLoading: boolean;
  /** Created booking data after success */
  createdBooking: Booking | null;
}

/**
 * Booking create action methods
 */
export interface BookingCreateActions {
  /** Create booking */
  createBooking: (params: CreateBookingParams) => Promise<Booking | null>;
  /** Load available resources */
  loadResources: () => Promise<void>;
  /** Load available time slots */
  loadAvailableSlots: (resourceId: number, date: string) => Promise<void>;
  /** Clear error */
  clearError: () => void;
  /** Reset state */
  reset: () => void;
  /** Navigate to booking list page */
  navigateToList: () => void;
  /** Navigate to booking detail page */
  navigateToDetail: (bookingId: number) => void;
}

/**
 * useBookingCreate Hook 返回类型
 */
export type UseBookingCreateResult = BookingCreateState & BookingCreateActions;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Booking Create ViewModel Hook
 * 
 * [Features]
 * - Load available resource list for booking
 * - Query available time slots based on resource and date
 * - Submit new booking form
 * - Publish creation event after successful creation
 * - Provide reset and navigation functionality
 * 
 * @returns Booking create state and action methods
 */
export function useBookingCreate(): UseBookingCreateResult {
  // ========================================================================
  // Dependency Injection
  // ========================================================================
  
  const http = useHttp();
  const eventBus = useEventBus();
  const navigation = useNavigation();
  
  // Repository 实例
  const bookingRepository = useMemo<BookingRepository | null>(
    () => http ? createBookingRepository(http) : null,
    [http]
  );
  
  const resourceRepository = useMemo<ResourceRepository | null>(
    () => http ? createResourceRepository(http) : null,
    [http]
  );
  
  // ========================================================================
  // State Definitions
  // ========================================================================
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  
  // ========================================================================
  // Data Loading
  // ========================================================================
  
  /**
   * Load available resource list for booking
   */
  const loadResources = useCallback(async (): Promise<void> => {
    if (!resourceRepository) {
      setError('[useBookingCreate] HttpCapability not initialized');
      return;
    }
    
    setResourcesLoading(true);
    setError(null);
    
    try {
      const data = await resourceRepository.listAvailable();
      setResources(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load resource list';
      setError(message);
      console.error('[useBookingCreate] Load resources failed:', err);
    } finally {
      setResourcesLoading(false);
    }
  }, [resourceRepository]);
  
  /**
   * Load available time slots
   * 
   * @param resourceId - Resource ID
   * @param date - Date (YYYY-MM-DD format)
   */
  const loadAvailableSlots = useCallback(async (
    resourceId: number,
    date: string
  ): Promise<void> => {
    if (!bookingRepository) {
      setError('[useBookingCreate] HttpCapability not initialized');
      return;
    }
    
    setSlotsLoading(true);
    setError(null);
    
    try {
      const slots = await bookingRepository.getAvailableSlots(resourceId, date);
      setAvailableSlots(slots);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load available slots';
      setError(message);
      console.error('[useBookingCreate] Load slots failed:', err);
    } finally {
      setSlotsLoading(false);
    }
  }, [bookingRepository]);
  
  // ========================================================================
  // Action Methods
  // ========================================================================
  
  /**
   * Create booking
   * 
   * @param params - Create booking parameters
   * @returns Returns booking data on success, null on failure
   */
  const createBooking = useCallback(async (
    params: CreateBookingParams
  ): Promise<Booking | null> => {
    if (!bookingRepository) {
      setError('[useBookingCreate] HttpCapability not initialized');
      return null;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const booking = await bookingRepository.create(params);
      setCreatedBooking(booking);
      
      // Publish booking creation event
      eventBus?.emit(BOOKING_EVENTS.CREATED, {
        id: booking.id,
        bookingNo: booking.bookingNo,
        resourceId: booking.resourceId,
        createdAt: new Date().toISOString(),
      });
      
      return booking;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create booking';
      setError(message);
      console.error('[useBookingCreate] Create failed:', err);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [bookingRepository, eventBus]);
  
  /** Clear error */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);
  
  /** Reset state */
  const reset = useCallback((): void => {
    setSubmitting(false);
    setError(null);
    setAvailableSlots([]);
    setCreatedBooking(null);
  }, []);
  
  /** Navigate to booking list page */
  const navigateToList = useCallback((): void => {
    navigation?.navigate(BOOKING_PAGE_IDS.LIST);
  }, [navigation]);
  
  /** Navigate to booking detail page */
  const navigateToDetail = useCallback((bookingId: number): void => {
    navigation?.navigate(BOOKING_PAGE_IDS.DETAIL, { id: bookingId });
  }, [navigation]);
  
  // ========================================================================
  // Return Results
  // ========================================================================
  
  return {
    // State
    submitting,
    error,
    resources,
    resourcesLoading,
    availableSlots,
    slotsLoading,
    createdBooking,
    
    // Actions
    createBooking,
    loadResources,
    loadAvailableSlots,
    clearError,
    reset,
    navigateToList,
    navigateToDetail,
  };
}
