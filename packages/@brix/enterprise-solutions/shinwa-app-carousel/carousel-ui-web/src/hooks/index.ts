/**
 * @file Hooks layer entry
 * @description Exports all ViewModel Hooks
 * @module carousel-ui-web/hooks
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture - ViewModel Layer:
 * This directory contains all page ViewModel Hooks:
 * - useCarouselList: Carousel list page
 * - useCarouselDetail: Carousel detail/Banner management page
 * - useCarouselForm: Carousel create/edit form page
 * 
 * Usage:
 * ```tsx
 * import { useCarouselList, useCarouselDetail, useCarouselForm } from '../hooks';
 * ```
 */

export { useCarouselList, type UseCarouselListResult } from './useCarouselList';
export { useCarouselDetail, type UseCarouselDetailResult, type UseCarouselDetailOptions } from './useCarouselDetail';
export {
  useCarouselForm,
  type CarouselFormData,
  type CarouselFormState,
  type CarouselFormActions,
  type UseCarouselFormReturn,
} from './useCarouselForm';
