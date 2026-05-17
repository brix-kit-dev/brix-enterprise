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
 * Carousel UI Mobile - API模块
 * 
 * [红线 R3 修复] 已移除 axios 直接依赖，通过 HttpCapability 能力契约发起请求。
 * 
 * @author Brix Team
 * @since 3.0.0
 */
import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type { CarouselDTO, BannerDTO, Platform } from '../types';

const API_BASE = '/api/carousels';

/**
 * HTTP 客户端（由运行时注入）
 */
let http: HttpCapability | null = null;

/**
 * 设置 HTTP 能力实例
 */
export function setHttpCapability(capability: HttpCapability): void {
  http = capability;
}

function getHttp(): HttpCapability {
  if (!http) {
    throw new Error('[carousel-ui-mobile] HttpCapability 未初始化，请先调用 setHttpCapability()');
  }
  return http;
}

/**
 * 轮播位API
 */
export const carouselApi = {
  /**
   * 获取所有轮播位
   */
  async listAll(): Promise<CarouselDTO[]> {
    return getHttp().get<CarouselDTO[]>(API_BASE);
  },

  /**
   * 根据编码获取轮播位
   */
  async getByCode(code: string): Promise<CarouselDTO> {
    return getHttp().get<CarouselDTO>(`${API_BASE}/code/${code}`);
  },

  /**
   * 获取有效的Banner列表（移动端默认使用IOS或ANDROID）
   */
  async getActiveBanners(code: string, platform: Platform = 'ALL'): Promise<BannerDTO[]> {
    return getHttp().get<BannerDTO[]>(`${API_BASE}/code/${code}/banners`, { platform });
  },
};

/**
 * Banner API - 统计埋点
 */
export const bannerApi = {
  /**
   * 记录点击
   */
  async recordClick(bannerId: number): Promise<void> {
    await getHttp().post(`${API_BASE}/banners/${bannerId}/click`);
  },

  /**
   * 记录展示
   */
  async recordView(bannerId: number): Promise<void> {
    await getHttp().post(`${API_BASE}/banners/${bannerId}/view`);
  },

  /**
   * 批量记录展示
   */
  async recordViews(bannerIds: number[]): Promise<void> {
    await getHttp().post(`${API_BASE}/banners/views`, bannerIds);
  },
};

export default { carouselApi, bannerApi };
