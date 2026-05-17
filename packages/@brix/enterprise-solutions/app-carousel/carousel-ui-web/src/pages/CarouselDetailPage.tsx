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
 * @file 轮播位详情/编辑页面
 * @description 轮播位创建与编辑表单 - v3.2 View 层实现
 * @module carousel-ui-web/pages/CarouselDetailPage
 * @version 3.2.0
 * 
 * 【v3.2 前后端分离架构 - View 层】
 * 本组件是纯粹的 View 层实现：
 * 1. 不直接调用 API，通过 useCarouselForm Hook 获取数据和操作
 * 2. 只负责 UI 渲染和用户交互
 * 3. 业务逻辑封装在 ViewModel（Hook）层
 * 
 * @author Brix Team
 * @since 3.0.0
 */
import React, { useState, useCallback } from 'react';
import { usePageParams, useUI, useI18n } from '@brix-sdk/runtime-sdk-react';
import { useCarouselForm, type CarouselFormData } from '../hooks';

interface CarouselDetailPageProps {
  /** 页面模式：创建或编辑 */
  mode: 'create' | 'edit';
}

/**
 * 轮播位详情/编辑页面组件
 * 
 * 【职责说明】
 * - View 层：负责 UI 渲染和用户交互
 * - 通过 useCarouselForm 获取表单数据和操作方法
 * - 不直接与 API 层交互
 */
export const CarouselDetailPage: React.FC<CarouselDetailPageProps> = ({ mode }) => {
  const { id } = usePageParams<{ id: string }>();
  const { t } = useI18n('carousel');
  const { Box, Button, Card, CardContent, Checkbox, Spin, FormControlLabel, Grid, Input, Typography, Alert, Snackbar, Divider, Icon } = useUI();
  
  // ─────────────────────────────────────────────────────────
  // 使用 ViewModel Hook 获取表单状态和操作
  // ─────────────────────────────────────────────────────────
  const {
    formData,
    loading,
    submitting,
    error,
    isEditMode,
    isDirty,
    updateField,
    submit,
    reset,
    navigateToList,
  } = useCarouselForm(mode === 'edit' && id ? { code: id } : undefined);

  // ─────────────────────────────────────────────────────────
  // 本地 UI 状态
  // ─────────────────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // ─────────────────────────────────────────────────────────
  // 事件处理
  // ─────────────────────────────────────────────────────────

  /**
   * 处理表单字段变更
   */
  const handleChange = useCallback((field: keyof CarouselFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' 
      ? e.target.checked 
      : e.target.type === 'number'
        ? Number(e.target.value)
        : e.target.value;
    updateField(field, value as CarouselFormData[typeof field]);
  }, [updateField]);

  /**
   * 处理表单提交
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await submit();
    
    if (success) {
      setSnackbar({ 
        open: true, 
        message: isEditMode ? t('message.updateSuccess') : t('message.createSuccess'), 
        severity: 'success' 
      });
      
      if (!isEditMode) {
        // 创建成功后延迟跳转到列表页
        setTimeout(() => navigateToList(), 1500);
      }
    } else if (error) {
      setSnackbar({ 
        open: true, 
        message: `${isEditMode ? t('message.updateFailed') : t('message.createFailed')}: ${error.message}`, 
        severity: 'error' 
      });
    }
  }, [submit, isEditMode, error, navigateToList]);

  /**
   * 关闭消息提示
   */
  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // ─────────────────────────────────────────────────────────
  // 渲染：加载状态
  // ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Spin />
        <Typography style={{ ml: 2 }}>{t('common.loading')}</Typography>
      </Box>
    );
  }

  // ─────────────────────────────────────────────────────────
  // 渲染：主内容
  // ─────────────────────────────────────────────────────────
  return (
    <Box p={3}>
      {/* 页面标题栏 */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button startIcon={<Icon name="arrow_back" />} onClick={navigateToList} style={{ mr: 2 }}>
          {t('common.back')}
        </Button>
        <Typography variant="h4" component="h1">
          {isEditMode ? t('detail.editTitle') : t('detail.createTitle')}
        </Typography>
      </Box>

      {/* 表单 */}
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* 基本信息 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {t('detail.section.basic')}
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} md={6}>
                <Input
                  label={t('detail.field.code')}
                  value={formData.code}
                  onChange={handleChange('code')}
                  fullWidth
                  required
                  disabled={isEditMode}
                  helperText={t('detail.field.code.helper')}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Input
                  label={t('detail.field.name')}
                  value={formData.name}
                  onChange={handleChange('name')}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Input
                  label={t('detail.field.description')}
                  value={formData.description}
                  onChange={handleChange('description')}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>

              {/* 尺寸设置 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom style={{ mt: 2 }}>
                  {t('detail.section.size')}
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} md={4}>
                <Input
                  label={t('detail.field.width')}
                  type="number"
                  value={formData.width}
                  onChange={handleChange('width')}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Input
                  label={t('detail.field.height')}
                  type="number"
                  value={formData.height}
                  onChange={handleChange('height')}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Input
                  label={t('detail.field.maxBannerCount')}
                  type="number"
                  value={formData.maxBannerCount}
                  onChange={handleChange('maxBannerCount')}
                  fullWidth
                />
              </Grid>

              {/* 播放设置 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom style={{ mt: 2 }}>
                  {t('detail.section.playback')}
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.autoPlay}
                      onChange={handleChange('autoPlay')}
                    />
                  }
                  label={t('detail.field.autoPlay')}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <Input
                  label={t('detail.field.interval')}
                  type="number"
                  value={formData.autoPlayInterval}
                  onChange={handleChange('autoPlayInterval')}
                  fullWidth
                  disabled={!formData.autoPlay}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.showIndicator}
                      onChange={handleChange('showIndicator')}
                    />
                  }
                  label={t('detail.field.showIndicator')}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.showArrow}
                      onChange={handleChange('showArrow')}
                    />
                  }
                  label={t('detail.field.showArrow')}
                />
              </Grid>

              {/* 提交按钮 */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                  {isDirty && (
                    <Button
                      variant="outlined"
                      startIcon={<Icon name="refresh" />}
                      onClick={reset}
                      disabled={submitting}
                    >
                      {t('common.reset')}
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={submitting ? <Spin size={20} /> : <Icon name="save" />}
                    disabled={submitting}
                  >
                    {submitting 
                      ? (isEditMode ? t('detail.saving') : t('detail.creating')) 
                      : (isEditMode ? t('detail.saveChanges') : t('detail.createCarousel'))
                    }
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <Alert type={snackbar.severity} onClose={handleSnackbarClose}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CarouselDetailPage;
