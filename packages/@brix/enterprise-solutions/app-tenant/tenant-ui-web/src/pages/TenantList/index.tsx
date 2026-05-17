/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 * 
 * @fileoverview TenantList Page (View Layer)
 * 
 * Pure rendering layer. Data from useTenantList hook, actions from ViewModel.
 * All UI text is i18n-driven via useTranslation().
 */

import type { ComponentType } from 'react';
import type { TableColumn, TableProps } from '@brix-sdk/runtime-sdk-api-web';
import { useUI, useI18n } from '@brix-sdk/runtime-sdk-react';
import { useTenantList, useTenantViewMode } from '../../hooks';
import { TenantStatus, type TenantDTO } from '@brix-sdk/tenant-shared';

/**
 * Get status display config using i18n translation function.
 */
function getStatusConfig(t: (key: string) => string): Record<TenantStatus, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> {
  return {
    [TenantStatus.ACTIVE]: { label: t('status.ACTIVE'), color: 'success' },
    [TenantStatus.PENDING_ACTIVATION]: { label: t('status.PENDING_ACTIVATION'), color: 'warning' },
    [TenantStatus.SUSPENDED]: { label: t('status.SUSPENDED'), color: 'error' },
    [TenantStatus.TERMINATED]: { label: t('status.TERMINATED'), color: 'default' },
  };
}

/**
 * TenantList Page Component
 */
export function TenantListPage() {
  const { t } = useI18n('tenant');
  const statusConfig = getStatusConfig(t);
  // =========================================
  // UI Components (via UIAdapter)
  // =========================================
  const {
    Card,
    Table,
    Button,
    Input,
    Select,
    Tag,
    Pagination,
    Spin,
    Empty,
    message,
  } = useUI();
  const TenantTable = Table as ComponentType<TableProps<TenantDTO>>;

  // =========================================
  // ViewModel Hook
  // =========================================
  const { state, actions } = useTenantList();
  const viewMode = useTenantViewMode();

  // =========================================
  // Event Handlers (delegate to actions)
  // =========================================
  const handleSearch = (value: string) => {
    actions.search(value);
  };

  const handleStatusFilter = (status: TenantStatus | null) => {
    actions.filterByStatus(status);
  };

  const handlePageChange = (page: number) => {
    actions.setPage(page);
  };

  const handleActivate = async (tenantId: string) => {
    try {
      await actions.activateTenant(tenantId);
      message.success(t('list.activateSuccess'));
    } catch {
      message.error(t('list.activateFailed'));
    }
  };

  const handleSuspend = async (tenantId: string) => {
    try {
      await actions.suspendTenant(tenantId, t('list.suspendReason'));
      message.success(t('list.suspendSuccess'));
    } catch {
      message.error(t('list.suspendFailed'));
    }
  };

  const handleViewAsTenant = async (tenantId: string) => {
    try {
      await viewMode.viewAsTenant(tenantId);
    } catch {
      message.error(t('list.viewAsFailed'));
    }
  };

  // =========================================
  // Table Columns Definition
  // =========================================
  const columns: TableColumn<TenantDTO>[] = [
    {
      title: t('list.colCode'),
      dataIndex: 'code',
      key: 'code',
      render: (code) => <code>{String(code)}</code>,
    },
    {
      title: t('list.colName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('list.colStatus'),
      dataIndex: 'status',
      key: 'status',
      render: (value) => {
        const status = value as TenantStatus;
        const config = statusConfig[status];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: t('list.colMemberCount'),
      dataIndex: 'memberCount',
      key: 'memberCount',
      align: 'center' as const,
    },
    {
      title: t('list.colCreatedAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(String(date)).toLocaleDateString('zh-CN'),
    },
    {
      title: t('list.colActions'),
      key: 'actions',
      render: (_value, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="small"
            onClick={() => actions.viewTenant(record.id)}
            data-testid="tenant-row-view"
          >
            {t('list.actionView')}
          </Button>
          <Button
            size="small"
            variant="secondary"
            loading={viewMode.switchingTenantId === record.id}
            onClick={() => handleViewAsTenant(record.id)}
            data-testid="tenant-row-view-as"
          >
            {t('list.actionViewAs')}
          </Button>
          {record.status === TenantStatus.PENDING_ACTIVATION && (
            <Button
              size="small"
              variant="primary"
              onClick={() => handleActivate(record.id)}
              data-testid="tenant-row-activate"
            >
              {t('list.actionActivate')}
            </Button>
          )}
          {record.status === TenantStatus.ACTIVE && (
            <Button
              size="small"
              variant="secondary"
              onClick={() => handleSuspend(record.id)}
              data-testid="tenant-row-suspend"
            >
              {t('list.actionSuspend')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  // =========================================
  // Status Filter Options
  // =========================================
  const statusOptions = [
    { value: '', label: t('list.allStatus') },
    { value: TenantStatus.ACTIVE, label: t('status.ACTIVE') },
    { value: TenantStatus.PENDING_ACTIVATION, label: t('status.PENDING_ACTIVATION') },
    { value: TenantStatus.SUSPENDED, label: t('status.SUSPENDED') },
    { value: TenantStatus.TERMINATED, label: t('status.TERMINATED') },
  ];

  // =========================================
  // Render
  // =========================================
  return (
    <div className="tenant-list-page">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1>{t('list.pageTitle')}</h1>
        <p>{t('list.pageDesc')}</p>
      </div>

      <Card>
        {/* Toolbar */}
        <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Input
              placeholder={t('list.searchPlaceholder')}
              value={state.keyword}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 240 }}
              data-testid="tenant-list-search"
            />
            <Select
              value={state.statusFilter || ''}
              onChange={(value) => handleStatusFilter(value as TenantStatus || null)}
              options={statusOptions}
              style={{ width: 140 }}
              data-testid="tenant-list-status-filter"
            />
          </div>
          <Button
            variant="primary"
            onClick={actions.createTenant}
            data-testid="tenant-create-open"
          >
            {t('list.createBtn')}
          </Button>
        </div>

        {/* Loading State */}
        {state.isLoading && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin />
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div style={{ color: 'red', padding: 16 }}>
            {state.error}
            <Button
              size="small"
              onClick={actions.refresh}
              style={{ marginLeft: 8 }}
              data-testid="tenant-list-retry"
            >
              {t('list.retry')}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!state.isLoading && !state.error && state.tenants.length === 0 && (
          <Empty description={t('list.noData')} />
        )}

        {/* Table */}
        {!state.isLoading && !state.error && state.tenants.length > 0 && (
          <>
            <TenantTable
              columns={columns}
              dataSource={state.tenants}
              rowKey={(record) => record.id}
            />
            
            {/* Pagination */}
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Pagination
                current={state.page}
                pageSize={state.pageSize}
                total={state.total}
                onChange={handlePageChange}
                showSizeChanger
                onPageSizeChange={actions.setPageSize}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default TenantListPage;
