/**
 * @file Product Repository
 * @description Product data access layer - encapsulates all product-related API interactions
 * @module products-ui-web/repositories/ProductRepository
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * Repository layer is responsible for:
 * 1. Encapsulating backend API call details
 * 2. Data format conversion (if needed)
 * 3. Error handling standardization
 * 
 * Architecture Red Line R3 Compliance:
 * All HTTP requests are made through HttpCapability, not directly using fetch/axios.
 * 
 * @see HttpCapability - defined in @brix/runtime-sdk-api-web
 */

import type { HttpCapability } from '@brix/runtime-sdk-api-web';
import type {
  Product,
  ProductType,
  ProductStatus,
  CreateProductParams,
  UpdateProductParams,
  ProductQueryParams,
  PagedResponse,
} from '@shinwa/products-shared';

// ============================================================================
// API Constants
// ============================================================================

/** API base path */
const API_BASE = '/api/v1/products';

// ============================================================================
// Repository Interface Definition
// ============================================================================

/**
 * Product Repository Interface
 * 
 * Defines the standard contract for product data access.
 */
export interface ProductRepository {
  /**
   * Get product list (paginated)
   * 
   * @param params - Query parameters
   * @returns Paginated product list
   */
  list(params?: ProductQueryParams): Promise<PagedResponse<Product>>;

  /**
   * Get all products
   * 
   * @returns Product list
   */
  listAll(): Promise<Product[]>;

  /**
   * Get product by ID
   * 
   * @param id - Product ID
   * @returns Product details
   */
  getById(id: number): Promise<Product>;

  /**
   * Get product by code
   * 
   * @param code - Product code
   * @returns Product details
   */
  getByCode(code: string): Promise<Product>;

  /**
   * Create product
   * 
   * @param params - Create parameters
   * @returns Created product
   */
  create(params: CreateProductParams): Promise<Product>;

  /**
   * Update product
   * 
   * @param id - Product ID
   * @param params - Update parameters
   * @returns Updated product
   */
  update(id: number, params: UpdateProductParams): Promise<Product>;

  /**
   * Delete product
   * 
   * @param id - Product ID
   */
  delete(id: number): Promise<void>;

  /**
   * Activate (list) product
   * 
   * @param id - Product ID
   * @returns Updated product
   */
  activate(id: number): Promise<Product>;

  /**
   * Deactivate (delist) product
   * 
   * @param id - Product ID
   * @returns Updated product
   */
  deactivate(id: number): Promise<Product>;

  /**
   * Archive product
   * 
   * @param id - Product ID
   * @returns Updated product
   */
  archive(id: number): Promise<Product>;

  /**
   * Submit for review
   * 
   * @param id - Product ID
   * @returns Updated product
   */
  submitForReview(id: number): Promise<Product>;

  /**
   * Approve product
   * 
   * @param id - Product ID
   * @returns Updated product
   */
  approve(id: number): Promise<Product>;

  /**
   * Reject product
   * 
   * @param id - Product ID
   * @param reason - Rejection reason
   * @returns Updated product
   */
  reject(id: number, reason: string): Promise<Product>;

  /**
   * Get products by type
   * 
   * @param type - Product type
   * @returns Product list
   */
  getByType(type: ProductType): Promise<Product[]>;

  /**
   * Get products by status
   * 
   * @param status - Product status
   * @returns Product list
   */
  getByStatus(status: ProductStatus): Promise<Product[]>;

  /**
   * Get products by partner
   * 
   * @param partnerId - Partner ID
   * @returns Product list
   */
  getByPartnerId(partnerId: number): Promise<Product[]>;
}

// ============================================================================
// Repository Factory Function
// ============================================================================

/**
 * Create Product Repository Instance
 * 
 * Usage Example:
 * ```typescript
 * const http = useHttp();
 * const productRepo = createProductRepository(http);
 * const products = await productRepo.listAll();
 * ```
 * 
 * @param http - HttpCapability instance
 * @returns ProductRepository instance
 */
export function createProductRepository(http: HttpCapability): ProductRepository {
  return {
    async list(params?: ProductQueryParams): Promise<PagedResponse<Product>> {
      return http.get<PagedResponse<Product>>(API_BASE, params);
    },

    async listAll(): Promise<Product[]> {
      const response = await http.get<PagedResponse<Product>>(API_BASE, { size: 1000 });
      return response.content;
    },

    async getById(id: number): Promise<Product> {
      return http.get<Product>(`${API_BASE}/${id}`);
    },

    async getByCode(code: string): Promise<Product> {
      return http.get<Product>(`${API_BASE}/code/${code}`);
    },

    async create(params: CreateProductParams): Promise<Product> {
      return http.post<Product>(API_BASE, params);
    },

    async update(id: number, params: UpdateProductParams): Promise<Product> {
      return http.put<Product>(`${API_BASE}/${id}`, params);
    },

    async delete(id: number): Promise<void> {
      await http.delete(`${API_BASE}/${id}`);
    },

    async activate(id: number): Promise<Product> {
      return http.post<Product>(`${API_BASE}/${id}/activate`);
    },

    async deactivate(id: number): Promise<Product> {
      return http.post<Product>(`${API_BASE}/${id}/deactivate`);
    },

    async archive(id: number): Promise<Product> {
      return http.post<Product>(`${API_BASE}/${id}/archive`);
    },

    async submitForReview(id: number): Promise<Product> {
      return http.post<Product>(`${API_BASE}/${id}/submit-review`);
    },

    async approve(id: number): Promise<Product> {
      return http.post<Product>(`${API_BASE}/${id}/approve`);
    },

    async reject(id: number, reason: string): Promise<Product> {
      return http.post<Product>(`${API_BASE}/${id}/reject`, { reason });
    },

    async getByType(type: ProductType): Promise<Product[]> {
      const response = await http.get<PagedResponse<Product>>(API_BASE, { type, size: 1000 });
      return response.content;
    },

    async getByStatus(status: ProductStatus): Promise<Product[]> {
      const response = await http.get<PagedResponse<Product>>(API_BASE, { status, size: 1000 });
      return response.content;
    },

    async getByPartnerId(partnerId: number): Promise<Product[]> {
      const response = await http.get<PagedResponse<Product>>(API_BASE, { partnerId, size: 1000 });
      return response.content;
    },
  };
}
