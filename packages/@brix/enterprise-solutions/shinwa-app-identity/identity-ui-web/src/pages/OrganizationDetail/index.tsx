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
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Card,
  CardContent,
  CardActionArea,
} from '@mui/material';
import {
  ArrowBackOutlined as BackIcon,
  EditOutlined as EditIcon,
  DeleteOutline as DeleteIcon,
  SaveOutlined as SaveIcon,
  CancelOutlined as CancelIcon,
  PersonOutlined as PersonIcon,
  BusinessOutlined as OrgIcon,
  AccountTreeOutlined as TreeIcon,
  EmailOutlined as EmailIcon,
  PhoneOutlined as PhoneIcon,
  LocationOnOutlined as LocationIcon,
  ExpandMoreOutlined as LoadMoreIcon,
} from '@mui/icons-material';
import { usePageParams } from '@brix/runtime-sdk-api-web';
import type { OrganizationStatus } from '@shinwa/identity-shared';
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
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

/**
 * Loading Skeleton Component
 */
const LoadingSkeleton: React.FC = () => (
  <Box>
    <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={150} />
  </Box>
);

/**
 * Info Row Component
 */
const InfoRow: React.FC<{ label: string; value?: string | React.ReactNode; icon?: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
    {icon && <Box sx={{ mr: 2, color: 'text.secondary' }}>{icon}</Box>}
    <Box sx={{ minWidth: 120 }}>
      <Typography variant="caption" color="textSecondary">
        {label}
      </Typography>
    </Box>
    <Box sx={{ flex: 1 }}>
      <Typography variant="body2">{value || '-'}</Typography>
    </Box>
  </Box>
);

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
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Alert severity="error">
          组织ID无效，请检查访问路径
        </Alert>
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          onClick={navigateToList}
          startIcon={<BackIcon />}
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
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <LoadingSkeleton />
      </Box>
    );
  }

  // ========================================================================
  // Render: Not Found After Load
  // ========================================================================
  
  if (!loading && !organization) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Alert severity="warning">
          未找到该组织，可能已被删除或不存在
        </Alert>
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          onClick={navigateToList}
          startIcon={<BackIcon />}
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
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
        <IconButton onClick={navigateToList} sx={{ mr: 2, mt: 0.5 }}>
          <BackIcon />
        </IconButton>
        
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
              <OrgIcon />
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5">{organization?.name}</Typography>
                {statusConfig && (
                  <Chip
                    label={statusConfig.label}
                    color={statusConfig.color}
                    size="small"
                  />
                )}
              </Box>
              <Typography variant="body2" color="textSecondary">
                {organization?.code}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isEditing ? (
            <>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleEditToggle}
                disabled={updating}
              >
                取消
              </Button>
              <Button
                variant="contained"
                startIcon={updating ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={updating}
              >
                {updating ? '保存中...' : '保存'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEditToggle}
              >
                编辑
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.message}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="基本信息" />
          <Tab label={`子组织 (${children.length})`} />
          <Tab label={`成员 (${totalUsers})`} />
        </Tabs>

        {/* Basic Info Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            {isEditing ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="组织名称"
                    value={editData.name}
                    onChange={handleEditChange('name')}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="描述"
                    value={editData.description}
                    onChange={handleEditChange('description')}
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="联系人"
                    value={editData.contactPerson}
                    onChange={handleEditChange('contactPerson')}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="联系电话"
                    value={editData.contactPhone}
                    onChange={handleEditChange('contactPhone')}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="联系邮箱"
                    value={editData.contactEmail}
                    onChange={handleEditChange('contactEmail')}
                    fullWidth
                    type="email"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="地址"
                    value={editData.address}
                    onChange={handleEditChange('address')}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            ) : (
              <Box>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  组织信息
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <InfoRow label="组织编码" value={organization?.code} />
                <InfoRow label="组织类型" value={organization?.type} />
                <InfoRow label="上级组织" value={organization?.parentName || '无'} />
                <InfoRow label="描述" value={organization?.description} />
                
                <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 3 }} gutterBottom>
                  联系方式
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <InfoRow
                  label="联系人"
                  value={organization?.contactPerson}
                  icon={<PersonIcon />}
                />
                <InfoRow
                  label="联系电话"
                  value={organization?.contactPhone}
                  icon={<PhoneIcon />}
                />
                <InfoRow
                  label="联系邮箱"
                  value={organization?.contactEmail}
                  icon={<EmailIcon />}
                />
                <InfoRow
                  label="地址"
                  value={organization?.address}
                  icon={<LocationIcon />}
                />
                
                <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 3 }} gutterBottom>
                  其他信息
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
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
          <Box sx={{ p: 3 }}>
            {loadingChildren ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : children.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <TreeIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="textSecondary">暂无子组织</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {children.map((child) => (
                  <Grid item xs={12} sm={6} md={4} key={child.id}>
                    <Card variant="outlined">
                      <CardActionArea onClick={() => navigateToChild(child.id)}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <OrgIcon color="action" />
                            <Typography variant="subtitle1">{child.name}</Typography>
                          </Box>
                          <Typography variant="body2" color="textSecondary">
                            {child.code}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip label={`${child.userCount} 成员`} size="small" variant="outlined" />
                            {child.childCount > 0 && (
                              <Chip label={`${child.childCount} 子级`} size="small" variant="outlined" />
                            )}
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </TabPanel>

        {/* Users Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            {loadingUsers && users.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : users.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="textSecondary">暂无成员</Typography>
              </Box>
            ) : (
              <>
                <List>
                  {users.map((user) => (
                    <ListItem key={user.id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.displayName}
                        secondary={user.username}
                      />
                    </ListItem>
                  ))}
                </List>
                
                {hasMoreUsers && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={handleLoadMoreUsers}
                      disabled={loadingUsers}
                      startIcon={loadingUsers ? <CircularProgress size={16} /> : <LoadMoreIcon />}
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
          <DialogContentText>
            确定要删除组织 "{organization?.name}" 吗？
            {organization && organization.childCount > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                该组织下有 {organization.childCount} 个子组织，删除后将一并删除。
              </Alert>
            )}
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
    </Box>
  );
};

export default OrganizationDetailPage;
