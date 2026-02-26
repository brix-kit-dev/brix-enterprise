/**
 * @file Carousel List ViewModel Hook
 * @description Manages state and business logic for carousel list page
 * @module carousel-ui-web/hooks/useCarouselList
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook is the ViewModel layer implementation, responsible for:
 * 1. Managing carousel list loading state and data
 * 2. Handling CRUD operations
 * 3. Subscribing to relevant events for auto-refresh
 * 
 * Usage:
 * ```tsx
 * function CarouselListPage() {
 *   const { 
 *     carousels, loading, error,
 *     refresh, deleteCarousel, toggleEnabled
 *   } = useCarouselList();
 *   
 *   // Pure rendering logic
 * }
 * ```
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useHttp, useEventBus, useAuth } from '@brix/runtime-sdk-react';
import { createCarouselRepository, type CarouselRepository } from '../repositories';
import type { CarouselDTO } from '@shinwa/carousel-shared';
import { CAROUSEL_EVENTS, CAROUSEL_PERMISSIONS } from '@shinwa/carousel-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Carousel List State
 */
export interface CarouselListState {
  /** Carousel list data */
  carousels: CarouselDTO[];
  /** Is loading */
  loading: boolean;
  /** Is operating */
  operating: boolean;
  /** Error message */
  error: string | null;
  /** Permission state */
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

/**
 * Carousel List Actions
 */
export interface CarouselListActions {
  /** Refresh list */
  refresh: () => Promise<void>;
  /** Delete carousel */
  deleteCarousel: (id: number) => Promise<boolean>;
  /** Toggle enabled state */
  toggleEnabled: (id: number, enabled: boolean) => Promise<boolean>;
}

/**
 * useCarouselList Hook return type
 */
export type UseCarouselListResult = CarouselListState & CarouselListActions;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Carousel List ViewModel Hook
 * 
 * Features:
 * - Manage carousel list data and loading state
 * - Provide delete, enable/disable operations
 * - Subscribe to carousel change events for auto-refresh
 * 
 * Event Subscriptions:
 * - carousel:carousel_created - Refresh list after carousel creation
 * - carousel:carousel_updated - Refresh list after carousel update
 * - carousel:carousel_deleted - Refresh list after carousel deletion
 * 
 * @returns Carousel list state and actions
 */
export function useCarouselList(): UseCarouselListResult {
  // -------------------- Get Capabilities --------------------
  const http = useHttp();
  const eventBus = useEventBus();
  const { hasPermission } = useAuth();

  // -------------------- Create Repository --------------------
  const repositoryRef = useRef<CarouselRepository | null>(null);
  
  if (!repositoryRef.current && http) {
    repositoryRef.current = createCarouselRepository(http);
  }

  // -------------------- State Definitions --------------------
  const [carousels, setCarousels] = useState<CarouselDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [operating, setOperating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------- Permission Check --------------------
  const permissions = useMemo(() => ({
    canCreate: hasPermission?.(CAROUSEL_PERMISSIONS.CREATE) ?? true,
    canEdit: hasPermission?.(CAROUSEL_PERMISSIONS.UPDATE) ?? true,
    canDelete: hasPermission?.(CAROUSEL_PERMISSIONS.DELETE) ?? true,
  }), [hasPermission]);

  // -------------------- Data Loading --------------------
  /**
   * Refresh carousel list
   */
  const refresh = useCallback(async () => {
    if (!repositoryRef.current) {
      setError('Repository not initialized');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await repositoryRef.current.listAll();
      setCarousels(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load carousel list';
      setError(message);
      console.error('[useCarouselList] Load failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // -------------------- Action Methods --------------------
  /**
   * Delete carousel
   * 
   * @param id - Carousel ID
   * @returns Success or not
   */
  const deleteCarousel = useCallback(async (id: number): Promise<boolean> => {
    if (!repositoryRef.current) {
      setError('Repository not initialized');
      return false;
    }

    setOperating(true);
    
    try {
      await repositoryRef.current.delete(id);
      
      // Publish delete event
      eventBus?.publish(CAROUSEL_EVENTS.CAROUSEL_DELETED, { id });
      
      // Remove from local list
      setCarousels((prev: CarouselDTO[]) => prev.filter((c: CarouselDTO) => c.id !== id));
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete carousel';
      setError(message);
      console.error('[useCarouselList] Delete failed:', err);
      return false;
    } finally {
      setOperating(false);
    }
  }, [eventBus]);

  /**
   * Toggle carousel enabled state
   * 
   * @param id - Carousel ID
   * @param enabled - Target state
   * @returns Success or not
   */
  const toggleEnabled = useCallback(async (id: number, enabled: boolean): Promise<boolean> => {
    if (!repositoryRef.current) {
      setError('Repository not initialized');
      return false;
    }

    setOperating(true);
    
    try {
      const updated = enabled
        ? await repositoryRef.current.enable(id)
        : await repositoryRef.current.disable(id);
      
      // Publish update event
      eventBus?.publish(CAROUSEL_EVENTS.CAROUSEL_UPDATED, {
        id,
        code: updated.code,
        name: updated.name,
        updatedFields: ['enabled'],
      });
      
      // Update local list
      setCarousels((prev: CarouselDTO[]) => prev.map((c: CarouselDTO) => c.id === id ? updated : c));
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle state';
      setError(message);
      console.error('[useCarouselList] Toggle state failed:', err);
      return false;
    } finally {
      setOperating(false);
    }
  }, [eventBus]);

  // -------------------- Initial Load --------------------
  useEffect(() => {
    refresh();
  }, [refresh]);

  // -------------------- Event Subscription --------------------
  useEffect(() => {
    if (!eventBus) return;

    // Subscribe to carousel change events
    const unsubscribeCreated = eventBus.subscribe(
      CAROUSEL_EVENTS.CAROUSEL_CREATED,
      () => refresh()
    );
    
    const unsubscribeUpdated = eventBus.subscribe(
      CAROUSEL_EVENTS.CAROUSEL_UPDATED,
      () => refresh()
    );

    return () => {
      unsubscribeCreated?.();
      unsubscribeUpdated?.();
    };
  }, [eventBus, refresh]);

  // -------------------- Return Result --------------------
  return {
    // State
    carousels,
    loading,
    operating,
    error,
    permissions,
    // Actions
    refresh,
    deleteCarousel,
    toggleEnabled,
  };
}
