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
 * @file Product Form ViewModel Hook
 * @description Manages state and business logic for product create/edit pages
 * @module products-ui-web/hooks/useProductForm
 * @version 3.2.0
 * 
 * [v3.2 Frontend-Backend Separation Architecture - ViewModel Layer]
 * This Hook implements the ViewModel layer, responsible for:
 * 1. Managing product form state
 * 2. Encapsulating create/update product business logic
 * 3. Publishing product change events
 * 4. Shielding View layer from direct Repository layer access
 * 
 * @author Brix Team
 * @since 3.0.0
 */

import { useState, useCallback, useEffect } from 'react';
import { useHttp, useEventBus, useNavigation } from '@brix-sdk/runtime-sdk-react';
import { createProductRepository, type ProductRepository } from '../repositories';
import type { Product, ProductType, CreateProductParams } from '@brix-sdk/enterprise-products-shared';
import { PRODUCT_EVENTS } from '@brix-sdk/enterprise-products-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Product form data
 * 
 * Consistent with CreateProductParams, used for form state management.
 */
export interface ProductFormData {
  /** Product name */
  name: string;
  /** Product description */
  description: string;
  /** Product type */
  type: ProductType;
  /** Product code */
  code: string;
  /** Price */
  price: number | undefined;
  /** Original price */
  originalPrice: number | undefined;
  /** Price range description */
  priceRange: string;
  /** Currency unit */
  currency: string;
  /** Partner ID */
  partnerId: number | undefined;
  /** Category ID */
  categoryId: number | undefined;
  /** Service items list */
  serviceItems: string[];
  /** Service duration description */
  duration: string;
  /** Remarks */
  remarks: string;
  /** Cover image */
  coverImage: string;
  /** Images list */
  images: string[];
  /** Tags list */
  tags: string[];
  /** Sort order weight */
  sortOrder: number;
}

/**
 * Product form state
 */
export interface ProductFormState {
  /** Form data */
  formData: ProductFormData;
  /** Original product data (edit mode) */
  product: Product | null;
  /** Whether loading */
  loading: boolean;
  /** Whether submitting */
  submitting: boolean;
  /** Error message */
  error: Error | null;
  /** Whether in edit mode */
  isEditMode: boolean;
  /** Whether form has changes */
  isDirty: boolean;
}

/**
 * Product form actions
 */
export interface ProductFormActions {
  /** Update form field */
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
  /** Update multiple fields */
  updateFields: (fields: Partial<ProductFormData>) => void;
  /** Submit form */
  submit: () => Promise<boolean>;
  /** Reset form */
  reset: () => void;
  /** Navigate to list page */
  navigateToList: () => void;
}

/**
 * useProductForm return type
 */
export type UseProductFormReturn = ProductFormState & ProductFormActions;

// ============================================================================
// Constants
// ============================================================================

/**
 * Default form data
 */
const DEFAULT_FORM_DATA: ProductFormData = {
  name: '',
  description: '',
  type: 'CHECKUP',
  code: '',
  price: undefined,
  originalPrice: undefined,
  priceRange: '',
  currency: 'CNY',
  partnerId: undefined,
  categoryId: undefined,
  serviceItems: [],
  duration: '',
  remarks: '',
  coverImage: '',
  images: [],
  tags: [],
  sortOrder: 0,
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Product Form Hook
 * 
 * @param options - Configuration options
 * @param options.id - Product ID (edit mode)
 * @param options.code - Product code (edit mode)
 * @returns Form state and action methods
 * 
 * @example
 * ```tsx
 * // 创建模式
 * const { formData, updateField, submit } = useProductForm();
 * 
 * // 编辑模式
 * const { formData, loading, submit } = useProductForm({ id: 1 });
 * ```
 */
export function useProductForm(options?: {
  id?: number;
  code?: string;
}): UseProductFormReturn {
  const httpCapability = useHttp();
  const eventBus = useEventBus();
  const navigation = useNavigation();

  // Create Repository instance
  const repository: ProductRepository = createProductRepository(httpCapability);

  // ─────────────────────────────────────────────────────────
  // State Management
  // ─────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM_DATA);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const isEditMode = Boolean(options?.id || options?.code);

  // ─────────────────────────────────────────────────────────
  // Load Product Data (Edit Mode)
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode) return;

    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let data: Product | null = null;
        
        if (options?.id) {
          data = await repository.getById(options.id);
        } else if (options?.code) {
          data = await repository.getByCode(options.code);
        }
        
        if (data) {
          setProduct(data);
          setFormData({
            name: data.name,
            description: data.description || '',
            type: data.type,
            code: data.code || '',
            price: data.price,
            originalPrice: data.originalPrice,
            priceRange: data.priceRange || '',
            currency: data.currency,
            partnerId: data.partnerId,
            categoryId: data.categoryId,
            serviceItems: data.serviceItems || [],
            duration: data.duration || '',
            remarks: data.remarks || '',
            coverImage: data.coverImage || '',
            images: data.images || [],
            tags: data.tags || [],
            sortOrder: data.sortOrder,
          });
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err : new Error('Failed to load product'));
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [options?.id, options?.code, isEditMode]);

  // ─────────────────────────────────────────────────────────
  // Form Operations
  // ─────────────────────────────────────────────────────────

  /**
   * Update single form field
   */
  const updateField = useCallback(<K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => {
    setFormData((prev: ProductFormData) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  /**
   * Update multiple form fields
   */
  const updateFields = useCallback((fields: Partial<ProductFormData>) => {
    setFormData((prev: ProductFormData) => ({ ...prev, ...fields }));
    setIsDirty(true);
  }, []);

  /**
   * Submit form
   */
  const submit = useCallback(async (): Promise<boolean> => {
    setSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Product name cannot be empty');
      }
      if (!formData.partnerId) {
        throw new Error('Please select a partner');
      }

      const params: CreateProductParams = {
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        code: formData.code || undefined,
        price: formData.price,
        originalPrice: formData.originalPrice,
        priceRange: formData.priceRange || undefined,
        currency: formData.currency || undefined,
        partnerId: formData.partnerId,
        categoryId: formData.categoryId,
        serviceItems: formData.serviceItems.length > 0 ? formData.serviceItems : undefined,
        duration: formData.duration || undefined,
        remarks: formData.remarks || undefined,
        coverImage: formData.coverImage || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        sortOrder: formData.sortOrder,
      };

      let result: Product;

      if (isEditMode && product?.id) {
        // Update existing product
        result = await repository.update(product.id, params);
        
        // Publish update event
        eventBus?.emit(PRODUCT_EVENTS.UPDATED, {
          id: result.id,
          name: result.name,
          updatedFields: Object.keys(params),
        });
      } else {
        // Create new product
        result = await repository.create(params);
        
        // Publish create event
        eventBus?.emit(PRODUCT_EVENTS.CREATED, {
          id: result.id,
          name: result.name,
          type: result.type,
          partnerId: result.partnerId,
        });
      }

      setProduct(result);
      setIsDirty(false);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error('Failed to save product'));
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [formData, isEditMode, product, repository, eventBus]);

  /**
   * Reset form
   */
  const reset = useCallback(() => {
    if (product) {
      // Edit mode: reset to original data
      setFormData({
        name: product.name,
        description: product.description || '',
        type: product.type,
        code: product.code || '',
        price: product.price,
        originalPrice: product.originalPrice,
        priceRange: product.priceRange || '',
        currency: product.currency,
        partnerId: product.partnerId,
        categoryId: product.categoryId,
        serviceItems: product.serviceItems || [],
        duration: product.duration || '',
        remarks: product.remarks || '',
        coverImage: product.coverImage || '',
        images: product.images || [],
        tags: product.tags || [],
        sortOrder: product.sortOrder,
      });
    } else {
      // Create mode: reset to default values
      setFormData(DEFAULT_FORM_DATA);
    }
    setIsDirty(false);
    setError(null);
  }, [product]);

  /**
   * Navigate to list page
   */
  const navigateToList = useCallback(() => {
    navigation.navigate('product:list');
  }, [navigation]);

  // ─────────────────────────────────────────────────────────
  // Return Value
  // ─────────────────────────────────────────────────────────
  return {
    // State
    formData,
    product,
    loading,
    submitting,
    error,
    isEditMode,
    isDirty,
    // Actions
    updateField,
    updateFields,
    submit,
    reset,
    navigateToList,
  };
}
