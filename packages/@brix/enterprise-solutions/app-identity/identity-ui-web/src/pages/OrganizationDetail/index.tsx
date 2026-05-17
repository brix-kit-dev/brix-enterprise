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
 * @file Organization Detail Page
 * @description Page for displaying organization details and management
 * @module identity-ui-web/pages/OrganizationDetail
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This component is a pure View layer implementation:
 * - Renders organization details with tabs for different sections
 * - Delegates all business logic to useOrganizationDetail hook (ViewModel)
 * - Does not directly access Repository layer
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

import React, { useState } from 'react';
import { usePageParams, useUI, useTheme } from '@brix-sdk/runtime-sdk-react';
import type { OrganizationStatus } from '@brix-sdk/enterprise-identity-shared';
import { useOrganizationDetail } from '../../hooks/useOrganizationDetail';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Tab panel props
 */
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

/**
 * Page route params
 */
interface OrganizationDetailPageParams {
  id?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Organization status labels and colors
 */
const ORG_STATUS_CONFIG: Record<OrganizationStatus, { label: string; color: 'default' | 'success' | 'warning' | 'error' }> = {
  ACTIVE: { label: '正常', color: 'success' },
  INACTIVE: { label: '停用', color: 'default' },
  SUSPENDED: { label: '暂停', color: 'warning' },
  PENDING: { label: '待审批', color: 'error' },
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Tab Panel Component
 */
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <div style={{ paddingTop: 24, paddingBottom: 24 }}>{children}</div>}
  </div>
);

/**
 * Loading Skeleton Component
 */
const LoadingSkeleton: React.FC = () => {
  const { tokens } = useTheme();
  return (
  <div>
    <div style={{ width: '60%', height: 40, background: tokens.colors.surface.page, marginBottom: 16, borderRadius: 4 }} />
    <div style={{ height: 200, background: tokens.colors.surface.page, marginBottom: 16, borderRadius: 4 }} />
    <div style={{ height: 150, background: tokens.colors.surface.page, borderRadius: 4 }} />
  </div>
  );
};

/**
 * Info Row Component
 */
const InfoRow: React.FC<{ label: string; value?: string | React.ReactNode; icon?: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => {
  const { tokens } = useTheme();
  return (
  <div style={{ display: 'flex', alignItems: 'center', paddingTop: 12, paddingBottom: 12 }}>
    {icon && <div style={{ marginRight: 16, color: tokens.colors.text.secondary }}>{icon}</div>}
    <div style={{ minWidth: 120 }}>
      <span style={{ fontSize: '0.75rem', color: tokens.colors.text.secondary }}>{label}</span>
    </div>
    <div style={{ flex: 1 }}>
      <span style={{ fontSize: '0.875rem' }}>{value || '-'}</span>
    </div>
  </div>
  );
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Organization Detail Page Component
 * 
 * Displays organization details with tabs for:
 * - Basic info
 * - Child organizations
 * - Users in organization
 * 
 * Features:
 * - Inline editing of basic info
 * - Child organization navigation
 * - User list with load more
 * - Delete confirmation
 */
export const OrganizationDetailPage: React.FC = () => {
  const params = usePageParams<OrganizationDetailPageParams>();
  const organizationId = params.id ? parseInt(params.id, 10) : undefined;
  const { Box, Paper, Typography, Button, Tabs, Tag, Avatar, Divider, List, ListItem, ListItemAvatar, ListItemText, Spin, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, CardActionArea, Input } = useUI();
  const { tokens } = useTheme();

  // ========================================================================
  // ViewModel Hook
  // ========================================================================
  
  const {
    organization,
    children,
    users,
    loading,
    loadingChildren,
    loadingUsers,
    updating,
    error,
    totalUsers,
    update,
    delete: deleteOrganization,
    loadMoreUsers,
    navigateToList,
    navigateToChild,
  } = useOrganizationDetail({ id: organizationId });

  // ========================================================================
  // Local State
  // ========================================================================
  
  // Active tab
  const [activeTab, setActiveTab] = useState(0);
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit form data
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
  });
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ========================================================================
  // Effects
  // ========================================================================
  
  React.useEffect(() => {
    if (organization && !isEditing) {
      setEditData({
        name: organization.name,
        description: organization.description || '',
        contactPerson: organization.contactPerson || '',
        contactPhone: organization.contactPhone || '',
        contactEmail: organization.contactEmail || '',
        address: organization.address || '',
      });
    }
  }, [organization, isEditing]);

  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * Handle tab change
   */
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  /**
   * Handle edit mode toggle
   */
  const handleEditToggle = () => {
    if (isEditing) {
      // Reset to original data
      if (organization) {
        setEditData({
          name: organization.name,
          description: organization.description || '',
          contactPerson: organization.contactPerson || '',
          contactPhone: organization.contactPhone || '',
          contactEmail: organization.contactEmail || '',
          address: organization.address || '',
        });
      }
    }
    setIsEditing(!isEditing);
  };

  /**
   * Handle edit field change
   */
  const handleEditChange = (field: keyof typeof editData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEditData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  /**
   * Handle save
   */
  const handleSave = async () => {
    const success = await update({
      name: editData.name,
      description: editData.description || undefined,
      contactPerson: editData.contactPerson || undefined,
      contactPhone: editData.contactPhone || undefined,
      contactEmail: editData.contactEmail || undefined,
      address: editData.address || undefined,
    });
    
    if (success) {
      setIsEditing(false);
    }
  };

  /**
   * Handle delete
   */
  const handleDelete = async () => {
    setDeleting(true);
    const success = await deleteOrganization();
    setDeleting(false);
    
    if (success) {
      setDeleteDialogOpen(false);
    }
  };

  /**
   * Handle load more users
   */
  const handleLoadMoreUsers = () => {
    loadMoreUsers();
  };

  // ========================================================================
  // Render: Not Found
  // ========================================================================
  
  if (!organizationId) {
    return (
      <Box style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Alert type="error">
          组织ID无效，请检查访问路径
        </Alert>
        <Button
          style={{ marginTop: 16 }}
          variant="primary"
          onClick={navigateToList}
          startIcon="arrow_back"
        >
          返回组织列表
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
  
  if (!loading && !organization) {
    return (
      <Box style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Alert type="warning">
          未找到该组织，可能已被删除或不存在
        </Alert>
        <Button
          style={{ marginTop: 16 }}
          variant="primary"
          onClick={navigateToList}
          startIcon="arrow_back"
        >
          返回组织列表
        </Button>
      </Box>
    );
  }

  // ========================================================================
  // Render: Main Content
  // ========================================================================
  
  const statusConfig = organization?.status ? ORG_STATUS_CONFIG[organization.status] : null;
  const hasMoreUsers = users.length < totalUsers;

  return (
    <Box style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <Box style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24 }}>
        <Button variant="text" size="small" onClick={navigateToList} startIcon="arrow_back" style={{ marginRight: 16, marginTop: 4 }}>{null}</Button>
        
        <Box style={{ flex: 1 }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <Avatar style={{ backgroundColor: tokens.colors.brand.primary, width: 48, height: 48 }}>
              <span className="material-icons">business</span>
            </Avatar>
            <Box>
              <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Typography variant="h5">{organization?.name}</Typography>
                {statusConfig && (
                  <Tag
                    color={statusConfig.color}
                    size="small"
                  >
                    {statusConfig.label}
                  </Tag>
                )}
              </Box>
              <Typography variant="body2" style={{ color: tokens.colors.text.secondary }}>
                {organization?.code}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box style={{ display: 'flex', gap: 8 }}>
          {isEditing ? (
            <>
              <Button
                variant="secondary"
                startIcon="cancel"
                onClick={handleEditToggle}
                disabled={updating}
              >
                取消
              </Button>
              <Button
                variant="primary"
                startIcon={updating ? undefined : "save"}
                onClick={handleSave}
                disabled={updating}
              >
                {updating ? '保存中...' : '保存'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                startIcon="edit"
                onClick={handleEditToggle}
              >
                编辑
              </Button>
              <Button
                variant="danger"
                startIcon="delete"
                onClick={() => setDeleteDialogOpen(true)}
              >
                删除
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert type="error" style={{ marginBottom: 24 }}>
          {error.message}
        </Alert>
      )}

      {/* Tabs */}
      <Paper style={{ marginBottom: 24 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          items={[
            { label: '基本信息' },
            { label: `子组织 (${children.length})` },
            { label: `成员 (${totalUsers})` },
          ]}
        />

        {/* Basic Info Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box style={{ padding: 24 }}>
            {isEditing ? (
              <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                <Box style={{ flex: '1 1 45%', minWidth: 250 }}>
                  <Input
                    label="组织名称"
                    value={editData.name}
                    onChange={handleEditChange('name')}
                    style={{ width: '100%' }}
                    required
                  />
                </Box>
                <Box style={{ width: '100%' }}>
                  <Input
                    label="描述"
                    value={editData.description}
                    onChange={handleEditChange('description')}
                    style={{ width: '100%' }}
                    multiline
                    rows={3}
                  />
                </Box>
                <Box style={{ flex: '1 1 45%', minWidth: 250 }}>
                  <Input
                    label="联系人"
                    value={editData.contactPerson}
                    onChange={handleEditChange('contactPerson')}
                    style={{ width: '100%' }}
                  />
                </Box>
                <Box style={{ flex: '1 1 45%', minWidth: 250 }}>
                  <Input
                    label="联系电话"
                    value={editData.contactPhone}
                    onChange={handleEditChange('contactPhone')}
                    style={{ width: '100%' }}
                  />
                </Box>
                <Box style={{ flex: '1 1 45%', minWidth: 250 }}>
                  <Input
                    label="联系邮箱"
                    value={editData.contactEmail}
                    onChange={handleEditChange('contactEmail')}
                    style={{ width: '100%' }}
                    type="email"
                  />
                </Box>
                <Box style={{ width: '100%' }}>
                  <Input
                    label="地址"
                    value={editData.address}
                    onChange={handleEditChange('address')}
                    style={{ width: '100%' }}
                    multiline
                    rows={2}
                  />
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography variant="subtitle2" style={{ color: tokens.colors.text.secondary, marginBottom: '0.35em' }}>
                  组织信息
                </Typography>
                <Divider style={{ marginBottom: 16 }} />
                
                <InfoRow label="组织编码" value={organization?.code} />
                <InfoRow label="组织类型" value={organization?.type} />
                <InfoRow label="上级组织" value={organization?.parentName || '无'} />
                <InfoRow label="描述" value={organization?.description} />
                
                <Typography variant="subtitle2" style={{ color: tokens.colors.text.secondary, marginTop: 24, marginBottom: '0.35em' }}>
                  联系方式
                </Typography>
                <Divider style={{ marginBottom: 16 }} />
                
                <InfoRow
                  label="联系人"
                  value={organization?.contactPerson}
                  icon={<span className="material-icons">person</span>}
                />
                <InfoRow
                  label="联系电话"
                  value={organization?.contactPhone}
                  icon={<span className="material-icons">phone</span>}
                />
                <InfoRow
                  label="联系邮箱"
                  value={organization?.contactEmail}
                  icon={<span className="material-icons">email</span>}
                />
                <InfoRow
                  label="地址"
                  value={organization?.address}
                  icon={<span className="material-icons">location_on</span>}
                />
                
                <Typography variant="subtitle2" style={{ color: tokens.colors.text.secondary, marginTop: 24, marginBottom: '0.35em' }}>
                  其他信息
                </Typography>
                <Divider style={{ marginBottom: 16 }} />
                
                <InfoRow
                  label="创建时间"
                  value={organization?.createdAt ? new Date(organization.createdAt).toLocaleString() : '-'}
                />
                <InfoRow
                  label="更新时间"
                  value={organization?.updatedAt ? new Date(organization.updatedAt).toLocaleString() : '-'}
                />
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Children Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box style={{ padding: 24 }}>
            {loadingChildren ? (
              <Box style={{ display: 'flex', justifyContent: 'center', paddingTop: 32, paddingBottom: 32 }}>
                <Spin />
              </Box>
            ) : children.length === 0 ? (
              <Box style={{ textAlign: 'center', paddingTop: 32, paddingBottom: 32 }}>
                <span className="material-icons" style={{ fontSize: 48, color: 'rgba(0,0,0,0.26)', marginBottom: 8, display: 'block' }}>account_tree</span>
                <Typography style={{ color: tokens.colors.text.secondary }}>暂无子组织</Typography>
              </Box>
            ) : (
              <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {children.map((child) => (
                  <Box style={{ flex: '1 1 30%', minWidth: 250 }} key={child.id}>
                    <Card variant="outlined">
                      <CardActionArea onClick={() => navigateToChild(child.id)}>
                        <CardContent>
                          <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span className="material-icons" style={{ color: 'rgba(0,0,0,0.54)' }}>business</span>
                            <Typography variant="subtitle1">{child.name}</Typography>
                          </Box>
                          <Typography variant="body2" style={{ color: tokens.colors.text.secondary }}>
                            {child.code}
                          </Typography>
                          <Box style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <Tag size="small">{`${child.userCount} 成员`}</Tag>
                            {child.childCount > 0 && (
                              <Tag size="small">{`${child.childCount} 子级`}</Tag>
                            )}
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Users Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box style={{ padding: 24 }}>
            {loadingUsers && users.length === 0 ? (
              <Box style={{ display: 'flex', justifyContent: 'center', paddingTop: 32, paddingBottom: 32 }}>
                <Spin />
              </Box>
            ) : users.length === 0 ? (
              <Box style={{ textAlign: 'center', paddingTop: 32, paddingBottom: 32 }}>
                <span className="material-icons" style={{ fontSize: 48, color: 'rgba(0,0,0,0.26)', marginBottom: 8, display: 'block' }}>person</span>
                <Typography style={{ color: tokens.colors.text.secondary }}>暂无成员</Typography>
              </Box>
            ) : (
              <>
                <List>
                  {users.map((user) => (
                    <ListItem key={user.id} divider>
                      <ListItemAvatar>
                        <Avatar />
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.displayName}
                        secondary={user.username}
                      />
                    </ListItem>
                  ))}
                </List>
                
                {hasMoreUsers && (
                  <Box style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                    <Button
                      variant="secondary"
                      onClick={handleLoadMoreUsers}
                      disabled={loadingUsers}
                      startIcon={loadingUsers ? undefined : "expand_more"}
                    >
                      {loadingUsers ? '加载中...' : `加载更多 (${users.length}/${totalUsers})`}
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Box>
        </TabPanel>
      </Paper>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除组织 "{organization?.name}" 吗？
            {organization && organization.childCount > 0 && (
              <Alert type="warning" style={{ marginTop: 16 }}>
                该组织下有 {organization.childCount} 个子组织，删除后将一并删除。
              </Alert>
            )}
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
    </Box>
  );
};

export default OrganizationDetailPage;
