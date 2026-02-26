/**
 * Product Detail Hook
 *
 * [Three-Layer Separation Architecture]
 * - This Hook belongs to the business logic layer, encapsulates product detail retrieval and state management
 * - Calls backend through productApi (productApi internally uses HttpCapability)
 * - UI layer only needs to call this Hook, no need to know data fetching details
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 * @version 3.2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { productApi } from '../api';
import type { Product } from '../types';

/**
 * useProductDetail return value
 */
export interface UseProductDetailReturn {
  /** Product detail */
  product: Product | null;
  /** Whether loading */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Refresh detail */
  refresh: () => Promise<void>;
}

/**
 * Product Detail Hook
 *
 * @param productId Product ID
 * @returns Product detail state and action methods
 *
 * @example
 * ```tsx
 * function ProductDetailScreen({ productId }: { productId: number }) {
 *   const { product, loading, error, refresh } = useProductDetail(productId);
 *
 *   if (loading) return <ActivityIndicator />;
 *   if (error) return <Text>{error}</Text>;
 *   if (!product) return <Text>产品不存在</Text>;
 *
 *   return <ProductDetailView product={product} />;
 * }
 * ```
 */
export function useProductDetail(productId: number): UseProductDetailReturn {
  // State
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch product detail
   */
  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await productApi.getById(productId);
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product detail');
      console.error('Failed to load product detail:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  /**
   * Refresh detail
   */
  const refresh = useCallback(async () => {
    await fetchProduct();
  }, [fetchProduct]);

  // Initial load
  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  return {
    product,
    loading,
    error,
    refresh,
  };
}
