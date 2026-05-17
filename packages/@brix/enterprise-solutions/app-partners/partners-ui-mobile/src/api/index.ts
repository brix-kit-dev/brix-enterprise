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
 * Partner Management Module - Mobile API Client
 *
 * [v3.0.4 Architecture Red Line Fix]
 * - Removed all direct fetch calls
 * - Unified HTTP requests through HttpCapability
 * - Supports dependency injection and capability protocol
 *
 * @description Encapsulates partner-related HTTP API calls
 * @version 3.0.4
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type { PartnerDTO, PartnerType, PartnerStatus } from '../types';

/**
 * API base path
 */
const API_BASE = '/api/v1/partners';

/**
 * Partner API service interface
 */
export interface PartnerApiService {
  /**
   * Get partner detail
   *
   * @param id Partner ID
   * @returns Partner detail
   */
  getById(id: number): Promise<PartnerDTO>;

  /**
   * Get partner by code
   *
   * @param code Partner code
   * @returns Partner detail
   */
  getByCode(code: string): Promise<PartnerDTO>;

  /**
   * Query partner list
   *
   * @param params Query parameters
   * @returns Partner list
   */
  list(params?: { type?: PartnerType; status?: PartnerStatus }): Promise<PartnerDTO[]>;

  /**
   * Query available partners
   *
   * @param type Partner type
   * @returns Available partner list
   */
  listAvailable(type?: PartnerType): Promise<PartnerDTO[]>;
}

/**
 * Create partner API service
 *
 * [Architecture Specification - Red Line R3]
 * Plugin layer is prohibited from using fetch/axios directly, must use HttpCapability for unified requests.
 *
 * @param http HttpCapability instance (obtained from RuntimeContext)
 * @returns Partner API service instance
 *
 * @example
 * ```typescript
 * // 在插件初始化时获取 HttpCapability
 * const http = runtimeContext.getCapability<HttpCapability>(HttpCapabilityType);
 * const partnerApi = createPartnerApiService(http);
 *
 * // Call API
 * const partners = await partnerApi.list({ type: 'SUPPLIER' });
 * ```
 */
export function createPartnerApiService(http: HttpCapability): PartnerApiService {
  return {
    getById(id) {
      return http.get<PartnerDTO>(`${API_BASE}/${id}`);
    },

    getByCode(code) {
      return http.get<PartnerDTO>(`${API_BASE}/code/${code}`);
    },

    list(params) {
      return http.get<PartnerDTO[]>(API_BASE, params);
    },

    listAvailable(type) {
      return http.get<PartnerDTO[]>(`${API_BASE}/available`, type ? { type } : undefined);
    },
  };
}
