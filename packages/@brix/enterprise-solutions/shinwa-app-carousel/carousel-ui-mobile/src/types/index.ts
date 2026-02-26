/**
 * Carousel UI Mobile - 类型定义
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */

/** 平台类型 */
export type Platform = 'ALL' | 'WEB' | 'H5' | 'IOS' | 'ANDROID' | 'MINI_PROGRAM';

/** Banner动作类型 */
export type BannerActionType = 'NONE' | 'LINK' | 'ROUTE' | 'POPUP' | 'DEEP_LINK';

/** Banner状态 */
export type BannerStatus = 'DRAFT' | 'ENABLED' | 'DISABLED' | 'EXPIRED';

/** 轮播位设置 */
export interface CarouselSettings {
  width?: number;
  height?: number;
  autoPlay: boolean;
  autoPlayInterval: number;
  showIndicator: boolean;
  showArrow: boolean;
  maxBannerCount: number;
}

/** 轮播位DTO */
export interface CarouselDTO {
  id?: number;
  code: string;
  name: string;
  description?: string;
  settings?: CarouselSettings;
  banners?: BannerDTO[];
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** BannerDTO */
export interface BannerDTO {
  id?: number;
  carouselId?: number;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  imageUrlMobile?: string;
  thumbnailUrl?: string;
  platform: Platform;
  status: BannerStatus;
  actionType: BannerActionType;
  actionValue?: string;
  actionValueApp?: string;
  sortOrder: number;
  startTime?: string;
  endTime?: string;
  clickCount?: number;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** 导航参数类型 */
export type CarouselStackParamList = {
  CarouselList: undefined;
  CarouselDetail: { code: string };
  BannerDetail: { bannerId: number; carouselCode: string };
};
