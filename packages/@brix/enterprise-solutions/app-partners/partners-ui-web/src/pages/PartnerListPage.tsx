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
import { useNavigation, useUI, useI18n } from '@brix-sdk/runtime-sdk-react';
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
  const navigation = useNavigation();
  const { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button, Tag, Tooltip, Input, Select, MenuItem, FormControl, InputLabel, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Spin, Icon } = useUI();
  const { t } = useI18n('partners');
  
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
      <Tooltip title={t('list.viewDetail')} key="view">
        <Button variant="text" size="small" onClick={() => navigation.navigate(`/partners/${partner.id}`)}>
          <Icon name="visibility" />
        </Button>
      </Tooltip>
    );
    
    // Edit - requires edit permission, and not terminated status
    if (permissions.canEdit && partner.status !== 'TERMINATED') {
      actions.push(
        <Tooltip title={t('list.edit')} key="edit">
          <Button variant="text" size="small" onClick={() => navigation.navigate(`/partners/${partner.id}/edit`)}>
            <Icon name="edit" />
          </Button>
        </Tooltip>
      );
    }
    
    // Status operations - requires status management permission
    if (permissions.canManageStatus) {
      // Activate (draft status only)
      if (partner.status === 'DRAFT') {
        actions.push(
          <Tooltip title={t('list.activate')} key="activate">
            <Button variant="text" size="small" color="success" onClick={() => openActionDialog(partner, 'activate')}>
              <Icon name="play_arrow" />
            </Button>
          </Tooltip>
        );
      }
      
      // Suspend (active status only)
      if (partner.status === 'ACTIVE') {
        actions.push(
          <Tooltip title={t('list.suspend')} key="suspend">
            <Button variant="text" size="small" color="warning" onClick={() => openActionDialog(partner, 'suspend')}>
              <Icon name="pause" />
            </Button>
          </Tooltip>
        );
      }
      
      // Resume (suspended status only)
      if (partner.status === 'SUSPENDED') {
        actions.push(
          <Tooltip title={t('list.resume')} key="resume">
            <Button variant="text" size="small" color="success" onClick={() => openActionDialog(partner, 'resume')}>
              <Icon name="play_arrow" />
            </Button>
          </Tooltip>
        );
      }
      
      // Terminate (active or suspended status)
      if (partner.status === 'ACTIVE' || partner.status === 'SUSPENDED') {
        actions.push(
          <Tooltip title={t('list.terminate')} key="terminate">
            <Button variant="text" size="small" color="error" onClick={() => openActionDialog(partner, 'terminate')}>
              <Icon name="stop" />
            </Button>
          </Tooltip>
        );
      }
    }
    
    // Delete - requires delete permission, and draft or terminated status only
    if (permissions.canDelete && (partner.status === 'DRAFT' || partner.status === 'TERMINATED')) {
      actions.push(
          <Tooltip title={t('list.delete')} key="delete">
          <Button
            variant="text"
            size="small"
            color="error"
            onClick={() => {
              setSelectedPartner(partner);
              setDeleteDialogOpen(true);
            }}
          >
            <Icon name="delete" />
          </Button>
        </Tooltip>
      );
    }
    
    return <Stack direction="row" spacing={0.5}>{actions}</Stack>;
  };

  return (
    <Box style={{ p: 3 }}>
      {/* Page Title */}
      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          {t('list.title')}
        </Typography>
        {permissions.canCreate && (
          <Button
            variant="primary"
            startIcon="add"
            onClick={() => navigation.navigate('/partners/create')}
          >
            {t('list.createBtn')}
          </Button>
        )}
      </Box>

      {/* Filter Bar */}
      <Paper style={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Input
            size="small"
            placeholder={t('list.searchPlaceholder')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ minWidth: 200 }}
          />
          <FormControl size="small" style={{ minWidth: 120 }}>
            <InputLabel>{t('list.typeFilter')}</InputLabel>
            <Select
              value={typeFilter ?? ''}
              label={t('list.typeFilter')}
              onChange={(e) => handleTypeFilterChange(e.target.value as PartnerType | '')}
            >
              <MenuItem value="">{t('list.allFilter')}</MenuItem>
              {PARTNER_TYPE_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" style={{ minWidth: 120 }}>
            <InputLabel>{t('list.statusFilter')}</InputLabel>
            <Select
              value={statusFilter ?? ''}
              label={t('list.statusFilter')}
              onChange={(e) => handleStatusFilterChange(e.target.value as PartnerStatus | '')}
            >
              <MenuItem value="">{t('list.allFilter')}</MenuItem>
              {PARTNER_STATUS_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title={t('list.refresh')}>
            <Button variant="text" onClick={refresh} disabled={loading}>
              <Icon name="refresh" />
            </Button>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" style={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Data Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box style={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Spin />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('list.colCode')}</TableCell>
                <TableCell>{t('list.colName')}</TableCell>
                <TableCell>{t('list.colType')}</TableCell>
                <TableCell>{t('list.colStatus')}</TableCell>
                <TableCell>{t('list.colContact')}</TableCell>
                <TableCell>{t('list.colServiceArea')}</TableCell>
                <TableCell>{t('list.colCreatedAt')}</TableCell>
                <TableCell align="right">{t('list.colActions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPartners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary">{t('list.noData')}</Typography>
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
                      <Tag label={getPartnerTypeLabel(partner.partnerType, t)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Tag
                        label={getPartnerStatusLabel(partner.status, t)}
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
        <DialogTitle>{t('list.deleteTitle')}</DialogTitle>
        <DialogContent>
          {t('list.deleteContent', { name: selectedPartner?.name ?? '' })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading}>
            {t('list.deleteCancel')}
          </Button>
          <Button color="error" onClick={handleDelete} disabled={actionLoading}>
            {actionLoading ? <Spin size={20} /> : t('list.deleteConfirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => !actionLoading && setActionDialogOpen(false)}>
        <DialogTitle>
          {actionType === 'activate' && t('list.activateTitle')}
          {actionType === 'suspend' && t('list.suspendTitle')}
          {actionType === 'resume' && t('list.resumeTitle')}
          {actionType === 'terminate' && t('list.terminateTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography style={{ mb: 2 }}>
            {t('list.actionConfirmPrefix')}{actionType === 'activate' && t('list.actionActivate')}
            {actionType === 'suspend' && t('list.actionSuspend')}
            {actionType === 'resume' && t('list.actionResume')}
            {actionType === 'terminate' && t('list.actionTerminate')}
            {t('list.actionConfirmSuffix', { name: selectedPartner?.name ?? '' })}
          </Typography>
          {(actionType === 'suspend' || actionType === 'terminate') && (
            <Input
              fullWidth
              label={t('list.reasonLabel')}
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
            {t('list.actionCancel')}
          </Button>
          <Button
            color={actionType === 'terminate' ? 'error' : 'primary'}
            onClick={handleAction}
            disabled={actionLoading}
          >
            {actionLoading ? <Spin size={20} /> : t('list.actionConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PartnerListPage;
