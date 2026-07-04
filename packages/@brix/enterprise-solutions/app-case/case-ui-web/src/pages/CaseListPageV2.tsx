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
 * @file Case List Page (UIAdapter pattern + Brix Design Tokens)
 * @description View layer - Case management list with search, filters, and actions.
 *
 * Architecture Alignment (v3.0.9 Blueprint & Design Token Plan Phase 6):
 * - All platform-level visual tokens obtained via `useTheme().tokens`
 *   (Brix semantic design tokens, NOT hardcoded hex or MUI palette)
 * - Business-domain colors (CASE_STATUS_COLORS) retained from theme module (Layer 3)
 * - UI components obtained through useUI() hook (UIAdapter pattern, Constraint 9)
 * - Pure View layer component: no business logic, no direct HTTP calls
 * - All data and operations obtained through useCaseList hook (ViewModel layer)
 *
 * @module @brix-sdk/enterprise-case-ui-web/pages
 * @version 3.2.1
 *
 * Design Notes:
 * This page follows the v3.0.8 blueprint three-layer architecture:
 * View → ViewModel (hooks) → Repository
 *
 * Architecture Compliance (Red Line R3):
 * - Pure View layer component with no business logic
 * - All data and operations obtained through useCaseList hook
 * - No direct HTTP/fetch/axios calls
 * - Navigation via runtime router capability
 * - UI components obtained via useUI() hook (UIAdapter pattern)
 *
 * Layout Reference:
 * Design follows Figma mockup specifications:
 * - Clean white card-based layout
 * - Status tabs for quick filtering
 * - Table with node progress indicators
 * - Action buttons with consistent styling
 *
 * @author Brix Platform Team
 * @date 2026-02-28
 */

import React, { useState, useCallback } from 'react';

// Runtime SDK imports - UIAdapter pattern per v3.0.8 Blueprint
import { useAuth, useNavigation, useUI, useTheme } from '@brix-sdk/runtime-sdk-react';

// Internal imports
import { useCaseList } from '../hooks/useCase';
import { NewCaseDialog } from '../components/NewCaseDialog';
import { CASE_STATUS_COLORS, TEMPLATE_TYPE_COLORS } from '../theme/caseTheme';
import type { CaseSummary, CaseStatus } from '@brix-sdk/enterprise-case-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Status tab configuration
 */
interface StatusTab {
  value: CaseStatus | 'ALL';
  label: string;
  count?: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Status tab options for filtering
 */
const STATUS_TABS: StatusTab[] = [
  { value: 'ALL', label: 'All' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

/**
 * Template type display configuration
 */
const TEMPLATE_LABELS: Record<string, { label: string; variant: string }> = {
  JP_CHECKUP: { label: 'JP Checkup', variant: 'checkup' },
  JP_TREATMENT: { label: 'JP Treatment', variant: 'treatment' },
};

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Status Tag Helper
 *
 * Returns styled tag props for case status display.
 *
 * @param status - The case status value
 * @returns Style configuration for Tag component
 */
const getStatusTagStyle = (status: CaseStatus): { background: string; color: string } => {
  const colors = CASE_STATUS_COLORS[status] || CASE_STATUS_COLORS.PENDING;
  return {
    background: colors.background,
    color: colors.text,
  };
};

/**
 * Format status label for display
 */
const formatStatusLabel = (status: CaseStatus): string => {
  return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * Case List Page Component
 *
 * Main page for browsing and managing cases. Provides:
 * - Search functionality with keyword filtering
 * - Status-based tab filtering
 * - Template type filtering
 * - Paginated table view with node progress
 * - Quick actions (view, create)
 *
 * Uses UIAdapter components obtained via useUI() hook per v3.0.8 Blueprint.
 * All styling uses standard CSS properties via style prop instead of MUI sx.
 *
 * @returns React element
 *
 * @example
 * ```tsx
 * // In router configuration
 * <Route path="/cases" element={<CaseListPageV2 />} />
 * ```
 */
export const CaseListPageV2: React.FC = () => {
  // Obtain UI components from UIAdapter via runtime context
  const {
    Box,
    Typography,
    Input,
    Button,
    Select,
    Card,
    Table,
    Tabs,
    Tag,
    Avatar,
    Spin,
    Alert,
    Tooltip,
    Icon,
  } = useUI();

  // Brix semantic design tokens — platform-level visual styling (Phase 6 migration)
  const { tokens } = useTheme();

  // Navigation capability from runtime
  const navigation = useNavigation();
  const { hasAnyPermission } = useAuth();
  const canCreateCase = hasAnyPermission(['case:create', 'case:manage']);

  // Local UI state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus | 'ALL'>('ALL');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('all');
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);

  // ViewModel hook - provides all data and operations
  const {
    items,
    isLoading,
    error,
    pagination,
    refresh,
    search,
    filterByStatus,
    deleteItem,
  } = useCaseList();

  // =========================================================================
  // Event Handlers
  // =========================================================================

  /**
   * Handle search input change
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  }, []);

  /**
   * Handle search submission
   */
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    search(searchKeyword);
  }, [search, searchKeyword]);

  /**
   * Handle status tab change
   */
  const handleStatusTabChange = useCallback((newValue: string) => {
    const status = newValue as CaseStatus | 'ALL';
    setSelectedStatus(status);
    filterByStatus(status === 'ALL' ? undefined : status);
  }, [filterByStatus]);

  /**
   * Handle template filter change
   */
  const handleTemplateChange = useCallback((value: string) => {
    setSelectedTemplate(value);
    // Note: Implement template filtering in useCaseList if needed
  }, []);

  /**
   * Navigate to case detail page
   */
  const handleViewCase = useCallback((caseData: CaseSummary) => {
    navigation.navigate(`/case/${caseData.id}`);
  }, [navigation]);

  /**
   * Open new case dialog
   */
  const handleOpenNewCase = useCallback(() => {
    setShowNewCaseDialog(true);
  }, []);

  /**
   * Close new case dialog
   */
  const handleCloseNewCase = useCallback(() => {
    setShowNewCaseDialog(false);
  }, []);

  /**
   * Handle case creation success
   */
  const handleCaseCreated = useCallback(() => {
    setShowNewCaseDialog(false);
    refresh();
  }, [refresh]);

  // =========================================================================
  // Table Configuration
  // =========================================================================

  /**
   * Table columns definition for UIAdapter Table
   */
  const tableColumns = [
    {
      key: 'caseNo',
      title: 'Case Number',
      render: (record: CaseSummary) => (
        <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            style={{
              width: 36,
              height: 36,
              backgroundColor: tokens.colors.brand.primaryLight,
              borderRadius: tokens.shape.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="folder_open" size={18} color={tokens.colors.brand.primary} />
          </Avatar>
          <Box>
            <Typography
              variant="body2"
              style={{ fontWeight: 500, fontFamily: 'monospace', color: tokens.colors.text.primary }}
            >
              {record.caseNo}
            </Typography>
            <Typography variant="caption" style={{ color: tokens.colors.text.secondary }}>
              {new Date(record.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      key: 'customer',
      title: 'Customer / Manager',
      render: (record: CaseSummary) => (
        <Box>
          <Typography variant="body2" style={{ color: tokens.colors.text.primary }}>
            {record.customerName}
          </Typography>
          <Typography variant="caption" style={{ color: tokens.colors.text.secondary }}>
            {record.assignedToName || 'Unassigned'}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'template',
      title: 'Template',
      render: (record: CaseSummary) => {
        const typeKey = record.templateName?.includes('Checkup') ? 'JP_CHECKUP' : 'JP_TREATMENT';
        const typeColor = TEMPLATE_TYPE_COLORS[typeKey];
        return (
          <Tag
            style={{
              backgroundColor: typeColor.background,
              color: typeColor.text,
              fontWeight: 500,
              fontSize: '0.6875rem',
            }}
          >
            {record.templateName}
          </Tag>
        );
      },
    },
    {
      key: 'progress',
      title: 'Node Progress',
      render: (record: CaseSummary) => (
        <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Box style={{ flex: 1, maxWidth: 100 }}>
            <Box
              style={{
                height: 4,
                borderRadius: 2,
                backgroundColor: tokens.colors.border.default,
                overflow: 'hidden',
              }}
            >
              <Box
                style={{
                  height: '100%',
                  width: `${record.progressPercent}%`,
                  backgroundColor: record.progressPercent === 100 ? tokens.colors.status.success : tokens.colors.brand.primary,
                  borderRadius: 2,
                  transition: `width ${tokens.motion.durationStandard} ${tokens.motion.easing}`,
                }}
              />
            </Box>
          </Box>
          <Typography variant="caption" style={{ color: tokens.colors.text.secondary, minWidth: 35 }}>
            {record.progressPercent}%
          </Typography>
        </Box>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (record: CaseSummary) => {
        const tagStyle = getStatusTagStyle(record.status);
        return (
          <Tag
            style={{
              backgroundColor: tagStyle.background,
              color: tagStyle.color,
              fontWeight: 500,
              fontSize: '0.6875rem',
            }}
          >
            {formatStatusLabel(record.status)}
          </Tag>
        );
      },
    },
    {
      key: 'action',
      title: '',
      width: 80,
      render: (record: CaseSummary) => (
        <Button
          variant="text"
          size="small"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            handleViewCase(record);
          }}
        >
          <Icon name="chevron_right" color={tokens.colors.brand.primary} />
        </Button>
      ),
    },
  ];

  // =========================================================================
  // Render States
  // =========================================================================

  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box style={{ padding: 24 }}>
        <Alert
          type="error"
          action={
            <Button variant="text" size="small" onClick={refresh}>
              Retry
            </Button>
          }
        >
          Failed to load cases: {error.message}
        </Alert>
      </Box>
    );
  }

  // =========================================================================
  // Tab Items Configuration
  // =========================================================================

  const tabItems = STATUS_TABS.map(tab => ({
    key: tab.value,
    label: (
      <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{tab.label}</span>
        <Tag
          style={{
            height: 20,
            fontSize: tokens.typography.labelSmall.fontSize,
            padding: `0 ${tokens.space.xs}`,
            backgroundColor: tokens.colors.surface.page,
            color: tokens.colors.text.secondary,
          }}
        >
          {tab.value === 'ALL' ? pagination.total : items.filter(c => c.status === tab.value).length}
        </Tag>
      </Box>
    ),
  }));

  // =========================================================================
  // Main Render
  // =========================================================================

  return (
    <Box style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header Section */}
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {/* Search */}
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, maxWidth: 500 }}
        >
          <Input
            size="small"
            placeholder="Search case number, customer name..."
            value={searchKeyword}
            onChange={handleSearchChange}
            prefix={<Icon name="search" size={20} color={tokens.colors.text.secondary} />}
            style={{ flex: 1 }}
          />
        </Box>

        {/* Actions */}
        <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Select
            value={selectedTemplate}
            onChange={handleTemplateChange}
            style={{ minWidth: 140 }}
            options={[
              { value: 'all', label: 'All Templates' },
              { value: 'JP_CHECKUP', label: 'JP Checkup' },
              { value: 'JP_TREATMENT', label: 'JP Treatment' },
            ]}
          />

          <Tooltip title="Refresh">
            <Button
              variant="secondary"
              onClick={refresh}
              style={{ padding: 8, minWidth: 'auto', border: `1px solid ${tokens.colors.border.default}` }}
            >
              <Icon name="refresh" size={18} />
            </Button>
          </Tooltip>

          {canCreateCase && (
            <Button
              variant="primary"
              onClick={handleOpenNewCase}
              style={{ whiteSpace: 'nowrap' }}
            >
              <Icon name="add" size={18} style={{ marginRight: 6 }} />
              New Case
            </Button>
          )}
        </Box>
      </Box>

      {/* Status Tabs */}
      <Box style={{ marginBottom: 16 }}>
        <Tabs
          activeKey={selectedStatus}
          onChange={handleStatusTabChange}
          items={tabItems}
        />
      </Box>

      {/* Case Table */}
      <Card>
        <Table
          columns={tableColumns}
          dataSource={items}
          rowKey="id"
          onRow={(record: CaseSummary) => ({
            onClick: () => handleViewCase(record),
            style: { cursor: 'pointer' },
          })}
        />

        {/* Empty State */}
        {items.length === 0 && (
          <Box style={{ textAlign: 'center', padding: '64px 0' }}>
            <Typography variant="body2" style={{ color: tokens.colors.text.secondary }}>
              No cases found
            </Typography>
          </Box>
        )}

        {/* Footer */}
        <Box
          style={{
            padding: '12px 16px',
            borderTop: `1px solid ${tokens.colors.border.default}`,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="caption" style={{ color: tokens.colors.text.secondary }}>
            Total: {pagination.total} records
          </Typography>
        </Box>
      </Card>

      {/* New Case Dialog */}
      <NewCaseDialog
        open={showNewCaseDialog}
        onClose={handleCloseNewCase}
        onSuccess={handleCaseCreated}
      />
    </Box>
  );
};

export default CaseListPageV2;
