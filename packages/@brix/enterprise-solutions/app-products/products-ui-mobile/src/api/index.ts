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
 * Product Module API Client
 *
 * v3.0 Product Package Module - Mobile UI API Layer
 *
 * [Red Line R3 Fix] Removed axios direct dependency, requests are made through HttpCapability contract.
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type { Product, ProductQueryParams } from '../types';

// API base path
const API_BASE = '/api/v1/products';

/**
 * HTTP client (injected by runtime)
 */
let http: HttpCapability | null = null;

/**
 * Set HTTP capability instance
 */
export function setHttpCapability(capability: HttpCapability): void {
  http = capability;
}

function getHttp(): HttpCapability {
  if (!http) {
    throw new Error('[products-ui-mobile] HttpCapability not initialized, please call setHttpCapability() first');
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
   * Health check
   */
  async health(): Promise<{ status: string; module: string; version: string }> {
    return getHttp().get(`${API_BASE}/health`);
  },
};

export default productApi;
