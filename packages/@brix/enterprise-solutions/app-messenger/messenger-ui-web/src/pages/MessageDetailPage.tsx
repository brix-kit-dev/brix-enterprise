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
 * @file Message Detail Page Component
 * @description Message center message detail page
 * @module messenger-ui-web/pages/MessageDetailPage
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture - View Layer:
 * This component is pure View layer implementation, responsible for:
 * 1. Display message detail UI
 * 2. Handle user interactions (archive, delete, reply)
 * 3. Get data and execute operations through useMessageDetail Hook
 * 
 * Architecture layers: View → ViewModel (Hooks) → Repository → HttpCapability
 * 
 * @author Brix Team
 * @since 3.0.0
 * @updated 3.2.0 - Refactored to View layer, removed direct API calls
 */

import React, { useCallback } from 'react';
import { useNavigate, usePageParams, useUI } from '@brix-sdk/runtime-sdk-react';
import { useMessageDetail } from '../hooks';
import type { MessageDTO } from '../types';
import { MESSAGE_TYPE_LABELS, MESSAGE_TYPE_COLORS } from '../types';

/**
 * Message Detail Page Component
 * 
 * v3.2 Architecture:
 * View layer component, gets data and executes operations through useMessageDetail Hook
 */
export default function MessageDetailPage(): React.ReactElement {
  const { messageId } = usePageParams<{ messageId: string }>();
  const navigate = useNavigate();
  const { Box, Typography, Paper, Avatar, Tag, Button, Stack, Spin, Alert, Divider, Icon } = useUI();
  
  // ========================================================================
  // ViewModel Hooks - Delegate data and business logic to Hook layer
  // ========================================================================
  
  const {
    message,
    loading,
    error,
    archiveMessage,
    deleteMessage,
  } = useMessageDetail(messageId || '');

  // ========================================================================
  // Message Operations - Delegate to Hook layer
  // ========================================================================

  // Archive message
  const handleArchive = useCallback(async () => {
    const success = await archiveMessage();
    if (success) {
      navigate('messenger:inbox');
    }
  }, [archiveMessage, navigate]);

  // Delete message
  const handleDelete = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    const success = await deleteMessage();
    if (success) {
      navigate('messenger:inbox');
    }
  }, [deleteMessage, navigate]);

  // Reply (only supported for private messages)
  const handleReply = useCallback(() => {
    if (!message) return;
    navigate('messenger:compose', { replyTo: message.senderId });
  }, [message, navigate]);

  // Format datetime
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box style={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Spin />
      </Box>
    );
  }

  if (error) {
    return (
      <Box style={{ p: 3 }}>
        <Alert type="error">{error}</Alert>
        <Button onClick={() => navigate('messenger:inbox')} style={{ mt: 2 }}>
          返回
        </Button>
      </Box>
    );
  }

  if (!message) {
    return (
      <Box style={{ p: 3 }}>
        <Alert type="warning">消息不存在</Alert>
        <Button onClick={() => navigate('messenger:inbox')} style={{ mt: 2 }}>
          返回
        </Button>
      </Box>
    );
  }

  return (
    <Box style={{ p: 3 }}>
      {/* Title Bar */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button variant="text" onClick={() => navigate('messenger:inbox')}>
            <Icon name="arrow_back" />
          </Button>
          <Typography variant="h5" fontWeight="bold">
            消息详情
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          {message.type === 'PRIVATE' && (
            <Button
              variant="outlined"
              startIcon={<Icon name="reply" />}
              onClick={handleReply}
            >
              回复
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Icon name="archive" />}
            onClick={handleArchive}
          >
            归档
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Icon name="delete" />}
            onClick={handleDelete}
          >
            删除
          </Button>
        </Stack>
      </Stack>

      {/* Message Content */}
      <Paper style={{ p: 3 }}>
        {/* Sender Info */}
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Avatar style={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            {message.type === 'SYSTEM' ? <Icon name="notifications" /> : <Icon name="send" />}
          </Avatar>
          <Box style={{ flexGrow: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" fontWeight="bold">
                {message.senderName || message.senderId}
              </Typography>
              <Tag
                label={MESSAGE_TYPE_LABELS[message.type]}
                size="small"
                color={MESSAGE_TYPE_COLORS[message.type]}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5} color="text.secondary">
              <Icon name="access_time" />
              <Typography variant="body2">
                {formatDateTime(message.createdAt)}
              </Typography>
              {message.readAt && (
                <Typography variant="body2" style={{ ml: 2 }}>
                  · 已读于 {formatDateTime(message.readAt)}
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>

        <Divider style={{ my: 2 }} />

        {/* Message Title */}
        <Typography variant="h6" gutterBottom>
          {message.title}
        </Typography>

        {/* Message Body */}
        <Typography
          variant="body1"
          style={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            mt: 2,
          }}
        >
          {message.content}
        </Typography>

        {/* Business Reference Info */}
        {message.referenceType && message.referenceId && (
          <>
            <Divider style={{ my: 3 }} />
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                关联业务:
              </Typography>
              <Tag
                label={`${message.referenceType}: ${message.referenceId}`}
                size="small"
                variant="outlined"
                onClick={() => {
                  // TODO: Navigate to associated business page
                }}
              />
            </Stack>
          </>
        )}
      </Paper>
    </Box>
  );
}
