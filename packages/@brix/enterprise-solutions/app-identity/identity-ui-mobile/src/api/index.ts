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
 * 身份认证模块 - Mobile API 服务
 *
 * 【v3.0.4 架构红线修复】
 * - 移除所有直接 fetch 调用
 * - 通过 HttpCapability 统一发起 HTTP 请求
 * - 支持依赖注入和能力协议
 *
 * @author Brix Team
 * @since 3.0.0
 * @version 3.0.4
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type { UserDTO, CreateUserRequest, UpdateUserRequest } from '../types';

/**
 * API 基础路径
 */
const API_BASE = '/api/v1/identity/users';

/**
 * 分页响应类型
 */
interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * 用户 API 服务接口
 */
export interface UserApiService {
  /**
   * 分页查询用户列表
   *
   * @param params 查询参数
   * @returns 分页用户列表
   */
  list(params: {
    tenantId: string;
    page?: number;
    size?: number;
    keyword?: string;
    status?: string;
    role?: string;
  }): Promise<PageResponse<UserDTO>>;

  /**
   * 根据用户ID获取用户详情
   *
   * @param userId 用户ID
   * @returns 用户详情
   */
  getByUserId(userId: string): Promise<UserDTO>;

  /**
   * 创建用户
   *
   * @param request 创建请求
   * @returns 创建的用户
   */
  create(request: CreateUserRequest): Promise<UserDTO>;

  /**
   * 更新用户
   *
   * @param userId 用户ID
   * @param request 更新请求
   * @returns 更新后的用户
   */
  update(userId: string, request: UpdateUserRequest): Promise<UserDTO>;

  /**
   * 删除用户
   *
   * @param userId 用户ID
   */
  delete(userId: string): Promise<void>;

  /**
   * 启用用户
   *
   * @param userId 用户ID
   * @param reason 原因
   */
  enable(userId: string, reason?: string): Promise<void>;

  /**
   * 禁用用户
   *
   * @param userId 用户ID
   * @param reason 原因
   */
  disable(userId: string, reason?: string): Promise<void>;

  /**
   * 锁定用户
   *
   * @param userId 用户ID
   * @param reason 原因
   */
  lock(userId: string, reason?: string): Promise<void>;

  /**
   * 解锁用户
   *
   * @param userId 用户ID
   * @param reason 原因
   */
  unlock(userId: string, reason?: string): Promise<void>;

  /**
   * 重置密码
   *
   * @param userId 用户ID
   * @param newPassword 新密码
   */
  resetPassword(userId: string, newPassword: string): Promise<void>;
}

/**
 * 创建用户 API 服务
 *
 * 【架构规范 - 红线 R3】
 * 插件层禁止直接使用 fetch/axios，需通过 HttpCapability 统一发起请求。
 *
 * @param http HttpCapability 实例（通过 RuntimeContext 获取）
 * @returns 用户 API 服务实例
 *
 * @example
 * ```typescript
 * // 在插件初始化时获取 HttpCapability
 * const http = runtimeContext.getCapability<HttpCapability>(HttpCapabilityType);
 * const userApi = createUserApiService(http);
 *
 * // 调用 API
 * const users = await userApi.list({ tenantId: 'tenant-001' });
 * ```
 */
export function createUserApiService(http: HttpCapability): UserApiService {
  return {
    async list(params) {
      return http.get<PageResponse<UserDTO>>(API_BASE, params);
    },

    async getByUserId(userId) {
      return http.get<UserDTO>(`${API_BASE}/${userId}`);
    },

    async create(request) {
      return http.post<UserDTO>(API_BASE, request);
    },

    async update(userId, request) {
      return http.put<UserDTO>(`${API_BASE}/${userId}`, request);
    },

    async delete(userId) {
      await http.delete(`${API_BASE}/${userId}`);
    },

    async enable(userId, reason) {
      await http.post(`${API_BASE}/${userId}/enable`, { reason });
    },

    async disable(userId, reason) {
      await http.post(`${API_BASE}/${userId}/disable`, { reason });
    },

    async lock(userId, reason) {
      await http.post(`${API_BASE}/${userId}/lock`, { reason });
    },

    async unlock(userId, reason) {
      await http.post(`${API_BASE}/${userId}/unlock`, { reason });
    },

    async resetPassword(userId, newPassword) {
      await http.post(`${API_BASE}/${userId}/reset-password`, { newPassword });
    },
  };
}

/**
 * @deprecated 请使用 createUserApiService(http) 替代。
 * 此静态对象违反架构红线 R3（禁止直接 fetch），仅为迁移期兼容保留。
 * 将在 v3.1.0 移除。
 */
export const userApi = {
  async list(_params: {
    tenantId: string;
    page?: number;
    size?: number;
    keyword?: string;
    status?: string;
    role?: string;
  }): Promise<PageResponse<UserDTO>> {
    throw new Error(
      '[架构红线] 禁止直接使用 userApi，请通过 createUserApiService(http) 创建服务实例。' +
        '参考文档: docs/README.md'
    );
  },
  async getByUserId(_userId: string): Promise<UserDTO> {
    throw new Error('[架构红线] 禁止直接使用 userApi');
  },
  async create(_request: CreateUserRequest): Promise<UserDTO> {
    throw new Error('[架构红线] 禁止直接使用 userApi');
  },
  async update(_userId: string, _request: UpdateUserRequest): Promise<UserDTO> {
    throw new Error('[架构红线] 禁止直接使用 userApi');
  },
  async delete(_userId: string): Promise<void> {
    throw new Error('[架构红线] 禁止直接使用 userApi');
  },
  async enable(_userId: string, _reason?: string): Promise<void> {
    throw new Error('[架构红线] 禁止直接使用 userApi');
  },
  async disable(_userId: string, _reason?: string): Promise<void> {
    throw new Error('[架构红线] 禁止直接使用 userApi');
  },
  async lock(_userId: string, _reason?: string): Promise<void> {
    throw new Error('[架构红线] 禁止直接使用 userApi');
  },
  async unlock(_userId: string, _reason?: string): Promise<void> {
    throw new Error('[架构红线] 禁止直接使用 userApi');
  },
  async resetPassword(_userId: string, _newPassword: string): Promise<void> {
    throw new Error('[架构红线] 禁止直接使用 userApi');
  },
};
