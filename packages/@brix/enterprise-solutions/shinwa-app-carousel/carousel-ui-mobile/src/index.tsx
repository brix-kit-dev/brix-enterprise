/**
 * Carousel UI Mobile - 模块入口
 * 
 * @author Shinwa Team
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
