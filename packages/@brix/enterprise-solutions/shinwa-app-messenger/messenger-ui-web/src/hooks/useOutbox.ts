/**
 * @file Outbox ViewModel Hook
 * @description Manages state and business logic for outbox page
 * @module messenger-ui-web/hooks/useOutbox
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook is the ViewModel layer implementation, responsible for:
 * 1. Managing outbox message list state
 * 2. Handling pagination
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp, useEventBus } from '@brix/runtime-sdk-react';
import { createMessageRepository, type MessageRepository } from '../repositories';
import type { MessageDTO } from '../types';

// ============================================================================
// Constants Definition
// ============================================================================

/**
 * Message Event Names
 */
const MESSENGER_EVENTS = {
  MESSAGE_SENT: 'messenger:message:sent',
};

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Outbox State
 */
export interface OutboxState {
  /** Message list */
  messages: MessageDTO[];
  /** Is loading */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Pagination info */
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Outbox Action Methods
 */
export interface OutboxActions {
  /** Refresh data */
  refresh: () => Promise<void>;
  /** Set page number */
  setPage: (page: number) => void;
  /** Set page size */
  setPageSize: (size: number) => void;
}

/**
 * useOutbox Hook Return Type
 */
export type UseOutboxResult = OutboxState & OutboxActions;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Outbox ViewModel Hook
 * 
 * Functionality:
 * - Load and manage outbox message list
 * - Provide pagination
 * - Subscribe to message sent event for real-time refresh
 * 
 * @returns Outbox state and action methods
 */
export function useOutbox(): UseOutboxResult {
  // ========================================================================
  // Dependencies
  // ========================================================================
  
  const http = useHttp();
  const eventBus = useEventBus();
  
  // Repository instance
  const repository = useMemo<MessageRepository | null>(
    () => http ? createMessageRepository(http) : null,
    [http]
  );
  
  // ========================================================================
  // State Definition
  // ========================================================================
  
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // ========================================================================
  // Data Loading
  // ========================================================================
  
  /**
   * Load outbox data
   */
  const fetchData = useCallback(async (): Promise<void> => {
    if (!repository) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await repository.getOutbox({
        page,
        size: pageSize,
      });
      
      setMessages(response.content);
      setTotal(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load outbox';
      setError(message);
      console.error('[useOutbox] Load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [repository, page, pageSize]);
  
  // ========================================================================
  // Initial Load
  // ========================================================================
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // ========================================================================
  // Event Subscription - Refresh after new message sent
  // ========================================================================
  
  useEffect(() => {
    if (!eventBus) return;
    
    const unsubSent = eventBus.on(MESSENGER_EVENTS.MESSAGE_SENT, () => {
      fetchData();
    });
    
    return () => {
      unsubSent?.();
    };
  }, [eventBus, fetchData]);
  
  // ========================================================================
  // Action Methods
  // ========================================================================
  
  /** Refresh data */
  const refresh = useCallback(async (): Promise<void> => {
    await fetchData();
  }, [fetchData]);
  
  /** Set page number */
  const handleSetPage = useCallback((newPage: number): void => {
    setPage(newPage);
  }, []);
  
  /** Set page size */
  const handleSetPageSize = useCallback((size: number): void => {
    setPageSize(size);
    setPage(0);
  }, []);
  
  // ========================================================================
  // Return Result
  // ========================================================================
  
  return {
    // State
    messages,
    loading,
    error,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    
    // 操作
    refresh,
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
  };
}
