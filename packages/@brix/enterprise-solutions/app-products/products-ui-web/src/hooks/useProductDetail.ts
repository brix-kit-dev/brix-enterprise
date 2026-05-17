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
 * @file Product Detail ViewModel Hook
 * @description Manages state and business logic for product detail page
 * @module products-ui-web/hooks/useProductDetail
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook is a ViewModel layer implementation, responsible for:
 * 1. Managing product detail loading state and data
 * 2. Providing refresh functionality
 * 3. Subscribing to related events for automatic refresh
 * 
 * Usage:
 * ```tsx
 * function ProductDetailPage() {
 *   const { id } = usePageParams<{ id: string }>();
 *   const { product, loading, error, refresh } = useProductDetail(id);
 *   
 *   // Pure rendering logic
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useHttp, useEventBus } from '@brix-sdk/runtime-sdk-react';
import { createProductRepository, type ProductRepository } from '../repositories';
import type { Product } from '@brix-sdk/enterprise-products-shared';
import { PRODUCT_EVENTS } from '@brix-sdk/enterprise-products-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Product detail state
 */
export interface ProductDetailState {
  /** Product detail data */
  product: Product | null;
  /** Whether loading */
  loading: boolean;
  /** Error message */
  error: string | null;
}

/**
 * Product detail action methods
 */
export interface ProductDetailActions {
  /** Refresh product details */
  refresh: () => Promise<void>;
}

/**
 * useProductDetail Hook return type
 */
export type UseProductDetailResult = ProductDetailState & ProductDetailActions;

/**
 * useProductDetail Hook configuration options
 */
export interface UseProductDetailOptions {
  /** Whether to auto load */
  autoLoad?: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Product Detail ViewModel Hook
 * 
 * Functionality:
 * - Manage product detail data and loading state
 * - Provide refresh operation
 * - Subscribe to product change events for automatic detail refresh
 * 
 * Event Subscriptions:
 * - product:updated - Refresh detail after product update
 * - product:deleted - Clear detail after product deletion
 * 
 * @param productId - Product ID (string or number)
 * @param options - Configuration options
 * @returns Product detail state and action methods
 */
export function useProductDetail(
  productId: string | number | undefined,
  options?: UseProductDetailOptions
): UseProductDetailResult {
  const { autoLoad = true } = options ?? {};

  // -------------------- Get Capabilities --------------------
  const http = useHttp();
  const eventBus = useEventBus();

  // -------------------- Create Repository --------------------
  const repositoryRef = useRef<ProductRepository | null>(null);
  
  if (!repositoryRef.current && http) {
    repositoryRef.current = createProductRepository(http);
  }

  // -------------------- State Definitions --------------------
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -------------------- Data Loading --------------------
  /**
   * Refresh product detail
   */
  const refresh = useCallback(async () => {
    if (!repositoryRef.current) {
      setError('Repository not initialized');
      return;
    }

    if (!productId) {
      setError('Product ID cannot be empty');
      setLoading(false);
      return;
    }

    const id = typeof productId === 'string' ? parseInt(productId) : productId;
    
    if (isNaN(id)) {
      setError('Invalid product ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await repositoryRef.current.getById(id);
      setProduct(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load product details';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // -------------------- Initial Load --------------------
  useEffect(() => {
    if (autoLoad && productId) {
      refresh();
    }
  }, [autoLoad, productId, refresh]);

  // -------------------- Event Subscriptions --------------------
  useEffect(() => {
    if (!eventBus || !productId) return;

    const id = typeof productId === 'string' ? parseInt(productId) : productId;

    // Subscribe to product update event
    const handleUpdated = (event: { id: number }) => {
      if (event.id === id) {
        refresh();
      }
    };

    // Subscribe to product delete event
    const handleDeleted = (event: { id: number }) => {
      if (event.id === id) {
        setProduct(null);
        setError('This product has been deleted');
      }
    };

    // EventBusCapability contract: on/off (no return-based unsubscribe)
    eventBus.on(PRODUCT_EVENTS.UPDATED, handleUpdated);
    eventBus.on(PRODUCT_EVENTS.DELETED, handleDeleted);

    return () => {
      eventBus.off(PRODUCT_EVENTS.UPDATED, handleUpdated);
      eventBus.off(PRODUCT_EVENTS.DELETED, handleDeleted);
    };
  }, [eventBus, productId, refresh]);

  // -------------------- Return Result --------------------
  return {
    product,
    loading,
    error,
    refresh,
  };
}
