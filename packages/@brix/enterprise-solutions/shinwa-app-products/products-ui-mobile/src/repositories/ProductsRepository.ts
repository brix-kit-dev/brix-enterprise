/**
 * Products Repository - Data Access Layer for Mobile
 * 
 * This module implements the Repository pattern for products data access.
 * All HTTP calls are routed through HttpCapability.
 * 
 * @module @shinwa/products-ui-mobile/repositories
 * @since 3.1.0
 */

import type { HttpCapability } from '@brix/runtime-sdk-api-mobile';
import type {
  Product,
  ProductCategory,
  ProductListParams,
  ProductListResponse
} from '@shinwa/products-shared';

/**
 * Products Repository Interface
 * 
 * 产品数据仓库接口
 */
export interface ProductsRepository {
  /**
   * Gets list of products
   * @param params - Query parameters
   * @returns Promise resolving to product list
   */
  getProducts(params?: ProductListParams): Promise<ProductListResponse>;

  /**
   * Gets a single product by ID
   * @param productId - Product ID
   * @returns Promise resolving to product details
   */
  getProductById(productId: string): Promise<Product>;

  /**
   * Gets product categories
   * @returns Promise resolving to category list
   */
  getCategories(): Promise<ProductCategory[]>;

  /**
   * Gets products by category
   * @param categoryId - Category ID
   * @param params - Query parameters
   * @returns Promise resolving to product list
   */
  getProductsByCategory(categoryId: string, params?: ProductListParams): Promise<ProductListResponse>;

  /**
   * Searches products
   * @param query - Search query string
   * @param limit - Maximum number of results
   * @returns Promise resolving to matching products
   */
  searchProducts(query: string, limit?: number): Promise<Product[]>;

  /**
   * Gets featured products
   * @param limit - Maximum number of products
   * @returns Promise resolving to featured products
   */
  getFeaturedProducts(limit?: number): Promise<Product[]>;
}

/**
 * Creates a ProductsRepository implementation using HttpCapability
 * 
 * 工厂函数通过注入 HttpCapability 创建产品仓库实例
 * 
 * @param httpCapability - The HTTP capability for making API calls
 * @returns ProductsRepository implementation
 */
export function createProductsRepository(httpCapability: HttpCapability): ProductsRepository {
  const BASE_PATH = '/api/v1/products';

  return {
    async getProducts(params?: ProductListParams): Promise<ProductListResponse> {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.set('page', String(params.page));
      if (params?.size !== undefined) queryParams.set('size', String(params.size));
      if (params?.categoryId) queryParams.set('categoryId', params.categoryId);
      if (params?.minPrice !== undefined) queryParams.set('minPrice', String(params.minPrice));
      if (params?.maxPrice !== undefined) queryParams.set('maxPrice', String(params.maxPrice));
      
      const url = queryParams.toString() ? `${BASE_PATH}?${queryParams}` : BASE_PATH;
      return httpCapability.get<ProductListResponse>(url);
    },

    async getProductById(productId: string): Promise<Product> {
      return httpCapability.get<Product>(`${BASE_PATH}/${productId}`);
    },

    async getCategories(): Promise<ProductCategory[]> {
      const response = await httpCapability.get<{ items: ProductCategory[] }>(
        `${BASE_PATH}/categories`
      );
      return response.items;
    },

    async getProductsByCategory(categoryId: string, params?: ProductListParams): Promise<ProductListResponse> {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.set('page', String(params.page));
      if (params?.size !== undefined) queryParams.set('size', String(params.size));
      
      return httpCapability.get<ProductListResponse>(
        `${BASE_PATH}/categories/${categoryId}/products?${queryParams}`
      );
    },

    async searchProducts(query: string, limit: number = 20): Promise<Product[]> {
      const response = await httpCapability.get<{ items: Product[] }>(
        `${BASE_PATH}/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response.items;
    },

    async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
      const response = await httpCapability.get<{ items: Product[] }>(
        `${BASE_PATH}/featured?limit=${limit}`
      );
      return response.items;
    }
  };
}
