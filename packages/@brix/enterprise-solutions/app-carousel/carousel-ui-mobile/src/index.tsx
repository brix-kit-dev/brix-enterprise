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
 * Carousel UI Mobile - 模块入口
 * 
 * @author Brix Team
 * @since 3.0.0
 */

// 组件导出
export { CarouselView } from './components/CarouselView';

// API导出
export { carouselApi, bannerApi } from './api';

// 类型导出
export type {
  Platform,
  BannerActionType,
  BannerStatus,
  CarouselSettings,
  CarouselDTO,
  BannerDTO,
  CarouselStackParamList,
} from './types';
