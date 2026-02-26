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

import type { HttpCapability } from '@brix/runtime-sdk-api-web';
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

/**
 * @deprecated Please use createPartnerApiService(http) instead.
 * This static object violates architecture red line R3 (no direct fetch), kept only for migration compatibility.
 * Will be removed in v3.1.0.
 */
export const partnerApi = {
  getById(_id: number): Promise<PartnerDTO> {
    throw new Error(
      '[Architecture Red Line] Direct use of partnerApi is prohibited, please create service instance through createPartnerApiService(http). ' +
        'Reference: v3.0.4-runtime-shell-architecture-blueprint.md#R3'
    );
  },
  getByCode(_code: string): Promise<PartnerDTO> {
    throw new Error('[Architecture Red Line] Direct use of partnerApi is prohibited');
  },
  list(_params?: { type?: PartnerType; status?: PartnerStatus }): Promise<PartnerDTO[]> {
    throw new Error('[Architecture Red Line] Direct use of partnerApi is prohibited');
  },
  listAvailable(_type?: PartnerType): Promise<PartnerDTO[]> {
    throw new Error('[Architecture Red Line] Direct use of partnerApi is prohibited');
  },
};

/**
 * @deprecated This function is deprecated, HttpCapability handles baseURL automatically.
 */
export function setApiBase(_baseUrl: string): void {
  console.warn(
    '[Architecture Red Line] setApiBase is deprecated. ' +
      'HttpCapability handles baseURL automatically based on configuration.'
  );
}

export default partnerApi;
