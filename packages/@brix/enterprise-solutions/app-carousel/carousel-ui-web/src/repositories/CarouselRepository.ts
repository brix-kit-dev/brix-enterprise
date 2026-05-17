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
 * @file Carousel Repository
 * @description Carousel data access layer - encapsulates all carousel-related API interactions
 * @module carousel-ui-web/repositories/CarouselRepository
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * Repository layer is responsible for:
 * 1. Encapsulating backend API call details
 * 2. Data format conversion (if needed)
 * 3. Error handling standardization
 * 
 * Architecture Red Line R3 Compliance:
 * All HTTP requests are made through HttpCapability, not directly using fetch/axios.
 * 
 * @see HttpCapability - Defined in @brix-sdk/runtime-sdk-api-web
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type {
  CarouselDTO,
  BannerDTO,
  Platform,
  CreateCarouselParams,
  UpdateCarouselParams,
  CreateBannerParams,
  UpdateBannerParams,
  PagedResponse,
} from '@brix-sdk/enterprise-carousel-shared';

// ============================================================================
// API Constants
// ============================================================================

/** API base path — '/api' prefix provided by HttpCapability baseURL */
const API_BASE = '/carousels';

// ============================================================================
// Repository Interface Definitions
// ============================================================================

/**
 * Carousel Repository Interface
 * 
 * Defines the standard contract for carousel data access.
 */
export interface CarouselRepository {
  /**
   * Get all carousels list
   * 
   * @returns Carousel list
   */
  listAll(): Promise<CarouselDTO[]>;

  /**
   * Get carousel by ID
   * 
   * @param id - Carousel ID
   * @returns Carousel details
   */
  getById(id: number): Promise<CarouselDTO>;

  /**
   * Get carousel by code
   * 
   * @param code - Carousel code
   * @returns Carousel details
   */
  getByCode(code: string): Promise<CarouselDTO>;

  /**
   * Get active banners for a carousel
   * 
   * @param code - Carousel code
   * @param platform - Platform type
   * @returns Banner list
   */
  getActiveBanners(code: string, platform?: Platform): Promise<BannerDTO[]>;

  /**
   * Create carousel
   * 
   * @param params - Create parameters
   * @returns Created carousel
   */
  create(params: CreateCarouselParams): Promise<CarouselDTO>;

  /**
   * Update carousel
   * 
   * @param id - Carousel ID
   * @param params - Update parameters
   * @returns Updated carousel
   */
  update(id: number, params: UpdateCarouselParams): Promise<CarouselDTO>;

  /**
   * Delete carousel
   * 
   * @param id - Carousel ID
   */
  delete(id: number): Promise<void>;

  /**
   * Enable carousel
   * 
   * @param id - Carousel ID
   * @returns Updated carousel
   */
  enable(id: number): Promise<CarouselDTO>;

  /**
   * Disable carousel
   * 
   * @param id - Carousel ID
   * @returns Updated carousel
   */
  disable(id: number): Promise<CarouselDTO>;
}

/**
 * Banner Repository Interface
 * 
 * Defines the standard contract for Banner data access.
 */
export interface BannerRepository {
  /**
   * Get all banners for a carousel
   * 
   * @param carouselId - Carousel ID
   * @returns Banner list
   */
  listByCarousel(carouselId: number): Promise<BannerDTO[]>;

  /**
   * Get banner by ID
   * 
   * @param id - Banner ID
   * @returns Banner details
   */
  getById(id: number): Promise<BannerDTO>;

  /**
   * Add banner
   * 
   * @param carouselId - Carousel ID
   * @param params - Create parameters
   * @returns Created banner
   */
  create(carouselId: number, params: CreateBannerParams): Promise<BannerDTO>;

  /**
   * Update banner
   * 
   * @param id - Banner ID
   * @param params - Update parameters
   * @returns Updated banner
   */
  update(id: number, params: UpdateBannerParams): Promise<BannerDTO>;

  /**
   * Delete banner
   * 
   * @param id - Banner ID
   */
  delete(id: number): Promise<void>;

  /**
   * Enable banner
   * 
   * @param id - Banner ID
   */
  enable(id: number): Promise<void>;

  /**
   * Disable banner
   * 
   * @param id - Banner ID
   */
  disable(id: number): Promise<void>;

  /**
   * Record banner click
   * 
   * @param id - Banner ID
   */
  recordClick(id: number): Promise<void>;

  /**
   * Record banner view
   * 
   * @param id - Banner ID
   */
  recordView(id: number): Promise<void>;

  /**
   * Batch record banner views
   * 
   * @param ids - Banner ID list
   */
  recordViews(ids: number[]): Promise<void>;
}

// ============================================================================
// Repository Factory Functions
// ============================================================================

/**
 * Create Carousel Repository instance
 * 
 * Usage Example:
 * ```typescript
 * const http = useHttp();
 * const carouselRepo = createCarouselRepository(http);
 * const carousels = await carouselRepo.listAll();
 * ```
 * 
 * @param http - HttpCapability instance
 * @returns CarouselRepository instance
 */
export function createCarouselRepository(http: HttpCapability): CarouselRepository {
  return {
    async listAll(): Promise<CarouselDTO[]> {
      return http.get<CarouselDTO[]>(API_BASE);
    },

    async getById(id: number): Promise<CarouselDTO> {
      return http.get<CarouselDTO>(`${API_BASE}/${id}`);
    },

    async getByCode(code: string): Promise<CarouselDTO> {
      return http.get<CarouselDTO>(`${API_BASE}/code/${code}`);
    },

    async getActiveBanners(code: string, platform: Platform = 'WEB'): Promise<BannerDTO[]> {
      return http.get<BannerDTO[]>(`${API_BASE}/code/${code}/banners`, { platform });
    },

    async create(params: CreateCarouselParams): Promise<CarouselDTO> {
      return http.post<CarouselDTO>(API_BASE, params);
    },

    async update(id: number, params: UpdateCarouselParams): Promise<CarouselDTO> {
      return http.put<CarouselDTO>(`${API_BASE}/${id}`, params);
    },

    async delete(id: number): Promise<void> {
      await http.delete(`${API_BASE}/${id}`);
    },

    async enable(id: number): Promise<CarouselDTO> {
      return http.put<CarouselDTO>(`${API_BASE}/${id}`, { enabled: true });
    },

    async disable(id: number): Promise<CarouselDTO> {
      return http.put<CarouselDTO>(`${API_BASE}/${id}`, { enabled: false });
    },
  };
}

/**
 * Create Banner Repository instance
 * 
 * @param http - HttpCapability instance
 * @returns BannerRepository instance
 */
export function createBannerRepository(http: HttpCapability): BannerRepository {
  return {
    async listByCarousel(carouselId: number): Promise<BannerDTO[]> {
      const carousel = await http.get<CarouselDTO>(`${API_BASE}/${carouselId}`);
      return carousel.banners || [];
    },

    async getById(id: number): Promise<BannerDTO> {
      return http.get<BannerDTO>(`${API_BASE}/banners/${id}`);
    },

    async create(carouselId: number, params: CreateBannerParams): Promise<BannerDTO> {
      return http.post<BannerDTO>(`${API_BASE}/${carouselId}/banners`, params);
    },

    async update(id: number, params: UpdateBannerParams): Promise<BannerDTO> {
      return http.put<BannerDTO>(`${API_BASE}/banners/${id}`, params);
    },

    async delete(id: number): Promise<void> {
      await http.delete(`${API_BASE}/banners/${id}`);
    },

    async enable(id: number): Promise<void> {
      await http.post(`${API_BASE}/banners/${id}/enable`);
    },

    async disable(id: number): Promise<void> {
      await http.post(`${API_BASE}/banners/${id}/disable`);
    },

    async recordClick(id: number): Promise<void> {
      await http.post(`${API_BASE}/banners/${id}/click`);
    },

    async recordView(id: number): Promise<void> {
      await http.post(`${API_BASE}/banners/${id}/view`);
    },

    async recordViews(ids: number[]): Promise<void> {
      await http.post(`${API_BASE}/banners/views`, ids);
    },
  };
}
