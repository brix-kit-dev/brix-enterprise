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
 * 消息通知模块 - Web API 服务
 * 
 * 【架构红线 R3 合规 - v3.2】
 * 本模块严格遵循 v3.0 架构设计蓝图 §7.1 的规定：
 * 「插件层禁止直接使用 axios / fetch 等 HTTP 客户端库，需通过 HttpCapability 统一发起请求。」
 * 
 * 【能力注入模式】
 * 使用 setHttpCapability() 在模块初始化时注入 HttpCapability 实例。
 * 此设计保证：
 * 1. 插件与 HTTP 实现解耦（Shell 可替换 fetch/axios 等实现）
 * 2. 自动获得 Shell 层的 Token 注入、重试策略等增强功能
 * 3. 统一的错误处理和拦截机制
 * 
 * @author Brix Team
 * @since 3.0.0
 * @version 3.2.0 - 架构红线 R3 合规改造
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type { MessageDTO, MessageStatus, SendMessageRequest } from '../types';
import { API_BASE } from '../types';

// ==================== 能力管理 ====================

/**
 * HTTP 能力实例
 * 由 Shell 层在插件激活时通过 setHttpCapability() 注入
 */
let httpCapability: HttpCapability | null = null;

/**
 * 注入 HTTP 能力实例
 * 
 * 【调用时机】插件激活阶段，由 Shell 或 Plugin Bootstrap 调用
 * 
 * @param capability - Shell 层提供的 HttpCapability 实现
 * @throws 如果传入 null 或 undefined 将抛出错误
 */
export function setHttpCapability(capability: HttpCapability): void {
  if (!capability) {
    throw new Error('[messenger-ui-web] HttpCapability 不能为 null');
  }
  httpCapability = capability;
}

/**
 * 获取 HTTP 能力实例（内部使用）
 * 
 * @returns HttpCapability 实例
 * @throws 如果能力未初始化将抛出明确的错误提示
 */
function getHttp(): HttpCapability {
  if (!httpCapability) {
    throw new Error(
      '[messenger-ui-web] HttpCapability 未初始化，' +
      '请确保在插件激活时调用 setHttpCapability(capability)'
    );
  }
  return httpCapability;
}

// ==================== 类型定义 ====================

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

// ==================== API 服务 ====================

/**
 * 消息 API 服务
 * 
 * 所有方法均通过 HttpCapability 发起请求，符合架构红线 R3 要求。
 */
export const messageApi = {
  /**
   * 发送消息
   * 
   * @param request - 发送请求
   * @returns 发送的消息
   */
  async send(request: SendMessageRequest): Promise<MessageDTO> {
    return getHttp().post<MessageDTO>(API_BASE, request);
  },

  /**
   * 根据消息 ID 获取详情
   * 
   * @param messageId - 消息 ID
   * @returns 消息详情
   */
  async getById(messageId: string): Promise<MessageDTO> {
    return getHttp().get<MessageDTO>(`${API_BASE}/${messageId}`);
  },

  /**
   * 获取收件箱列表
   * 
   * @param params - 查询参数
   * @param params.page - 页码
   * @param params.size - 每页大小
   * @param params.status - 消息状态筛选
   * @returns 消息分页列表
   */
  async getInbox(params: {
    page?: number;
    size?: number;
    status?: MessageStatus;
  }): Promise<PageResponse<MessageDTO>> {
    const queryParams: Record<string, unknown> = {};
    if (params.page !== undefined) queryParams.page = params.page;
    if (params.size !== undefined) queryParams.size = params.size;
    if (params.status) queryParams.status = params.status;
    
    return getHttp().get<PageResponse<MessageDTO>>(`${API_BASE}/inbox`, queryParams);
  },

  /**
   * 获取发件箱列表
   * 
   * @param params - 查询参数
   * @param params.page - 页码
   * @param params.size - 每页大小
   * @returns 消息分页列表
   */
  async getOutbox(params: {
    page?: number;
    size?: number;
  }): Promise<PageResponse<MessageDTO>> {
    const queryParams: Record<string, unknown> = {};
    if (params.page !== undefined) queryParams.page = params.page;
    if (params.size !== undefined) queryParams.size = params.size;
    
    return getHttp().get<PageResponse<MessageDTO>>(`${API_BASE}/outbox`, queryParams);
  },

  /**
   * 标记消息为已读
   * 
   * @param messageId - 消息 ID
   */
  async markAsRead(messageId: string): Promise<void> {
    return getHttp().post<void>(`${API_BASE}/${messageId}/read`);
  },

  /**
   * 批量标记为已读
   * 
   * @param messageIds - 消息 ID 列表
   */
  async markAsReadBatch(messageIds: string[]): Promise<void> {
    return getHttp().post<void>(`${API_BASE}/read-batch`, messageIds);
  },

  /**
   * 全部标记为已读
   */
  async markAllAsRead(): Promise<void> {
    return getHttp().post<void>(`${API_BASE}/read-all`);
  },

  /**
   * 归档消息
   * 
   * @param messageId - 消息 ID
   */
  async archive(messageId: string): Promise<void> {
    return getHttp().post<void>(`${API_BASE}/${messageId}/archive`);
  },

  /**
   * 删除消息
   * 
   * @param messageId - 消息 ID
   */
  async delete(messageId: string): Promise<void> {
    return getHttp().delete<void>(`${API_BASE}/${messageId}`);
  },

  /**
   * 获取未读消息数量
   * 
   * @returns 未读数量
   */
  async getUnreadCount(): Promise<number> {
    const data = await getHttp().get<{ count: number }>(`${API_BASE}/unread-count`);
    return data.count;
  },
};
