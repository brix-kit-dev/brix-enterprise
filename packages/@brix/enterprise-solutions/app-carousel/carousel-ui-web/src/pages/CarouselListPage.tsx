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
 * @file 轮播位列表页面
 * @description 轮播位管理列表 - v3.2 View 层实现
 * @module carousel-ui-web/pages/CarouselListPage
 * @version 3.2.0
 * 
 * 【v3.2 前后端分离架构 - View 层】
 * 本组件是纯粹的 View 层实现：
 * 1. 不直接调用 API，通过 useCarouselList Hook 获取数据
 * 2. 只负责 UI 渲染和用户交互
 * 3. 业务逻辑封装在 ViewModel（Hook）层
 * 
 * @author Brix Team
 * @since 3.0.0
 */
import React, { useState, useCallback } from 'react';
import { useNavigate, useUI, useI18n } from '@brix-sdk/runtime-sdk-react';
import { useCarouselList } from '../hooks';
import type { CarouselDTO } from '@brix-sdk/enterprise-carousel-shared';

/**
 * 轮播位列表页面组件
 * 
 * 【职责说明】
 * - View 层：负责 UI 渲染和用户交互
 * - 通过 useCarouselList 获取数据和操作方法
 * - 不直接与 API 层交互
 */
export const CarouselListPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n('carousel');
  const { Box, Button, Tag, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar, Tooltip, Spin, Icon } = useUI();
  
  // ─────────────────────────────────────────────────────────
  // 使用 ViewModel Hook 获取数据和操作方法
  // ─────────────────────────────────────────────────────────
  const {
    carousels,
    loading,
    error,
    refresh,
    deleteCarousel,
  } = useCarouselList();

  // ─────────────────────────────────────────────────────────
  // 本地 UI 状态
  // ─────────────────────────────────────────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCarousel, setSelectedCarousel] = useState<CarouselDTO | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // ─────────────────────────────────────────────────────────
  // 事件处理
  // ─────────────────────────────────────────────────────────
  
  /**
   * 打开删除确认对话框
   */
  const handleDeleteClick = useCallback((carousel: CarouselDTO) => {
    setSelectedCarousel(carousel);
    setDeleteDialogOpen(true);
  }, []);

  /**
   * 确认删除轮播位
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedCarousel?.id) return;
    
    setDeleteLoading(true);
    try {
      await deleteCarousel(selectedCarousel.id);
      setSnackbar({ open: true, message: t('message.deleteSuccess'), severity: 'success' });
      setDeleteDialogOpen(false);
    } catch (err) {
      setSnackbar({ open: true, message: t('message.deleteFailed'), severity: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedCarousel, deleteCarousel]);

  /**
   * 关闭删除对话框
   */
  const handleDeleteDialogClose = useCallback(() => {
    if (!deleteLoading) {
      setDeleteDialogOpen(false);
      setSelectedCarousel(null);
    }
  }, [deleteLoading]);

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
  // 渲染：错误状态
  // ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <Alert type="error">
        {t('list.loadFailed')}: {error.message || t('common.unknownError')}
      </Alert>
    );
  }

  // ─────────────────────────────────────────────────────────
  // 渲染：主内容
  // ─────────────────────────────────────────────────────────
  return (
    <Box p={3}>
      {/* 页面标题栏 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {t('list.title')}
        </Typography>
        <Box>
          <Tooltip title={t('list.refreshTooltip')}>
            <Button variant="text" onClick={refresh} style={{ mr: 1 }}>
              <Icon name="refresh" />
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Icon name="add" />}
            onClick={() => navigate('carousel:create')}
          >
            {t('list.create')}
          </Button>
        </Box>
      </Box>

      {/* 轮播位列表 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('list.col.code')}</TableCell>
              <TableCell>{t('list.col.name')}</TableCell>
              <TableCell>{t('list.col.size')}</TableCell>
              <TableCell align="center">{t('list.col.bannerCount')}</TableCell>
              <TableCell align="center">{t('list.col.autoPlay')}</TableCell>
              <TableCell align="center">{t('list.col.status')}</TableCell>
              <TableCell align="center">{t('list.col.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {carousels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary" py={4}>
                    {t('list.empty')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              carousels.map((carousel) => (
                <TableRow key={carousel.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {carousel.code}
                    </Typography>
                  </TableCell>
                  <TableCell>{carousel.name}</TableCell>
                  <TableCell>
                    {carousel.settings?.width && carousel.settings?.height
                      ? `${carousel.settings.width} × ${carousel.settings.height}`
                      : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Tag
                      label={carousel.banners?.length || 0}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tag
                      label={carousel.settings?.autoPlay ? t('common.yes') : t('common.no')}
                      size="small"
                      color={carousel.settings?.autoPlay ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tag
                      label={carousel.enabled ? t('status.enabled') : t('status.disabled')}
                      size="small"
                      color={carousel.enabled ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={t('list.action.viewBanners')}>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => navigate('carousel:banners', { id: carousel.id })}
                      >
                        <Icon name="visibility" />
                      </Button>
                    </Tooltip>
                    <Tooltip title={t('common.edit')}>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => navigate('carousel:edit', { id: carousel.id })}
                      >
                        <Icon name="edit" />
                      </Button>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <Button
                        variant="text"
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(carousel)}
                      >
                        <Icon name="delete" />
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>{t('common.confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('list.deleteConfirm', { name: selectedCarousel?.name || '' })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} disabled={deleteLoading}>
            {t('common.cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deleteLoading}
          >
            {deleteLoading ? t('list.deleting') : t('common.confirmDelete')}
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

export default CarouselListPage;
