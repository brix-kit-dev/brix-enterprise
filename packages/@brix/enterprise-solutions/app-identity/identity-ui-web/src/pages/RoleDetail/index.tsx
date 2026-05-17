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
import { usePageParams, useUI, useTheme } from '@brix-sdk/runtime-sdk-react';
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
const LoadingSkeleton: React.FC = () => {
  const { tokens } = useTheme();
  return (
  <div>
    <div style={{ width: '40%', height: 40, background: tokens.colors.surface.page, marginBottom: 16, borderRadius: 4 }} />
    <div style={{ height: 100, background: tokens.colors.surface.page, marginBottom: 16, borderRadius: 4 }} />
    <div style={{ height: 300, background: tokens.colors.surface.page, borderRadius: 4 }} />
  </div>
  );
};

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
  ui: Record<string, any>;
}> = ({
  category,
  expanded,
  onToggle,
  onTogglePermission,
  onAssignAll,
  onRemoveAll,
  disabled = false,
  ui,
}) => {
  const { Accordion, AccordionSummary, AccordionDetails, Box, Typography, Tag, Button, Tooltip, Checkbox, FormControlLabel, FormGroup } = ui;
  const { tokens } = useTheme();
  const assignedCount = category.permissions.filter((p) => p.assigned).length;
  const totalCount = category.permissions.length;
  const allAssigned = assignedCount === totalCount;
  const someAssigned = assignedCount > 0 && assignedCount < totalCount;

  return (
    <Accordion expanded={expanded} onChange={onToggle}>
      <AccordionSummary expandIcon={<span className="material-icons">expand_more</span>}>
        <Box style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', paddingRight: 16 }}>
          <Typography variant="subtitle1" style={{ fontWeight: 500 }}>
            {category.name}
          </Typography>
          <Tag
            size="small"
            color={allAssigned ? 'success' : someAssigned ? 'warning' : 'default'}
          >
            {`${assignedCount}/${totalCount}`}
          </Tag>
          <Box style={{ flexGrow: 1 }} />
          {!disabled && (
            <Box onClick={(e) => e.stopPropagation()}>
              <Tooltip title="全选">
                <Button variant="text" size="small" onClick={onAssignAll} disabled={allAssigned} startIcon="check_box">{null}</Button>
              </Tooltip>
              <Tooltip title="取消全选">
                <Button variant="text" size="small" onClick={onRemoveAll} disabled={assignedCount === 0} startIcon="indeterminate_check_box">{null}</Button>
              </Tooltip>
            </Box>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <FormGroup>
          <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {category.permissions.map((permission) => (
              <Box style={{ flex: '1 1 30%', minWidth: 200 }} key={permission.code}>
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
                        <Typography variant="caption" style={{ color: tokens.colors.text.secondary }}>
                          {permission.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </Box>
            ))}
          </Box>
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
  const ui = useUI();
  const { Box, Paper, Typography, Button, Input, Tag, Divider, Spin, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Tooltip } = ui;
  const { tokens } = useTheme();

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
      <Box style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Alert type="error">
          角色ID无效，请检查访问路径
        </Alert>
        <Button
          style={{ marginTop: 16 }}
          variant="primary"
          onClick={navigateToList}
          startIcon="arrow_back"
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
      <Box style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <LoadingSkeleton />
      </Box>
    );
  }

  // ========================================================================
  // Render: Not Found After Load
  // ========================================================================
  
  if (!loading && !role) {
    return (
      <Box style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Alert type="warning">
          未找到该角色，可能已被删除或不存在
        </Alert>
        <Button
          style={{ marginTop: 16 }}
          variant="primary"
          onClick={navigateToList}
          startIcon="arrow_back"
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
    <Box style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <Box style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24 }}>
        <Button variant="text" size="small" onClick={navigateToList} startIcon="arrow_back" style={{ marginRight: 16, marginTop: 4 }}>{null}</Button>
        
        <Box style={{ flex: 1 }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <span className="material-icons" style={{ fontSize: 32, color: tokens.colors.brand.primary }}>security</span>
            <Box>
              <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Typography variant="h5">{role?.name}</Typography>
                {isBuiltIn && (
                  <Tooltip title="系统内置角色，不可删除">
                    <Tag size="small">内置</Tag>
                  </Tooltip>
                )}
                {isDirty && (
                  <Tag size="small" color="warning">有未保存的更改</Tag>
                )}
              </Box>
              <Typography variant="body2" style={{ color: tokens.colors.text.secondary, fontFamily: 'monospace' }}>
                {role?.code}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box style={{ display: 'flex', gap: 8 }}>
          {!isBuiltIn && (
            <Button
              variant="danger"
              startIcon="delete"
              onClick={() => setDeleteDialogOpen(true)}
            >
              删除
            </Button>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert type="error" style={{ marginBottom: 24 }}>
          {error.message}
        </Alert>
      )}

      {/* Basic Info Section */}
      <Paper style={{ padding: 24, marginBottom: 24 }}>
        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Typography variant="subtitle1" style={{ fontWeight: 500 }}>
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
                    variant="primary"
                    onClick={handleSaveInfo}
                    disabled={updating}
                    startIcon={updating ? undefined : "save"}
                  >
                    {updating ? '保存中...' : '保存'}
                  </Button>
                </>
              ) : (
                <Button
                  size="small"
                  startIcon="edit"
                  onClick={handleEditInfoToggle}
                >
                  编辑
                </Button>
              )}
            </Box>
          )}
        </Box>
        
        <Divider style={{ marginBottom: 16 }} />
        
        {isEditingInfo ? (
          <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Box style={{ flex: '1 1 45%', minWidth: 250 }}>
              <Input
                label="角色名称"
                value={editInfo.name}
                onChange={handleEditInfoChange('name')}
                style={{ width: '100%' }}
                required
              />
            </Box>
            <Box style={{ width: '100%' }}>
              <Input
                label="描述"
                value={editInfo.description}
                onChange={handleEditInfoChange('description')}
                style={{ width: '100%' }}
                multiline
                rows={2}
              />
            </Box>
          </Box>
        ) : (
          <Box>
            <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <Box style={{ flex: '1 1 45%', minWidth: 200 }}>
                <Typography variant="caption" style={{ color: tokens.colors.text.secondary }}>角色编码</Typography>
                <Typography variant="body1" style={{ fontFamily: 'monospace' }}>{role?.code}</Typography>
              </Box>
              <Box style={{ flex: '1 1 45%', minWidth: 200 }}>
                <Typography variant="caption" style={{ color: tokens.colors.text.secondary }}>状态</Typography>
                <Typography variant="body1">
                  <Tag
                    size="small"
                    color={role?.enabled ? 'success' : 'default'}
                  >
                    {role?.enabled ? '启用' : '禁用'}
                  </Tag>
                </Typography>
              </Box>
              <Box style={{ width: '100%' }}>
                <Typography variant="caption" style={{ color: tokens.colors.text.secondary }}>描述</Typography>
                <Typography variant="body1">{role?.description || '暂无描述'}</Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Permissions Section */}
      <Paper style={{ padding: 24 }}>
        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Typography variant="subtitle1" style={{ fontWeight: 500 }}>
            权限配置
          </Typography>
          {!isBuiltIn && (
            <Box style={{ display: 'flex', gap: 8 }}>
              <Button
                size="small"
                variant="secondary"
                startIcon="undo"
                onClick={handleResetPermissions}
                disabled={!isDirty || updating}
              >
                重置
              </Button>
              <Button
                size="small"
                variant="primary"
                startIcon={updating ? undefined : "save"}
                onClick={handleSavePermissions}
                disabled={!isDirty || updating}
              >
                {updating ? '保存中...' : '保存权限'}
              </Button>
            </Box>
          )}
        </Box>
        
        <Divider style={{ marginBottom: 16 }} />
        
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
              ui={ui}
            />
          ))}
        </Box>
      </Paper>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除角色 "{role?.name}" 吗？删除后，所有拥有此角色的用户将失去该角色的权限。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            取消
          </Button>
          <Button
            onClick={handleDelete}
            variant="danger"
            disabled={deleting}
            startIcon={deleting ? undefined : "delete"}
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
