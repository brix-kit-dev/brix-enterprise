/**
 * Carousel UI Web - Module Entry
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */

// Page exports
export { CarouselListPage } from './pages/CarouselListPage';
export { CarouselDetailPage } from './pages/CarouselDetailPage';
export { BannerListPage } from './pages/BannerListPage';

// API exports
export { carouselApi, bannerApi } from './api';

// Type exports
export type {
  Platform,
  BannerActionType,
  BannerStatus,
  CarouselSettings,
  CarouselDTO,
  BannerDTO,
  CarouselFormData,
  BannerFormData,
} from './types';

// Route configuration
export const carouselRoutes = [
  {
    path: '/carousels',
    element: 'CarouselListPage',
  },
  {
    path: '/carousels/create',
    element: 'CarouselDetailPage',
    props: { mode: 'create' },
  },
  {
    path: '/carousels/:id/edit',
    element: 'CarouselDetailPage',
    props: { mode: 'edit' },
  },
  {
    path: '/carousels/:carouselId/banners',
    element: 'BannerListPage',
  },
];
