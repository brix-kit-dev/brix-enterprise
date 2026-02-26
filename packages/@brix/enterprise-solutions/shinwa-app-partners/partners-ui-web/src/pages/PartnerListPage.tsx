/**
 * Partner List Page - View Layer
 * 
 * @description Displays partner list, supports filtering, searching, and status operations
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This component is a View layer implementation, following these architecture rules:
 * - View is responsible only for UI rendering and user interaction
 * - Get data and operations through ViewModel (usePartnerList)
 * - Do not call API directly, all data is obtained through Hook
 * 
 * Architecture Path: View (PartnerListPage) → ViewModel (usePartnerList) → Repository → HttpCapability
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PlayArrow as ActivateIcon,
  Pause as SuspendIcon,
  Stop as TerminateIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from '@brix/runtime-sdk-api-web';
import { usePartnerList } from '../hooks';
import type {
  PartnerDTO,
  PartnerType,
  PartnerStatus,
} from '../types';
import {
  PARTNER_TYPE_OPTIONS,
  PARTNER_STATUS_OPTIONS,
  getPartnerTypeLabel,
  getPartnerStatusLabel,
  getPartnerStatusColor,
} from '../types';

/**
 * Partner List Page Component
 * 
 * Responsibilities:
 * - UI rendering and user interaction
 * - Dialog state management (local UI state)
 * - Client-side search filtering
 * 
 * State Sources:
 * - partners, loading, error, typeFilter, statusFilter, permissions → usePartnerList Hook
 * - searchText, dialogs, selectedPartner → Local UI state
 */
export const PartnerListPage: React.FC = () => {
  const navigate = useNavigate();
  
  // ========================================================================
  // ViewModel Hook - Get data state and action methods
  // ========================================================================
  
  const {
    // 状态
    partners,
    loading,
    error,
    typeFilter,
    statusFilter,
    permissions,
    // 操作
    refresh,
    filterByType,
    filterByStatus,
    deletePartner,
    activatePartner,
    suspendPartner,
    resumePartner,
    terminatePartner,
  } = usePartnerList();
  
  // ========================================================================
  // Local UI State - Used only for view layer interaction
  // ========================================================================
  
  /** Local search text (client-side filter) */
  const [searchText, setSearchText] = useState('');
  
  /** Delete confirmation dialog */
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  /** Status action dialog */
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  
  /** Currently selected partner */
  const [selectedPartner, setSelectedPartner] = useState<PartnerDTO | null>(null);
  
  /** Current action type */
  const [actionType, setActionType] = useState<'activate' | 'suspend' | 'resume' | 'terminate' | null>(null);
  
  /** Action reason input */
  const [actionReason, setActionReason] = useState('');
  
  /** Action in progress */
  const [actionLoading, setActionLoading] = useState(false);

  // ========================================================================
  // Client-side Search Filter
  // ========================================================================

  /**
   * Filtered partner list
   * Client-side filtering based on local search text
   */
  const filteredPartners = partners.filter(partner => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      partner.name.toLowerCase().includes(search) ||
      partner.partnerCode.toLowerCase().includes(search) ||
      partner.shortName?.toLowerCase().includes(search)
    );
  });

  // ========================================================================
  // Event Handlers
  // ========================================================================

  /**
   * Handle status action
   * Calls status action methods provided by Hook
   */
  const handleAction = async () => {
    if (!selectedPartner || !actionType) return;
    
    setActionLoading(true);
    let success = false;
    
    try {
      switch (actionType) {
        case 'activate':
          success = await activatePartner(selectedPartner.id);
          break;
        case 'suspend':
          success = await suspendPartner(selectedPartner.id, actionReason);
          break;
        case 'resume':
          success = await resumePartner(selectedPartner.id);
          break;
        case 'terminate':
          success = await terminatePartner(selectedPartner.id, actionReason);
          break;
      }
      
      if (success) {
        setActionDialogOpen(false);
        setActionReason('');
      }
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handle delete
   * Calls delete method provided by Hook
   */
  const handleDelete = async () => {
    if (!selectedPartner) return;
    
    setActionLoading(true);
    try {
      const success = await deletePartner(selectedPartner.id);
      if (success) {
        setDeleteDialogOpen(false);
      }
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Open status action dialog
   */
  const openActionDialog = (partner: PartnerDTO, action: 'activate' | 'suspend' | 'resume' | 'terminate') => {
    setSelectedPartner(partner);
    setActionType(action);
    setActionDialogOpen(true);
  };

  /**
   * Handle type filter change
   */
  const handleTypeFilterChange = (value: PartnerType | '') => {
    filterByType(value === '' ? null : value);
  };

  /**
   * Handle status filter change
   */
  const handleStatusFilterChange = (value: PartnerStatus | '') => {
    filterByStatus(value === '' ? null : value);
  };

  /**
   * Get action buttons
   * Control button display based on permissions provided by Hook
   */
  const renderActions = (partner: PartnerDTO) => {
    const actions = [];
    
    // View details - visible to all users
    actions.push(
      <Tooltip title="查看详情" key="view">
        <IconButton size="small" onClick={() => navigate('partners:detail', { id: partner.id })}>
          <ViewIcon />
        </IconButton>
      </Tooltip>
    );
    
    // Edit - requires edit permission, and not terminated status
    if (permissions.canEdit && partner.status !== 'TERMINATED') {
      actions.push(
        <Tooltip title="编辑" key="edit">
          <IconButton size="small" onClick={() => navigate('partners:edit', { id: partner.id })}>
            <EditIcon />
          </IconButton>
        </Tooltip>
      );
    }
    
    // Status operations - requires status management permission
    if (permissions.canManageStatus) {
      // Activate (draft status only)
      if (partner.status === 'DRAFT') {
        actions.push(
          <Tooltip title="激活" key="activate">
            <IconButton size="small" color="success" onClick={() => openActionDialog(partner, 'activate')}>
              <ActivateIcon />
            </IconButton>
          </Tooltip>
        );
      }
      
      // Suspend (active status only)
      if (partner.status === 'ACTIVE') {
        actions.push(
          <Tooltip title="暂停" key="suspend">
            <IconButton size="small" color="warning" onClick={() => openActionDialog(partner, 'suspend')}>
              <SuspendIcon />
            </IconButton>
          </Tooltip>
        );
      }
      
      // Resume (suspended status only)
      if (partner.status === 'SUSPENDED') {
        actions.push(
          <Tooltip title="恢复" key="resume">
            <IconButton size="small" color="success" onClick={() => openActionDialog(partner, 'resume')}>
              <ActivateIcon />
            </IconButton>
          </Tooltip>
        );
      }
      
      // Terminate (active or suspended status)
      if (partner.status === 'ACTIVE' || partner.status === 'SUSPENDED') {
        actions.push(
          <Tooltip title="终止" key="terminate">
            <IconButton size="small" color="error" onClick={() => openActionDialog(partner, 'terminate')}>
              <TerminateIcon />
            </IconButton>
          </Tooltip>
        );
      }
    }
    
    // Delete - requires delete permission, and draft or terminated status only
    if (permissions.canDelete && (partner.status === 'DRAFT' || partner.status === 'TERMINATED')) {
      actions.push(
        <Tooltip title="删除" key="delete">
          <IconButton
            size="small"
            color="error"
            onClick={() => {
              setSelectedPartner(partner);
              setDeleteDialogOpen(true);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      );
    }
    
    return <Stack direction="row" spacing={0.5}>{actions}</Stack>;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          合作伙伴管理
        </Typography>
        {permissions.canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('partners:create')}
          >
            新建合作伙伴
          </Button>
        )}
      </Box>

      {/* Filter Bar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="搜索名称或编码..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>类型</InputLabel>
            <Select
              value={typeFilter ?? ''}
              label="类型"
              onChange={(e) => handleTypeFilterChange(e.target.value as PartnerType | '')}
            >
              <MenuItem value="">全部</MenuItem>
              {PARTNER_TYPE_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>状态</InputLabel>
            <Select
              value={statusFilter ?? ''}
              label="状态"
              onChange={(e) => handleStatusFilterChange(e.target.value as PartnerStatus | '')}
            >
              <MenuItem value="">全部</MenuItem>
              {PARTNER_STATUS_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="刷新">
            <IconButton onClick={refresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Data Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>编码</TableCell>
                <TableCell>名称</TableCell>
                <TableCell>类型</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>联系人</TableCell>
                <TableCell>服务区域</TableCell>
                <TableCell>创建时间</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPartners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary">暂无数据</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPartners.map((partner) => (
                  <TableRow key={partner.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {partner.partnerCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">{partner.name}</Typography>
                      {partner.shortName && (
                        <Typography variant="caption" color="text.secondary">
                          {partner.shortName}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={getPartnerTypeLabel(partner.partnerType)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPartnerStatusLabel(partner.status)}
                        size="small"
                        color={getPartnerStatusColor(partner.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {partner.contactName && (
                        <Box>
                          <Typography variant="body2">{partner.contactName}</Typography>
                          {partner.contactPhone && (
                            <Typography variant="caption" color="text.secondary">
                              {partner.contactPhone}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>{partner.serviceArea || '-'}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(partner.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{renderActions(partner)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !actionLoading && setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          确定要删除合作伙伴 <strong>{selectedPartner?.name}</strong> 吗？此操作不可撤销。
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading}>
            取消
          </Button>
          <Button color="error" onClick={handleDelete} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : '删除'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => !actionLoading && setActionDialogOpen(false)}>
        <DialogTitle>
          {actionType === 'activate' && '激活合作伙伴'}
          {actionType === 'suspend' && '暂停合作伙伴'}
          {actionType === 'resume' && '恢复合作伙伴'}
          {actionType === 'terminate' && '终止合作伙伴'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            确定要{actionType === 'activate' && '激活'}
            {actionType === 'suspend' && '暂停'}
            {actionType === 'resume' && '恢复'}
            {actionType === 'terminate' && '终止'}
            合作伙伴 <strong>{selectedPartner?.name}</strong> 吗？
          </Typography>
          {(actionType === 'suspend' || actionType === 'terminate') && (
            <TextField
              fullWidth
              label="原因"
              multiline
              rows={3}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              disabled={actionLoading}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)} disabled={actionLoading}>
            取消
          </Button>
          <Button
            color={actionType === 'terminate' ? 'error' : 'primary'}
            onClick={handleAction}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : '确认'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PartnerListPage;
