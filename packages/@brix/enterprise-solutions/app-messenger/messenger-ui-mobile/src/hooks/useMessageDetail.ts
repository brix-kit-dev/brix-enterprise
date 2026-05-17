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
 * Message Detail Hook
 *
 * [Three-Layer Separation Architecture]
 * - This Hook belongs to the business logic layer, encapsulates message detail retrieval and state management
 * - Calls backend through messageApi (messageApi internally uses HttpCapability)
 * - UI layer (screens/MessageDetailScreen) only needs to call this Hook, no need to know data fetching details
 *
 * @author Brix Team
 * @since 3.0.0
 * @version 3.2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { messageApi } from '../api';
import type { MessageDTO } from '../types';

/**
 * useMessageDetail return value
 */
export interface UseMessageDetailReturn {
  /** Message detail */
  message: MessageDTO | null;
  /** Whether loading */
  loading: boolean;
  /** Whether action in progress */
  actionLoading: boolean;
  /** Error message */
  error: string | null;
  /** Refresh detail */
  refresh: () => Promise<void>;
  /** Mark as read */
  markAsRead: () => Promise<boolean>;
  /** Archive message */
  archive: () => Promise<boolean>;
  /** Delete message */
  deleteMessage: () => Promise<boolean>;
}

/**
 * Message Detail Hook
 *
 * @param messageId Message ID
 * @returns Message detail state and action methods
 *
 * @example
 * ```tsx
 * function MessageDetailScreen({ messageId }: { messageId: string }) {
 *   const {
 *     message,
 *     loading,
 *     actionLoading,
 *     archive,
 *     deleteMessage,
 *   } = useMessageDetail(messageId);
 *
 *   if (loading) return <ActivityIndicator />;
 *   if (!message) return <Text>消息不存在</Text>;
 *
 *   return <MessageDetailView message={message} />;
 * }
 * ```
 */
export function useMessageDetail(messageId: string): UseMessageDetailReturn {
  // State
  const [message, setMessage] = useState<MessageDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch message detail
   */
  const fetchMessage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await messageApi.getById(messageId);
      if (data) {
        setMessage(data);
        // Auto mark as read
        if (data.status === 'UNREAD') {
          await messageApi.markAsRead(messageId);
          setMessage({ ...data, status: 'READ' as any });
        }
      } else {
        setError('Message does not exist');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load message detail');
    } finally {
      setLoading(false);
    }
  }, [messageId]);

  /**
   * Refresh detail
   */
  const refresh = useCallback(async () => {
    await fetchMessage();
  }, [fetchMessage]);

  /**
   * Mark as read
   */
  const markAsRead = useCallback(async (): Promise<boolean> => {
    setActionLoading(true);
    try {
      await messageApi.markAsRead(messageId);
      setMessage((prev) => (prev ? { ...prev, status: 'READ' as any } : null));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [messageId]);

  /**
   * Archive message
   */
  const archive = useCallback(async (): Promise<boolean> => {
    setActionLoading(true);
    try {
      await messageApi.archive(messageId);
      setMessage((prev) => (prev ? { ...prev, status: 'ARCHIVED' as any } : null));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive message');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [messageId]);

  /**
   * Delete message
   */
  const deleteMessage = useCallback(async (): Promise<boolean> => {
    setActionLoading(true);
    try {
      await messageApi.delete(messageId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [messageId]);

  // Initial load
  useEffect(() => {
    if (messageId) {
      fetchMessage();
    }
  }, [messageId]);

  return {
    message,
    loading,
    actionLoading,
    error,
    refresh,
    markAsRead,
    archive,
    deleteMessage,
  };
}
