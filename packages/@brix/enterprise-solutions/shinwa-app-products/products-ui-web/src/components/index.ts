/**
 * @file Products UI Components Export
 * @description Exports all reusable UI components for the products module
 * @module products-ui-web/components
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * Components are pure presentation layer, responsible only for UI rendering.
 * Business logic should be handled by ViewModel hooks.
 */

export { ProductItemEditor, type ProductItemEditorProps, type ServiceItem } from './ProductItemEditor';
export { PriceRangeInput, type PriceRangeInputProps, type PriceRange } from './PriceRangeInput';
export { PartnerSelector, type PartnerSelectorProps, type PartnerOption } from './PartnerSelector';
export { ProductFormFields, type ProductFormFieldsProps, type ProductFormData, type ProductFormErrors } from './ProductFormFields';
