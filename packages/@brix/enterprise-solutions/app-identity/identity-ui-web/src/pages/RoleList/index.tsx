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
 * @file Role List Page
 * @description Page for displaying and managing role list
 * @module identity-ui-web/pages/RoleList
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This component is a pure View layer implementation:
 * - Renders role list with filters
 * - Delegates all business logic to useRoleList hook (ViewModel)
 * - Does not directly access Repository layer
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

import React, { useState } from 'react';
import { useUI, useTheme } from '@brix-sdk/runtime-sdk-react';
import { useRoleList } from '../../hooks/useRoleList';

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Role List Page Component
 * 
 * Displays role list with filtering and CRUD actions.
 * 
 * Features:
 * - Keyword search (filters client-side)
 * - Toggle filters for enabled/custom roles
 * - Inline enable/disable toggle
 * - Row action menu
 * - Delete confirmation for custom roles
 */
export const RoleListPage: React.FC = () => {
  const { Box, Paper, Typography, Button, Input, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tag, Menu, MenuItem, FormControlLabel, Switch, Tooltip, Spin, Alert, Dialog, DialogTitle, DialogContent, DialogActions } = useUI();
  const { tokens } = useTheme();

  // ========================================================================
  // ViewModel Hook
  // ========================================================================
  
  const {
    filteredRoles,
    loading,
    error,
    filters,
    refresh,
    setFilters,
    navigateToDetail,
    navigateToCreate,
    deleteRole,
    toggleRoleEnabled,
  } = useRoleList();

  // ========================================================================
  // Local State
  // ========================================================================
  
  // Search input
  const [searchInput, setSearchInput] = useState(filters.keyword);
  
  // Row action menu
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRoleId, setMenuRoleId] = useState<number | null>(null);
  const [menuRoleBuiltIn, setMenuRoleBuiltIn] = useState(false);
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingName, setDeletingName] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // Toggle loading state
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * Handle search input change
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchInput(value);
    setFilters({ keyword: value });
  };

  /**
   * Handle clear search
   */
  const handleClearSearch = () => {
    setSearchInput('');
    setFilters({ keyword: '' });
  };

  /**
   * Handle enabled only filter
   */
  const handleEnabledOnlyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ enabledOnly: event.target.checked });
  };

  /**
   * Handle custom only filter
   */
  const handleCustomOnlyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ customOnly: event.target.checked });
  };

  /**
   * Handle row menu open
   */
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    roleId: number,
    builtIn: boolean
  ) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuRoleId(roleId);
    setMenuRoleBuiltIn(builtIn);
  };

  /**
   * Handle row menu close
   */
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuRoleId(null);
    setMenuRoleBuiltIn(false);
  };

  /**
   * Handle view action
   */
  const handleView = () => {
    if (menuRoleId) {
      navigateToDetail(menuRoleId);
    }
    handleMenuClose();
  };

  /**
   * Handle delete action
   */
  const handleDeleteClick = () => {
    if (menuRoleId) {
      const role = filteredRoles.find((r) => r.id === menuRoleId);
      setDeletingId(menuRoleId);
      setDeletingName(role?.name || '');
      setDeleteDialogOpen(true);
    }
    handleMenuClose();
  };

  /**
   * Confirm delete
   */
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    
    setDeleting(true);
    const success = await deleteRole(deletingId);
    setDeleting(false);
    
    if (success) {
      setDeleteDialogOpen(false);
      setDeletingId(null);
      setDeletingName('');
    }
  };

  /**
   * Cancel delete
   */
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeletingId(null);
    setDeletingName('');
  };

  /**
   * Handle toggle enabled
   */
  const handleToggleEnabled = async (roleId: number, currentEnabled: boolean) => {
    setTogglingId(roleId);
    await toggleRoleEnabled(roleId, !currentEnabled);
    setTogglingId(null);
  };

  /**
   * Handle row click
   */
  const handleRowClick = (roleId: number) => {
    navigateToDetail(roleId);
  };

  // ========================================================================
  // Render
  // ========================================================================
  
  return (
    <Box style={{ padding: 24 }}>
      {/* Page Header */}
      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Box>
          <Typography variant="h5" style={{ marginBottom: '0.35em' }}>
            角色管理
          </Typography>
          <Typography variant="body2" style={{ color: tokens.colors.text.secondary }}>
            管理系统中的角色和权限
          </Typography>
        </Box>
        <Box style={{ display: 'flex', gap: 8 }}>
          <Tooltip title="刷新列表">
            <Button variant="text" size="small" onClick={refresh} disabled={loading} startIcon="refresh">{null}</Button>
          </Tooltip>
          <Button
            variant="primary"
            startIcon="add"
            onClick={navigateToCreate}
          >
            新建角色
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert type="error" style={{ marginBottom: 24 }}>
          {error.message}
        </Alert>
      )}

      {/* Search and Filters */}
      <Paper style={{ padding: 16, marginBottom: 24 }}>
        <Box style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Field */}
          <Input
            placeholder="搜索角色名称或编码..."
            value={searchInput}
            onChange={handleSearchChange}
            size="small"
            style={{ width: 300 }}
          />

          {/* Filter Switches */}
          <FormControlLabel
            control={
              <Switch
                checked={filters.enabledOnly}
                onChange={handleEnabledOnlyChange}
                size="small"
              />
            }
            label="仅显示启用"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={filters.customOnly}
                onChange={handleCustomOnlyChange}
                size="small"
              />
            }
            label="仅显示自定义"
          />
        </Box>
      </Paper>

      {/* Data Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>角色名称</TableCell>
                <TableCell>角色编码</TableCell>
                <TableCell>描述</TableCell>
                <TableCell align="center">权限数</TableCell>
                <TableCell align="center">状态</TableCell>
                <TableCell align="center">类型</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" style={{ paddingTop: 64, paddingBottom: 64 }}>
                    <Spin />
                  </TableCell>
                </TableRow>
              ) : filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" style={{ paddingTop: 64, paddingBottom: 64 }}>
                    <span className="material-icons" style={{ fontSize: 48, color: 'rgba(0,0,0,0.26)', marginBottom: 8, display: 'block' }}>security</span>
                    <Typography style={{ color: tokens.colors.text.secondary }}>
                      {filters.keyword || filters.enabledOnly || filters.customOnly
                        ? '没有找到匹配的角色'
                        : '暂无角色数据'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow
                    key={role.id}
                    hover
                    onClick={() => handleRowClick(role.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-icons" style={{ fontSize: 20, color: 'rgba(0,0,0,0.54)' }}>security</span>
                        <Typography variant="body2">{role.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" style={{ color: tokens.colors.text.secondary, fontFamily: 'monospace' }}>
                        {role.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        style={{
                          color: tokens.colors.text.secondary,
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {role.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tag size="small">
                        {role.permissions.length}
                      </Tag>
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      {togglingId === role.id ? (
                        <Spin size={20} />
                      ) : (
                        <Tooltip title={role.enabled ? '点击禁用' : '点击启用'}>
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => handleToggleEnabled(role.id, role.enabled)}
                            disabled={role.builtIn}
                            startIcon={role.enabled ? "check_circle" : "block"}
                            style={role.enabled ? { color: tokens.colors.status.success } : { color: 'rgba(0,0,0,0.26)' }}
                          >{null}</Button>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {role.builtIn ? (
                        <Tooltip title="系统内置角色，不可删除">
                          <Tag size="small">内置</Tag>
                        </Tooltip>
                      ) : (
                        <Tag size="small" color="primary">自定义</Tag>
                      )}
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="text" size="small" onClick={(e) => handleMenuOpen(e, role.id, role.builtIn)} startIcon="more_vert">{null}</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Row Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>查看详情</MenuItem>
        <MenuItem onClick={handleView}>编辑权限</MenuItem>
        {!menuRoleBuiltIn && (
          <MenuItem onClick={handleDeleteClick} style={{ color: 'red' }}>删除</MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除角色 "{deletingName}" 吗？删除后，所有拥有此角色的用户将失去该角色的权限。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            取消
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="danger"
            disabled={deleting}
            startIcon={deleting ? undefined : "delete"}
          >
            {deleting ? '删除中...' : '确认删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleListPage;
