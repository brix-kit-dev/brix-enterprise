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
import { useNavigate, usePageParams } from '@brix/runtime-sdk-api-web';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  Snackbar,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Visibility as EnableIcon,
  VisibilityOff as DisableIcon,
} from '@mui/icons-material';
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
        setSnackbar({ open: true, message: '更新成功', severity: 'success' });
        handleCloseDialog();
      } else {
        setSnackbar({ open: true, message: '更新失败', severity: 'error' });
      }
    } else {
      success = await addBanner(data);
      if (success) {
        setSnackbar({ open: true, message: '添加成功', severity: 'success' });
        handleCloseDialog();
      } else {
        setSnackbar({ open: true, message: '添加失败', severity: 'error' });
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
      setSnackbar({ open: true, message: '删除成功', severity: 'success' });
      setDeleteDialogOpen(false);
      setSelectedBanner(null);
    } else {
      setSnackbar({ open: true, message: '删除失败', severity: 'error' });
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
      setSnackbar({ open: true, message: '操作成功', severity: 'success' });
    } else {
      setSnackbar({ open: true, message: '操作失败', severity: 'error' });
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
      case 'ENABLED': return '已启用';
      case 'DISABLED': return '已禁用';
      case 'DRAFT': return '草稿';
      case 'EXPIRED': return '已过期';
      default: return status;
    }
  };

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
  if (error && !carousel) {
    return (
      <Alert severity="error">
        加载Banner数据失败: {error || '未知错误'}
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
          <Button startIcon={<BackIcon />} onClick={() => navigate('carousel:list')} sx={{ mr: 2 }}>
            返回
          </Button>
          <Typography variant="h4" component="h1">
            {carousel?.name} - Banner管理
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          添加Banner
        </Button>
      </Box>

      {/* Banner列表 */}
      <Grid container spacing={3}>
        {(!banners || banners.length === 0) ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="textSecondary">
                暂无Banner，点击"添加Banner"创建
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
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="h6" noWrap sx={{ flex: 1 }}>
                      {banner.title}
                    </Typography>
                    <Chip
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
                      <Chip label={banner.platform} size="small" variant="outlined" sx={{ mr: 1 }} />
                      <Chip label={`排序: ${banner.sortOrder}`} size="small" variant="outlined" />
                    </Box>
                    <Box>
                      <Tooltip title={banner.status === 'ENABLED' ? '禁用' : '启用'}>
                        <IconButton
                          size="small"
                          disabled={operating}
                          onClick={() => handleToggleBanner(banner)}
                        >
                          {banner.status === 'ENABLED' ? <DisableIcon /> : <EnableIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="编辑">
                        <IconButton size="small" onClick={() => handleOpenDialog(banner)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="删除">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedBanner(banner);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  {(banner.clickCount !== undefined || banner.viewCount !== undefined) && (
                    <Box mt={1}>
                      <Typography variant="caption" color="textSecondary">
                        展示: {banner.viewCount || 0} | 点击: {banner.clickCount || 0}
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
        <DialogTitle>{editingBanner ? '编辑Banner' : '添加Banner'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="标题"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="副标题"
                value={formData.subtitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="图片URL (PC端)"
                value={formData.imageUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="图片URL (移动端)"
                value={formData.imageUrlMobile}
                onChange={(e) => setFormData((prev) => ({ ...prev, imageUrlMobile: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>目标平台</InputLabel>
                <Select
                  value={formData.platform}
                  label="目标平台"
                  onChange={(e) => setFormData((prev) => ({ ...prev, platform: e.target.value as Platform }))}
                >
                  <MenuItem value="ALL">全平台</MenuItem>
                  <MenuItem value="WEB">Web端</MenuItem>
                  <MenuItem value="H5">H5</MenuItem>
                  <MenuItem value="IOS">iOS</MenuItem>
                  <MenuItem value="ANDROID">Android</MenuItem>
                  <MenuItem value="MINI_PROGRAM">小程序</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>点击动作</InputLabel>
                <Select
                  value={formData.actionType}
                  label="点击动作"
                  onChange={(e) => setFormData((prev) => ({ ...prev, actionType: e.target.value as BannerActionType }))}
                >
                  <MenuItem value="NONE">无</MenuItem>
                  <MenuItem value="LINK">打开链接</MenuItem>
                  <MenuItem value="ROUTE">跳转路由</MenuItem>
                  <MenuItem value="POPUP">弹窗</MenuItem>
                  <MenuItem value="DEEP_LINK">Deep Link</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.actionType !== 'NONE' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="动作值 (Web端)"
                    value={formData.actionValue}
                    onChange={(e) => setFormData((prev) => ({ ...prev, actionValue: e.target.value }))}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="动作值 (App端)"
                    value={formData.actionValueApp}
                    onChange={(e) => setFormData((prev) => ({ ...prev, actionValueApp: e.target.value }))}
                    fullWidth
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12} md={4}>
              <TextField
                label="排序"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="生效开始时间"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="生效结束时间"
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
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={operating}
          >
            {editingBanner ? '保存' : '添加'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={() => !operating && setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>确定要删除Banner "{selectedBanner?.title}" 吗？此操作不可恢复。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={operating}>取消</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={operating}
          >
            确认删除
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

export default BannerListPage;
