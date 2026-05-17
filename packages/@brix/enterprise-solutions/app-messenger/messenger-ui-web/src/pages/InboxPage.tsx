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
 * @file Inbox Page Component
 * @description Message center inbox page, displays list of messages received by user
 * @module messenger-ui-web/pages/InboxPage
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture - View Layer:
 * This component is a pure View layer implementation, responsible for:
 * 1. Displaying message list UI
 * 2. Handling user interactions (clicks, selections, etc.)
 * 3. Getting data and executing operations through useInbox/useUnreadCount Hooks
 * 
 * Architecture layers: View → ViewModel (Hooks) → Repository → HttpCapability
 * 
 * @author Brix Team
 * @since 3.0.0
 * @updated 3.2.0 - Refactored to View layer, removed direct API calls
 */

import React, { useState, useCallback } from 'react';
import { useNavigate, useUI } from '@brix-sdk/runtime-sdk-react';
import { useInbox, useUnreadCount } from '../hooks';
import type { MessageDTO, MessageStatus } from '../types';
import { MESSAGE_TYPE_LABELS, MESSAGE_TYPE_COLORS } from '../types';

/**
 * Inbox Page Component
 * 
 * v3.2 Architecture:
 * View layer component, gets data and executes operations through useInbox and useUnreadCount Hooks
 */
export default function InboxPage(): React.ReactElement {
  const navigate = useNavigate();
  const { Box, Typography, Paper, List, ListItem, ListItemButton, ListItemAvatar, ListItemText, Avatar, Tag, Button, Stack, Spin, Alert, Tabs, Tab, Badge, Checkbox, Divider, Menu, MenuItem, Icon } = useUI();
  
  // ========================================================================
  // ViewModel Hooks - Data and business logic delegated to Hook layer
  // ========================================================================
  
  const {
    messages,
    loading,
    error,
    pagination,
    statusFilter,
    refresh,
    setPage,
    filterByStatus,
    markAsRead,
    markAsReadBatch,
    markAllAsRead,
    archiveMessage,
    deleteMessage,
  } = useInbox();
  
  const { unreadCount, refresh: refreshUnreadCount } = useUnreadCount();
  
  // ========================================================================
  // UI Local State - Only for interface interactions
  // ========================================================================
  
  /** Current Tab index */
  const [tabValue, setTabValue] = useState(0);
  /** Set of selected message IDs */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  /** Menu anchor element */
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  /** Currently active message ID (for menu operations) */
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  // Tab 对应的状态过滤映射（tab 0 = all/null, tab 1 = UNREAD, tab 2 = READ, tab 3 = ARCHIVED）
  const statusFilters: (MessageStatus | null)[] = [null, 'UNREAD', 'READ', 'ARCHIVED'];

  // ========================================================================
  // Tab Switch Handling - Sync tabValue and statusFilter
  // ========================================================================
  
  /**
   * Handle Tab switch
   * Simultaneously updates local tabValue and statusFilter in Hook
   */
  const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    filterByStatus(statusFilters[newValue]);
  }, [filterByStatus]);

  // ========================================================================
  // Message Operations - Delegated to Hook layer
  // ========================================================================

  /**
   * Mark single message as read
   */
  const handleMarkAsRead = useCallback(async (messageId: string) => {
    const success = await markAsRead(messageId);
    if (success) {
      refreshUnreadCount();
    }
  }, [markAsRead, refreshUnreadCount]);

  /**
   * Batch mark selected messages as read
   */
  const handleMarkSelectedAsRead = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const success = await markAsReadBatch(Array.from(selectedIds));
    if (success) {
      setSelectedIds(new Set());
      refreshUnreadCount();
    }
  }, [selectedIds, markAsReadBatch, refreshUnreadCount]);

  /**
   * Mark all messages as read
   */
  const handleMarkAllAsRead = useCallback(async () => {
    const success = await markAllAsRead();
    if (success) {
      refreshUnreadCount();
    }
  }, [markAllAsRead, refreshUnreadCount]);

  /**
   * Archive message
   */
  const handleArchive = useCallback(async (messageId: string) => {
    await archiveMessage(messageId);
  }, [archiveMessage]);

  /**
   * Delete message
   */
  const handleDelete = useCallback(async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    await deleteMessage(messageId);
  }, [deleteMessage]);

  // ========================================================================
  // UI Interaction Handling - Local state management
  // ========================================================================

  /**
   * Toggle message selection state
   */
  const handleToggleSelect = useCallback((messageId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  /**
   * Select all/Deselect all
   */
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === messages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(messages.map((m) => m.messageId)));
    }
  }, [messages, selectedIds.size]);

  /**
   * 点击消息项 - 标记已读并跳转详情
   */
  const handleMessageClick = useCallback((message: MessageDTO) => {
    if (message.status === 'UNREAD') {
      handleMarkAsRead(message.messageId);
    }
    navigate('messenger:detail', { id: message.messageId });
  }, [navigate, handleMarkAsRead]);

  /**
   * 打开操作菜单
   */
  const handleOpenMenu = useCallback((event: React.MouseEvent<HTMLElement>, messageId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActiveMessageId(messageId);
  }, []);

  /**
   * 关闭操作菜单
   */
  const handleCloseMenu = useCallback(() => {
    setAnchorEl(null);
    setActiveMessageId(null);
  }, []);

  // ========================================================================
  // 工具函数
  // ========================================================================

  /**
   * 格式化时间为友好显示
   */
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
    return date.toLocaleDateString();
  };

  // ========================================================================
  // 渲染
  // ========================================================================

  return (
    <Box style={{ p: 3 }}>
      {/* 标题栏 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Icon name="notifications" style={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">
            消息中心
          </Typography>
          <Badge badgeContent={unreadCount} color="error">
            <Tag label="未读" size="small" />
          </Badge>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<Icon name="create" />}
            onClick={() => navigate('messenger:compose')}
          >
            写消息
          </Button>
          <Button variant="text" onClick={() => refresh()}>
            <Icon name="refresh" />
          </Button>
        </Stack>
      </Stack>

      {/* 错误提示 */}
      {error && (
        <Alert type="error" style={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tab 切换 */}
      <Paper style={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab icon={<Icon name="mail" />} label="全部" />
          <Tab icon={<Icon name="mail_outline" />} label={`未读 (${unreadCount})`} />
          <Tab icon={<Icon name="drafts" />} label="已读" />
          <Tab icon={<Icon name="archive" />} label="已归档" />
        </Tabs>
      </Paper>

      {/* 操作栏 */}
      <Paper style={{ mb: 2, p: 1 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Checkbox
            checked={selectedIds.size > 0 && selectedIds.size === messages.length}
            indeterminate={selectedIds.size > 0 && selectedIds.size < messages.length}
            onChange={handleSelectAll}
          />
          {selectedIds.size > 0 && (
            <>
              <Typography variant="body2" color="text.secondary">
                已选择 {selectedIds.size} 条
              </Typography>
              <Button
                size="small"
                startIcon={<Icon name="done_all" />}
                onClick={handleMarkSelectedAsRead}
              >
                标记已读
              </Button>
            </>
          )}
          <Box style={{ flexGrow: 1 }} />
          <Button
            size="small"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            全部已读
          </Button>
        </Stack>
      </Paper>

      {/* 消息列表 */}
      <Paper>
        {loading ? (
          <Box style={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Spin />
          </Box>
        ) : messages.length === 0 ? (
          <Box style={{ textAlign: 'center', p: 4 }}>
            <Icon name="mail_outline" style={{ fontSize: 64, color: 'text.secondary' }} />
            <Typography color="text.secondary" mt={2}>
              暂无消息
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {messages.map((message, index) => (
              <React.Fragment key={message.messageId}>
                {index > 0 && <Divider />}
                <ListItem
                  disablePadding
                  secondaryAction={
                    <Button
                      variant="text"
                      size="small"
                      onClick={(e) => handleOpenMenu(e, message.messageId)}
                    >
                      <Icon name="more_vert" />
                    </Button>
                  }
                >
                  <Checkbox
                    checked={selectedIds.has(message.messageId)}
                    onChange={() => handleToggleSelect(message.messageId)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ ml: 1 }}
                  />
                  <ListItemButton
                    onClick={() => handleMessageClick(message)}
                    style={{
                      bgcolor: message.status === 'UNREAD' ? 'action.hover' : 'transparent',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar style={{ bgcolor: message.status === 'UNREAD' ? 'primary.main' : 'grey.400' }}>
                        {message.type === 'SYSTEM' ? <Icon name="notifications" /> : <Icon name="send" />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography
                            variant="body1"
                            fontWeight={message.status === 'UNREAD' ? 'bold' : 'normal'}
                            noWrap
                            style={{ maxWidth: 400 }}
                          >
                            {message.title}
                          </Typography>
                          <Tag
                            label={MESSAGE_TYPE_LABELS[message.type]}
                            size="small"
                            color={MESSAGE_TYPE_COLORS[message.type]}
                            style={{ height: 20 }}
                          />
                        </Stack>
                      }
                      secondary={
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary" noWrap style={{ maxWidth: 300 }}>
                            {message.senderName || message.senderId} - {message.content?.substring(0, 50)}...
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(message.createdAt)}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}

        {/* 操作菜单 - 放在列表外部，通过 activeMessageId 控制 */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && activeMessageId !== null}
          onClose={handleCloseMenu}
        >
          <MenuItem onClick={() => {
            if (activeMessageId) handleMarkAsRead(activeMessageId);
            handleCloseMenu();
          }}>
            标记已读
          </MenuItem>
          <MenuItem onClick={() => {
            if (activeMessageId) handleArchive(activeMessageId);
            handleCloseMenu();
          }}>
            归档
          </MenuItem>
          <MenuItem onClick={() => {
            if (activeMessageId) handleDelete(activeMessageId);
            handleCloseMenu();
          }}>
            删除
          </MenuItem>
        </Menu>

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <Stack direction="row" justifyContent="center" spacing={2} p={2}>
            <Button
              disabled={pagination.page === 0}
              onClick={() => setPage(pagination.page - 1)}
            >
              上一页
            </Button>
            <Typography style={{ alignSelf: 'center' }}>
              {pagination.page + 1} / {pagination.totalPages}
            </Typography>
            <Button
              disabled={pagination.page >= pagination.totalPages - 1}
              onClick={() => setPage(pagination.page + 1)}
            >
              下一页
            </Button>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
