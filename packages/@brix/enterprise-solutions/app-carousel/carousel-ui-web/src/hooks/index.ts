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
