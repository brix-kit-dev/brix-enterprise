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
 * @file Send Message Page Component
 * @description Message center send message page
 * @module messenger-ui-web/pages/ComposePage
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture - View Layer:
 * This component is pure View layer implementation, responsible for:
 * 1. Display send message form UI
 * 2. Handle user input and form validation
 * 3. Submit message through useSendMessage Hook
 * 
 * Architecture layers: View → ViewModel (Hooks) → Repository → HttpCapability
 * 
 * @author Brix Team
 * @since 3.0.0
 * @updated 3.2.0 - Refactored to View layer, removed direct API calls
 */

import React, { useState, useCallback } from 'react';
import { useNavigate, usePageParams, useUI } from '@brix-sdk/runtime-sdk-react';
import { useSendMessage } from '../hooks';
import type { SendMessageRequest, MessageType } from '../types';
import { MESSAGE_TYPE_LABELS } from '../types';

/**
 * Send Message Page Component
 * 
 * v3.2 Architecture:
 * View layer component, submits messages through useSendMessage Hook
 */
export default function ComposePage(): React.ReactElement {
  const navigate = useNavigate();
  const { Box, Typography, Paper, Input, Button, Stack, Alert, FormControl, InputLabel, Select, MenuItem, Spin, Icon } = useUI();
  // Get route params through pageParams (replaces useSearchParams)
  const { replyTo } = usePageParams<{ replyTo?: string }>();
  
  // ========================================================================
  // ViewModel Hooks - Delegate data and business logic to Hook layer
  // ========================================================================
  
  const {
    sending,
    error: sendError,
    sendMessage,
    clearError,
  } = useSendMessage();
  
  // ========================================================================
  // UI Local State - For form management only
  // ========================================================================
  
  // Form state
  const [formData, setFormData] = useState<SendMessageRequest>({
    receiverId: replyTo || '',
    title: '',
    content: '',
    type: 'PRIVATE',
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>();

  // ========================================================================
  // Form Handling
  // ========================================================================
  
  // Form field change handler
  const handleChange = useCallback((field: keyof SendMessageRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    // Clear send error
    clearError();
  }, [clearError]);

  // Form validation
  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.receiverId?.trim()) {
      errors.receiverId = '接收者不能为空';
    }
    
    if (!formData.title?.trim()) {
      errors.title = '标题不能为空';
    } else if (formData.title.length > 200) {
      errors.title = '标题长度不能超过200字符';
    }
    
    if (!formData.content?.trim()) {
      errors.content = '内容不能为空';
    } else if (formData.content.length > 5000) {
      errors.content = '内容长度不能超过5000字符';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // ========================================================================
  // Message Operations - Delegate to Hook layer
  // ========================================================================
  
  // Submit form
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    
    const result = await sendMessage(formData);
    if (result) {
      navigate('messenger:inbox');
    }
  }, [formData, navigate, validate, sendMessage]);

  // Cancel
  const handleCancel = useCallback(() => {
    navigate('messenger:inbox');
  }, [navigate]);

  return (
    <Box style={{ p: 3 }}>
      {/* Title Bar */}
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <Button variant="text" onClick={() => navigate('messenger:inbox')}>
          <Icon name="arrow_back" />
        </Button>
        <Typography variant="h5" fontWeight="bold">
          {replyTo ? '回复消息' : '发送消息'}
        </Typography>
      </Stack>

      {/* Error Alert */}
      {sendError && (
        <Alert type="error" style={{ mb: 2 }} onClose={clearError}>
          {sendError}
        </Alert>
      )}

      {/* Form */}
      <Paper style={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Receiver */}
          <Input
            fullWidth
            required
            label="接收者"
            placeholder="输入接收者ID或用户名"
            value={formData.receiverId}
            onChange={(e) => handleChange('receiverId', e.target.value)}
            error={!!validationErrors.receiverId}
            helperText={validationErrors.receiverId}
          />

          {/* Message Type */}
          <FormControl fullWidth>
            <InputLabel>消息类型</InputLabel>
            <Select
              value={formData.type}
              label="消息类型"
              onChange={(e) => handleChange('type', e.target.value as MessageType)}
            >
              {Object.entries(MESSAGE_TYPE_LABELS)
                .filter(([key]) => key !== 'SYSTEM') // Regular users cannot send system messages
                .map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          {/* Title */}
          <Input
            fullWidth
            required
            label="标题"
            placeholder="输入消息标题"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            error={!!validationErrors.title}
            helperText={validationErrors.title || `${formData.title?.length || 0}/200`}
            inputProps={{ maxLength: 200 }}
          />

          {/* Content */}
          <Input
            fullWidth
            required
            multiline
            rows={10}
            label="内容"
            placeholder="输入消息内容..."
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            error={!!validationErrors.content}
            helperText={validationErrors.content || `${formData.content?.length || 0}/5000`}
            inputProps={{ maxLength: 5000 }}
          />

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<Icon name="cancel" />}
              onClick={handleCancel}
              disabled={sending}
            >
              取消
            </Button>
            <Button
              variant="contained"
              startIcon={sending ? <Spin size={20} /> : <Icon name="send" />}
              onClick={handleSubmit}
              disabled={sending}
            >
              发送
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
