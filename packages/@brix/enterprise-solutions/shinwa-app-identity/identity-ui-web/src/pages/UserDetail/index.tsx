/**
 * 用户详情页面
 * 
 * @module identity-ui-web
 * @version 3.2.0
 * 
 * 【v3.2 前端三层分离架构】
 * - 页面组件（View 层）：只负责 UI 渲染
 * - 通过 useUserDetail Hook（ViewModel 层）获取数据和操作方法
 * - 通过 NavigationCapability 获取参数和执行导航
 * 
 * 【架构红线】
 * ❌ 禁止直接导入 api 层（如 userApi）
 * ❌ 禁止使用 react-router-dom 的 useNavigate
 * ❌ 禁止在页面中实现业务逻辑
 * ✅ 使用 useUserDetail Hook 管理状态和业务逻辑
 * ✅ 使用 navigation.requestNavigate(PageId, params)
 * 
 * 功能说明：
 * - 展示用户详细信息
 * - 支持启用/禁用/锁定/解锁操作
 * - 支持重置密码
 * 
 * @see ui-manifest.yaml pages[pageId="identity:user:detail"]
 * @see useUserDetail Hook 提供 ViewModel 层实现
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Chip,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Person,
  Edit,
  ArrowBack,
  Lock,
  LockOpen,
  Block,
  CheckCircle,
  VpnKey,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@brix/runtime-sdk-api-web';
import { useUserDetail } from '../../hooks/useUserDetail';
import { USER_ROLE_LABELS, USER_STATUS_LABELS, USER_STATUS_COLORS } from '../../types';
import { IDENTITY_PAGE_IDS } from 'identity-shared';

/**
 * 用户详情页面组件
 * 
 * 【v3.2 前端三层分离】
 * - 使用 useUserDetail Hook 获取状态和操作方法
 * - 页面只负责 UI 渲染和事件处理
 * - 业务逻辑完全委托给 Hook
 * 
 * 【使用能力契约】
 * - useNavigation: 获取页面参数，执行导航
 * - useUserDetail: ViewModel 层，管理数据和业务逻辑
 * 
 * 【架构红线】
 * ❌ 禁止直接导入 api 层
 * ❌ 禁止使用 react-router-dom
 * ✅ 使用 useUserDetail Hook 管理所有数据操作
 */
export default function UserDetail(): React.ReactElement {
  const { t } = useTranslation();
  const navigation = useNavigation();
  
  // 【v3.0 架构】通过 NavigationCapability 获取页面参数
  const params = navigation.getPageParams<{ id: string }>();
  const userId = params?.id ?? '';
  
  // ========================================================================
  // 使用 ViewModel Hook - 获取状态和操作方法
  // ========================================================================
  const {
    user,
    loading,
    submitting,
    error,
    permissions,
    enableUser,
    disableUser,
    lockUser,
    unlockUser,
    resetPassword,
  } = useUserDetail(userId);
  
  // 从 hook 获取权限
  const { canEdit, canResetPassword } = permissions;
  const canManageStatus = canEdit; // 状态管理权限与编辑权限相同
  
  // 密码重置对话框状态
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // ========================================================================
  // 事件处理 - 委托给 Hook 或执行导航
  // ========================================================================

  /**
   * 启用用户
   * 调用 hook 的 enableUser 方法
   */
  const handleEnable = useCallback(async () => {
    const reason = t('identity.reason.adminEnable', '管理员启用');
    await enableUser(reason);
  }, [enableUser, t]);

  /**
   * 禁用用户
   * 调用 hook 的 disableUser 方法
   */
  const handleDisable = useCallback(async () => {
    if (!window.confirm(t('identity.confirm.disableUser', '确定要禁用该用户吗？'))) return;
    const reason = t('identity.reason.adminDisable', '管理员禁用');
    await disableUser(reason);
  }, [disableUser, t]);

  /**
   * 锁定用户
   * 调用 hook 的 lockUser 方法
   */
  const handleLock = useCallback(async () => {
    if (!window.confirm(t('identity.confirm.lockUser', '确定要锁定该用户吗？'))) return;
    const reason = t('identity.reason.adminLock', '管理员锁定');
    await lockUser(reason);
  }, [lockUser, t]);

  /**
   * 解锁用户
   * 调用 hook 的 unlockUser 方法
   */
  const handleUnlock = useCallback(async () => {
    const reason = t('identity.reason.adminUnlock', '管理员解锁');
    await unlockUser(reason);
  }, [unlockUser, t]);

  /**
   * 重置密码
   * 调用 hook 的 resetPassword 方法
   */
  const handleResetPassword = useCallback(async () => {
    if (!newPassword) return;
    const success = await resetPassword(newPassword);
    if (success) {
      setPasswordDialogOpen(false);
      setNewPassword('');
      alert(t('identity.message.passwordResetSuccess', '密码重置成功'));
    }
  }, [newPassword, resetPassword, t]);

  /**
   * 返回上一页
   * 
   * 【v3.0 架构】使用 NavigationCapability 返回
   * 注意：使用 requestGoBack() 而非 goBack()，Host 可拒绝
   */
  const handleBack = useCallback(() => {
    navigation.requestGoBack();
  }, [navigation]);

  /**
   * 导航到编辑页面
   */
  const handleEdit = useCallback(() => {
    if (!userId) return;
    navigation.requestNavigate(IDENTITY_PAGE_IDS.USER_EDIT, { id: userId });
  }, [navigation, userId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          {t('common.back', '返回')}
        </Button>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">{t('identity.error.userNotFound', '用户不存在')}</Alert>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          {t('common.back', '返回')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 标题栏 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={handleBack}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" fontWeight="bold">
            {t('identity.page.userDetail.title', '用户详情')}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          {canEdit && (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={handleEdit}
            >
              {t('common.edit', '编辑')}
            </Button>
          )}
          {canResetPassword && (
            <Button
              variant="outlined"
              startIcon={<VpnKey />}
              onClick={() => setPasswordDialogOpen(true)}
            >
              {t('identity.action.resetPassword', '重置密码')}
            </Button>
          )}
        </Stack>
      </Stack>

      {/* 用户信息卡片 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {/* 头像和基本信息 */}
          <Grid item xs={12} md={4}>
            <Stack alignItems="center" spacing={2}>
              <Avatar
                src={user.avatarUrl}
                sx={{ width: 120, height: 120, fontSize: 48 }}
              >
                <Person sx={{ fontSize: 64 }} />
              </Avatar>
              <Typography variant="h6">{user.displayName || user.username}</Typography>
              <Typography variant="body2" color="text.secondary">
                @{user.username}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={USER_ROLE_LABELS[user.role] || user.role}
                  variant="outlined"
                />
                <Chip
                  label={USER_STATUS_LABELS[user.status] || user.status}
                  color={USER_STATUS_COLORS[user.status] || 'default'}
                />
              </Stack>
            </Stack>
          </Grid>

          {/* 详细信息 */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('identity.field.userId', '用户ID')}
                </Typography>
                <Typography variant="body1" fontFamily="monospace">
                  {user.userId}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('identity.field.tenantId', '租户ID')}
                </Typography>
                <Typography variant="body1">{user.tenantId}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('identity.field.email', '邮箱')}
                </Typography>
                <Typography variant="body1">{user.email || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('identity.field.phone', '手机号')}
                </Typography>
                <Typography variant="body1">{user.phone || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('identity.field.createdAt', '创建时间')}
                </Typography>
                <Typography variant="body1">
                  {new Date(user.createdAt).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  {t('identity.field.lastLoginAt', '最后登录')}
                </Typography>
                <Typography variant="body1">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* 操作按钮 */}
      {canManageStatus && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {t('identity.section.statusManagement', '状态管理')}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack direction="row" spacing={2}>
            {user.status === 'ACTIVE' && (
              <>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<Lock />}
                  onClick={handleLock}
                  disabled={submitting}
                >
                  {t('identity.action.lock', '锁定')}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Block />}
                  onClick={handleDisable}
                  disabled={submitting}
                >
                  {t('identity.action.disable', '禁用')}
                </Button>
              </>
            )}
            {user.status === 'LOCKED' && (
              <Button
                variant="outlined"
                color="success"
                startIcon={<LockOpen />}
                onClick={handleUnlock}
                disabled={submitting}
              >
                {t('identity.action.unlock', '解锁')}
              </Button>
            )}
            {user.status === 'DISABLED' && (
              <Button
                variant="outlined"
                color="success"
                startIcon={<CheckCircle />}
                onClick={handleEnable}
                disabled={submitting}
              >
                {t('identity.action.enable', '启用')}
              </Button>
            )}
          </Stack>
        </Paper>
      )}

      {/* 重置密码对话框 */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
        <DialogTitle>{t('identity.dialog.resetPassword.title', '重置密码')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('identity.dialog.resetPassword.newPassword', '新密码')}
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>
            {t('common.cancel', '取消')}
          </Button>
          <Button onClick={handleResetPassword} disabled={!newPassword || submitting}>
            {t('common.confirm', '确认')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
