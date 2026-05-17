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
 * @file Inbox ViewModel Hook
 * @description Manages state and business logic for the inbox page
 * @module messenger-ui-web/hooks/useInbox
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook is the ViewModel layer implementation, responsible for:
 * 1. Managing inbox message list state
 * 2. Handling message filtering and pagination
 * 3. Providing message operations (mark as read, archive, delete)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp, useEventBus } from '@brix-sdk/runtime-sdk-react';
import { createMessageRepository, type MessageRepository } from '../repositories';
import type { MessageDTO, MessageStatus } from '../types';

// ============================================================================
// Constants
// ============================================================================

/**
 * Message event names
 */
const MESSENGER_EVENTS = {
  MESSAGE_RECEIVED: 'messenger:message:received',
  MESSAGE_READ: 'messenger:message:read',
  MESSAGE_ARCHIVED: 'messenger:message:archived',
  MESSAGE_DELETED: 'messenger:message:deleted',
  UNREAD_COUNT_CHANGED: 'messenger:unread:changed',
};

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Inbox state
 */
export interface InboxState {
  /** Message list */
  messages: MessageDTO[];
  /** Loading indicator */
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
  /** Status filter */
  statusFilter: MessageStatus | null;
}

/**
 * Inbox action methods
 */
export interface InboxActions {
  /** Refresh data */
  refresh: () => Promise<void>;
  /** Set page number */
  setPage: (page: number) => void;
  /** Set page size */
  setPageSize: (size: number) => void;
  /** Filter by status */
  filterByStatus: (status: MessageStatus | null) => void;
  /** Mark as read */
  markAsRead: (messageId: string) => Promise<boolean>;
  /** Batch mark as read */
  markAsReadBatch: (messageIds: string[]) => Promise<boolean>;
  /** Mark all as read */
  markAllAsRead: () => Promise<boolean>;
  /** Archive message */
  archiveMessage: (messageId: string) => Promise<boolean>;
  /** Delete message */
  deleteMessage: (messageId: string) => Promise<boolean>;
}

/**
 * useInbox Hook return type
 */
export type UseInboxResult = InboxState & InboxActions;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Inbox ViewModel Hook
 * 
 * Features:
 * - Load and manage inbox message list
 * - Support filtering by status
 * - Provide pagination functionality
 * - Provide message operations (read, archive, delete)
 * - Subscribe to new message events for real-time refresh
 * 
 * @returns Inbox state and action methods
 */
export function useInbox(): UseInboxResult {
  // ========================================================================
  // Dependency Retrieval
  // ========================================================================
  
  const http = useHttp();
  const eventBus = useEventBus();
  
  // Repository instance
  const repository = useMemo<MessageRepository | null>(
    () => http ? createMessageRepository(http) : null,
    [http]
  );
  
  // ========================================================================
  // State Definitions
  // ========================================================================
  
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<MessageStatus | null>(null);
  
  // ========================================================================
  // Data Loading
  // ========================================================================
  
  /**
   * Load inbox data
   */
  const fetchData = useCallback(async (): Promise<void> => {
    if (!repository) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await repository.getInbox({
        page,
        size: pageSize,
        status: statusFilter ?? undefined,
      });
      
      setMessages(response.content);
      setTotal(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载收件箱失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [repository, page, pageSize, statusFilter]);
  
  // ========================================================================
  // 初始加载
  // ========================================================================
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // ========================================================================
  // 事件订阅 - 实时更新
  // ========================================================================
  
  useEffect(() => {
    if (!eventBus) return;
    
    // 收到新消息时刷新
    const unsubReceive = eventBus.on(MESSENGER_EVENTS.MESSAGE_RECEIVED, () => {
      fetchData();
    });
    
    return () => {
      unsubReceive?.();
    };
  }, [eventBus, fetchData]);
  
  // ========================================================================
  // 操作方法
  // ========================================================================
  
  /** 刷新数据 */
  const refresh = useCallback(async (): Promise<void> => {
    await fetchData();
  }, [fetchData]);
  
  /** 设置页码 */
  const handleSetPage = useCallback((newPage: number): void => {
    setPage(newPage);
  }, []);
  
  /** 设置每页大小 */
  const handleSetPageSize = useCallback((size: number): void => {
    setPageSize(size);
    setPage(0);
  }, []);
  
  /** 按状态筛选 */
  const filterByStatus = useCallback((status: MessageStatus | null): void => {
    setStatusFilter(status);
    setPage(0);
  }, []);
  
  /** 标记为已读 */
  const markAsRead = useCallback(async (messageId: string): Promise<boolean> => {
    if (!repository) {
      setError('[useInbox] HttpCapability 未初始化');
      return false;
    }
    
    try {
      await repository.markAsRead(messageId);
      
      // 更新本地状态
      setMessages(prev => prev.map(msg => 
        msg.messageId === messageId 
          ? { ...msg, status: 'READ' as MessageStatus, readAt: new Date().toISOString() }
          : msg
      ));
      
      // 发布已读事件
      eventBus?.emit(MESSENGER_EVENTS.MESSAGE_READ, { messageId });
      eventBus?.emit(MESSENGER_EVENTS.UNREAD_COUNT_CHANGED, {});
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '标记已读失败';
      setError(message);
      return false;
    }
  }, [repository, eventBus]);
  
  /** 批量标记为已读 */
  const markAsReadBatch = useCallback(async (messageIds: string[]): Promise<boolean> => {
    if (!repository) {
      setError('[useInbox] HttpCapability 未初始化');
      return false;
    }
    
    try {
      await repository.markAsReadBatch(messageIds);
      
      // 更新本地状态
      const idSet = new Set(messageIds);
      setMessages(prev => prev.map(msg => 
        idSet.has(msg.messageId)
          ? { ...msg, status: 'READ' as MessageStatus, readAt: new Date().toISOString() }
          : msg
      ));
      
      // 发布事件
      eventBus?.emit(MESSENGER_EVENTS.UNREAD_COUNT_CHANGED, {});
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '批量标记已读失败';
      setError(message);
      return false;
    }
  }, [repository, eventBus]);
  
  /** 全部标记为已读 */
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!repository) {
      setError('[useInbox] HttpCapability 未初始化');
      return false;
    }
    
    try {
      await repository.markAllAsRead();
      
      // 更新本地状态
      setMessages(prev => prev.map(msg => ({
        ...msg,
        status: 'READ' as MessageStatus,
        readAt: msg.readAt || new Date().toISOString(),
      })));
      
      // 发布事件
      eventBus?.emit(MESSENGER_EVENTS.UNREAD_COUNT_CHANGED, {});
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '全部标记已读失败';
      setError(message);
      return false;
    }
  }, [repository, eventBus]);
  
  /** 归档消息 */
  const archiveMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!repository) {
      setError('[useInbox] HttpCapability 未初始化');
      return false;
    }
    
    try {
      await repository.archive(messageId);
      
      // 从列表中移除（如果当前不是查看归档状态）
      if (statusFilter !== 'ARCHIVED') {
        setMessages(prev => prev.filter(msg => msg.messageId !== messageId));
        setTotal(prev => prev - 1);
      }
      
      // 发布归档事件
      eventBus?.emit(MESSENGER_EVENTS.MESSAGE_ARCHIVED, { messageId });
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '归档消息失败';
      setError(message);
      return false;
    }
  }, [repository, statusFilter, eventBus]);
  
  /** 删除消息 */
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!repository) {
      setError('[useInbox] HttpCapability 未初始化');
      return false;
    }
    
    try {
      await repository.delete(messageId);
      
      // 从列表中移除
      setMessages(prev => prev.filter(msg => msg.messageId !== messageId));
      setTotal(prev => prev - 1);
      
      // 发布删除事件
      eventBus?.emit(MESSENGER_EVENTS.MESSAGE_DELETED, { messageId });
      eventBus?.emit(MESSENGER_EVENTS.UNREAD_COUNT_CHANGED, {});
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除消息失败';
      setError(message);
      return false;
    }
  }, [repository, eventBus]);
  
  // ========================================================================
  // 返回结果
  // ========================================================================
  
  return {
    // 状态
    messages,
    loading,
    error,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    statusFilter,
    
    // 操作
    refresh,
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    filterByStatus,
    markAsRead,
    markAsReadBatch,
    markAllAsRead,
    archiveMessage,
    deleteMessage,
  };
}
