/**
 * Messenger Repository - Data Access Layer for Mobile
 * 
 * This module implements the Repository pattern for messaging data access.
 * All HTTP calls are routed through HttpCapability.
 * 
 * @module @shinwa/messenger-ui-mobile/repositories
 * @since 3.1.0
 */

import type { HttpCapability } from '@brix/runtime-sdk-api-mobile';
import type {
  Conversation,
  Message,
  SendMessageRequest,
  ConversationListParams,
  ConversationListResponse,
  MessageListResponse
} from '@shinwa/messenger-shared';

/**
 * Messenger Repository Interface
 * 
 * 消息数据仓库接口
 */
export interface MessengerRepository {
  /**
   * Gets list of conversations
   * @param params - Query parameters
   * @returns Promise resolving to conversation list
   */
  getConversations(params?: ConversationListParams): Promise<ConversationListResponse>;

  /**
   * Gets a single conversation
   * @param conversationId - Conversation ID
   * @returns Promise resolving to conversation details
   */
  getConversation(conversationId: string): Promise<Conversation>;

  /**
   * Gets messages in a conversation
   * @param conversationId - Conversation ID
   * @param beforeId - Load messages before this ID (pagination)
   * @param limit - Number of messages to load
   * @returns Promise resolving to message list
   */
  getMessages(conversationId: string, beforeId?: string, limit?: number): Promise<MessageListResponse>;

  /**
   * Sends a message
   * @param conversationId - Conversation ID
   * @param request - Message data
   * @returns Promise resolving to sent message
   */
  sendMessage(conversationId: string, request: SendMessageRequest): Promise<Message>;

  /**
   * Marks messages as read
   * @param conversationId - Conversation ID
   * @param messageIds - IDs of messages to mark as read
   */
  markAsRead(conversationId: string, messageIds: string[]): Promise<void>;

  /**
   * Creates a new conversation
   * @param participantIds - User IDs to include
   * @param title - Optional conversation title
   * @returns Promise resolving to new conversation
   */
  createConversation(participantIds: string[], title?: string): Promise<Conversation>;
}

/**
 * Creates a MessengerRepository implementation using HttpCapability
 * 
 * 工厂函数通过注入 HttpCapability 创建消息仓库实例
 * 
 * @param httpCapability - The HTTP capability for making API calls
 * @returns MessengerRepository implementation
 */
export function createMessengerRepository(httpCapability: HttpCapability): MessengerRepository {
  const BASE_PATH = '/api/v1/messenger';

  return {
    async getConversations(params?: ConversationListParams): Promise<ConversationListResponse> {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.set('page', String(params.page));
      if (params?.size !== undefined) queryParams.set('size', String(params.size));
      
      const url = queryParams.toString() ? `${BASE_PATH}/conversations?${queryParams}` : `${BASE_PATH}/conversations`;
      return httpCapability.get<ConversationListResponse>(url);
    },

    async getConversation(conversationId: string): Promise<Conversation> {
      return httpCapability.get<Conversation>(`${BASE_PATH}/conversations/${conversationId}`);
    },

    async getMessages(conversationId: string, beforeId?: string, limit: number = 50): Promise<MessageListResponse> {
      const queryParams = new URLSearchParams();
      if (beforeId) queryParams.set('beforeId', beforeId);
      queryParams.set('limit', String(limit));
      
      return httpCapability.get<MessageListResponse>(
        `${BASE_PATH}/conversations/${conversationId}/messages?${queryParams}`
      );
    },

    async sendMessage(conversationId: string, request: SendMessageRequest): Promise<Message> {
      return httpCapability.post<Message>(
        `${BASE_PATH}/conversations/${conversationId}/messages`,
        request
      );
    },

    async markAsRead(conversationId: string, messageIds: string[]): Promise<void> {
      await httpCapability.post<void>(
        `${BASE_PATH}/conversations/${conversationId}/read`,
        { messageIds }
      );
    },

    async createConversation(participantIds: string[], title?: string): Promise<Conversation> {
      return httpCapability.post<Conversation>(
        `${BASE_PATH}/conversations`,
        { participantIds, title }
      );
    }
  };
}
