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
import { usePageParams } from '@brix/runtime-sdk-api-web';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  TextField,
  Typography,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon, Refresh as ResetIcon } from '@mui/icons-material';
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
        message: isEditMode ? '更新成功' : '创建成功', 
        severity: 'success' 
      });
      
      if (!isEditMode) {
        // 创建成功后延迟跳转到列表页
        setTimeout(() => navigateToList(), 1500);
      }
    } else if (error) {
      setSnackbar({ 
        open: true, 
        message: `${isEditMode ? '更新' : '创建'}失败: ${error.message}`, 
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
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>加载中...</Typography>
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
        <Button startIcon={<BackIcon />} onClick={navigateToList} sx={{ mr: 2 }}>
          返回
        </Button>
        <Typography variant="h4" component="h1">
          {isEditMode ? '编辑轮播位' : '新建轮播位'}
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
                  基本信息
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="轮播位编码"
                  value={formData.code}
                  onChange={handleChange('code')}
                  fullWidth
                  required
                  disabled={isEditMode}
                  helperText="唯一标识，创建后不可修改"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="轮播位名称"
                  value={formData.name}
                  onChange={handleChange('name')}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="描述"
                  value={formData.description}
                  onChange={handleChange('description')}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>

              {/* 尺寸设置 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  尺寸设置
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="宽度 (px)"
                  type="number"
                  value={formData.width}
                  onChange={handleChange('width')}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="高度 (px)"
                  type="number"
                  value={formData.height}
                  onChange={handleChange('height')}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="最大Banner数量"
                  type="number"
                  value={formData.maxBannerCount}
                  onChange={handleChange('maxBannerCount')}
                  fullWidth
                />
              </Grid>

              {/* 播放设置 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  播放设置
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
                  label="自动播放"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  label="播放间隔 (ms)"
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
                  label="显示指示器"
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
                  label="显示箭头"
                />
              </Grid>

              {/* 提交按钮 */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                  {isDirty && (
                    <Button
                      variant="outlined"
                      startIcon={<ResetIcon />}
                      onClick={reset}
                      disabled={submitting}
                    >
                      重置
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={submitting}
                  >
                    {submitting 
                      ? (isEditMode ? '保存中...' : '创建中...') 
                      : (isEditMode ? '保存修改' : '创建轮播位')
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
        <Alert severity={snackbar.severity} onClose={handleSnackbarClose}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CarouselDetailPage;
