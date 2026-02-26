/**
 * 用户创建/编辑页面
 * 
 * @module identity-ui-web
 * @version 3.2.0
 * 
 * 【v3.2 前端三层分离架构】
 * - 页面组件（View 层）：只负责 UI 渲染和表单处理
 * - 创建模式：使用 useUserCreate Hook
 * - 编辑模式：使用 useUserDetail Hook
 * - 通过 NavigationCapability 获取参数和执行导航
 * 
 * 【架构红线】
 * ❌ 禁止直接导入 api 层（如 userApi）
 * ❌ 禁止使用 react-router-dom 的 useNavigate
 * ❌ 禁止在页面中实现业务逻辑
 * ✅ 使用 ViewModel Hooks 管理状态和业务逻辑
 * ✅ 使用 navigation.requestNavigate(PageId, params)
 * 
 * 功能说明：
 * - 创建新用户
 * - 编辑现有用户
 * - 表单验证
 * 
 * @see ui-manifest.yaml pages[pageId="identity:user:create"]
 * @see useUserCreate Hook 提供创建模式的 ViewModel
 * @see useUserDetail Hook 提供编辑模式的 ViewModel
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import { ArrowBack, Save, Cancel } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@brix/runtime-sdk-api-web';
import { useUserCreate } from '../../hooks/useUserCreate';
import { useUserDetail } from '../../hooks/useUserDetail';
import type { CreateUserParams } from 'identity-shared';
import { UserRole, USER_ROLE_LABELS } from '../../types';
import { IDENTITY_PAGE_IDS } from 'identity-shared';

/**
 * 用户创建/编辑页面组件
 * 
 * 【v3.2 前端三层分离】
 * - 使用 useUserCreate Hook 处理创建模式
 * - 使用 useUserDetail Hook 处理编辑模式
 * - 页面只负责 UI 渲染和表单处理
 * 
 * 【使用能力契约】
 * - useNavigation: 获取页面参数（编辑模式的 userId），执行导航
 * - useUserCreate: 创建模式的 ViewModel
 * - useUserDetail: 编辑模式的 ViewModel
 * 
 * 【页面模式】
 * - 创建模式：无 id 参数
 * - 编辑模式：有 id 参数
 */
export default function UserCreate(): React.ReactElement {
  const { t } = useTranslation();
  const navigation = useNavigation();
  
  // 【v3.0 架构】通过 NavigationCapability 获取页面参数
  const params = navigation.getPageParams<{ id?: string }>();
  const userId = params?.id ?? '';
  const isEdit = !!userId;
  
  // ========================================================================
  // 使用 ViewModel Hooks
  // ========================================================================
  
  // 创建模式 Hook
  const {
    submitting: createSubmitting,
    error: createError,
    roles,
    rolesLoading,
    createUser,
    navigateToList,
    clearError: clearCreateError,
  } = useUserCreate();
  
  // 编辑模式 Hook（仅在编辑模式下有效）
  const {
    user: existingUser,
    loading: userLoading,
    submitting: updateSubmitting,
    error: updateError,
    updateUser,
  } = useUserDetail(userId);
  
  // 合并状态
  const submitting = isEdit ? updateSubmitting : createSubmitting;
  const hookError = isEdit ? updateError : createError;
  
  // 表单状态
  const [formData, setFormData] = useState<CreateUserParams>({
    username: '',
    password: '',
    email: undefined,
    phone: undefined,
    displayName: undefined,
    avatarUrl: undefined,
    role: UserRole.USER,
    tenantId: 'default',
  });
  
  const [localError, setLocalError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // 合并错误显示
  const error = localError || hookError;
  
  // 编辑模式：从 useUserDetail 加载的数据填充表单
  useEffect(() => {
    if (isEdit && existingUser) {
      setFormData({
        username: existingUser.username,
        password: '', // 编辑时不显示密码
        email: existingUser.email,
        phone: existingUser.phone,
        displayName: existingUser.displayName,
        avatarUrl: existingUser.avatarUrl,
        role: existingUser.roles?.[0] as UserRole || UserRole.USER,
        tenantId: existingUser.tenantId,
      });
    }
  }, [isEdit, existingUser]);

  /**
   * 表单字段变更处理
   */
  const handleChange = useCallback((field: keyof CreateUserRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
    // 清除该字段的验证错误
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  /**
   * 表单验证
   */
  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.username?.trim()) {
      errors.username = t('identity.validation.usernameRequired', '用户名不能为空');
    } else if (formData.username.length < 3) {
      errors.username = t('identity.validation.usernameTooShort', '用户名长度不能少于3位');
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = t('identity.validation.usernameInvalid', '用户名只能包含字母、数字和下划线');
    }
    
    if (!isEdit && !formData.password?.trim()) {
      errors.password = t('identity.validation.passwordRequired', '密码不能为空');
    } else if (!isEdit && formData.password && formData.password.length < 6) {
      errors.password = t('identity.validation.passwordTooShort', '密码长度不能少于6位');
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('identity.validation.emailInvalid', '邮箱格式不正确');
    }
    
    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      errors.phone = t('identity.validation.phoneInvalid', '手机号格式不正确');
    }
    
    if (!formData.tenantId?.trim()) {
      errors.tenantId = t('identity.validation.tenantIdRequired', '租户ID不能为空');
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, isEdit, t]);

  /**
   * 提交表单
   * 根据模式调用不同的 Hook 方法
   */
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    
    setLocalError(null);
    
    try {
      if (isEdit && userId) {
        // 编辑模式：调用 useUserDetail 的 updateUser
        const success = await updateUser({
          email: formData.email,
          phone: formData.phone,
          displayName: formData.displayName,
          avatarUrl: formData.avatarUrl,
        });
        if (success) {
          navigateToList();
        }
      } else {
        // 创建模式：调用 useUserCreate 的 createUser
        const success = await createUser(formData as CreateUserParams);
        if (success) {
          navigateToList();
        }
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('identity.error.operationFailed', '操作失败'));
    }
  }, [formData, isEdit, userId, navigateToList, updateUser, createUser, validate, t]);

  /**
   * 取消操作
   * 
   * 【v3.0 架构】使用 requestGoBack()，Host 可拒绝
   */
  const handleCancel = useCallback(() => {
    navigation.requestGoBack();
  }, [navigation]);

  /**
   * 返回上一页
   * 
   * 【v3.0 架构】使用 requestGoBack()，Host 可拒绝
   */
  const handleBack = useCallback(() => {
    navigation.requestGoBack();
  }, [navigation]);

  if (userLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 标题栏 */}
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <IconButton onClick={handleBack}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" fontWeight="bold">
          {isEdit 
            ? t('identity.page.userEdit.title', '编辑用户')
            : t('identity.page.userCreate.title', '创建用户')
          }
        </Typography>
      </Stack>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 表单 */}
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* 基本信息 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {t('identity.section.basicInfo', '基本信息')}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label={t('identity.field.username', '用户名')}
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              error={!!validationErrors.username}
              helperText={validationErrors.username}
              disabled={isEdit} // 编辑时不允许修改用户名
            />
          </Grid>

          {!isEdit && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label={t('identity.field.password', '密码')}
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={!!validationErrors.password}
                helperText={validationErrors.password}
              />
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('identity.field.displayName', '显示名称')}
              value={formData.displayName || ''}
              onChange={(e) => handleChange('displayName', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>{t('identity.field.role', '角色')}</InputLabel>
              <Select
                value={formData.role}
                label={t('identity.field.role', '角色')}
                onChange={(e) => handleChange('role', e.target.value as UserRole)}
              >
                {Object.entries(USER_ROLE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* 联系方式 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
              {t('identity.section.contactInfo', '联系方式')}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('identity.field.email', '邮箱')}
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('identity.field.phone', '手机号')}
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              error={!!validationErrors.phone}
              helperText={validationErrors.phone}
            />
          </Grid>

          {/* 其他信息 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
              {t('identity.section.otherInfo', '其他信息')}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label={t('identity.field.tenantId', '租户ID')}
              value={formData.tenantId}
              onChange={(e) => handleChange('tenantId', e.target.value)}
              error={!!validationErrors.tenantId}
              helperText={validationErrors.tenantId}
              disabled={isEdit} // 编辑时不允许修改租户
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('identity.field.avatarUrl', '头像URL')}
              value={formData.avatarUrl || ''}
              onChange={(e) => handleChange('avatarUrl', e.target.value)}
            />
          </Grid>

          {/* 操作按钮 */}
          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleCancel}
                disabled={submitting}
              >
                {t('common.cancel', '取消')}
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting 
                  ? <CircularProgress size={24} /> 
                  : (isEdit 
                      ? t('common.save', '保存') 
                      : t('common.create', '创建')
                    )
                }
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
