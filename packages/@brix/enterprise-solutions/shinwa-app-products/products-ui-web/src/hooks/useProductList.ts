/**
 * @file Product List ViewModel Hook
 * @description Manages state and business logic for product list page
 * @module products-ui-web/hooks/useProductList
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook is a ViewModel layer implementation, responsible for:
 * 1. Managing product list loading state and data
 * 2. Handling CRUD operations
 * 3. Subscribing to related events for automatic refresh
 * 
 * Usage:
 * ```tsx
 * function ProductListPage() {
 *   const { 
 *     products, loading, error,
 *     refresh, deleteProduct, activateProduct, deactivateProduct
 *   } = useProductList();
 *   
 *   // Pure rendering logic
 * }
 * ```
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useHttp, useEventBus, useAuth } from '@brix/runtime-sdk-react';
import { createProductRepository, type ProductRepository } from '../repositories';
import type { Product, ProductQueryParams } from '@shinwa/products-shared';
import { PRODUCT_EVENTS, PRODUCT_PERMISSIONS } from '@shinwa/products-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Product list state
 */
export interface ProductListState {
  /** Product list data */
  products: Product[];
  /** Whether loading */
  loading: boolean;
  /** Whether operation in progress */
  operating: boolean;
  /** Error message */
  error: string | null;
  /** Permission status */
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}

/**
 * Product list action methods
 */
export interface ProductListActions {
  /** Refresh list */
  refresh: () => Promise<void>;
  /** Delete product */
  deleteProduct: (id: number) => Promise<boolean>;
  /** Activate (list) product */
  activateProduct: (id: number) => Promise<boolean>;
  /** Deactivate (delist) product */
  deactivateProduct: (id: number) => Promise<boolean>;
  /** Archive product */
  archiveProduct: (id: number) => Promise<boolean>;
  /** Submit for review */
  submitForReview: (id: number) => Promise<boolean>;
  /** Approve product */
  approveProduct: (id: number) => Promise<boolean>;
  /** Reject product */
  rejectProduct: (id: number, reason: string) => Promise<boolean>;
}

/**
 * useProductList Hook return type
 */
export type UseProductListResult = ProductListState & ProductListActions;

/**
 * useProductList Hook configuration options
 */
export interface UseProductListOptions {
  /** Initial query parameters */
  initialParams?: ProductQueryParams;
  /** Whether to auto load */
  autoLoad?: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Product List ViewModel Hook
 * 
 * Functionality:
 * - Manage product list data and loading state
 * - Provide delete, activate/deactivate operations
 * - Subscribe to product change events for automatic list refresh
 * 
 * Event Subscriptions:
 * - product:created - Refresh list after product creation
 * - product:updated - Refresh list after product update
 * - product:deleted - Refresh list after product deletion
 * 
 * @param options - Configuration options
 * @returns Product list state and action methods
 */
export function useProductList(options?: UseProductListOptions): UseProductListResult {
  const { initialParams, autoLoad = true } = options ?? {};

  // -------------------- Get Capabilities --------------------
  const http = useHttp();
  const eventBus = useEventBus();
  const { hasPermission } = useAuth();

  // -------------------- Create Repository --------------------
  const repositoryRef = useRef<ProductRepository | null>(null);
  
  if (!repositoryRef.current && http) {
    repositoryRef.current = createProductRepository(http);
  }

  // -------------------- State Definitions --------------------
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [operating, setOperating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryParams] = useState<ProductQueryParams | undefined>(initialParams);

  // -------------------- Permission Check --------------------
  const permissions = useMemo(() => ({
    canCreate: hasPermission?.(PRODUCT_PERMISSIONS.CREATE) ?? true,
    canUpdate: hasPermission?.(PRODUCT_PERMISSIONS.UPDATE) ?? true,
    canDelete: hasPermission?.(PRODUCT_PERMISSIONS.DELETE) ?? true,
  }), [hasPermission]);

  // -------------------- Data Loading --------------------
  /**
   * Refresh product list
   */
  const refresh = useCallback(async () => {
    if (!repositoryRef.current) {
      setError('Repository not initialized');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await repositoryRef.current.list(queryParams);
      setProducts(response.content);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load product list';
      setError(message);
      console.error('[useProductList] Load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  // -------------------- Action Methods --------------------
  /**
   * Delete product
   * 
   * @param id - Product ID
   * @returns Whether successful
   */
  const deleteProduct = useCallback(async (id: number): Promise<boolean> => {
    if (!repositoryRef.current) {
      setError('Repository not initialized');
      return false;
    }

    setOperating(true);
    
    try {
      await repositoryRef.current.delete(id);
      
      // Publish delete event
      eventBus?.publish(PRODUCT_EVENTS.DELETED, { id });
      
      // Remove from local list
      setProducts((prev: Product[]) => prev.filter((p: Product) => p.id !== id));
      
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete product';
      setError(message);
      console.error('[useProductList] Delete failed:', err);
      return false;
    } finally {
      setOperating(false);
    }
  }, [eventBus]);

  /**
   * Activate (list) product
   * 
   * @param id - Product ID
   * @returns Whether successful
   */
  const activateProduct = useCallback(async (id: number): Promise<boolean> => {
    if (!repositoryRef.current) {
      setError('Repository not initialized');
      return false;
    }

    setOperating(true);
    
    try {
      const updated = await repositoryRef.current.activate(id);
      
      // Publish activate event
      eventBus?.publish(PRODUCT_EVENTS.ACTIVATED, {
        id,
        name: updated.name,
      });
      
      // Update local list
      setProducts((prev: Product[]) => prev.map((p: Product) => p.id === id ? updated : p));
      
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to activate product';
      setError(message);
      console.error('[useProductList] Activate failed:', err);
      return false;
    } finally {
      setOperating(false);
    }
  }, [eventBus]);

  /**
   * Deactivate (delist) product
   * 
   * @param id - Product ID
   * @returns Whether successful
   */
  const deactivateProduct = useCallback(async (id: number): Promise<boolean> => {
    if (!repositoryRef.current) {
      setError('Repository not initialized');
      return false;
    }

    setOperating(true);
    
    try {
      const updated = await repositoryRef.current.deactivate(id);
      
      // Publish deactivate event
      eventBus?.publish(PRODUCT_EVENTS.DEACTIVATED, {
        id,
        name: updated.name,
      });
      
      // Update local list
      setProducts((prev: Product[]) => prev.map((p: Product) => p.id === id ? updated : p));
      
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to deactivate product';
      setError(message);
      console.error('[useProductList] Deactivate failed:', err);
      return false;
    } finally {
      setOperating(false);
    }
  }, [eventBus]);

  /**
   * Archive product
   * 
   * @param id - Product ID
   * @returns Whether successful
   */
  const archiveProduct = useCallback(async (id: number): Promise<boolean> => {
    if (!repositoryRef.current) {
      setError('Repository not initialized');
      return false;
    }

    setOperating(true);
    
    try {
      const updated = await repositoryRef.current.archive(id);
      
      // Update local list
      setProducts((prev: Product[]) => prev.map((p: Product) => p.id === id ? updated : p));
      
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to archive product';
      setError(message);
      console.error('[useProductList] Archive failed:', err);
      return false;
    } finally {
      setOperating(false);
    }
  }, []);

  /**
   * Submit for review
   * 
   * @param id - Product ID
   * @returns Whether successful
   */
  const submitForReview = useCallback(async (id: number): Promise<boolean> => {
    if (!repositoryRef.current) {
      setError('Repository not initialized');
      return false;
    }

    setOperating(true);
    
    try {
      const updated = await repositoryRef.current.submitForReview(id);
      
      // Update local list
      setProducts((prev: Product[]) => prev.map((p: Product) => p.id === id ? updated : p));
      
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit for review';
      setError(message);
      console.error('[useProductList] Submit for review failed:', err);
      return false;
    } finally {
      setOperating(false);
    }
  }, []);

  /**
   * Approve product
   * 
   * @param id - Product ID
   * @returns Whether successful
   */
  const approveProduct = useCallback(async (id: number): Promise<boolean> => {
    if (!repositoryRef.current) {
      setError('Repository not initialized');
      return false;
    }

    setOperating(true);
    
    try {
      const updated = await repositoryRef.current.approve(id);
      
      // Update local list
      setProducts((prev: Product[]) => prev.map((p: Product) => p.id === id ? updated : p));
      
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to approve product';
      setError(message);
      console.error('[useProductList] Approve failed:', err);
      return false;
    } finally {
      setOperating(false);
    }
  }, []);

  /**
   * Reject product
   * 
   * @param id - Product ID
   * @param reason - Rejection reason
   * @returns Whether successful
   */
  const rejectProduct = useCallback(async (id: number, reason: string): Promise<boolean> => {
    if (!repositoryRef.current) {
      setError('Repository not initialized');
      return false;
    }

    setOperating(true);
    
    try {
      const updated = await repositoryRef.current.reject(id, reason);
      
      // Update local list
      setProducts((prev: Product[]) => prev.map((p: Product) => p.id === id ? updated : p));
      
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reject product';
      setError(message);
      console.error('[useProductList] Reject failed:', err);
      return false;
    } finally {
      setOperating(false);
    }
  }, []);

  // -------------------- Initial Load --------------------
  useEffect(() => {
    if (autoLoad) {
      refresh();
    }
  }, [refresh, autoLoad]);

  // -------------------- Event Subscriptions --------------------
  useEffect(() => {
    if (!eventBus) return;

    // Subscribe to product change events
    const unsubscribeCreated = eventBus.subscribe(
      PRODUCT_EVENTS.CREATED,
      () => refresh()
    );
    
    const unsubscribeUpdated = eventBus.subscribe(
      PRODUCT_EVENTS.UPDATED,
      () => refresh()
    );

    return () => {
      unsubscribeCreated?.();
      unsubscribeUpdated?.();
    };
  }, [eventBus, refresh]);

  // -------------------- Return Result --------------------
  return {
    // State
    products,
    loading,
    operating,
    error,
    permissions,
    // Actions
    refresh,
    deleteProduct,
    activateProduct,
    deactivateProduct,
    archiveProduct,
    submitForReview,
    approveProduct,
    rejectProduct,
  };
}
