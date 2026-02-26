/**
 * @file Partner Repository
 * @description Partner data access layer, encapsulates all partner-related API calls
 * @module partners-ui-web/repositories/PartnerRepository
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * Repository layer is the data access layer, responsible for:
 * 1. Encapsulating HTTP request details
 * 2. Providing type-safe API methods
 * 3. Handling request parameter and response data transformation
 * 
 * Architecture Red Line R3 Compliance:
 * All HTTP requests go through HttpCapability, direct use of axios/fetch is prohibited
 * 
 * @see v3.0-Runtime-Shell-Architecture-Blueprint.md §7.1
 */

import type { HttpCapability } from '@brix/runtime-sdk-api-web';
import type {
  PartnerDTO,
  CreatePartnerRequest,
  UpdatePartnerRequest,
  PartnerType,
  PartnerStatus,
} from '../types';

// ============================================================================
// Constants Definition
// ============================================================================

/**
 * API Base Path
 */
const API_BASE = '/api/v1/partners';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Partner Query Parameters
 */
export interface PartnerQueryParams {
  /** Partner type filter */
  type?: PartnerType;
  /** Status filter */
  status?: PartnerStatus;
}

/**
 * Partner Repository Interface Definition
 */
export interface PartnerRepository {
  /**
   * Create partner
   * @param data - Create request
   * @returns Created partner info
   */
  create(data: CreatePartnerRequest): Promise<PartnerDTO>;
  
  /**
   * Update partner
   * @param id - Partner ID
   * @param data - Update request
   * @returns Updated partner info
   */
  update(id: number, data: UpdatePartnerRequest): Promise<PartnerDTO>;
  
  /**
   * Get partner details
   * @param id - Partner ID
   * @returns Partner details
   */
  getById(id: number): Promise<PartnerDTO>;
  
  /**
   * Get partner by code
   * @param code - Partner code
   * @returns Partner details
   */
  getByCode(code: string): Promise<PartnerDTO>;
  
  /**
   * Query partner list
   * @param params - Query parameters
   * @returns Partner list
   */
  list(params?: PartnerQueryParams): Promise<PartnerDTO[]>;
  
  /**
   * Query available partners
   * @param type - Partner type (optional)
   * @returns Available partner list
   */
  listAvailable(type?: PartnerType): Promise<PartnerDTO[]>;
  
  /**
   * Delete partner
   * @param id - Partner ID
   */
  delete(id: number): Promise<void>;
  
  /**
   * Activate partner
   * @param id - Partner ID
   * @returns Updated partner info
   */
  activate(id: number): Promise<PartnerDTO>;
  
  /**
   * Suspend partner
   * @param id - Partner ID
   * @param reason - Suspend reason (optional)
   * @returns Updated partner info
   */
  suspend(id: number, reason?: string): Promise<PartnerDTO>;
  
  /**
   * Resume partner
   * @param id - Partner ID
   * @returns Updated partner info
   */
  resume(id: number): Promise<PartnerDTO>;
  
  /**
   * Terminate partner
   * @param id - Partner ID
   * @param reason - Terminate reason (optional)
   * @returns Updated partner info
   */
  terminate(id: number, reason?: string): Promise<PartnerDTO>;
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create Partner Repository Instance
 * 
 * Usage:
 * ```typescript
 * const http = useHttp();
 * const partnerRepo = createPartnerRepository(http);
 * const partners = await partnerRepo.list({ type: 'HOSPITAL' });
 * ```
 * 
 * @param http - HttpCapability instance provided by Shell layer
 * @returns PartnerRepository instance
 */
export function createPartnerRepository(http: HttpCapability): PartnerRepository {
  return {
    /**
     * Create partner
     */
    async create(data: CreatePartnerRequest): Promise<PartnerDTO> {
      return http.post<PartnerDTO>(API_BASE, data);
    },
    
    /**
     * Update partner
     */
    async update(id: number, data: UpdatePartnerRequest): Promise<PartnerDTO> {
      return http.put<PartnerDTO>(`${API_BASE}/${id}`, data);
    },
    
    /**
     * Get partner details
     */
    async getById(id: number): Promise<PartnerDTO> {
      return http.get<PartnerDTO>(`${API_BASE}/${id}`);
    },
    
    /**
     * Get partner by code
     */
    async getByCode(code: string): Promise<PartnerDTO> {
      return http.get<PartnerDTO>(`${API_BASE}/code/${code}`);
    },
    
    /**
     * Query partner list
     */
    async list(params?: PartnerQueryParams): Promise<PartnerDTO[]> {
      const queryParams: Record<string, unknown> = {};
      if (params?.type) queryParams.type = params.type;
      if (params?.status) queryParams.status = params.status;
      return http.get<PartnerDTO[]>(API_BASE, queryParams);
    },
    
    /**
     * Query available partners
     */
    async listAvailable(type?: PartnerType): Promise<PartnerDTO[]> {
      const queryParams: Record<string, unknown> = {};
      if (type) queryParams.type = type;
      return http.get<PartnerDTO[]>(`${API_BASE}/available`, queryParams);
    },
    
    /**
     * Delete partner
     */
    async delete(id: number): Promise<void> {
      return http.delete<void>(`${API_BASE}/${id}`);
    },
    
    /**
     * Activate partner
     */
    async activate(id: number): Promise<PartnerDTO> {
      return http.post<PartnerDTO>(`${API_BASE}/${id}/activate`);
    },
    
    /**
     * Suspend partner
     */
    async suspend(id: number, reason?: string): Promise<PartnerDTO> {
      return http.post<PartnerDTO>(`${API_BASE}/${id}/suspend`, { reason });
    },
    
    /**
     * Resume partner
     */
    async resume(id: number): Promise<PartnerDTO> {
      return http.post<PartnerDTO>(`${API_BASE}/${id}/resume`);
    },
    
    /**
     * Terminate partner
     */
    async terminate(id: number, reason?: string): Promise<PartnerDTO> {
      return http.post<PartnerDTO>(`${API_BASE}/${id}/terminate`, { reason });
    },
  };
}
