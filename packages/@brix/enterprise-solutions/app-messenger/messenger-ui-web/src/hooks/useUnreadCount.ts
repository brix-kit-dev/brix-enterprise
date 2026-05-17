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
 * @file Unread Message Count Hook
 * @description Manages state for unread message count
 * @module messenger-ui-web/hooks/useUnreadCount
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook provides global unread message count state for:
 * 1. Displaying unread message badge
 * 2. Real-time updating of unread count
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp, useEventBus } from '@brix-sdk/runtime-sdk-react';
import { createMessageRepository, type MessageRepository } from '../repositories';

// ============================================================================
// Constants Definition
// ============================================================================

/**
 * Message Event Names
 */
const MESSENGER_EVENTS = {
  MESSAGE_RECEIVED: 'messenger:message:received',
  UNREAD_COUNT_CHANGED: 'messenger:unread:changed',
};

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * useUnreadCount Hook Return Type
 */
export interface UseUnreadCountResult {
  /** Unread message count */
  unreadCount: number;
  /** Is loading */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Refresh unread count */
  refresh: () => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Unread Message Count Hook
 * 
 * Functionality:
 * - Load current unread message count
 * - Subscribe to related events for auto-update
 * - Can be used to display message badge
 * 
 * @returns Unread message count state
 */
export function useUnreadCount(): UseUnreadCountResult {
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
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ========================================================================
  // Data Loading
  // ========================================================================
  
  /**
   * Load unread count
   */
  const fetchData = useCallback(async (): Promise<void> => {
    if (!repository) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const count = await repository.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get unread count';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [repository]);
  
  // ========================================================================
  // Initial Load
  // ========================================================================
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // ========================================================================
  // Event Subscription - Auto-update
  // ========================================================================
  
  useEffect(() => {
    if (!eventBus) return;
    
    // Update when new message received
    const unsubReceive = eventBus.on(MESSENGER_EVENTS.MESSAGE_RECEIVED, () => {
      fetchData();
    });
    
    // Unread count changed event
    const unsubChange = eventBus.on(MESSENGER_EVENTS.UNREAD_COUNT_CHANGED, () => {
      fetchData();
    });
    
    return () => {
      unsubReceive?.();
      unsubChange?.();
    };
  }, [eventBus, fetchData]);
  
  // ========================================================================
  // Return Result
  // ========================================================================
  
  return {
    unreadCount,
    loading,
    error,
    refresh: fetchData,
  };
}
