/**
 * Product List Hook
 *
 * [Three-Layer Separation Architecture]
 * - This Hook belongs to the business logic layer, encapsulates product list retrieval and state management
 * - Calls backend through productApi (productApi internally uses HttpCapability)
 * - UI layer (components/ProductList) only needs to call this Hook, no need to know data fetching details
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 * @version 3.2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { productApi } from '../api';
import type { Product, ProductType } from '../types';

/**
 * useProductList parameter options
 */
export interface UseProductListOptions {
  /** Product type filter */
  filterType?: ProductType | 'ALL';
  /** Search keyword */
  keyword?: string;
  /** Show only active products */
  activeOnly?: boolean;
  /** Auto fetch on mount */
  autoFetch?: boolean;
}

/**
 * useProductList return value
 */
export interface UseProductListReturn {
  /** Product list */
  products: Product[];
  /** Whether loading */
  loading: boolean;
  /** Whether refreshing */
  refreshing: boolean;
  /** Error message */
  error: string | null;
  /** Search keyword */
  searchKeyword: string;
  /** Set search keyword */
  setSearchKeyword: (keyword: string) => void;
  /** Filter type */
  filterType: ProductType | 'ALL';
  /** Set filter type */
  setFilterType: (type: ProductType | 'ALL') => void;
  /** Refresh list */
  refresh: () => Promise<void>;
  /** Search */
  search: () => Promise<void>;
}

/**
 * Product List Hook
 *
 * @param options Configuration options
 * @returns Product list state and action methods
 *
 * @example
 * ```tsx
 * function ProductListScreen() {
 *   const {
 *     products,
 *     loading,
 *     refreshing,
 *     refresh,
 *     searchKeyword,
 *     setSearchKeyword,
 *   } = useProductList({ activeOnly: true });
 *
 *   return (
 *     <FlatList
 *       data={products}
 *       refreshing={refreshing}
 *       onRefresh={refresh}
 *     />
 *   );
 * }
 * ```
 */
export function useProductList(options: UseProductListOptions = {}): UseProductListReturn {
  const {
    filterType: initialFilterType = 'ALL',
    keyword: initialKeyword = '',
    activeOnly = true,
    autoFetch = true,
  } = options;

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState(initialKeyword);
  const [filterType, setFilterType] = useState<ProductType | 'ALL'>(initialFilterType);

  /**
   * Fetch product list
   */
  const fetchProducts = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const params: Record<string, string> = {};
        if (searchKeyword) params.keyword = searchKeyword;
        if (filterType !== 'ALL') params.type = filterType;
        if (activeOnly) params.status = 'ACTIVE';

        const data = await productApi.list(params);
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product list');
        console.error('Failed to load product list:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchKeyword, filterType, activeOnly]
  );

  /**
   * Refresh list
   */
  const refresh = useCallback(async () => {
    await fetchProducts(true);
  }, [fetchProducts]);

  /**
   * Search
   */
  const search = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  // Auto load
  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch, filterType]);

  return {
    products,
    loading,
    refreshing,
    error,
    searchKeyword,
    setSearchKeyword,
    filterType,
    setFilterType,
    refresh,
    search,
  };
}
