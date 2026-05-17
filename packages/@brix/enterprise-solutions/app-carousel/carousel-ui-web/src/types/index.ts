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
 * Carousel UI Web - Type Definitions
 * 
 * @author Brix Team
 * @since 3.0.0
 */

/** Platform type */
export type Platform = 'ALL' | 'WEB' | 'H5' | 'IOS' | 'ANDROID' | 'MINI_PROGRAM';

/** Banner action type */
export type BannerActionType = 'NONE' | 'LINK' | 'ROUTE' | 'POPUP' | 'DEEP_LINK';

/** Banner status */
export type BannerStatus = 'DRAFT' | 'ENABLED' | 'DISABLED' | 'EXPIRED';

/** Carousel settings */
export interface CarouselSettings {
  width?: number;
  height?: number;
  autoPlay: boolean;
  autoPlayInterval: number;
  showIndicator: boolean;
  showArrow: boolean;
  maxBannerCount: number;
}

/** Carousel DTO */
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

/** Create/Update carousel form */
export interface CarouselFormData {
  code: string;
  name: string;
  description?: string;
  width?: number;
  height?: number;
  autoPlay: boolean;
  autoPlayInterval: number;
  showIndicator: boolean;
  showArrow: boolean;
  maxBannerCount: number;
}

/** Create/Update banner form */
export interface BannerFormData {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  imageUrlMobile?: string;
  platform: Platform;
  actionType: BannerActionType;
  actionValue?: string;
  actionValueApp?: string;
  sortOrder: number;
  startTime?: string;
  endTime?: string;
}
