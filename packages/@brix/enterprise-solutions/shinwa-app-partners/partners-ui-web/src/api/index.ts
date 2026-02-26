/**
 * Partner Management Module - API Client
 * 
 * Architecture Red Line R3 Compliance - v3.2:
 * This module strictly follows the v3.0 Architecture Design Blueprint §7.1 specification:
 * "Plugin layer is prohibited from directly using HTTP client libraries like axios/fetch,
 * all requests must be made through HttpCapability."
 * 
 * Refactoring Notes:
 * v3.2 version removed the internal request() wrapper function (based on fetch),
 * all HTTP requests are now unified through HttpCapability.
 * 
 * @description Encapsulates HTTP API calls related to partners
 * @version 3.2.0
 */

import type { HttpCapability } from '@brix/runtime-sdk-api-web';
import type {
  PartnerDTO,
  CreatePartnerRequest,
  UpdatePartnerRequest,
  PartnerType,
  PartnerStatus,
} from '../types';

// ==================== Capability Management ====================

/**
 * HTTP capability instance
 * Injected by Shell layer through setHttpCapability() during plugin activation
 */
let httpCapability: HttpCapability | null = null;

/**
 * Inject HTTP capability instance
 * 
 * Call Timing: Plugin activation phase, called by Shell or Plugin Bootstrap
 * 
 * @param capability - HttpCapability implementation provided by Shell layer
 * @throws Error if null or undefined is passed
 */
export function setHttpCapability(capability: HttpCapability): void {
  if (!capability) {
    throw new Error('[partners-ui-web] HttpCapability cannot be null');
  }
  httpCapability = capability;
}

/**
 * Get HTTP capability instance (internal use)
 * 
 * @returns HttpCapability instance
 * @throws Clear error message if capability is not initialized
 */
function getHttp(): HttpCapability {
  if (!httpCapability) {
    throw new Error(
      '[partners-ui-web] HttpCapability not initialized, ' +
      'please ensure setHttpCapability(capability) is called during plugin activation'
    );
  }
  return httpCapability;
}

// ==================== API Constants ====================

/**
 * API base path
 */
const API_BASE = '/api/v1/partners';

// ==================== API Service ====================

/**
 * Partner API Client
 * 
 * All methods use HttpCapability to make requests, compliant with Architecture Red Line R3.
 */
export const partnerApi = {
  /**
   * Create partner
   * 
   * @param data - Create request
   * @returns Created partner info
   */
  create: (data: CreatePartnerRequest): Promise<PartnerDTO> => {
    return getHttp().post<PartnerDTO>(API_BASE, data);
  },

  /**
   * Update partner
   * 
   * @param id - Partner ID
   * @param data - Update request
   * @returns Updated partner info
   */
  update: (id: number, data: UpdatePartnerRequest): Promise<PartnerDTO> => {
    return getHttp().put<PartnerDTO>(`${API_BASE}/${id}`, data);
  },

  /**
   * Get partner details
   * 
   * @param id - Partner ID
   * @returns Partner details
   */
  getById: (id: number): Promise<PartnerDTO> => {
    return getHttp().get<PartnerDTO>(`${API_BASE}/${id}`);
  },

  /**
   * Get partner by code
   * 
   * @param code - Partner code
   * @returns Partner details
   */
  getByCode: (code: string): Promise<PartnerDTO> => {
    return getHttp().get<PartnerDTO>(`${API_BASE}/code/${code}`);
  },

  /**
   * Query partner list
   * 
   * @param params - Query parameters
   * @param params.type - Partner type
   * @param params.status - Partner status
   * @returns Partner list
   */
  list: (params?: { type?: PartnerType; status?: PartnerStatus }): Promise<PartnerDTO[]> => {
    const queryParams: Record<string, unknown> = {};
    if (params?.type) queryParams.type = params.type;
    if (params?.status) queryParams.status = params.status;
    return getHttp().get<PartnerDTO[]>(API_BASE, queryParams);
  },

  /**
   * Query available partners
   * 
   * @param type - Partner type (optional)
   * @returns Available partner list
   */
  listAvailable: (type?: PartnerType): Promise<PartnerDTO[]> => {
    const queryParams: Record<string, unknown> = {};
    if (type) queryParams.type = type;
    return getHttp().get<PartnerDTO[]>(`${API_BASE}/available`, queryParams);
  },

  /**
   * Delete partner
   * 
   * @param id - Partner ID
   */
  delete: (id: number): Promise<void> => {
    return getHttp().delete<void>(`${API_BASE}/${id}`);
  },

  /**
   * Activate partner
   * 
   * @param id - Partner ID
   * @returns Updated partner info
   */
  activate: (id: number): Promise<PartnerDTO> => {
    return getHttp().post<PartnerDTO>(`${API_BASE}/${id}/activate`);
  },

  /**
   * Suspend partner
   * 
   * @param id - Partner ID
   * @param reason - Suspend reason (optional)
   * @returns Updated partner info
   */
  suspend: (id: number, reason?: string): Promise<PartnerDTO> => {
    return getHttp().post<PartnerDTO>(`${API_BASE}/${id}/suspend`, { reason });
  },

  /**
   * Resume partner
   * 
   * @param id - Partner ID
   * @returns Updated partner info
   */
  resume: (id: number): Promise<PartnerDTO> => {
    return getHttp().post<PartnerDTO>(`${API_BASE}/${id}/resume`);
  },

  /**
   * Terminate partner
   * 
   * @param id - Partner ID
   * @param reason - Terminate reason (optional)
   * @returns Updated partner info
   */
  terminate: (id: number, reason?: string): Promise<PartnerDTO> => {
    return getHttp().post<PartnerDTO>(`${API_BASE}/${id}/terminate`, { reason });
  },
};

export default partnerApi;
