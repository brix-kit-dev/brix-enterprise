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
 * @file Role Repository
 * @description Role data access layer - encapsulates all role-related API interactions
 * @module identity-ui-web/repositories/RoleRepository
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * Repository layer encapsulates backend API call details.
 * When backend API changes, only this file needs modification.
 * 
 * Architecture Red Line R3 Compliance:
 * All HTTP requests are made through HttpCapability.
 * 
 * @see HttpCapability - Defined in @brix-sdk/runtime-sdk-api-web
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Role data transfer object
 */
export interface Role {
  /** Role ID */
  id: number;
  /** Role code */
  code: string;
  /** Role name */
  name: string;
  /** Role description */
  description?: string;
  /** Permission list */
  permissions: string[];
  /** Whether system built-in */
  builtIn: boolean;
  /** Whether enabled */
  enabled: boolean;
  /** Created time */
  createdAt: string;
  /** Updated time */
  updatedAt?: string;
}

/**
 * Create role parameters
 */
export interface CreateRoleParams {
  /** Role code */
  code: string;
  /** Role name */
  name: string;
  /** Role description */
  description?: string;
  /** Permission list */
  permissions?: string[];
}

/**
 * Update role parameters
 */
export interface UpdateRoleParams {
  /** Role name */
  name?: string;
  /** Role description */
  description?: string;
  /** Permission list */
  permissions?: string[];
  /** Whether enabled */
  enabled?: boolean;
}

/**
 * Role Repository interface
 * 
 * Defines role data access contract for easy mocking in tests.
 */
export interface RoleRepository {
  /**
   * Get role list
   * 
   * @returns Role list
   */
  list(): Promise<Role[]>;
  
  /**
   * Get role details by ID
   * 
   * @param roleId - Role ID
   * @returns Role details
   */
  getById(roleId: number): Promise<Role>;
  
  /**
   * Get role by code
   * 
   * @param code - Role code
   * @returns Role details
   */
  getByCode(code: string): Promise<Role>;
  
  /**
   * Create role
   * 
   * @param params - Creation parameters
   * @returns Created role
   */
  create(params: CreateRoleParams): Promise<Role>;
  
  /**
   * Update role
   * 
   * @param roleId - Role ID
   * @param params - Update parameters
   * @returns Updated role
   */
  update(roleId: number, params: UpdateRoleParams): Promise<Role>;
  
  /**
   * Delete role
   * 
   * @param roleId - Role ID
   */
  delete(roleId: number): Promise<void>;
  
  /**
   * Get available roles list (for dropdown selection)
   * 
   * @returns Enabled roles list
   */
  listAvailable(): Promise<Role[]>;
}

// ============================================================================
// API Constants
// ============================================================================

/** Role API base path — '/api' prefix provided by HttpCapability baseURL */
const API_BASE = '/v1/roles';

// ============================================================================
// Repository Factory Function
// ============================================================================

/**
 * Create Role Repository instance
 * 
 * @param http - HttpCapability instance provided by Shell layer
 * @returns RoleRepository instance
 * 
 * @example
 * ```typescript
 * const http = useHttp();
 * const roleRepo = useMemo(() => createRoleRepository(http), [http]);
 * const roles = await roleRepo.list();
 * ```
 */
export function createRoleRepository(http: HttpCapability): RoleRepository {
  return {
    // ========================================================================
    // Query Operations
    // ========================================================================
    
    /**
     * Get role list
     * 
     * Request Format:
     * GET /api/v1/roles
     */
    async list(): Promise<Role[]> {
      return http.get<Role[]>(API_BASE);
    },
    
    /**
     * Get role details by ID
     * 
     * Request Format:
     * GET /api/v1/roles/{roleId}
     */
    async getById(roleId: number): Promise<Role> {
      return http.get<Role>(`${API_BASE}/${roleId}`);
    },
    
    /**
     * Get role by code
     * 
     * Request Format:
     * GET /api/v1/roles/code/{code}
     */
    async getByCode(code: string): Promise<Role> {
      return http.get<Role>(`${API_BASE}/code/${code}`);
    },
    
    /**
     * Get available roles list
     * 
     * Request Format:
     * GET /api/v1/roles/available
     */
    async listAvailable(): Promise<Role[]> {
      return http.get<Role[]>(`${API_BASE}/available`);
    },
    
    // ========================================================================
    // Write Operations
    // ========================================================================
    
    /**
     * Create role
     * 
     * Request Format:
     * POST /api/v1/roles
     * Body: CreateRoleParams
     */
    async create(params: CreateRoleParams): Promise<Role> {
      return http.post<Role>(API_BASE, params);
    },
    
    /**
     * Update role
     * 
     * Request Format:
     * PUT /api/v1/roles/{roleId}
     * Body: UpdateRoleParams
     */
    async update(roleId: number, params: UpdateRoleParams): Promise<Role> {
      return http.put<Role>(`${API_BASE}/${roleId}`, params);
    },
    
    /**
     * Delete role
     * 
     * Request Format:
     * DELETE /api/v1/roles/{roleId}
     */
    async delete(roleId: number): Promise<void> {
      return http.delete<void>(`${API_BASE}/${roleId}`);
    },
  };
}
