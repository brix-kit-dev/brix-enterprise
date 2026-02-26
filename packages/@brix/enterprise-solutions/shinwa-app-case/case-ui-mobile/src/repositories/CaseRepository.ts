/**
 * @file Case 模块 Repository（Mobile）
 * @description 数据访问层 — 封装 API 调用
 * @module @shinwa/case-ui-mobile
 * @version 3.0.0-SNAPSHOT
 *
 * 由 @brix/create-brix 2026-02-23 自动生成
 *
 * 【设计说明】
 * Repository 层封装所有数据访问逻辑：
 * 1. 调用 HttpCapability 发起 HTTP 请求
 * 2. 数据格式转换
 * 3. 错误处理
 *
 * 【架构红线 R3 合规】
 * - 所有 HTTP 请求通过 HttpCapability 发起
 * - 禁止直接使用 fetch/axios
 */

import type { RuntimeContext, HttpCapability } from '@brix/runtime-sdk-api-mobile';
import type { Case, PagedResponse } from '@shinwa/case-shared';
import { API_ENDPOINTS } from '@shinwa/case-shared/constants';

/**
 * Case 模块 Repository
 */
export interface CaseRepository {
  /**
   * 获取分页列表
   */
  list(params?: { page?: number; size?: number }): Promise<PagedResponse<Case>>;

  /**
   * 根据 ID 获取详情
   */
  getById(id: number): Promise<Case>;
}

/**
 * 创建 Case 模块 Repository 实例
 *
 * @param runtimeContext RuntimeContext 实例
 * @returns Repository 实例
 */
export function createCaseRepository(runtimeContext: RuntimeContext): CaseRepository {
  const http = runtimeContext.getCapability<HttpCapability>('HttpCapability');

  if (!http) {
    throw new Error('[case-ui-mobile] HttpCapability 不可用');
  }

  return {
    /**
     * 获取分页列表
     */
    async list(params?: { page?: number; size?: number }): Promise<PagedResponse<Case>> {
      const response = await http.request<PagedResponse<Case>>({
        url: API_ENDPOINTS.LIST,
        method: 'GET',
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
        },
      });
      return response.data;
    },

    /**
     * 根据 ID 获取详情
     */
    async getById(id: number): Promise<Case> {
      const response = await http.request<Case>({
        url: API_ENDPOINTS.DETAIL(id),
        method: 'GET',
      });
      return response.data;
    },
  };
}
