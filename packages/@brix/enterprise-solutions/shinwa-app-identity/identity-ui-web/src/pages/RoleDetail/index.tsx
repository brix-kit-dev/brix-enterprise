/**
 * @file Role Detail Page
 * @description Page for displaying role details and permission management
 * @module identity-ui-web/pages/RoleDetail
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This component is a pure View layer implementation:
 * - Renders role details with permission configuration
 * - Delegates all business logic to useRoleDetail hook (ViewModel)
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
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  CircularProgress,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Tooltip,
} from '@mui/material';
import {
  ArrowBackOutlined as BackIcon,
  EditOutlined as EditIcon,
  DeleteOutline as DeleteIcon,
  SaveOutlined as SaveIcon,
  CancelOutlined as CancelIcon,
  ExpandMoreOutlined as ExpandIcon,
  SecurityOutlined as RoleIcon,
  CheckBoxOutlined as CheckAllIcon,
  IndeterminateCheckBoxOutlined as UncheckAllIcon,
  LockOutlined as BuiltInIcon,
  UndoOutlined as ResetIcon,
} from '@mui/icons-material';
import { usePageParams } from '@brix/runtime-sdk-api-web';
import { useRoleDetail, type PermissionCategory } from '../../hooks/useRoleDetail';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Page route params
 */
interface RoleDetailPageParams {
  id?: string;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Loading Skeleton Component
 */
const LoadingSkeleton: React.FC = () => (
  <Box>
    <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={300} />
  </Box>
);

/**
 * Permission Category Accordion Component
 */
const PermissionCategoryAccordion: React.FC<{
  category: PermissionCategory;
  expanded: boolean;
  onToggle: () => void;
  onTogglePermission: (code: string) => void;
  onAssignAll: () => void;
  onRemoveAll: () => void;
  disabled?: boolean;
}> = ({
  category,
  expanded,
  onToggle,
  onTogglePermission,
  onAssignAll,
  onRemoveAll,
  disabled = false,
}) => {
  const assignedCount = category.permissions.filter((p) => p.assigned).length;
  const totalCount = category.permissions.length;
  const allAssigned = assignedCount === totalCount;
  const someAssigned = assignedCount > 0 && assignedCount < totalCount;

  return (
    <Accordion expanded={expanded} onChange={onToggle}>
      <AccordionSummary expandIcon={<ExpandIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            {category.name}
          </Typography>
          <Chip
            label={`${assignedCount}/${totalCount}`}
            size="small"
            color={allAssigned ? 'success' : someAssigned ? 'warning' : 'default'}
            variant="outlined"
          />
          <Box sx={{ flexGrow: 1 }} />
          {!disabled && (
            <Box onClick={(e) => e.stopPropagation()}>
              <Tooltip title="全选">
                <IconButton
                  size="small"
                  onClick={onAssignAll}
                  disabled={allAssigned}
                >
                  <CheckAllIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="取消全选">
                <IconButton
                  size="small"
                  onClick={onRemoveAll}
                  disabled={assignedCount === 0}
                >
                  <UncheckAllIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <FormGroup>
          <Grid container spacing={2}>
            {category.permissions.map((permission) => (
              <Grid item xs={12} sm={6} md={4} key={permission.code}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={permission.assigned}
                      onChange={() => onTogglePermission(permission.code)}
                      disabled={disabled}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">{permission.name}</Typography>
                      {permission.description && (
                        <Typography variant="caption" color="textSecondary">
                          {permission.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </Grid>
            ))}
          </Grid>
        </FormGroup>
      </AccordionDetails>
    </Accordion>
  );
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Role Detail Page Component
 * 
 * Displays role details with permission management.
 * 
 * Features:
 * - View and edit basic role info
 * - Permission configuration grouped by category
 * - Bulk assign/remove permissions
 * - Change tracking (unsaved changes warning)
 * - Delete confirmation for custom roles
 */
export const RoleDetailPage: React.FC = () => {
  const params = usePageParams<RoleDetailPageParams>();
  const roleId = params.id ? parseInt(params.id, 10) : undefined;

  // ========================================================================
  // ViewModel Hook
  // ========================================================================
  
  const {
    role,
    permissionCategories,
    loading,
    updating,
    error,
    isDirty,
    updateBasicInfo,
    togglePermission,
    assignCategoryPermissions,
    removeCategoryPermissions,
    savePermissions,
    resetPermissions,
    delete: deleteRole,
    navigateToList,
  } = useRoleDetail({ id: roleId });

  // ========================================================================
  // Local State
  // ========================================================================
  
  // Edit mode for basic info
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  
  // Edit form data
  const [editInfo, setEditInfo] = useState({
    name: '',
    description: '',
  });
  
  // Expanded accordion categories
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Success snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // ========================================================================
  // Effects
  // ========================================================================
  
  React.useEffect(() => {
    if (role && !isEditingInfo) {
      setEditInfo({
        name: role.name,
        description: role.description || '',
      });
    }
  }, [role, isEditingInfo]);

  // Expand all categories by default
  React.useEffect(() => {
    if (permissionCategories.length > 0 && expandedCategories.length === 0) {
      setExpandedCategories(permissionCategories.map((c) => c.key));
    }
  }, [permissionCategories, expandedCategories.length]);

  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * Handle edit info toggle
   */
  const handleEditInfoToggle = () => {
    if (isEditingInfo) {
      if (role) {
        setEditInfo({
          name: role.name,
          description: role.description || '',
        });
      }
    }
    setIsEditingInfo(!isEditingInfo);
  };

  /**
   * Handle edit info field change
   */
  const handleEditInfoChange = (field: keyof typeof editInfo) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEditInfo((prev) => ({ ...prev, [field]: event.target.value }));
  };

  /**
   * Handle save info
   */
  const handleSaveInfo = async () => {
    const success = await updateBasicInfo({
      name: editInfo.name,
      description: editInfo.description || undefined,
    });
    
    if (success) {
      setIsEditingInfo(false);
      setSnackbarMessage('角色信息已更新');
      setSnackbarOpen(true);
    }
  };

  /**
   * Handle accordion toggle
   */
  const handleAccordionToggle = (categoryKey: string) => () => {
    setExpandedCategories((prev) =>
      prev.includes(categoryKey)
        ? prev.filter((k) => k !== categoryKey)
        : [...prev, categoryKey]
    );
  };

  /**
   * Handle save permissions
   */
  const handleSavePermissions = async () => {
    const success = await savePermissions();
    if (success) {
      setSnackbarMessage('权限配置已保存');
      setSnackbarOpen(true);
    }
  };

  /**
   * Handle reset permissions
   */
  const handleResetPermissions = () => {
    resetPermissions();
  };

  /**
   * Handle delete
   */
  const handleDelete = async () => {
    setDeleting(true);
    const success = await deleteRole();
    setDeleting(false);
    
    if (success) {
      setDeleteDialogOpen(false);
    }
  };

  // ========================================================================
  // Render: Not Found
  // ========================================================================
  
  if (!roleId) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Alert severity="error">
          角色ID无效，请检查访问路径
        </Alert>
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          onClick={navigateToList}
          startIcon={<BackIcon />}
        >
          返回角色列表
        </Button>
      </Box>
    );
  }

  // ========================================================================
  // Render: Loading
  // ========================================================================
  
  if (loading) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <LoadingSkeleton />
      </Box>
    );
  }

  // ========================================================================
  // Render: Not Found After Load
  // ========================================================================
  
  if (!loading && !role) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Alert severity="warning">
          未找到该角色，可能已被删除或不存在
        </Alert>
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          onClick={navigateToList}
          startIcon={<BackIcon />}
        >
          返回角色列表
        </Button>
      </Box>
    );
  }

  // ========================================================================
  // Render: Main Content
  // ========================================================================
  
  const isBuiltIn = role?.builtIn ?? false;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
        <IconButton onClick={navigateToList} sx={{ mr: 2, mt: 0.5 }}>
          <BackIcon />
        </IconButton>
        
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <RoleIcon color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5">{role?.name}</Typography>
                {isBuiltIn && (
                  <Tooltip title="系统内置角色，不可删除">
                    <Chip
                      label="内置"
                      size="small"
                      icon={<BuiltInIcon />}
                      color="default"
                    />
                  </Tooltip>
                )}
                {isDirty && (
                  <Chip
                    label="有未保存的更改"
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ fontFamily: 'monospace' }}>
                {role?.code}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isBuiltIn && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              删除
            </Button>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.message}
        </Alert>
      )}

      {/* Basic Info Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="medium">
            基本信息
          </Typography>
          {!isBuiltIn && (
            <Box>
              {isEditingInfo ? (
                <>
                  <Button
                    size="small"
                    onClick={handleEditInfoToggle}
                    disabled={updating}
                  >
                    取消
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleSaveInfo}
                    disabled={updating}
                    startIcon={updating ? <CircularProgress size={16} /> : <SaveIcon />}
                  >
                    保存
                  </Button>
                </>
              ) : (
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={handleEditInfoToggle}
                >
                  编辑
                </Button>
              )}
            </Box>
          )}
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {isEditingInfo ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="角色名称"
                value={editInfo.name}
                onChange={handleEditInfoChange('name')}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="描述"
                value={editInfo.description}
                onChange={handleEditInfoChange('description')}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        ) : (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="textSecondary">角色编码</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{role?.code}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="textSecondary">状态</Typography>
                <Typography variant="body1">
                  <Chip
                    label={role?.enabled ? '启用' : '禁用'}
                    size="small"
                    color={role?.enabled ? 'success' : 'default'}
                  />
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">描述</Typography>
                <Typography variant="body1">{role?.description || '暂无描述'}</Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Permissions Section */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="medium">
            权限配置
          </Typography>
          {!isBuiltIn && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ResetIcon />}
                onClick={handleResetPermissions}
                disabled={!isDirty || updating}
              >
                重置
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={updating ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={handleSavePermissions}
                disabled={!isDirty || updating}
              >
                {updating ? '保存中...' : '保存权限'}
              </Button>
            </Box>
          )}
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Box>
          {permissionCategories.map((category) => (
            <PermissionCategoryAccordion
              key={category.key}
              category={category}
              expanded={expandedCategories.includes(category.key)}
              onToggle={handleAccordionToggle(category.key)}
              onTogglePermission={togglePermission}
              onAssignAll={() => assignCategoryPermissions(category.key)}
              onRemoveAll={() => removeCategoryPermissions(category.key)}
              disabled={isBuiltIn}
            />
          ))}
        </Box>
      </Paper>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要删除角色 "{role?.name}" 吗？删除后，所有拥有此角色的用户将失去该角色的权限。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            取消
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deleting ? '删除中...' : '确认删除'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default RoleDetailPage;
