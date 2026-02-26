/**
 * @file Message Detail ViewModel Hook
 * @description Manages state and business logic for message detail page
 * @module messenger-ui-web/hooks/useMessageDetail
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook is the ViewModel layer implementation, responsible for:
 * 1. Loading message details
 * 2. Auto-marking as read
 * 3. Providing message operations (archive, delete)
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
  MESSAGE_READ: 'messenger:message:read',
  MESSAGE_ARCHIVED: 'messenger:message:archived',
  MESSAGE_DELETED: 'messenger:message:deleted',
  UNREAD_COUNT_CHANGED: 'messenger:unread:changed',
};

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Message Detail State
 */
export interface MessageDetailState {
  /** Message data */
  message: MessageDTO | null;
  /** Is loading */
  loading: boolean;
  /** Error message */
  error: string | null;
}

/**
 * Message Detail Action Methods
 */
export interface MessageDetailActions {
  /** Refresh message */
  refresh: () => Promise<void>;
  /** Archive message */
  archiveMessage: () => Promise<boolean>;
  /** Delete message */
  deleteMessage: () => Promise<boolean>;
}

/**
 * useMessageDetail Hook Return Type
 */
export type UseMessageDetailResult = MessageDetailState & MessageDetailActions;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Message Detail ViewModel Hook
 * 
 * Functionality:
 * - Load message details by message ID
 * - Auto-mark as read when loaded
 * - Provide archive and delete operations
 * 
 * @param messageId - Message ID
 * @returns Message detail state and action methods
 */
export function useMessageDetail(messageId: string): UseMessageDetailResult {
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
  
  const [message, setMessage] = useState<MessageDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ========================================================================
  // Data Loading
  // ========================================================================
  
  /**
   * Load message details
   */
  const fetchData = useCallback(async (): Promise<void> => {
    if (!repository || !messageId) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await repository.getById(messageId);
      setMessage(data);
      
      // Auto-mark as read if unread
      if (data.status === 'UNREAD') {
        try {
          await repository.markAsRead(messageId);
          setMessage(prev => prev ? { ...prev, status: 'READ', readAt: new Date().toISOString() } : null);
          
          // Publish events
          eventBus?.emit(MESSENGER_EVENTS.MESSAGE_READ, { messageId });
          eventBus?.emit(MESSENGER_EVENTS.UNREAD_COUNT_CHANGED, {});
        } catch (markErr) {
          // Mark as read failure doesn't affect viewing, just log
          console.warn('[useMessageDetail] Mark as read failed:', markErr);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load message details';
      setError(errorMessage);
      console.error('[useMessageDetail] Load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [repository, messageId, eventBus]);
  
  // ========================================================================
  // Initial Load
  // ========================================================================
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // ========================================================================
  // Action Methods
  // ========================================================================
  
  /** Refresh message */
  const refresh = useCallback(async (): Promise<void> => {
    await fetchData();
  }, [fetchData]);
  
  /** Archive message */
  const archiveMessage = useCallback(async (): Promise<boolean> => {
    if (!repository || !messageId) {
      setError('[useMessageDetail] HttpCapability not initialized');
      return false;
    }
    
    try {
      await repository.archive(messageId);
      setMessage(prev => prev ? { ...prev, status: 'ARCHIVED' } : null);
      
      // Publish archive event
      eventBus?.emit(MESSENGER_EVENTS.MESSAGE_ARCHIVED, { messageId });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive message';
      setError(errorMessage);
      console.error('[useMessageDetail] Archive failed:', err);
      return false;
    }
  }, [repository, messageId, eventBus]);
  
  /** Delete message */
  const deleteMessage = useCallback(async (): Promise<boolean> => {
    if (!repository || !messageId) {
      setError('[useMessageDetail] HttpCapability not initialized');
      return false;
    }
    
    try {
      await repository.delete(messageId);
      
      // Publish delete event
      eventBus?.emit(MESSENGER_EVENTS.MESSAGE_DELETED, { messageId });
      eventBus?.emit(MESSENGER_EVENTS.UNREAD_COUNT_CHANGED, {});
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete message';
      setError(errorMessage);
      console.error('[useMessageDetail] Delete failed:', err);
      return false;
    }
  }, [repository, messageId, eventBus]);
  
  // ========================================================================
  // Return Result
  // ========================================================================
  
  return {
    // State
    message,
    loading,
    error,
    
    // Actions
    refresh,
    archiveMessage,
    deleteMessage,
  };
}
