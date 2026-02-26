/**
 * Message Module API Service
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */

import type { MessageDTO, SendMessageRequest, PageResponse, MessageStatus } from '../types';

// API base path
const API_BASE = '/api/v1/messenger/messages';

/**
 * HTTP client interface
 */
interface HttpClient {
  get<T>(url: string, params?: Record<string, any>): Promise<T>;
  post<T>(url: string, data?: any): Promise<T>;
  delete<T>(url: string): Promise<T>;
}

// HTTP client instance (injected by Shell)
let httpClient: HttpClient | null = null;

/**
 * Set HTTP client
 */
export function setHttpClient(client: HttpClient): void {
  httpClient = client;
}

/**
 * Get HTTP client
 */
function getClient(): HttpClient {
  if (!httpClient) {
    throw new Error('HTTP client not initialized. Call setHttpClient first.');
  }
  return httpClient;
}

/**
 * Message API service
 */
export const messageApi = {
  /**
   * Send message
   */
  async send(request: SendMessageRequest): Promise<MessageDTO> {
    return getClient().post<MessageDTO>(API_BASE, request);
  },

  /**
   * Get message detail
   */
  async getById(messageId: string): Promise<MessageDTO | null> {
    try {
      return await getClient().get<MessageDTO>(`${API_BASE}/${messageId}`);
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  },

  /**
   * Get inbox list
   */
  async getInbox(params: {
    status?: MessageStatus;
    page?: number;
    size?: number;
  } = {}): Promise<PageResponse<MessageDTO>> {
    return getClient().get<PageResponse<MessageDTO>>(`${API_BASE}/inbox`, {
      status: params.status,
      page: params.page ?? 0,
      size: params.size ?? 20,
    });
  },

  /**
   * Get outbox list
   */
  async getOutbox(params: {
    page?: number;
    size?: number;
  } = {}): Promise<PageResponse<MessageDTO>> {
    return getClient().get<PageResponse<MessageDTO>>(`${API_BASE}/outbox`, {
      page: params.page ?? 0,
      size: params.size ?? 20,
    });
  },

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    await getClient().post<void>(`${API_BASE}/${messageId}/read`);
  },

  /**
   * Batch mark as read
   */
  async markAsReadBatch(messageIds: string[]): Promise<void> {
    await getClient().post<void>(`${API_BASE}/read-batch`, messageIds);
  },

  /**
   * Mark all as read
   */
  async markAllAsRead(): Promise<void> {
    await getClient().post<void>(`${API_BASE}/read-all`);
  },

  /**
   * Archive message
   */
  async archive(messageId: string): Promise<void> {
    await getClient().post<void>(`${API_BASE}/${messageId}/archive`);
  },

  /**
   * Delete message
   */
  async delete(messageId: string): Promise<void> {
    await getClient().delete<void>(`${API_BASE}/${messageId}`);
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    const result = await getClient().get<{ count: number }>(`${API_BASE}/unread-count`);
    return result.count;
  },
};
