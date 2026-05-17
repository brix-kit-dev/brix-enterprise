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
 * @file Banner管理页面
 * @description 轮播位Banner管理 - v3.2 View 层实现
 * @module carousel-ui-web/pages/BannerListPage
 * @version 3.2.0
 * 
 * 【v3.2 前后端分离架构 - View 层】
 * 本组件是纯粹的 View 层实现：
 * 1. 不直接调用 API，通过 useCarouselDetail Hook 获取数据和操作
 * 2. 只负责 UI 渲染和用户交互
 * 3. 业务逻辑封装在 ViewModel（Hook）层
 * 
 * @author Brix Team
 * @since 3.0.0
 */
import React, { useState, useCallback } from 'react';
import { useNavigate, usePageParams, useUI, useI18n } from '@brix-sdk/runtime-sdk-react';
import { useCarouselDetail } from '../hooks';
import type { BannerDTO, BannerFormData, Platform, BannerActionType, BannerStatus } from '../types';

/**
 * Banner管理页面组件
 * 
 * 【职责说明】
 * - View 层：负责 UI 渲染和用户交互
 * - 通过 useCarouselDetail 获取数据和操作方法
 * - 不直接与 API 层交互
 */
export const BannerListPage: React.FC = () => {
  const { carouselId } = usePageParams<{ carouselId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n('carousel');
  const { Box, Button, Card, CardContent, CardMedia, Tag, Spin, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, Grid, InputLabel, MenuItem, Select, Input, Typography, Alert, Snackbar, Tooltip, Paper, Icon } = useUI();

  // ─────────────────────────────────────────────────────────
  // 使用 ViewModel Hook 获取数据和操作方法
  // ─────────────────────────────────────────────────────────
  const {
    carousel,
    banners,
    loading,
    operating,
    error,
    addBanner,
    updateBanner,
    deleteBanner,
    enableBanner,
    disableBanner,
  } = useCarouselDetail({ id: carouselId ? Number(carouselId) : undefined });

  // ─────────────────────────────────────────────────────────
  // 本地 UI 状态
  // ─────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerDTO | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<BannerDTO | null>(null);
  const [formData, setFormData] = useState<BannerFormData>({
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    imageUrlMobile: '',
    platform: 'ALL',
    actionType: 'NONE',
    actionValue: '',
    actionValueApp: '',
    sortOrder: 0,
    startTime: '',
    endTime: '',
  });

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // ─────────────────────────────────────────────────────────
  // 事件处理
  // ─────────────────────────────────────────────────────────

  /**
   * 处理添加/更新 Banner 提交
   */
  const handleSubmit = useCallback(async () => {
    const data = {
      ...formData,
      startTime: formData.startTime || undefined,
      endTime: formData.endTime || undefined,
    };

    let success: boolean;
    if (editingBanner?.id) {
      success = await updateBanner(editingBanner.id, data);
      if (success) {
        setSnackbar({ open: true, message: t('message.updateSuccess'), severity: 'success' });
        handleCloseDialog();
      } else {
        setSnackbar({ open: true, message: t('message.updateFailed'), severity: 'error' });
      }
    } else {
      success = await addBanner(data);
      if (success) {
        setSnackbar({ open: true, message: t('message.addSuccess'), severity: 'success' });
        handleCloseDialog();
      } else {
        setSnackbar({ open: true, message: t('message.addFailed'), severity: 'error' });
      }
    }
  }, [formData, editingBanner, updateBanner, addBanner]);

  /**
   * 处理删除 Banner
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedBanner?.id) return;
    
    const success = await deleteBanner(selectedBanner.id);
    if (success) {
      setSnackbar({ open: true, message: t('message.deleteSuccess'), severity: 'success' });
      setDeleteDialogOpen(false);
      setSelectedBanner(null);
    } else {
      setSnackbar({ open: true, message: t('message.deleteFailed'), severity: 'error' });
    }
  }, [selectedBanner, deleteBanner]);

  /**
   * 处理启用/禁用 Banner
   */
  const handleToggleBanner = useCallback(async (banner: BannerDTO) => {
    if (!banner.id) return;
    
    const success = banner.status === 'ENABLED' 
      ? await disableBanner(banner.id)
      : await enableBanner(banner.id);
      
    if (success) {
      setSnackbar({ open: true, message: t('message.operationSuccess'), severity: 'success' });
    } else {
      setSnackbar({ open: true, message: t('message.operationFailed'), severity: 'error' });
    }
  }, [enableBanner, disableBanner]);

  /**
   * 打开 Banner 编辑对话框
   */
  const handleOpenDialog = useCallback((banner?: BannerDTO) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || '',
        description: banner.description || '',
        imageUrl: banner.imageUrl || '',
        imageUrlMobile: banner.imageUrlMobile || '',
        platform: banner.platform,
        actionType: banner.actionType,
        actionValue: banner.actionValue || '',
        actionValueApp: banner.actionValueApp || '',
        sortOrder: banner.sortOrder,
        startTime: banner.startTime || '',
        endTime: banner.endTime || '',
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        imageUrl: '',
        imageUrlMobile: '',
        platform: 'ALL',
        actionType: 'NONE',
        actionValue: '',
        actionValueApp: '',
        sortOrder: (banners?.length || 0) + 1,
        startTime: '',
        endTime: '',
      });
    }
    setDialogOpen(true);
  }, [banners]);

  /**
   * 关闭 Banner 编辑对话框
   */
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingBanner(null);
  }, []);

  /**
   * 关闭消息提示
   */
  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // ─────────────────────────────────────────────────────────
  // 辅助函数
  // ─────────────────────────────────────────────────────────

  const getStatusColor = (status: BannerStatus) => {
    switch (status) {
      case 'ENABLED': return 'success';
      case 'DISABLED': return 'error';
      case 'DRAFT': return 'warning';
      case 'EXPIRED': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: BannerStatus) => {
    switch (status) {
      case 'ENABLED': return t('status.ENABLED');
      case 'DISABLED': return t('status.DISABLED');
      case 'DRAFT': return t('status.DRAFT');
      case 'EXPIRED': return t('status.EXPIRED');
      default: return status;
    }
  };

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
  // 渲染：错误状态
  // ─────────────────────────────────────────────────────────
  if (error && !carousel) {
    return (
      <Alert type="error">
        {t('banner.loadFailed')}: {error || t('common.unknownError')}
      </Alert>
    );
  }

  // ─────────────────────────────────────────────────────────
  // 渲染：主内容
  // ─────────────────────────────────────────────────────────
  return (
    <Box p={3}>
      {/* 页面标题 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Button startIcon={<Icon name="arrow_back" />} onClick={() => navigate('carousel:list')} style={{ mr: 2 }}>
            {t('common.back')}
          </Button>
          <Typography variant="h4" component="h1">
            {t('banner.title', { name: carousel?.name || '' })}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Icon name="add" />}
          onClick={() => handleOpenDialog()}
        >
          {t('banner.add')}
        </Button>
      </Box>

      {/* Banner列表 */}
      <Grid container spacing={3}>
        {(!banners || banners.length === 0) ? (
          <Grid item xs={12}>
            <Paper style={{ p: 4, textAlign: 'center' }}>
              <Typography color="textSecondary">
                {t('banner.empty')}
              </Typography>
            </Paper>
          </Grid>
        ) : (
          banners.map((banner) => (
            <Grid item xs={12} md={6} lg={4} key={banner.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="160"
                  image={banner.imageUrl || 'https://via.placeholder.com/400x160?text=No+Image'}
                  alt={banner.title}
                  style={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="h6" noWrap style={{ flex: 1 }}>
                      {banner.title}
                    </Typography>
                    <Tag
                      label={getStatusLabel(banner.status)}
                      color={getStatusColor(banner.status)}
                      size="small"
                    />
                  </Box>
                  {banner.subtitle && (
                    <Typography variant="body2" color="textSecondary" noWrap>
                      {banner.subtitle}
                    </Typography>
                  )}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                    <Box>
                      <Tag label={banner.platform} size="small" variant="outlined" style={{ mr: 1 }} />
                      <Tag label={t('banner.sortLabel', { order: String(banner.sortOrder) })} size="small" variant="outlined" />
                    </Box>
                    <Box>
                      <Tooltip title={banner.status === 'ENABLED' ? t('banner.disableTooltip') : t('banner.enableTooltip')}>
                        <Button
                          variant="text"
                          size="small"
                          disabled={operating}
                          onClick={() => handleToggleBanner(banner)}
                        >
                          {banner.status === 'ENABLED' ? <Icon name="visibility_off" /> : <Icon name="visibility" />}
                        </Button>
                      </Tooltip>
                      <Tooltip title={t('common.edit')}>
                        <Button variant="text" size="small" onClick={() => handleOpenDialog(banner)}>
                          <Icon name="edit" />
                        </Button>
                      </Tooltip>
                      <Tooltip title={t('common.delete')}>
                        <Button
                          variant="text"
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedBanner(banner);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Icon name="delete" />
                        </Button>
                      </Tooltip>
                    </Box>
                  </Box>
                  {(banner.clickCount !== undefined || banner.viewCount !== undefined) && (
                    <Box mt={1}>
                      <Typography variant="caption" color="textSecondary">
                        {t('banner.statsLabel', { views: String(banner.viewCount || 0), clicks: String(banner.clickCount || 0) })}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Banner编辑对话框 */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingBanner ? t('banner.editDialog') : t('banner.addDialog')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} style={{ mt: 1 }}>
            <Grid item xs={12}>
              <Input
                label={t('banner.field.title')}
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Input
                label={t('banner.field.subtitle')}
                value={formData.subtitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Input
                label={t('banner.field.imageUrlPc')}
                value={formData.imageUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Input
                label={t('banner.field.imageUrlMobile')}
                value={formData.imageUrlMobile}
                onChange={(e) => setFormData((prev) => ({ ...prev, imageUrlMobile: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{t('banner.field.platform')}</InputLabel>
                <Select
                  value={formData.platform}
                  label={t('banner.field.platform')}
                  onChange={(e) => setFormData((prev) => ({ ...prev, platform: e.target.value as Platform }))}
                >
                  <MenuItem value="ALL">{t('platform.ALL')}</MenuItem>
                  <MenuItem value="WEB">{t('platform.WEB')}</MenuItem>
                  <MenuItem value="H5">{t('platform.H5')}</MenuItem>
                  <MenuItem value="IOS">{t('platform.IOS')}</MenuItem>
                  <MenuItem value="ANDROID">{t('platform.ANDROID')}</MenuItem>
                  <MenuItem value="MINI_PROGRAM">{t('platform.MINI_PROGRAM')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{t('banner.field.actionType')}</InputLabel>
                <Select
                  value={formData.actionType}
                  label={t('banner.field.actionType')}
                  onChange={(e) => setFormData((prev) => ({ ...prev, actionType: e.target.value as BannerActionType }))}
                >
                  <MenuItem value="NONE">{t('actionType.NONE')}</MenuItem>
                  <MenuItem value="LINK">{t('actionType.LINK')}</MenuItem>
                  <MenuItem value="ROUTE">{t('actionType.ROUTE')}</MenuItem>
                  <MenuItem value="POPUP">{t('actionType.POPUP')}</MenuItem>
                  <MenuItem value="DEEP_LINK">{t('actionType.DEEP_LINK')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.actionType !== 'NONE' && (
              <>
                <Grid item xs={12} md={6}>
                  <Input
                    label={t('banner.field.actionValueWeb')}
                    value={formData.actionValue}
                    onChange={(e) => setFormData((prev) => ({ ...prev, actionValue: e.target.value }))}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Input
                    label={t('banner.field.actionValueApp')}
                    value={formData.actionValueApp}
                    onChange={(e) => setFormData((prev) => ({ ...prev, actionValueApp: e.target.value }))}
                    fullWidth
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12} md={4}>
              <Input
                label={t('banner.field.sortOrder')}
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Input
                label={t('banner.field.startTime')}
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Input
                label={t('banner.field.endTime')}
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={operating}
          >
            {editingBanner ? t('common.save') : t('common.add')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={() => !operating && setDeleteDialogOpen(false)}>
        <DialogTitle>{t('common.confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>{t('banner.deleteConfirm', { title: selectedBanner?.title || '' })}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={operating}>{t('common.cancel')}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={operating}
          >
            {t('common.confirmDelete')}
          </Button>
        </DialogActions>
      </Dialog>

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

export default BannerListPage;
