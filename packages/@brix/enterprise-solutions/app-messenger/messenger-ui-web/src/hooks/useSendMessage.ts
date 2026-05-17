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
 * @file Send Message ViewModel Hook
 * @description Manages state and business logic for send message form
 * @module messenger-ui-web/hooks/useSendMessage
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook is the ViewModel layer implementation, responsible for:
 * 1. Managing send message form state
 * 2. Submitting send requests
 * 3. Publishing send success events
 */

import { useState, useCallback, useMemo } from 'react';
import { useHttp, useEventBus, useNavigation } from '@brix-sdk/runtime-sdk-react';
import { createMessageRepository, type MessageRepository } from '../repositories';
import type { MessageDTO, SendMessageRequest } from '../types';

// ============================================================================
// Constants Definition
// ============================================================================

/**
 * Message Event Names
 */
const MESSENGER_EVENTS = {
  MESSAGE_SENT: 'messenger:message:sent',
};

/**
 * Page IDs
 */
const MESSENGER_PAGE_IDS = {
  INBOX: 'messenger-inbox',
  OUTBOX: 'messenger-outbox',
  DETAIL: 'messenger-detail',
};

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Send Message State
 */
export interface SendMessageState {
  /** Is sending */
  sending: boolean;
  /** Error message */
  error: string | null;
  /** Successfully sent message */
  sentMessage: MessageDTO | null;
}

/**
 * Send Message Action Methods
 */
export interface SendMessageActions {
  /** Send message */
  sendMessage: (request: SendMessageRequest) => Promise<MessageDTO | null>;
  /** Clear error */
  clearError: () => void;
  /** Reset state */
  reset: () => void;
  /** Navigate to inbox */
  navigateToInbox: () => void;
  /** Navigate to outbox */
  navigateToOutbox: () => void;
}

/**
 * useSendMessage Hook Return Type
 */
export type UseSendMessageResult = SendMessageState & SendMessageActions;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Send Message ViewModel Hook
 * 
 * Functionality:
 * - Submit send message request
 * - Publish event after successful send
 * - Provide reset and navigation functions
 * 
 * @returns Send message state and action methods
 */
export function useSendMessage(): UseSendMessageResult {
  // ========================================================================
  // Dependencies
  // ========================================================================
  
  const http = useHttp();
  const eventBus = useEventBus();
  const navigation = useNavigation();
  
  // Repository instance
  const repository = useMemo<MessageRepository | null>(
    () => http ? createMessageRepository(http) : null,
    [http]
  );
  
  // ========================================================================
  // State Definition
  // ========================================================================
  
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<MessageDTO | null>(null);
  
  // ========================================================================
  // Action Methods
  // ========================================================================
  
  /**
   * Send message
   * 
   * @param request - Send message request
   * @returns Message data on success, null on failure
   */
  const sendMessage = useCallback(async (
    request: SendMessageRequest
  ): Promise<MessageDTO | null> => {
    if (!repository) {
      setError('[useSendMessage] HttpCapability not initialized');
      return null;
    }
    
    setSending(true);
    setError(null);
    
    try {
      const message = await repository.send(request);
      setSentMessage(message);
      
      // Publish send success event
      eventBus?.emit(MESSENGER_EVENTS.MESSAGE_SENT, {
        messageId: message.messageId,
        receiverId: message.receiverId,
        type: message.type,
      });
      
      return message;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      return null;
    } finally {
      setSending(false);
    }
  }, [repository, eventBus]);
  
  /** Clear error */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);
  
  /** Reset state */
  const reset = useCallback((): void => {
    setSending(false);
    setError(null);
    setSentMessage(null);
  }, []);
  
  /** Navigate to inbox */
  const navigateToInbox = useCallback((): void => {
    navigation?.navigate(MESSENGER_PAGE_IDS.INBOX);
  }, [navigation]);
  
  /** Navigate to outbox */
  const navigateToOutbox = useCallback((): void => {
    navigation?.navigate(MESSENGER_PAGE_IDS.OUTBOX);
  }, [navigation]);
  
  // ========================================================================
  // Return Result
  // ========================================================================
  
  return {
    // State
    sending,
    error,
    sentMessage,
    
    // Actions
    sendMessage,
    clearError,
    reset,
    navigateToInbox,
    navigateToOutbox,
  };
}
