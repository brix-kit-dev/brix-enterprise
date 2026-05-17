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
 * User identity module API service
 * 
 * Architecture Red Line R3 Compliance:
 * This module strictly follows the v3.0 Architecture Design Blueprint §7.1:
 * "Plugin layer must not directly use axios/fetch or other HTTP client libraries;
 * requests must be made through HttpCapability."
 * 
 * Capability Injection Pattern:
 * Use setHttpCapability() to inject HttpCapability instance during module initialization.
 * All API methods obtain capability instance via getHttp() to make requests.
 * This design ensures:
 * 1. Plugin decoupled from HTTP implementation (Shell can replace with fetch/axios etc.)
 * 2. Automatic access to Shell layer's Token injection, retry policies, and other enhancements
 * 3. Unified error handling and interception mechanism
 * 
 * @author Brix Team
 * @since 3.0.0
 * @see HttpCapability - Defined in @brix-sdk/runtime-sdk-api-web
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type { UserDTO, CreateUserRequest, UpdateUserRequest, PageResponse } from '../types';

// ==================== Capability Management ====================

/**
 * HTTP capability instance
 * Injected by Shell layer during plugin activation via setHttpCapability()
 */
let httpCapability: HttpCapability | null = null;

/**
 * Inject HTTP capability instance
 * 
 * Invocation Timing: Plugin activation phase, called by Shell or Plugin Bootstrap
 * 
 * @param capability - HttpCapability implementation provided by Shell layer
 * @throws Error if null or undefined is passed
 */
export function setHttpCapability(capability: HttpCapability): void {
  if (!capability) {
    throw new Error('[identity-ui-web] HttpCapability cannot be null');
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
      '[identity-ui-web] HttpCapability not initialized, ' +
      'ensure setHttpCapability(capability) is called during plugin activation'
    );
  }
  return httpCapability;
}

// ==================== API Constants ====================

/** API base path — '/api' prefix provided by HttpCapability baseURL */
const API_BASE = '/v1/users';

// ==================== API Service ====================

/**
 * User API service
 * 
 * All methods make requests through HttpCapability, complying with Architecture Red Line R3.
 */
export const userApi = {
  /**
   * Get user list (paginated)
   * 
   * @param params - Query parameters
   * @param params.page - Page number (0-based)
   * @param params.size - Page size
   * @param params.keyword - Search keyword
   * @returns Paginated user list
   */
  async list(params?: { page?: number; size?: number; keyword?: string }): Promise<PageResponse<UserDTO>> {
    const queryParams: Record<string, unknown> = {};
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.size !== undefined) queryParams.size = params.size;
    if (params?.keyword) queryParams.keyword = params.keyword;
    
    return getHttp().get<PageResponse<UserDTO>>(API_BASE, queryParams);
  },

  /**
   * Get user details by primary key ID
   * 
   * @param id - User primary key ID
   * @returns User details
   */
  async getById(id: number): Promise<UserDTO> {
    return getHttp().get<UserDTO>(`${API_BASE}/${id}`);
  },

  /**
   * Get user details by user ID (business unique identifier)
   * 
   * @param userId - User business ID
   * @returns User details
   */
  async getByUserId(userId: string): Promise<UserDTO> {
    return getHttp().get<UserDTO>(`${API_BASE}/by-user-id/${userId}`);
  },

  /**
   * Create user
   * 
   * @param request - Create user request
   * @returns Successfully created user information
   */
  async create(request: CreateUserRequest): Promise<UserDTO> {
    return getHttp().post<UserDTO>(API_BASE, request);
  },

  /**
   * Update user information
   * 
   * @param userId - User ID
   * @param request - Update request
   * @returns Updated user information
   */
  async update(userId: string, request: UpdateUserRequest): Promise<UserDTO> {
    return getHttp().put<UserDTO>(`${API_BASE}/${userId}`, request);
  },

  /**
   * Delete user
   * 
   * @param userId - User ID
   */
  async delete(userId: string): Promise<void> {
    return getHttp().delete<void>(`${API_BASE}/${userId}`);
  },

  /**
   * Enable user account
   * 
   * @param userId - User ID
   * @param reason - Enable reason (optional, for audit log)
   */
  async enable(userId: string, reason?: string): Promise<void> {
    return getHttp().post<void>(`${API_BASE}/${userId}/enable`, { reason });
  },

  /**
   * Disable user account
   * 
   * @param userId - User ID
   * @param reason - Disable reason (will be recorded in audit log)
   */
  async disable(userId: string, reason?: string): Promise<void> {
    return getHttp().post<void>(`${API_BASE}/${userId}/disable`, { reason });
  },

  /**
   * Lock user account
   * 
   * @param userId - User ID
   * @param reason - Lock reason
   */
  async lock(userId: string, reason?: string): Promise<void> {
    return getHttp().post<void>(`${API_BASE}/${userId}/lock`, { reason });
  },

  /**
   * Unlock user account
   * 
   * @param userId - User ID
   * @param reason - Unlock reason (optional)
   */
  async unlock(userId: string, reason?: string): Promise<void> {
    return getHttp().post<void>(`${API_BASE}/${userId}/unlock`, { reason });
  },

  /**
   * Reset user password
   * 
   * @param userId - User ID
   * @param newPassword - New password
   */
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    return getHttp().post<void>(`${API_BASE}/${userId}/reset-password`, { newPassword });
  },
};
