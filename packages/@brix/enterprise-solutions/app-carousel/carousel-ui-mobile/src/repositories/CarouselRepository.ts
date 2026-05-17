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
 * Carousel Repository - Data Access Layer for Mobile
 * 
 * This module implements the Repository pattern for carousel/banner data access.
 * All HTTP calls are routed through HttpCapability.
 * 
 * @module @brix-sdk/enterprise-carousel-ui-mobile/repositories
 * @since 3.1.0
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-mobile';
import type {
  CarouselItem,
  CarouselConfig,
  CarouselListResponse
} from '@brix-sdk/enterprise-carousel-shared';

/**
 * Carousel Repository Interface
 * 
 * 轮播数据仓库接口
 */
export interface CarouselRepository {
  /**
   * Gets list of carousel items
   * @param placement - Placement identifier (e.g., 'home', 'product-detail')
   * @returns Promise resolving to carousel items
   */
  getCarouselItems(placement: string): Promise<CarouselListResponse>;

  /**
   * Gets carousel configuration
   * @param placement - Placement identifier
   * @returns Promise resolving to carousel config
   */
  getCarouselConfig(placement: string): Promise<CarouselConfig>;

  /**
   * Records a carousel item click (analytics)
   * @param itemId - Carousel item ID
   */
  recordClick(itemId: string): Promise<void>;

  /**
   * Records a carousel item impression (analytics)
   * @param itemIds - Array of item IDs that were viewed
   */
  recordImpressions(itemIds: string[]): Promise<void>;
}

/**
 * Creates a CarouselRepository implementation using HttpCapability
 * 
 * 工厂函数通过注入 HttpCapability 创建轮播仓库实例
 * 
 * @param httpCapability - The HTTP capability for making API calls
 * @returns CarouselRepository implementation
 */
export function createCarouselRepository(httpCapability: HttpCapability): CarouselRepository {
  const BASE_PATH = '/api/v1/carousel';

  return {
    async getCarouselItems(placement: string): Promise<CarouselListResponse> {
      return httpCapability.get<CarouselListResponse>(
        `${BASE_PATH}/items?placement=${encodeURIComponent(placement)}`
      );
    },

    async getCarouselConfig(placement: string): Promise<CarouselConfig> {
      return httpCapability.get<CarouselConfig>(
        `${BASE_PATH}/config?placement=${encodeURIComponent(placement)}`
      );
    },

    async recordClick(itemId: string): Promise<void> {
      await httpCapability.post<void>(`${BASE_PATH}/analytics/click`, { itemId });
    },

    async recordImpressions(itemIds: string[]): Promise<void> {
      await httpCapability.post<void>(`${BASE_PATH}/analytics/impressions`, { itemIds });
    }
  };
}
