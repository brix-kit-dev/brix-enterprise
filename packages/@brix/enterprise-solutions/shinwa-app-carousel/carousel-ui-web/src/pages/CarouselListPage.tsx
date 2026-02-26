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
import { useNavigate } from '@brix/runtime-sdk-api-web';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useCarouselList } from '../hooks';
import type { CarouselDTO } from '@shinwa/carousel-shared';

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
      setSnackbar({ open: true, message: '删除成功', severity: 'success' });
      setDeleteDialogOpen(false);
    } catch (err) {
      setSnackbar({ open: true, message: '删除失败', severity: 'error' });
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
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>加载中...</Typography>
      </Box>
    );
  }

  // ─────────────────────────────────────────────────────────
  // 渲染：错误状态
  // ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <Alert severity="error">
        加载轮播位列表失败: {error.message || '未知错误'}
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
          轮播位管理
        </Typography>
        <Box>
          <Tooltip title="刷新列表">
            <IconButton onClick={refresh} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('carousel:create')}
          >
            新建轮播位
          </Button>
        </Box>
      </Box>

      {/* 轮播位列表 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>编码</TableCell>
              <TableCell>名称</TableCell>
              <TableCell>尺寸</TableCell>
              <TableCell align="center">Banner数量</TableCell>
              <TableCell align="center">自动播放</TableCell>
              <TableCell align="center">状态</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {carousels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary" py={4}>
                    暂无轮播位，点击"新建轮播位"创建
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
                    <Chip
                      label={carousel.banners?.length || 0}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={carousel.settings?.autoPlay ? '是' : '否'}
                      size="small"
                      color={carousel.settings?.autoPlay ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={carousel.enabled ? '启用' : '禁用'}
                      size="small"
                      color={carousel.enabled ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="查看Banner">
                      <IconButton
                        size="small"
                        onClick={() => navigate('carousel:banners', { id: carousel.id })}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="编辑">
                      <IconButton
                        size="small"
                        onClick={() => navigate('carousel:edit', { id: carousel.id })}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="删除">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(carousel)}
                      >
                        <DeleteIcon />
                      </IconButton>
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
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除轮播位 <strong>{selectedCarousel?.name}</strong> 吗？
            此操作将同时删除该轮播位下的所有Banner，且不可恢复。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} disabled={deleteLoading}>
            取消
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deleteLoading}
          >
            {deleteLoading ? '删除中...' : '确认删除'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <Alert severity={snackbar.severity} onClose={handleSnackbarClose}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CarouselListPage;
