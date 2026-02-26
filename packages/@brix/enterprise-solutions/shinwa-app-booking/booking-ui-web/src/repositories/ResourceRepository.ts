/**
 * @file Resource Repository
 * @description Bookable resource data access layer - Encapsulates all resource-related API interactions
 * @module booking-ui-web/repositories/ResourceRepository
 * @version 3.2.0
 * 
 * [v3.2 Frontend-Backend Separation Architecture]
 * Repository layer responsibilities: Encapsulate backend API call details.
 * 
 * [Architecture Red Line R3 Compliance]
 * All HTTP requests are made through HttpCapability.
 * 
 * @see HttpCapability - Defined in @brix/runtime-sdk-api-web
 */

import type { HttpCapability } from '@brix/runtime-sdk-api-web';
import type { Resource, ResourceType } from 'booking-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Resource query parameters
 */
export interface ResourceQueryParams {
  /** Resource type filter */
  type?: ResourceType;
  /** Whether enabled */
  enabled?: boolean;
  /** Search keyword */
  keyword?: string;
}

/**
 * Create resource parameters
 */
export interface CreateResourceParams {
  /** Resource name */
  name: string;
  /** Resource type */
  type: ResourceType;
  /** Resource description */
  description?: string;
  /** Service duration (minutes) */
  serviceDuration: number;
  /** Avatar/image URL */
  avatarUrl?: string;
  /** Extended attributes */
  metadata?: Record<string, unknown>;
}

/**
 * Update resource parameters
 */
export interface UpdateResourceParams {
  /** Resource name */
  name?: string;
  /** Resource description */
  description?: string;
  /** Service duration (minutes) */
  serviceDuration?: number;
  /** Whether enabled */
  enabled?: boolean;
  /** Avatar/image URL */
  avatarUrl?: string;
  /** Extended attributes */
  metadata?: Record<string, unknown>;
}

/**
 * Resource Repository interface
 */
export interface ResourceRepository {
  /**
   * Get resource list
   * 
   * @param query - Query parameters
   * @returns Resource list
   */
  list(query?: ResourceQueryParams): Promise<Resource[]>;
  
  /**
   * Get available resource list (for booking selection)
   * 
   * @param type - Resource type filter (optional)
   * @returns Enabled resource list
   */
  listAvailable(type?: ResourceType): Promise<Resource[]>;
  
  /**
   * Get resource detail by ID
   * 
   * @param id - Resource ID
   * @returns Resource detail
   */
  getById(id: number): Promise<Resource>;
  
  /**
   * Create resource
   * 
   * @param params - 创建参数
   * @returns 创建的资源
   */
  create(params: CreateResourceParams): Promise<Resource>;
  
  /**
   * 更新资源
   * 
   * @param id - 资源 ID
   * @param params - 更新参数
   * @returns 更新后的资源
   */
  update(id: number, params: UpdateResourceParams): Promise<Resource>;
  
  /**
   * 删除资源
   * 
   * @param id - 资源 ID
   */
  delete(id: number): Promise<void>;
  
  /**
   * 启用资源
   * 
   * @param id - 资源 ID
   * @returns 更新后的资源
   */
  enable(id: number): Promise<Resource>;
  
  /**
   * 禁用资源
   * 
   * @param id - 资源 ID
   * @returns 更新后的资源
   */
  disable(id: number): Promise<Resource>;
}

// ============================================================================
// API 常量
// ============================================================================

/** 资源 API 基础路径 */
const API_BASE = '/api/v1/resources';

// ============================================================================
// Repository 工厂函数
// ============================================================================

/**
 * 创建资源 Repository 实例
 * 
 * @param http - HttpCapability 实例，由 Shell 层提供
 * @returns ResourceRepository 实例
 * 
 * @example
 * ```typescript
 * const http = useHttp();
 * const resourceRepo = useMemo(() => createResourceRepository(http), [http]);
 * const resources = await resourceRepo.listAvailable('DOCTOR');
 * ```
 */
export function createResourceRepository(http: HttpCapability): ResourceRepository {
  return {
    // ========================================================================
    // 查询操作
    // ========================================================================
    
    /**
     * 获取资源列表
     * 
     * 【请求格式】
     * GET /api/v1/resources?type={type}&enabled={enabled}&keyword={keyword}
     */
    async list(query?: ResourceQueryParams): Promise<Resource[]> {
      const params: Record<string, unknown> = {};
      
      if (query?.type) params.type = query.type;
      if (query?.enabled !== undefined) params.enabled = query.enabled;
      if (query?.keyword) params.keyword = query.keyword;
      
      return http.get<Resource[]>(API_BASE, params);
    },
    
    /**
     * 获取可用资源列表
     * 
     * 【请求格式】
     * GET /api/v1/resources/available?type={type}
     */
    async listAvailable(type?: ResourceType): Promise<Resource[]> {
      const params: Record<string, unknown> = {};
      if (type) params.type = type;
      
      return http.get<Resource[]>(`${API_BASE}/available`, params);
    },
    
    /**
     * 根据 ID 获取资源详情
     * 
     * 【请求格式】
     * GET /api/v1/resources/{id}
     */
    async getById(id: number): Promise<Resource> {
      return http.get<Resource>(`${API_BASE}/${id}`);
    },
    
    // ========================================================================
    // 写入操作
    // ========================================================================
    
    /**
     * 创建资源
     * 
     * 【请求格式】
     * POST /api/v1/resources
     * Body: CreateResourceParams
     */
    async create(params: CreateResourceParams): Promise<Resource> {
      return http.post<Resource>(API_BASE, params);
    },
    
    /**
     * 更新资源
     * 
     * 【请求格式】
     * PUT /api/v1/resources/{id}
     * Body: UpdateResourceParams
     */
    async update(id: number, params: UpdateResourceParams): Promise<Resource> {
      return http.put<Resource>(`${API_BASE}/${id}`, params);
    },
    
    /**
     * 删除资源
     * 
     * 【请求格式】
     * DELETE /api/v1/resources/{id}
     */
    async delete(id: number): Promise<void> {
      return http.delete<void>(`${API_BASE}/${id}`);
    },
    
    // ========================================================================
    // 状态变更操作
    // ========================================================================
    
    /**
     * 启用资源
     * 
     * 【请求格式】
     * POST /api/v1/resources/{id}/enable
     */
    async enable(id: number): Promise<Resource> {
      return http.post<Resource>(`${API_BASE}/${id}/enable`);
    },
    
    /**
     * 禁用资源
     * 
     * 【请求格式】
     * POST /api/v1/resources/{id}/disable
     */
    async disable(id: number): Promise<Resource> {
      return http.post<Resource>(`${API_BASE}/${id}/disable`);
    },
  };
}
