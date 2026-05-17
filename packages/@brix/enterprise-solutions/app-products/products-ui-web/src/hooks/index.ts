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
 * @file Hooks Layer Entry
 * @description Exports all ViewModel Hooks
 * @module products-ui-web/hooks
 * @version 3.2.0
 * 
 * [v3.2 Frontend-Backend Separation Architecture - ViewModel Layer]
 * This directory contains all page ViewModel Hooks:
 * - useProductList: Product list page
 * - useProductDetail: Product detail page
 * - useProductForm: Product create/edit form page
 * 
 * [Usage]
 * ```tsx
 * import { useProductList, useProductDetail, useProductForm } from '../hooks';
 * ```
 */

export {
  useProductList,
  type ProductListState,
  type ProductListActions,
  type UseProductListResult,
  type UseProductListOptions,
} from './useProductList';

export {
  useProductDetail,
  type ProductDetailState,
  type ProductDetailActions,
  type UseProductDetailResult,
  type UseProductDetailOptions,
} from './useProductDetail';

export {
  useProductForm,
  type ProductFormData,
  type ProductFormState,
  type ProductFormActions,
  type UseProductFormReturn,
} from './useProductForm';

export {
  usePartnerOptions,
  type UsePartnerOptionsResult,
  type UsePartnerOptionsConfig,
} from './usePartnerOptions';
