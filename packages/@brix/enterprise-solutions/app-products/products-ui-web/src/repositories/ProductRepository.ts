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
 * @see HttpCapability - defined in @brix-sdk/runtime-sdk-api-web
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type {
  Product,
  ProductType,
  ProductStatus,
  CreateProductParams,
  UpdateProductParams,
  ProductQueryParams,
  PagedResponse,
} from '@brix-sdk/enterprise-products-shared';

// ============================================================================
// API Constants
// ============================================================================

/** API base path — '/api' prefix provided by HttpCapability baseURL */
const API_BASE = '/v1/products';

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
/**
 * Normalize backend list response to PagedResponse<Product>.
 *
 * Backend `/api/v1/products` currently returns a plain `List<ProductDTO>` (JSON array)
 * for filter-based queries; the same endpoint may return a Spring `Page<ProductDTO>`
 * once pagination is enabled server-side. Per the Repository pattern (see file header,
 * point 2: "Data format conversion"), this layer is the contract boundary that
 * normalizes both shapes into the frontend's canonical `PagedResponse<Product>`,
 * so View / Hook layers stay agnostic of backend pagination evolution.
 *
 * @param raw - Raw HTTP response body (array or paged object)
 * @param fallbackSize - Page size used when backend did not return paging metadata
 */
function normalizeProductPage(
  raw: unknown,
  fallbackSize: number,
): PagedResponse<Product> {
  if (Array.isArray(raw)) {
    const content = raw as Product[];
    return {
      content,
      page: 0,
      size: content.length || fallbackSize,
      totalElements: content.length,
      totalPages: 1,
      first: true,
      last: true,
    };
  }

  const paged = (raw ?? {}) as Partial<PagedResponse<Product>>;
  const content = Array.isArray(paged.content) ? paged.content : [];
  const size = paged.size ?? (content.length || fallbackSize);
  const totalElements = paged.totalElements ?? content.length;
  const totalPages = paged.totalPages ?? (size > 0 ? Math.max(1, Math.ceil(totalElements / size)) : 1);

  return {
    content,
    page: paged.page ?? 0,
    size,
    totalElements,
    totalPages,
    first: paged.first ?? true,
    last: paged.last ?? true,
  };
}

export function createProductRepository(http: HttpCapability): ProductRepository {
  return {
    async list(params?: ProductQueryParams): Promise<PagedResponse<Product>> {
      const raw = await http.get<unknown>(API_BASE, params as Record<string, unknown> | undefined);
      return normalizeProductPage(raw, params?.size ?? 20);
    },

    async listAll(): Promise<Product[]> {
      const raw = await http.get<unknown>(API_BASE, { size: 1000 });
      return normalizeProductPage(raw, 1000).content;
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
      const raw = await http.get<unknown>(API_BASE, { type, size: 1000 });
      return normalizeProductPage(raw, 1000).content;
    },

    async getByStatus(status: ProductStatus): Promise<Product[]> {
      const raw = await http.get<unknown>(API_BASE, { status, size: 1000 });
      return normalizeProductPage(raw, 1000).content;
    },

    async getByPartnerId(partnerId: number): Promise<Product[]> {
      const raw = await http.get<unknown>(API_BASE, { partnerId, size: 1000 });
      return normalizeProductPage(raw, 1000).content;
    },
  };
}
