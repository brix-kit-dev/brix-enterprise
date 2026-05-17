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
 * @file User Repository
 * @description User data access layer - encapsulates all user-related API interactions
 * @module identity-ui-web/repositories/UserRepository
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * Repository layer responsibilities:
 * 1. Encapsulate backend API call details
 * 2. Data format conversion (if needed)
 * 3. Error handling standardization
 * 
 * Architecture Red Line R3 Compliance:
 * All HTTP requests are made through HttpCapability, not directly using fetch/axios.
 * 
 * Change Isolation:
 * When backend API changes (such as path, parameter format, response structure),
 * only this file needs modification; ViewModel and UI layers remain unchanged.
 * 
 * @see HttpCapability - Defined in @brix-sdk/runtime-sdk-api-web
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type { 
  User, 
  CreateUserParams, 
  UpdateUserParams,
  UserListQuery,
  PagedResponse,
} from 'identity-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * User list query parameters (Repository layer)
 * 
 * Consistent with identity-shared's UserListQuery,
 * provides more explicit optional parameter types.
 */
export interface UserQueryParams {
  /** Page number (0-based) */
  page?: number;
  /** Page size */
  size?: number;
  /** Search keyword (username, email, phone) */
  keyword?: string;
  /** Status filter */
  status?: string;
  /** Role filter */
  role?: string;
}

/**
 * User Repository interface
 * 
 * Defines user data access contract for easy mocking in tests.
 */
export interface UserRepository {
  /**
   * Get paginated user list
   * 
   * @param query - Query parameters
   * @returns User paginated response
   */
  list(query?: UserQueryParams): Promise<PagedResponse<User>>;
  
  /**
   * Get user details by ID
   * 
   * @param userId - User ID (business ID)
   * @returns User details
   */
  getById(userId: string): Promise<User>;
  
  /**
   * Create user
   * 
   * @param params - Creation parameters
   * @returns Created user
   */
  create(params: CreateUserParams): Promise<User>;
  
  /**
   * Update user
   * 
   * @param userId - User ID
   * @param params - Update parameters
   * @returns Updated user
   */
  update(userId: string, params: UpdateUserParams): Promise<User>;
  
  /**
   * Delete user
   * 
   * @param userId - User ID
   */
  delete(userId: string): Promise<void>;
  
  /**
   * Enable user
   * 
   * @param userId - User ID
   * @param reason - Enable reason (optional, for audit)
   */
  enable(userId: string, reason?: string): Promise<void>;
  
  /**
   * Disable user
   * 
   * @param userId - User ID
   * @param reason - Disable reason (will be recorded in audit log)
   */
  disable(userId: string, reason?: string): Promise<void>;
  
  /**
   * Lock user
   * 
   * @param userId - User ID
   * @param reason - Lock reason
   */
  lock(userId: string, reason?: string): Promise<void>;
  
  /**
   * Unlock user
   * 
   * @param userId - User ID
   * @param reason - Unlock reason (optional)
   */
  unlock(userId: string, reason?: string): Promise<void>;
  
  /**
   * Reset user password
   * 
   * @param userId - User ID
   * @param newPassword - New password
   */
  resetPassword(userId: string, newPassword: string): Promise<void>;
}

// ============================================================================
// API Constants
// ============================================================================

/** User API base path — '/api' prefix provided by HttpCapability baseURL */
const API_BASE = '/v1/users';

// ============================================================================
// Repository Factory Function
// ============================================================================

/**
 * Create User Repository instance
 * 
 * Factory Pattern:
 * Using factory function instead of class for:
 * 1. Dependency injection (passing HttpCapability via parameter)
 * 2. Unit testing (can pass mock HttpCapability)
 * 3. Functional composition
 * 
 * @param http - HttpCapability instance provided by Shell layer
 * @returns UserRepository instance
 * 
 * @example
 * ```typescript
 * // Usage in ViewModel Hook
 * const http = useHttp();
 * const userRepo = useMemo(() => createUserRepository(http), [http]);
 * const users = await userRepo.list({ page: 0, size: 10 });
 * ```
 */
export function createUserRepository(http: HttpCapability): UserRepository {
  return {
    // ========================================================================
    // Query Operations
    // ========================================================================
    
    /**
     * Get paginated user list
     * 
     * Request Format:
     * GET /api/v1/users?page={page}&size={size}&keyword={keyword}
     * 
     * Response Format:
     * PagedResponse<User>
     */
    async list(query?: UserQueryParams): Promise<PagedResponse<User>> {
      const params: Record<string, unknown> = {};
      
      if (query?.page !== undefined) params.page = query.page;
      if (query?.size !== undefined) params.size = query.size;
      if (query?.keyword) params.keyword = query.keyword;
      if (query?.status) params.status = query.status;
      if (query?.role) params.role = query.role;
      
      return http.get<PagedResponse<User>>(API_BASE, params);
    },
    
    /**
     * Get user details by ID
     * 
     * Request Format:
     * GET /api/v1/users/{userId}
     */
    async getById(userId: string): Promise<User> {
      return http.get<User>(`${API_BASE}/${userId}`);
    },
    
    // ========================================================================
    // Write Operations
    // ========================================================================
    
    /**
     * Create user
     * 
     * Request Format:
     * POST /api/v1/users
     * Body: CreateUserParams
     */
    async create(params: CreateUserParams): Promise<User> {
      return http.post<User>(API_BASE, params);
    },
    
    /**
     * Update user
     * 
     * Request Format:
     * PUT /api/v1/users/{userId}
     * Body: UpdateUserParams
     */
    async update(userId: string, params: UpdateUserParams): Promise<User> {
      return http.put<User>(`${API_BASE}/${userId}`, params);
    },
    
    /**
     * Delete user
     * 
     * Request Format:
     * DELETE /api/v1/users/{userId}
     */
    async delete(userId: string): Promise<void> {
      return http.delete<void>(`${API_BASE}/${userId}`);
    },
    
    // ========================================================================
    // Status Change Operations
    // ========================================================================
    
    /**
     * Enable user
     * 
     * Request Format:
     * POST /api/v1/users/{userId}/enable
     * Body: { reason?: string }
     */
    async enable(userId: string, reason?: string): Promise<void> {
      return http.post<void>(`${API_BASE}/${userId}/enable`, { reason });
    },
    
    /**
     * Disable user
     * 
     * Request Format:
     * POST /api/v1/users/{userId}/disable
     * Body: { reason?: string }
     */
    async disable(userId: string, reason?: string): Promise<void> {
      return http.post<void>(`${API_BASE}/${userId}/disable`, { reason });
    },
    
    /**
     * Lock user
     * 
     * Request Format:
     * POST /api/v1/users/{userId}/lock
     * Body: { reason?: string }
     */
    async lock(userId: string, reason?: string): Promise<void> {
      return http.post<void>(`${API_BASE}/${userId}/lock`, { reason });
    },
    
    /**
     * Unlock user
     * 
     * Request Format:
     * POST /api/v1/users/{userId}/unlock
     * Body: { reason?: string }
     */
    async unlock(userId: string, reason?: string): Promise<void> {
      return http.post<void>(`${API_BASE}/${userId}/unlock`, { reason });
    },
    
    /**
     * Reset password
     * 
     * Request Format:
     * POST /api/v1/users/{userId}/reset-password
     * Body: { newPassword: string }
     */
    async resetPassword(userId: string, newPassword: string): Promise<void> {
      return http.post<void>(`${API_BASE}/${userId}/reset-password`, { newPassword });
    },
  };
}
