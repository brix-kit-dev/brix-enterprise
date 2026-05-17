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
 * @file Case 模块 Repository（Mobile）
 * @description 数据访问层 — 封装 API 调用
 * @module @brix-sdk/enterprise-case-ui-mobile
 * @version 3.0.0-SNAPSHOT
 *
 * 由 @brix-sdk/create-brix 2026-02-23 自动生成
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

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-mobile';
import type { CaseDTO, PagedResponse } from '@brix-sdk/enterprise-case-shared';
import { CASE_API } from '@brix-sdk/enterprise-case-shared/constants';

/**
 * Case 模块 Repository
 */
export interface CaseRepository {
  /**
   * 获取分页列表
   */
  list(params?: { page?: number; size?: number }): Promise<PagedResponse<CaseDTO>>;

  /**
   * 根据 ID 获取详情
   */
  getById(id: number): Promise<CaseDTO>;
}

/**
 * 创建 Case 模块 Repository 实例
 *
 * @param runtimeContext RuntimeContext 实例
 * @returns Repository 实例
 */
export function createCaseRepository(http: HttpCapability): CaseRepository {
  return {
    /**
     * 获取分页列表
     */
    async list(params?: { page?: number; size?: number }): Promise<PagedResponse<CaseDTO>> {
      const response = await http.request<PagedResponse<CaseDTO>>({
        url: CASE_API.LIST,
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
    async getById(id: number): Promise<CaseDTO> {
      const response = await http.request<CaseDTO>({
        url: CASE_API.DETAIL(id),
        method: 'GET',
      });
      return response.data;
    },
  };
}
