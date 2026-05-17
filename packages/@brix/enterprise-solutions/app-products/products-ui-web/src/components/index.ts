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
 * @file Products UI Components Export
 * @description Exports all reusable UI components for the products module
 * @module products-ui-web/components
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * Components are pure presentation layer, responsible only for UI rendering.
 * Business logic should be handled by ViewModel hooks.
 * 
 * Component Categories:
 * - Form Components: ProductFormFields, ProductItemEditor, PriceRangeInput, PartnerSelector
 * - Display Components: ProductCard
 * - Dialog Components: ProductDetailDialog, AddProductDialog
 */

// Form Components
export { ProductItemEditor, type ProductItemEditorProps, type ServiceItem } from './ProductItemEditor';
export { PriceRangeInput, type PriceRangeInputProps, type PriceRange } from './PriceRangeInput';
export { PartnerSelector, type PartnerSelectorProps, type PartnerOption } from './PartnerSelector';
export { ProductFormFields, type ProductFormFieldsProps, type ProductFormData, type ProductFormErrors } from './ProductFormFields';

// Display Components
export { ProductCard, type ProductCardProps } from './ProductCard';

// Dialog Components
export { ProductDetailDialog, type ProductDetailDialogProps } from './ProductDetailDialog';
export { AddProductDialog, type AddProductDialogProps, type AddProductFormData, type AddProductFormErrors } from './AddProductDialog';
