/**
 * Partners Repository - Data Access Layer for Mobile
 * 
 * This module implements the Repository pattern for partners data access.
 * All HTTP calls are routed through HttpCapability.
 * 
 * @module @shinwa/partners-ui-mobile/repositories
 * @since 3.1.0
 */

import type { HttpCapability } from '@brix/runtime-sdk-api-mobile';
import type {
  Partner,
  PartnerListParams,
  PartnerListResponse
} from '@shinwa/partners-shared';

/**
 * Partners Repository Interface
 * 
 * 合作伙伴数据仓库接口
 */
export interface PartnersRepository {
  /**
   * Gets list of partners
   * @param params - Query parameters
   * @returns Promise resolving to partner list
   */
  getPartners(params?: PartnerListParams): Promise<PartnerListResponse>;

  /**
   * Gets a single partner by ID
   * @param partnerId - Partner ID
   * @returns Promise resolving to partner details
   */
  getPartnerById(partnerId: string): Promise<Partner>;

  /**
   * Gets featured/recommended partners
   * @param limit - Maximum number of partners to return
   * @returns Promise resolving to featured partners list
   */
  getFeaturedPartners(limit?: number): Promise<Partner[]>;

  /**
   * Searches partners
   * @param query - Search query string
   * @param limit - Maximum number of results
   * @returns Promise resolving to matching partners
   */
  searchPartners(query: string, limit?: number): Promise<Partner[]>;
}

/**
 * Creates a PartnersRepository implementation using HttpCapability
 * 
 * 工厂函数通过注入 HttpCapability 创建合作伙伴仓库实例
 * 
 * @param httpCapability - The HTTP capability for making API calls
 * @returns PartnersRepository implementation
 */
export function createPartnersRepository(httpCapability: HttpCapability): PartnersRepository {
  const BASE_PATH = '/api/v1/partners';

  return {
    async getPartners(params?: PartnerListParams): Promise<PartnerListResponse> {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.set('page', String(params.page));
      if (params?.size !== undefined) queryParams.set('size', String(params.size));
      if (params?.category) queryParams.set('category', params.category);
      
      const url = queryParams.toString() ? `${BASE_PATH}?${queryParams}` : BASE_PATH;
      return httpCapability.get<PartnerListResponse>(url);
    },

    async getPartnerById(partnerId: string): Promise<Partner> {
      return httpCapability.get<Partner>(`${BASE_PATH}/${partnerId}`);
    },

    async getFeaturedPartners(limit: number = 10): Promise<Partner[]> {
      const response = await httpCapability.get<{ items: Partner[] }>(
        `${BASE_PATH}/featured?limit=${limit}`
      );
      return response.items;
    },

    async searchPartners(query: string, limit: number = 20): Promise<Partner[]> {
      const response = await httpCapability.get<{ items: Partner[] }>(
        `${BASE_PATH}/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response.items;
    }
  };
}
