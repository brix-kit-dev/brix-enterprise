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
 * @file Organization List Page
 * @description Page for displaying and managing organization list
 * @module identity-ui-web/pages/OrganizationList
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This component is a pure View layer implementation:
 * - Renders organization list with filters and pagination
 * - Delegates all business logic to useOrganizationList hook (ViewModel)
 * - Does not directly access Repository layer
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

import React, { useState, useCallback } from 'react';
import { useUI, useTheme } from '@brix-sdk/runtime-sdk-react';
import type { OrganizationType, OrganizationStatus } from '@brix-sdk/enterprise-identity-shared';
import { useOrganizationList, type OrganizationListFilters } from '../../hooks/useOrganizationList';

// ============================================================================
// Constants
// ============================================================================

/**
 * Organization type labels
 */
const ORG_TYPE_LABELS: Record<OrganizationType, string> = {
  ENTERPRISE: '企业',
  DEPARTMENT: '部门',
  BRANCH: '分支机构',
  PARTNER: '合作方',
  TENANT: '租户',
};

/**
 * Organization status labels and colors
 */
const ORG_STATUS_CONFIG: Record<OrganizationStatus, { label: string; color: 'default' | 'success' | 'warning' | 'error' }> = {
  ACTIVE: { label: '正常', color: 'success' },
  INACTIVE: { label: '停用', color: 'default' },
  SUSPENDED: { label: '暂停', color: 'warning' },
  PENDING: { label: '待审批', color: 'error' },
};

/**
 * Page size options
 */
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Organization List Page Component
 * 
 * Displays organization list with filtering, pagination, and CRUD actions.
 * 
 * Features:
 * - Keyword search
 * - Type and status filters
 * - Sortable table columns
 * - Row selection
 * - Inline actions menu
 * - Pagination
 */
export const OrganizationListPage: React.FC = () => {
  const { Box, Paper, Typography, Button, Input, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Tag, Menu, MenuItem, Select, Checkbox, Tooltip, Spin, Alert, Dialog, DialogTitle, DialogContent, DialogActions } = useUI();
  const { tokens } = useTheme();

  // ========================================================================
  // ViewModel Hook
  // ========================================================================
  
  const {
    organizations,
    loading,
    error,
    filters,
    pagination,
    selectedIds,
    refresh,
    setFilters,
    setPage,
    setPageSize,
    selectOrganization,
    selectAll,
    clearSelection,
    navigateToDetail,
    navigateToCreate,
    deleteOrganization,
  } = useOrganizationList();

  // ========================================================================
  // Local State
  // ========================================================================
  
  // Search input (debounced)
  const [searchInput, setSearchInput] = useState(filters.keyword);
  
  // Filter panel expanded
  const [showFilters, setShowFilters] = useState(false);
  
  // Row action menu
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuOrgId, setMenuOrgId] = useState<number | null>(null);
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * Handle search input change
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };

  /**
   * Handle search submit
   */
  const handleSearchSubmit = () => {
    setFilters({ keyword: searchInput });
  };

  /**
   * Handle search key press (Enter to submit)
   */
  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  /**
   * Handle clear search
   */
  const handleClearSearch = () => {
    setSearchInput('');
    setFilters({ keyword: '' });
  };

  /**
   * Handle type filter change
   */
  const handleTypeChange = (event: { target: { value: string } }) => {
    setFilters({ type: event.target.value as OrganizationType | '' });
  };

  /**
   * Handle status filter change
   */
  const handleStatusChange = (event: { target: { value: string } }) => {
    setFilters({ status: event.target.value as OrganizationStatus | '' });
  };

  /**
   * Handle clear all filters
   */
  const handleClearFilters = () => {
    setSearchInput('');
    setFilters({ keyword: '', type: '', status: '' });
  };

  /**
   * Handle row menu open
   */
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, orgId: number) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuOrgId(orgId);
  };

  /**
   * Handle row menu close
   */
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuOrgId(null);
  };

  /**
   * Handle view action
   */
  const handleView = () => {
    if (menuOrgId) {
      navigateToDetail(menuOrgId);
    }
    handleMenuClose();
  };

  /**
   * Handle edit action
   */
  const handleEdit = () => {
    // Navigate to edit (same as detail for now)
    if (menuOrgId) {
      navigateToDetail(menuOrgId);
    }
    handleMenuClose();
  };

  /**
   * Handle delete action
   */
  const handleDeleteClick = () => {
    if (menuOrgId) {
      setDeletingId(menuOrgId);
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
    const success = await deleteOrganization(deletingId);
    setDeleting(false);
    
    if (success) {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  /**
   * Cancel delete
   */
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  /**
   * Handle page change
   */
  const handlePageChange = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  /**
   * Handle rows per page change
   */
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
  };

  /**
   * Handle select all checkbox
   */
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      selectAll();
    } else {
      clearSelection();
    }
  };

  /**
   * Handle row click
   */
  const handleRowClick = (orgId: number) => {
    navigateToDetail(orgId);
  };

  // ========================================================================
  // Render
  // ========================================================================
  
  const hasFilters = filters.keyword || filters.type || filters.status;
  const allSelected = organizations.length > 0 && selectedIds.length === organizations.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < organizations.length;
  
  return (
    <Box style={{ padding: 24 }}>
      {/* Page Header */}
      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Box>
          <Typography variant="h5" style={{ marginBottom: '0.35em' }}>
            组织管理
          </Typography>
          <Typography variant="body2" style={{ color: tokens.colors.text.secondary }}>
            管理系统中的组织架构
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
            新建组织
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
            placeholder="搜索组织名称或编码..."
            value={searchInput}
            onChange={handleSearchChange}
            onKeyPress={handleSearchKeyPress}
            size="small"
            style={{ width: 300 }}
          />

          {/* Filter Toggle */}
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            startIcon="filter_list"
            onClick={() => setShowFilters(!showFilters)}
            size="small"
          >
            筛选
          </Button>

          {/* Clear Filters */}
          {hasFilters && (
            <Button
              variant="text"
              color="inherit"
              onClick={handleClearFilters}
              size="small"
            >
              清除筛选
            </Button>
          )}

          <Box style={{ flexGrow: 1 }} />

          {/* Selection Info */}
          {selectedIds.length > 0 && (
            <Typography variant="body2" style={{ color: tokens.colors.text.secondary }}>
              已选择 {selectedIds.length} 项
            </Typography>
          )}
        </Box>

        {/* Filter Panel */}
        {showFilters && (
          <Box style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${tokens.colors.border.default}` }}>
            {/* Type Filter */}
            <Select
              size="small"
              label="组织类型"
              value={filters.type}
              onChange={handleTypeChange}
              style={{ minWidth: 150 }}
            >
              <MenuItem value="">全部</MenuItem>
              {Object.entries(ORG_TYPE_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>

            {/* Status Filter */}
            <Select
              size="small"
              label="状态"
              value={filters.status}
              onChange={handleStatusChange}
              style={{ minWidth: 120 }}
            >
              <MenuItem value="">全部</MenuItem>
              {Object.entries(ORG_STATUS_CONFIG).map(([value, config]) => (
                <MenuItem key={value} value={value}>{config.label}</MenuItem>
              ))}
            </Select>
          </Box>
        )}
      </Paper>

      {/* Data Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={someSelected}
                    checked={allSelected}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell>组织名称</TableCell>
                <TableCell>编码</TableCell>
                <TableCell>类型</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>上级组织</TableCell>
                <TableCell align="right">用户数</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" style={{ paddingTop: 64, paddingBottom: 64 }}>
                    <Spin />
                  </TableCell>
                </TableRow>
              ) : organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" style={{ paddingTop: 64, paddingBottom: 64 }}>
                    <span className="material-icons" style={{ fontSize: 48, color: 'rgba(0,0,0,0.26)', marginBottom: 8, display: 'block' }}>business</span>
                    <Typography style={{ color: tokens.colors.text.secondary }}>
                      {hasFilters ? '没有找到匹配的组织' : '暂无组织数据'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => (
                  <TableRow
                    key={org.id}
                    hover
                    selected={selectedIds.includes(org.id)}
                    onClick={() => handleRowClick(org.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.includes(org.id)}
                        onChange={() => selectOrganization(org.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-icons" style={{ fontSize: 20, color: 'rgba(0,0,0,0.54)' }}>business</span>
                        <Typography variant="body2">{org.name}</Typography>
                        {org.childCount > 0 && (
                          <Tag size="small">
                            {`${org.childCount} 子级`}
                          </Tag>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" style={{ color: tokens.colors.text.secondary }}>
                        {org.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tag size="small">
                        {ORG_TYPE_LABELS[org.type] || org.type}
                      </Tag>
                    </TableCell>
                    <TableCell>
                      <Tag
                        size="small"
                        color={ORG_STATUS_CONFIG[org.status]?.color || 'default'}
                      >
                        {ORG_STATUS_CONFIG[org.status]?.label || org.status}
                      </Tag>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" style={{ color: tokens.colors.text.secondary }}>
                        {org.parentName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{org.userCount}</Typography>
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="text" size="small" onClick={(e) => handleMenuOpen(e, org.id)} startIcon="more_vert">{null}</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={pagination.totalElements}
          page={pagination.page}
          onPageChange={handlePageChange}
          rowsPerPage={pagination.size}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={PAGE_SIZE_OPTIONS}
          labelRowsPerPage="每页行数"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </Paper>

      {/* Row Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>查看详情</MenuItem>
        <MenuItem onClick={handleEdit}>编辑</MenuItem>
        <MenuItem onClick={handleDeleteClick} style={{ color: 'red' }}>删除</MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除此组织吗？删除后将无法恢复，且该组织下的所有子组织也将被删除。
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

export default OrganizationListPage;
