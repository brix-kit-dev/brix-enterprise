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
 * Product Module Entry
 *
 * v3.2 Product Package Module - Web UI Entry File
 * 
 * Phase 5 Enhancement (Week 10):
 * - Added ProductCreatePage export for product creation
 * - Added ProductEditPage export for product editing
 * - Added ProductItemEditor, PriceRangeInput, PartnerSelector component exports
 * 
 * Phase 6 Enhancement (Week 12):
 * - Added ProductListPageV2 (card-based grid view)
 * - Added ProductCard, ProductDetailDialog, AddProductDialog component exports
 * - Added theme module exports for styling configuration
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */

// Export types
export * from './types';

// Export theme configuration
export * from './theme';

// Export API
export { productApi } from './api';

// Export components
export {
  // Form Components
  ProductItemEditor,
  type ProductItemEditorProps,
  type ServiceItem,
  PriceRangeInput,
  type PriceRangeInputProps,
  type PriceRange,
  PartnerSelector,
  type PartnerSelectorProps,
  type PartnerOption,
  ProductFormFields,
  type ProductFormFieldsProps,
  type ProductFormData,
  type ProductFormErrors,
  // Display Components
  ProductCard,
  type ProductCardProps,
  // Dialog Components
  ProductDetailDialog,
  type ProductDetailDialogProps,
  AddProductDialog,
  type AddProductDialogProps,
  type AddProductFormData,
  type AddProductFormErrors,
} from './components';

// Export hooks
export {
  useProductList,
  useProductDetail,
  useProductForm,
} from './hooks';

// Export repositories
export {
  createProductRepository,
  type ProductRepository,
} from './repositories';

// Export page components
export { ProductListPage } from './pages/ProductListPage';
export { ProductListPageV2 } from './pages/ProductListPageV2';
export { ProductDetailPage } from './pages/ProductDetailPage';
export { ProductCreatePage } from './pages/ProductCreatePage';
export { ProductEditPage } from './pages/ProductEditPage';

// Default export
export default {
  name: '@brix-sdk/enterprise-products-ui-web',
  version: '3.2.0',
};
