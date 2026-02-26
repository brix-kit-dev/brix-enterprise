/**
 * Product Module API Client
 *
 * v3.0 Product Package Module - Web UI API Layer
 *
 * [Red Line R3 Fix] Removed axios direct dependency, requests are made through HttpCapability contract.
 * HttpCapability is injected by Shell layer, plugins don't need to know the underlying HTTP implementation.
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */

import type { HttpCapability } from '@brix/runtime-sdk-api-web';
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductQueryParams,
} from '../types';

// API base path
const API_BASE = '/api/v1/products';

/**
 * HTTP client (injected by runtime)
 */
let http: HttpCapability | null = null;

/**
 * Set HTTP capability instance
 * 
 * <p>Obtained from RuntimeContext and injected during module initialization.</p>
 */
export function setHttpCapability(capability: HttpCapability): void {
  http = capability;
}

/**
 * Get current HTTP capability (internal assertion)
 */
function getHttp(): HttpCapability {
  if (!http) {
    throw new Error('[products-ui-web] HttpCapability not initialized, please call setHttpCapability() first');
  }
  return http;
}

/**
 * Product API service
 */
export const productApi = {
  /**
   * Query product list
   */
  async list(params?: ProductQueryParams): Promise<Product[]> {
    return getHttp().get<Product[]>(API_BASE, params as Record<string, unknown>);
  },

  /**
   * Query active products
   */
  async listActive(): Promise<Product[]> {
    return getHttp().get<Product[]>(`${API_BASE}/active`);
  },

  /**
   * Query product detail
   */
  async getById(id: number): Promise<Product> {
    return getHttp().get<Product>(`${API_BASE}/${id}`);
  },

  /**
   * Create product
   */
  async create(request: CreateProductRequest): Promise<Product> {
    return getHttp().post<Product>(API_BASE, request);
  },

  /**
   * Update product
   */
  async update(id: number, request: UpdateProductRequest): Promise<Product> {
    return getHttp().put<Product>(`${API_BASE}/${id}`, request);
  },

  /**
   * Delete product
   */
  async delete(id: number): Promise<void> {
    await getHttp().delete(`${API_BASE}/${id}`);
  },

  /**
   * Submit for review
   */
  async submitReview(id: number): Promise<Product> {
    return getHttp().post<Product>(`${API_BASE}/${id}/submit-review`);
  },

  /**
   * Approve review
   */
  async approve(id: number): Promise<Product> {
    return getHttp().post<Product>(`${API_BASE}/${id}/approve`);
  },

  /**
   * Reject review
   */
  async reject(id: number, reason?: string): Promise<Product> {
    return getHttp().post<Product>(`${API_BASE}/${id}/reject`, { reason });
  },

  /**
   * Deactivate product
   */
  async deactivate(id: number): Promise<Product> {
    return getHttp().post<Product>(`${API_BASE}/${id}/deactivate`);
  },

  /**
   * Reactivate product
   */
  async reactivate(id: number): Promise<Product> {
    return getHttp().post<Product>(`${API_BASE}/${id}/reactivate`);
  },

  /**
   * Archive product
   */
  async archive(id: number): Promise<Product> {
    return getHttp().post<Product>(`${API_BASE}/${id}/archive`);
  },

  /**
   * Health check
   */
  async health(): Promise<{ status: string; module: string; version: string }> {
    return getHttp().get(`${API_BASE}/health`);
  },
};

export default productApi;
