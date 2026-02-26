/**
 * 用户列表页面
 * 
 * @module identity-ui-web
 * @version 3.2.0
 * 
 * 【v3.2 前端三层分离架构】
 * - 页面组件（View 层）：只负责 UI 渲染，不包含业务逻辑
 * - 通过 useUserList Hook（ViewModel 层）获取数据和操作方法
 * - 通过 NavigationCapability 执行导航（不使用 react-router-dom）
 * - 通过 EventBusCapability 发布用户选择事件
 * 
 * 【架构红线】
 * ❌ 禁止直接导入 api 层（如 userApi）
 * ❌ 禁止使用 react-router-dom 的 useNavigate
 * ❌ 禁止在页面中实现业务逻辑
 * ✅ 使用 useUserList Hook 管理状态和业务逻辑
 * ✅ 使用 navigation.requestNavigate(PageId, params)
 * 
 * 功能说明：
 * - 展示用户列表
 * - 支持分页、搜索
 * - 支持查看、编辑、删除操作
 * 
 * @see ui-manifest.yaml pages[pageId="identity:user:list"]
 * @see useUserList Hook 提供 ViewModel 层实现
 */

import React, { useCallback, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  CircularProgress,
  Alert,
  Stack,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Search,
  Refresh,
  Add,
  Edit,
  Delete,
  Visibility,
  Person,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigation, useEventBus } from '@brix/runtime-sdk-api-web';
import { useUserList } from '../../hooks/useUserList';
import type { User } from 'identity-shared';
import {
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
  USER_STATUS_COLORS,
} from '../../types';
import {
  IDENTITY_PAGE_IDS,
  IDENTITY_EVENTS,
} from 'identity-shared';
import type { UserSelectedPayload } from 'identity-shared';

/**
 * 用户列表页面组件
 * 
 * 【v3.2 前端三层分离】
 * - 使用 useUserList Hook 获取状态和操作方法
 * - 页面只负责 UI 渲染和事件处理
 * - 业务逻辑完全委托给 Hook
 * 
 * 【使用能力契约】
 * - useNavigation: 执行 PageId 导航
 * - useEventBus: 发布用户选择事件
 * - useUserList: ViewModel 层，管理数据和业务逻辑
 * 
 * 【架构红线】
 * ❌ 禁止使用 react-router-dom 的 useNavigate
 * ❌ 禁止直接操作 URL
 * ❌ 禁止直接导入 api 层
 * ✅ 使用 navigation.requestNavigate(PageId, params)
 * ✅ 使用 useUserList Hook 管理状态
 */
export default function UserList(): React.ReactElement {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const eventBus = useEventBus();
  
  // ========================================================================
  // 使用 ViewModel Hook - 获取状态和操作方法
  // ========================================================================
  const {
    users,
    loading,
    error,
    pagination,
    keyword,
    permissions,
    refresh,
    search,
    setPage,
    setPageSize,
    deleteUser,
    clearFilters,
  } = useUserList();
  
  // 从 hook 获取权限
  const { canCreate, canEdit, canDelete } = permissions;
  
  // 本地搜索关键字状态（用于输入框受控）
  const [searchKeyword, setSearchKeyword] = useState(keyword);

  // ========================================================================
  // 事件处理 - 委托给 Hook 或执行导航
  // ========================================================================

  /**
   * 搜索
   * 调用 hook 的 search 方法
   */
  const handleSearch = useCallback(() => {
    search(searchKeyword);
  }, [search, searchKeyword]);

  /**
   * 刷新
   * 清除搜索条件并刷新列表
   */
  const handleRefresh = useCallback(() => {
    setSearchKeyword('');
    clearFilters();
  }, [clearFilters]);

  /**
   * 分页变更
   * 调用 hook 的 setPage 方法
   */
  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, [setPage]);

  /**
   * 每页条数变更
   * 调用 hook 的 setPageSize 方法
   */
  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
  }, [setPageSize]);

  /**
   * 导航到创建用户页面
   * 
   * 【v3.0 架构】使用 PageId 导航，不直接操作 URL
   */
  const handleCreate = useCallback(() => {
    navigation.requestNavigate(IDENTITY_PAGE_IDS.USER_CREATE);
  }, [navigation]);

  /**
   * 导航到用户详情页面
   * 
   * 【v3.0 架构】
   * 1. 发布用户选择事件（供其他模块响应）
   * 2. 使用 PageId 导航
   */
  const handleView = useCallback((user: User) => {
    // 发布用户选择事件
    const payload: UserSelectedPayload = {
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
    };
    eventBus.emit(IDENTITY_EVENTS.USER_SELECTED, payload);
    
    // 导航到详情页
    navigation.requestNavigate(IDENTITY_PAGE_IDS.USER_DETAIL, {
      id: user.userId,
    });
  }, [navigation, eventBus]);

  /**
   * 导航到编辑用户页面
   */
  const handleEdit = useCallback((user: User) => {
    navigation.requestNavigate(IDENTITY_PAGE_IDS.USER_EDIT, {
      id: user.userId,
    });
  }, [navigation]);

  /**
   * 删除用户
   * 调用 hook 的 deleteUser 方法
   */
  const handleDelete = useCallback(async (userId: string) => {
    if (!window.confirm(t('identity.confirm.deleteUser', '确定要删除该用户吗？'))) return;
    await deleteUser(userId);
  }, [deleteUser, t]);

  return (
    <Box sx={{ p: 3 }}>
      {/* 标题栏 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          {t('identity.page.userList.title', '用户管理')}
        </Typography>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            {t('identity.action.createUser', '新建用户')}
          </Button>
        )}
      </Stack>

      {/* 搜索栏 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder={t('identity.search.placeholder', '搜索用户名、邮箱、手机号...')}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <Button variant="outlined" onClick={handleSearch}>
            {t('common.search', '搜索')}
          </Button>
          <IconButton onClick={handleRefresh}>
            <Refresh />
          </IconButton>
        </Stack>
      </Paper>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 用户列表 */}
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('identity.field.user', '用户')}</TableCell>
                  <TableCell>{t('identity.field.userId', '用户ID')}</TableCell>
                  <TableCell>{t('identity.field.email', '邮箱')}</TableCell>
                  <TableCell>{t('identity.field.phone', '手机号')}</TableCell>
                  <TableCell>{t('identity.field.role', '角色')}</TableCell>
                  <TableCell>{t('identity.field.status', '状态')}</TableCell>
                  <TableCell>{t('identity.field.createdAt', '创建时间')}</TableCell>
                  <TableCell align="right">{t('common.actions', '操作')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar src={user.avatarUrl} sx={{ width: 32, height: 32 }}>
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {user.displayName || user.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{user.username}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {user.userId}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={USER_ROLE_LABELS[user.role] || user.role}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={USER_STATUS_LABELS[user.status] || user.status}
                        size="small"
                        color={USER_STATUS_COLORS[user.status] || 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={t('common.view', '查看')}>
                        <IconButton
                          size="small"
                          onClick={() => handleView(user)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canEdit && (
                        <Tooltip title={t('common.edit', '编辑')}>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title={t('common.delete', '删除')}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(user.userId)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {t('identity.emptyState.noUsers', '暂无用户数据')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={pagination.totalElements}
              page={pagination.page}
              rowsPerPage={pagination.size}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              labelRowsPerPage={t('common.rowsPerPage', '每页条数')}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}
