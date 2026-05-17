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
 * @file Organization Repository
 * @description Organization data access layer - encapsulates all organization-related API interactions
 * @module identity-ui-web/repositories/OrganizationRepository
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
import type {
  Organization,
  OrganizationTreeNode,
  CreateOrganizationParams,
  UpdateOrganizationParams,
  OrganizationListQuery,
  PaginatedOrganizations,
} from '@brix-sdk/enterprise-identity-shared';

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * Organization API base path
 * Note: '/api' prefix is provided by HttpCapability baseURL (VITE_API_BASE)
 */
const BASE_PATH = '/identity/organizations';

// ============================================================================
// Repository Interface
// ============================================================================

/**
 * Organization Repository Interface
 * 
 * Defines organization data access contract for easy mocking in tests.
 */
export interface OrganizationRepository {
  /**
   * Get paginated organization list
   * 
   * @param query - Query parameters
   * @returns Paginated organization list
   */
  getList(query?: OrganizationListQuery): Promise<PaginatedOrganizations>;
  
  /**
   * Get organization tree structure
   * 
   * @param rootId - Root organization ID (optional, defaults to entire tree)
   * @returns Organization tree
   */
  getTree(rootId?: number): Promise<OrganizationTreeNode[]>;
  
  /**
   * Get organization by ID
   * 
   * @param id - Organization ID
   * @returns Organization details
   */
  getById(id: number): Promise<Organization>;
  
  /**
   * Get organization by code
   * 
   * @param code - Organization code
   * @returns Organization details
   */
  getByCode(code: string): Promise<Organization>;
  
  /**
   * Create new organization
   * 
   * @param params - Create parameters
   * @returns Created organization
   */
  create(params: CreateOrganizationParams): Promise<Organization>;
  
  /**
   * Update organization
   * 
   * @param id - Organization ID
   * @param params - Update parameters
   * @returns Updated organization
   */
  update(id: number, params: UpdateOrganizationParams): Promise<Organization>;
  
  /**
   * Delete organization
   * 
   * @param id - Organization ID
   */
  delete(id: number): Promise<void>;
  
  /**
   * Get child organizations
   * 
   * @param parentId - Parent organization ID
   * @returns Child organization list
   */
  getChildren(parentId: number): Promise<Organization[]>;
  
  /**
   * Get users in organization
   * 
   * @param organizationId - Organization ID
   * @param query - Query parameters
   * @returns Paginated user list
   */
  getUsers(organizationId: number, query?: { page?: number; size?: number }): Promise<{
    content: Array<{ id: string; username: string; displayName: string }>;
    totalElements: number;
  }>;
  
  /**
   * Move organization to new parent
   * 
   * @param id - Organization ID to move
   * @param newParentId - New parent organization ID
   * @returns Updated organization
   */
  move(id: number, newParentId: number): Promise<Organization>;
}

// ============================================================================
// Repository Factory
// ============================================================================

/**
 * Create Organization Repository
 * 
 * Factory function that creates an OrganizationRepository instance using the provided HttpCapability.
 * 
 * @param http - HttpCapability instance from runtime
 * @returns OrganizationRepository instance
 * 
 * @example
 * ```tsx
 * const http = useHttp();
 * const repository = createOrganizationRepository(http);
 * const organizations = await repository.getList();
 * ```
 */
export function createOrganizationRepository(http: HttpCapability): OrganizationRepository {
  return {
    /**
     * Get paginated organization list
     */
    async getList(query: OrganizationListQuery = {}): Promise<PaginatedOrganizations> {
      const params = new URLSearchParams();
      
      if (query.page !== undefined) params.append('page', String(query.page));
      if (query.size !== undefined) params.append('size', String(query.size));
      if (query.keyword) params.append('keyword', query.keyword);
      if (query.type) params.append('type', query.type);
      if (query.status) params.append('status', query.status);
      if (query.parentId !== undefined) params.append('parentId', String(query.parentId));
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortDir) params.append('sortDir', query.sortDir);
      
      const url = `${BASE_PATH}?${params.toString()}`;
      const response = await http.get<PaginatedOrganizations>(url);
      return response;
    },
    
    /**
     * Get organization tree structure
     */
    async getTree(rootId?: number): Promise<OrganizationTreeNode[]> {
      const url = rootId
        ? `${BASE_PATH}/tree?rootId=${rootId}`
        : `${BASE_PATH}/tree`;
      const response = await http.get<OrganizationTreeNode[]>(url);
      return response;
    },
    
    /**
     * Get organization by ID
     */
    async getById(id: number): Promise<Organization> {
      const url = `${BASE_PATH}/${id}`;
      const response = await http.get<Organization>(url);
      return response;
    },
    
    /**
     * Get organization by code
     */
    async getByCode(code: string): Promise<Organization> {
      const url = `${BASE_PATH}/code/${code}`;
      const response = await http.get<Organization>(url);
      return response;
    },
    
    /**
     * Create new organization
     */
    async create(params: CreateOrganizationParams): Promise<Organization> {
      const response = await http.post<Organization>(BASE_PATH, params);
      return response;
    },
    
    /**
     * Update organization
     */
    async update(id: number, params: UpdateOrganizationParams): Promise<Organization> {
      const url = `${BASE_PATH}/${id}`;
      const response = await http.put<Organization>(url, params);
      return response;
    },
    
    /**
     * Delete organization
     */
    async delete(id: number): Promise<void> {
      const url = `${BASE_PATH}/${id}`;
      await http.delete<void>(url);
    },
    
    /**
     * Get child organizations
     */
    async getChildren(parentId: number): Promise<Organization[]> {
      const url = `${BASE_PATH}/${parentId}/children`;
      const response = await http.get<Organization[]>(url);
      return response;
    },
    
    /**
     * Get users in organization
     */
    async getUsers(
      organizationId: number,
      query: { page?: number; size?: number } = {}
    ): Promise<{ content: Array<{ id: string; username: string; displayName: string }>; totalElements: number }> {
      const params = new URLSearchParams();
      if (query.page !== undefined) params.append('page', String(query.page));
      if (query.size !== undefined) params.append('size', String(query.size));
      
      const url = `${BASE_PATH}/${organizationId}/users?${params.toString()}`;
      const response = await http.get<{
        content: Array<{ id: string; username: string; displayName: string }>;
        totalElements: number;
      }>(url);
      return response;
    },
    
    /**
     * Move organization to new parent
     */
    async move(id: number, newParentId: number): Promise<Organization> {
      const url = `${BASE_PATH}/${id}/move`;
      const response = await http.post<Organization>(url, { newParentId });
      return response;
    },
  };
}
