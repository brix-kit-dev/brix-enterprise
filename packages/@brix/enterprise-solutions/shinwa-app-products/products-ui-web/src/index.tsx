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
 * @author Shinwa Platform Team
 * @since 3.0.0
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

// Export types
export * from './types';

// Export API
export { productApi } from './api';

// Export components
export {
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
export { ProductDetailPage } from './pages/ProductDetailPage';
export { ProductCreatePage } from './pages/ProductCreatePage';
export { ProductEditPage } from './pages/ProductEditPage';

// Default export
export default {
  name: '@shinwa/products-ui-web',
  version: '3.2.0',
};
