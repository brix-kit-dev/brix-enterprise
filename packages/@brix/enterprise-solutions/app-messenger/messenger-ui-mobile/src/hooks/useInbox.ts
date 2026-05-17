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
 * Inbox Hook
 *
 * [Three-Layer Separation Architecture]
 * - This Hook belongs to the business logic layer, encapsulates message list retrieval and state management
 * - Calls backend through messageApi (messageApi internally uses HttpCapability)
 * - UI layer (screens/InboxScreen) only needs to call this Hook, no need to know data fetching details
 *
 * @author Brix Team
 * @since 3.0.0
 * @version 3.2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { messageApi } from '../api';
import type { MessageDTO, MessageStatus, PageResponse } from '../types';

/**
 * useInbox parameter options
 */
export interface UseInboxOptions {
  /** Message status filter */
  status?: MessageStatus;
  /** Page size */
  pageSize?: number;
  /** Auto fetch on mount */
  autoFetch?: boolean;
}

/**
 * useInbox return value
 */
export interface UseInboxReturn {
  /** Message list */
  messages: MessageDTO[];
  /** Whether loading */
  loading: boolean;
  /** Whether refreshing */
  refreshing: boolean;
  /** Whether loading more */
  loadingMore: boolean;
  /** Error message */
  error: string | null;
  /** Whether has more data */
  hasMore: boolean;
  /** Unread count */
  unreadCount: number;
  /** Refresh list */
  refresh: () => Promise<void>;
  /** Load more */
  loadMore: () => void;
  /** Mark as read */
  markAsRead: (messageId: string) => Promise<boolean>;
  /** Batch mark as read */
  markAsReadBatch: (messageIds: string[]) => Promise<boolean>;
  /** Mark all as read */
  markAllAsRead: () => Promise<boolean>;
  /** Archive message */
  archive: (messageId: string) => Promise<boolean>;
  /** Delete message */
  deleteMessage: (messageId: string) => Promise<boolean>;
}

/**
 * Inbox Hook
 *
 * @param options Configuration options
 * @returns Inbox state and action methods
 *
 * @example
 * ```tsx
 * function InboxScreen() {
 *   const {
 *     messages,
 *     loading,
 *     refreshing,
 *     refresh,
 *     loadMore,
 *     markAsRead,
 *   } = useInbox({ autoFetch: true });
 *
 *   return (
 *     <FlatList
 *       data={messages}
 *       refreshing={refreshing}
 *       onRefresh={refresh}
 *       onEndReached={loadMore}
 *     />
 *   );
 * }
 * ```
 */
export function useInbox(options: UseInboxOptions = {}): UseInboxReturn {
  const { status, pageSize = 20, autoFetch = true } = options;

  // State
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * Fetch message list
   */
  const fetchMessages = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
        setPage(0);
      } else if (page === 0) {
        setLoading(true);
      }

      setError(null);

      try {
        const response: PageResponse<MessageDTO> = await messageApi.getInbox({
          status,
          page: isRefresh ? 0 : page,
          size: pageSize,
        });

        if (isRefresh || page === 0) {
          setMessages(response.content);
        } else {
          setMessages((prev) => [...prev, ...response.content]);
        }

        setHasMore(response.number < response.totalPages - 1);

        // 获取未读数量
        const count = await messageApi.getUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load message list');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [status, page, pageSize]
  );

  /**
   * Refresh list
   */
  const refresh = useCallback(async () => {
    await fetchMessages(true);
  }, [fetchMessages]);

  /**
   * Load more
   */
  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    setPage((prev) => prev + 1);
  }, [hasMore, loadingMore, loading]);

  /**
   * Mark as read
   */
  const markAsRead = useCallback(
    async (messageId: string): Promise<boolean> => {
      try {
        await messageApi.markAsRead(messageId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, status: 'READ' as MessageStatus } : m
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to mark as read');
        return false;
      }
    },
    []
  );

  /**
   * Batch mark as read
   */
  const markAsReadBatch = useCallback(
    async (messageIds: string[]): Promise<boolean> => {
      try {
        await messageApi.markAsReadBatch(messageIds);
        setMessages((prev) =>
          prev.map((m) =>
            messageIds.includes(m.id!) ? { ...m, status: 'READ' as MessageStatus } : m
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - messageIds.length));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to batch mark as read');
        return false;
      }
    },
    []
  );

  /**
   * Mark all as read
   */
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      await messageApi.markAllAsRead();
      setMessages((prev) =>
        prev.map((m) => ({ ...m, status: 'READ' as MessageStatus }))
      );
      setUnreadCount(0);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
      return false;
    }
  }, []);

  /**
   * Archive message
   */
  const archive = useCallback(
    async (messageId: string): Promise<boolean> => {
      try {
        await messageApi.archive(messageId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to archive message');
        return false;
      }
    },
    []
  );

  /**
   * Delete message
   */
  const deleteMessage = useCallback(
    async (messageId: string): Promise<boolean> => {
      try {
        await messageApi.delete(messageId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete message');
        return false;
      }
    },
    []
  );

  // Auto load
  useEffect(() => {
    if (autoFetch) {
      fetchMessages();
    }
  }, [autoFetch, page]);

  return {
    messages,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    unreadCount,
    refresh,
    loadMore,
    markAsRead,
    markAsReadBatch,
    markAllAsRead,
    archive,
    deleteMessage,
  };
}
