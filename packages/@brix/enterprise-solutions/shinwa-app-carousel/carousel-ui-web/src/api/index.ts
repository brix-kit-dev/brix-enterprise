/**
 * Carousel UI Web - API Module
 * 
 * [Red Line R3 Fix] Removed direct axios dependency, requests are made through the HttpCapability contract.
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */
import type { HttpCapability } from '@brix/runtime-sdk-api-web';
import type { CarouselDTO, BannerDTO, Platform } from '../types';

const API_BASE = '/api/carousels';

/**
 * HTTP client (injected by runtime)
 */
let http: HttpCapability | null = null;

/**
 * Set HTTP capability instance
 */
export function setHttpCapability(capability: HttpCapability): void {
  http = capability;
}

function getHttp(): HttpCapability {
  if (!http) {
    throw new Error('[carousel-ui-web] HttpCapability not initialized, please call setHttpCapability() first');
  }
  return http;
}

/**
 * Carousel API
 */
export const carouselApi = {
  /**
   * Get all carousels
   */
  async listAll(): Promise<CarouselDTO[]> {
    return getHttp().get<CarouselDTO[]>(API_BASE);
  },

  /**
   * Get carousel by code
   */
  async getByCode(code: string): Promise<CarouselDTO> {
    return getHttp().get<CarouselDTO>(`${API_BASE}/code/${code}`);
  },

  /**
   * Get active banner list
   */
  async getActiveBanners(code: string, platform: Platform = 'WEB'): Promise<BannerDTO[]> {
    return getHttp().get<BannerDTO[]>(`${API_BASE}/code/${code}/banners`, { platform });
  },

  /**
   * Create carousel
   */
  async create(data: Partial<CarouselDTO>): Promise<CarouselDTO> {
    return getHttp().post<CarouselDTO>(API_BASE, data);
  },

  /**
   * Update carousel
   */
  async update(id: number, data: Partial<CarouselDTO>): Promise<CarouselDTO> {
    return getHttp().put<CarouselDTO>(`${API_BASE}/${id}`, data);
  },

  /**
   * Delete carousel
   */
  async delete(id: number): Promise<void> {
    await getHttp().delete(`${API_BASE}/${id}`);
  },
};

/**
 * Banner API
 */
export const bannerApi = {
  /**
   * Add banner
   */
  async add(carouselId: number, data: Partial<BannerDTO>): Promise<BannerDTO> {
    return getHttp().post<BannerDTO>(`${API_BASE}/${carouselId}/banners`, data);
  },

  /**
   * Update banner
   */
  async update(bannerId: number, data: Partial<BannerDTO>): Promise<BannerDTO> {
    return getHttp().put<BannerDTO>(`${API_BASE}/banners/${bannerId}`, data);
  },

  /**
   * Delete banner
   */
  async delete(bannerId: number): Promise<void> {
    await getHttp().delete(`${API_BASE}/banners/${bannerId}`);
  },

  /**
   * Enable banner
   */
  async enable(bannerId: number): Promise<void> {
    await getHttp().post(`${API_BASE}/banners/${bannerId}/enable`);
  },

  /**
   * Disable banner
   */
  async disable(bannerId: number): Promise<void> {
    await getHttp().post(`${API_BASE}/banners/${bannerId}/disable`);
  },

  /**
   * Record click
   */
  async recordClick(bannerId: number): Promise<void> {
    await getHttp().post(`${API_BASE}/banners/${bannerId}/click`);
  },

  /**
   * Record view
   */
  async recordView(bannerId: number): Promise<void> {
    await getHttp().post(`${API_BASE}/banners/${bannerId}/view`);
  },

  /**
   * Batch record views
   */
  async recordViews(bannerIds: number[]): Promise<void> {
    await getHttp().post(`${API_BASE}/banners/views`, bannerIds);
  },
};

export default { carouselApi, bannerApi };
