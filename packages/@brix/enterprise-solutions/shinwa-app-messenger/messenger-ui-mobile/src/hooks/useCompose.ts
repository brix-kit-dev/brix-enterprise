/**
 * Send Message Hook
 *
 * [Three-Layer Separation Architecture]
 * - This Hook belongs to the business logic layer, encapsulates message sending operations
 * - Calls backend through messageApi (messageApi internally uses HttpCapability)
 * - UI layer (screens/ComposeScreen) only needs to call this Hook, no need to know data submission details
 *
 * @author Shinwa Team
 * @since 3.0.0
 * @version 3.2.0
 */

import { useState, useCallback } from 'react';
import { messageApi } from '../api';
import type { MessageDTO, SendMessageRequest } from '../types';

/**
 * useCompose return value
 */
export interface UseComposeReturn {
  /** Whether sending */
  sending: boolean;
  /** Whether send successful */
  success: boolean;
  /** Error message */
  error: string | null;
  /** Send message */
  send: (request: SendMessageRequest) => Promise<MessageDTO | null>;
  /** Reset state */
  reset: () => void;
}

/**
 * Send Message Hook
 *
 * @returns Send message state and action methods
 *
 * @example
 * ```tsx
 * function ComposeScreen() {
 *   const { sending, success, error, send, reset } = useCompose();
 *
 *   const handleSend = async () => {
 *     const result = await send({
 *       receiverId: '123',
 *       type: 'PERSONAL',
 *       title: '标题',
 *       content: '内容',
 *     });
 *     if (result) {
 *       navigation.goBack();
 *     }
 *   };
 *
 *   return <ComposeForm onSubmit={handleSend} />;
 * }
 * ```
 */
export function useCompose(): UseComposeReturn {
  // State
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send message
   */
  const send = useCallback(
    async (request: SendMessageRequest): Promise<MessageDTO | null> => {
      setSending(true);
      setError(null);
      setSuccess(false);

      try {
        const data = await messageApi.send(request);
        setSuccess(true);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        return null;
      } finally {
        setSending(false);
      }
    },
    []
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setSending(false);
    setSuccess(false);
    setError(null);
  }, []);

  return {
    sending,
    success,
    error,
    send,
    reset,
  };
}
