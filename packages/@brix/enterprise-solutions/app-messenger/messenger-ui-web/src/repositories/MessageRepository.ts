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
 * @file Message Repository
 * @description Message data access layer, encapsulates all message-related API calls
 * @module messenger-ui-web/repositories/MessageRepository
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * Repository layer is the data access layer, responsible for:
 * 1. Encapsulating HTTP request details
 * 2. Providing type-safe API methods
 * 3. Handling request parameter and response data transformation
 * 
 * Architecture Red Line R3 Compliance:
 * All HTTP requests are made through HttpCapability, direct use of axios/fetch is prohibited
 * 
 * @see v3.0-Runtime-Shell-Architecture-Blueprint.md §7.1
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type { MessageDTO, MessageStatus, SendMessageRequest } from '../types';
import { API_BASE } from '../types';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Message page response
 */
export interface MessagePageResponse {
  /** Message list */
  content: MessageDTO[];
  /** Total records */
  totalElements: number;
  /** Total pages */
  totalPages: number;
  /** Current page number */
  number: number;
  /** Page size */
  size: number;
}

/**
 * Inbox query parameters
 */
export interface InboxQueryParams {
  /** Page number (starts from 0) */
  page?: number;
  /** Page size */
  size?: number;
  /** Status filter */
  status?: MessageStatus;
}

/**
 * Outbox query parameters
 */
export interface OutboxQueryParams {
  /** Page number (starts from 0) */
  page?: number;
  /** Page size */
  size?: number;
}

/**
 * Message Repository interface definition
 */
export interface MessageRepository {
  /**
   * Send message
   * @param request - Send message request
   * @returns Sent message
   */
  send(request: SendMessageRequest): Promise<MessageDTO>;
  
  /**
   * Get message details
   * @param messageId - Message ID
   * @returns Message details
   */
  getById(messageId: string): Promise<MessageDTO>;
  
  /**
   * Get inbox list
   * @param params - Query parameters
   * @returns Message page list
   */
  getInbox(params: InboxQueryParams): Promise<MessagePageResponse>;
  
  /**
   * Get outbox list
   * @param params - Query parameters
   * @returns Message page list
   */
  getOutbox(params: OutboxQueryParams): Promise<MessagePageResponse>;
  
  /**
   * Mark message as read
   * @param messageId - Message ID
   */
  markAsRead(messageId: string): Promise<void>;
  
  /**
   * Batch mark as read
   * @param messageIds - Message ID list
   */
  markAsReadBatch(messageIds: string[]): Promise<void>;
  
  /**
   * Mark all as read
   */
  markAllAsRead(): Promise<void>;
  
  /**
   * Archive message
   * @param messageId - Message ID
   */
  archive(messageId: string): Promise<void>;
  
  /**
   * Delete message
   * @param messageId - Message ID
   */
  delete(messageId: string): Promise<void>;
  
  /**
   * Get unread message count
   * @returns Unread count
   */
  getUnreadCount(): Promise<number>;
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create Message Repository instance
 * 
 * Usage:
 * ```typescript
 * const http = useHttp();
 * const messageRepo = createMessageRepository(http);
 * const inbox = await messageRepo.getInbox({ page: 0, size: 10 });
 * ```
 * 
 * @param http - HttpCapability instance provided by Shell layer
 * @returns MessageRepository instance
 */
export function createMessageRepository(http: HttpCapability): MessageRepository {
  return {
    /**
     * 发送消息
     */
    async send(request: SendMessageRequest): Promise<MessageDTO> {
      return http.post<MessageDTO>(API_BASE, request);
    },
    
    /**
     * 获取消息详情
     */
    async getById(messageId: string): Promise<MessageDTO> {
      return http.get<MessageDTO>(`${API_BASE}/${messageId}`);
    },
    
    /**
     * 获取收件箱列表
     */
    async getInbox(params: InboxQueryParams): Promise<MessagePageResponse> {
      const queryParams: Record<string, unknown> = {};
      if (params.page !== undefined) queryParams.page = params.page;
      if (params.size !== undefined) queryParams.size = params.size;
      if (params.status) queryParams.status = params.status;
      
      return http.get<MessagePageResponse>(`${API_BASE}/inbox`, queryParams);
    },
    
    /**
     * 获取发件箱列表
     */
    async getOutbox(params: OutboxQueryParams): Promise<MessagePageResponse> {
      const queryParams: Record<string, unknown> = {};
      if (params.page !== undefined) queryParams.page = params.page;
      if (params.size !== undefined) queryParams.size = params.size;
      
      return http.get<MessagePageResponse>(`${API_BASE}/outbox`, queryParams);
    },
    
    /**
     * 标记消息为已读
     */
    async markAsRead(messageId: string): Promise<void> {
      return http.post<void>(`${API_BASE}/${messageId}/read`);
    },
    
    /**
     * 批量标记为已读
     */
    async markAsReadBatch(messageIds: string[]): Promise<void> {
      return http.post<void>(`${API_BASE}/read-batch`, messageIds);
    },
    
    /**
     * 全部标记为已读
     */
    async markAllAsRead(): Promise<void> {
      return http.post<void>(`${API_BASE}/read-all`);
    },
    
    /**
     * 归档消息
     */
    async archive(messageId: string): Promise<void> {
      return http.post<void>(`${API_BASE}/${messageId}/archive`);
    },
    
    /**
     * 删除消息
     */
    async delete(messageId: string): Promise<void> {
      return http.delete<void>(`${API_BASE}/${messageId}`);
    },
    
    /**
     * 获取未读消息数量
     */
    async getUnreadCount(): Promise<number> {
      const data = await http.get<{ count: number }>(`${API_BASE}/unread-count`);
      return data.count;
    },
  };
}
