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
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Switch,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  AddOutlined as AddIcon,
  SearchOutlined as SearchIcon,
  RefreshOutlined as RefreshIcon,
  MoreVertOutlined as MoreIcon,
  EditOutlined as EditIcon,
  DeleteOutline as DeleteIcon,
  VisibilityOutlined as ViewIcon,
  SecurityOutlined as RoleIcon,
  CheckCircleOutlined as EnabledIcon,
  BlockOutlined as DisabledIcon,
  LockOutlined as BuiltInIcon,
  ClearOutlined as ClearIcon,
} from '@mui/icons-material';
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
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            角色管理
          </Typography>
          <Typography variant="body2" color="textSecondary">
            管理系统中的角色和权限
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="刷新列表">
            <IconButton onClick={refresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={navigateToCreate}
          >
            新建角色
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.message}
        </Alert>
      )}

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Field */}
          <TextField
            placeholder="搜索角色名称或编码..."
            value={searchInput}
            onChange={handleSearchChange}
            size="small"
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchInput && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
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
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <RoleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="textSecondary">
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RoleIcon color="action" fontSize="small" />
                        <Typography variant="body2">{role.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary" sx={{ fontFamily: 'monospace' }}>
                        {role.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{
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
                      <Chip
                        label={role.permissions.length}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      {togglingId === role.id ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Tooltip title={role.enabled ? '点击禁用' : '点击启用'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleEnabled(role.id, role.enabled)}
                            disabled={role.builtIn}
                          >
                            {role.enabled ? (
                              <EnabledIcon color="success" />
                            ) : (
                              <DisabledIcon color="disabled" />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {role.builtIn ? (
                        <Tooltip title="系统内置角色，不可删除">
                          <Chip
                            label="内置"
                            size="small"
                            icon={<BuiltInIcon />}
                            color="default"
                            variant="outlined"
                          />
                        </Tooltip>
                      ) : (
                        <Chip
                          label="自定义"
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, role.id, role.builtIn)}
                      >
                        <MoreIcon />
                      </IconButton>
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
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>查看详情</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>编辑权限</ListItemText>
        </MenuItem>
        {!menuRoleBuiltIn && (
          <MenuItem onClick={handleDeleteClick}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>删除</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要删除角色 "{deletingName}" 吗？删除后，所有拥有此角色的用户将失去该角色的权限。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            取消
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deleting ? '删除中...' : '确认删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleListPage;
