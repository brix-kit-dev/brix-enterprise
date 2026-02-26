/**
 * @file Carousel Detail ViewModel Hook
 * @description Manages the state and business logic for the carousel detail page
 * @module carousel-ui-web/hooks/useCarouselDetail
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook is the ViewModel layer implementation, responsible for:
 * 1. Managing the loading state and data for carousel details
 * 2. Handling Banner CRUD operations
 * 3. Subscribing to related events for automatic refresh
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useHttp, useEventBus, useAuth } from '@brix/runtime-sdk-react';
import { 
  createCarouselRepository, 
  createBannerRepository,
  type CarouselRepository, 
  type BannerRepository 
} from '../repositories';
import type { CarouselDTO, BannerDTO, CreateBannerParams, UpdateBannerParams } from '@shinwa/carousel-shared';
import { CAROUSEL_EVENTS, CAROUSEL_PERMISSIONS } from '@shinwa/carousel-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Carousel detail state
 */
export interface CarouselDetailState {
  /** Carousel data */
  carousel: CarouselDTO | null;
  /** Banner list */
  banners: BannerDTO[];
  /** Whether loading */
  loading: boolean;
  /** Whether executing operation */
  operating: boolean;
  /** Error message */
  error: string | null;
  /** Permission state */
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canManageBanner: boolean;
  };
}

/**
 * Carousel detail action methods
 */
export interface CarouselDetailActions {
  /** Refresh data */
  refresh: () => Promise<void>;
  /** Add banner */
  addBanner: (params: CreateBannerParams) => Promise<boolean>;
  /** Update banner */
  updateBanner: (id: number, params: UpdateBannerParams) => Promise<boolean>;
  /** Delete banner */
  deleteBanner: (id: number) => Promise<boolean>;
  /** Enable banner */
  enableBanner: (id: number) => Promise<boolean>;
  /** Disable banner */
  disableBanner: (id: number) => Promise<boolean>;
}

/**
 * useCarouselDetail Hook parameters
 */
export interface UseCarouselDetailOptions {
  /** Carousel ID */
  id?: number;
  /** Carousel code (optional, id takes priority) */
  code?: string;
}

/**
 * useCarouselDetail Hook return type
 */
export type UseCarouselDetailResult = CarouselDetailState & CarouselDetailActions;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Carousel Detail ViewModel Hook
 * 
 * @param options - Configuration options
 * @returns Carousel detail state and action methods
 */
export function useCarouselDetail(options: UseCarouselDetailOptions): UseCarouselDetailResult {
  const { id, code } = options;

  // -------------------- Get capabilities --------------------
  const http = useHttp();
  const eventBus = useEventBus();
  const { hasPermission } = useAuth();

  // -------------------- Create Repository --------------------
  const carouselRepoRef = useRef<CarouselRepository | null>(null);
  const bannerRepoRef = useRef<BannerRepository | null>(null);
  
  if (!carouselRepoRef.current && http) {
    carouselRepoRef.current = createCarouselRepository(http);
    bannerRepoRef.current = createBannerRepository(http);
  }

  // -------------------- State definitions --------------------
  const [carousel, setCarousel] = useState<CarouselDTO | null>(null);
  const [banners, setBanners] = useState<BannerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [operating, setOperating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------- Permission check --------------------
  const permissions = useMemo(() => ({
    canEdit: hasPermission?.(CAROUSEL_PERMISSIONS.UPDATE) ?? true,
    canDelete: hasPermission?.(CAROUSEL_PERMISSIONS.DELETE) ?? true,
    canManageBanner: hasPermission?.(CAROUSEL_PERMISSIONS.MANAGE_BANNER) ?? true,
  }), [hasPermission]);

  // -------------------- Data loading --------------------
  const refresh = useCallback(async () => {
    if (!carouselRepoRef.current) {
      setError('Repository not initialized');
      return;
    }

    if (!id && !code) {
      setError('Please provide carousel ID or code');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = id
        ? await carouselRepoRef.current.getById(id)
        : await carouselRepoRef.current.getByCode(code!);
      
      setCarousel(data);
      setBanners(data.banners || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load carousel details';
      setError(message);
      console.error('[useCarouselDetail] Load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [id, code]);

  // -------------------- Banner operations --------------------
  const addBanner = useCallback(async (params: CreateBannerParams): Promise<boolean> => {
    if (!bannerRepoRef.current || !carousel?.id) {
      setError('Repository not initialized or carousel not loaded');
      return false;
    }

    setOperating(true);
    
    try {
      const created = await bannerRepoRef.current.create(carousel.id, params);
      
      eventBus?.publish(CAROUSEL_EVENTS.BANNER_CREATED, {
        id: created.id,
        carouselId: carousel.id,
        title: created.title,
        platform: created.platform,
      });
      
      setBanners((prev: BannerDTO[]) => [...prev, created]);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add banner';
      setError(message);
      console.error('[useCarouselDetail] Add banner failed:', err);
      return false;
    } finally {
      setOperating(false);
    }
  }, [carousel?.id, eventBus]);

  const updateBanner = useCallback(async (bannerId: number, params: UpdateBannerParams): Promise<boolean> => {
    if (!bannerRepoRef.current) {
      setError('Repository not initialized');
      return false;
    }

    setOperating(true);
    
    try {
      const updated = await bannerRepoRef.current.update(bannerId, params);
      
      eventBus?.publish(CAROUSEL_EVENTS.BANNER_UPDATED, {
        id: bannerId,
        carouselId: carousel?.id,
        title: updated.title,
        updatedFields: Object.keys(params),
      });
      
      setBanners((prev: BannerDTO[]) => prev.map((b: BannerDTO) => b.id === bannerId ? updated : b));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update banner';
      setError(message);
      console.error('[useCarouselDetail] Update banner failed:', err);
      return false;
    } finally {
      setOperating(false);
    }
  }, [carousel?.id, eventBus]);

  const deleteBanner = useCallback(async (bannerId: number): Promise<boolean> => {
    if (!bannerRepoRef.current) {
      setError('Repository not initialized');
      return false;
    }

    setOperating(true);
    
    try {
      await bannerRepoRef.current.delete(bannerId);
      
      eventBus?.publish(CAROUSEL_EVENTS.BANNER_DELETED, {
        id: bannerId,
        carouselId: carousel?.id,
      });
      
      setBanners((prev: BannerDTO[]) => prev.filter((b: BannerDTO) => b.id !== bannerId));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete banner';
      setError(message);
      console.error('[useCarouselDetail] Delete banner failed:', err);
      return false;
    } finally {
      setOperating(false);
    }
  }, [carousel?.id, eventBus]);

  const enableBanner = useCallback(async (bannerId: number): Promise<boolean> => {
    if (!bannerRepoRef.current) return false;

    setOperating(true);
    
    try {
      await bannerRepoRef.current.enable(bannerId);
      setBanners((prev: BannerDTO[]) => prev.map((b: BannerDTO) => 
        b.id === bannerId ? { ...b, status: 'ENABLED' as const } : b
      ));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable banner');
      return false;
    } finally {
      setOperating(false);
    }
  }, []);

  const disableBanner = useCallback(async (bannerId: number): Promise<boolean> => {
    if (!bannerRepoRef.current) return false;

    setOperating(true);
    
    try {
      await bannerRepoRef.current.disable(bannerId);
      setBanners((prev: BannerDTO[]) => prev.map((b: BannerDTO) => 
        b.id === bannerId ? { ...b, status: 'DISABLED' as const } : b
      ));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable banner');
      return false;
    } finally {
      setOperating(false);
    }
  }, []);

  // -------------------- Initial loading --------------------
  useEffect(() => {
    refresh();
  }, [refresh]);

  // -------------------- Return result --------------------
  return {
    carousel,
    banners,
    loading,
    operating,
    error,
    permissions,
    refresh,
    addBanner,
    updateBanner,
    deleteBanner,
    enableBanner,
    disableBanner,
  };
}
