/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 * 
 * @fileoverview TenantDetail Page (View Layer)
 * All UI text is i18n-driven via useTranslation().
 */

import { useState } from 'react';
import { useUI, useI18n, useTheme } from '@brix-sdk/runtime-sdk-react';
import { useTenantDetail } from '../../hooks';
import { TenantStatus } from '@brix-sdk/tenant-shared';
import type { UpdateTenantRequest } from '@brix-sdk/tenant-shared';

/**
 * Props for TenantDetailPage
 */
interface TenantDetailPageProps {
  tenantId: string;
}

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
 * TenantDetail Page Component
 */
export function TenantDetailPage({ tenantId }: TenantDetailPageProps) {
  const { t } = useI18n('tenant');
  const { tokens } = useTheme();
  const statusConfig = getStatusConfig(t);
  // =========================================
  // UI Components (via UIAdapter)
  // =========================================
  const {
    Card,
    Button,
    Input,
    Tabs,
    Tag,
    Switch,
    Spin,
    Empty,
    Modal,
    message,
    Divider,
  } = useUI();

  // =========================================
  // ViewModel Hook
  // =========================================
  const { state, actions } = useTenantDetail(tenantId);

  // =========================================
  // Local State (UI only)
  // =========================================
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateTenantRequest>({});
  const [suspendReason, setSuspendReason] = useState('');
  const [terminateReason, setTerminateReason] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);

  // =========================================
  // Event Handlers
  // =========================================
  const handleStartEdit = () => {
    if (state.tenant) {
      setEditForm({
        name: state.tenant.name,
        description: state.tenant.description,
        contactEmail: state.tenant.contactEmail,
      });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await actions.updateTenant(editForm);
      setIsEditing(false);
      message.success(t('detail.saveSuccess'));
    } catch {
      message.error(t('detail.saveFailed'));
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleActivate = async () => {
    try {
      await actions.activateTenant();
      message.success(t('detail.activateSuccess'));
    } catch {
      message.error(t('detail.activateFailed'));
    }
  };

  const handleSuspend = async () => {
    try {
      await actions.suspendTenant(suspendReason);
      setShowSuspendModal(false);
      setSuspendReason('');
      message.success(t('detail.suspendSuccess'));
    } catch {
      message.error(t('detail.suspendFailed'));
    }
  };

  const handleTerminate = async () => {
    try {
      await actions.terminateTenant(terminateReason);
      setShowTerminateModal(false);
      message.success(t('detail.terminateSuccess'));
    } catch {
      message.error(t('detail.terminateFailed'));
    }
  };

  const handleFeatureToggle = async (featureKey: string, enabled: boolean) => {
    try {
      await actions.toggleFeature(featureKey, enabled);
      message.success(enabled ? t('detail.featureEnabled') : t('detail.featureDisabled'));
    } catch {
      message.error(t('detail.featureToggleFailed'));
    }
  };

  // =========================================
  // Loading State
  // =========================================
  if (state.isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin />
      </div>
    );
  }

  // =========================================
  // Empty State
  // =========================================
  if (!state.tenant) {
    return <Empty description={t('detail.notFound')} />;
  }

  const { tenant, features } = state;
  const statusDisplay = statusConfig[tenant.status];

  // =========================================
  // Tab Items
  // =========================================
  const tabItems = [
    {
      key: 'info',
      label: t('detail.tabInfo'),
      children: (
        <div className="tenant-info">
          {/* Basic Info */}
          <div className="info-section">
            <h3>{t('detail.tenantInfo')}</h3>
            <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px 24px' }}>
              <span className="label">{t('detail.tenantCode')}</span>
              <code>{tenant.code}</code>

              <span className="label">{t('detail.tenantName')}</span>
              {isEditing ? (
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              ) : (
                <span>{tenant.name}</span>
              )}

              <span className="label">{t('detail.statusLabel')}</span>
              <Tag color={statusDisplay.color}>{statusDisplay.label}</Tag>

              <span className="label">{t('detail.description')}</span>
              {isEditing ? (
                <Input
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              ) : (
                <span>{tenant.description || '-'}</span>
              )}

              <span className="label">{t('detail.contactEmail')}</span>
              {isEditing ? (
                <Input
                  value={editForm.contactEmail || ''}
                  onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                />
              ) : (
                <span>{tenant.contactEmail || '-'}</span>
              )}

              <span className="label">{t('detail.memberCount')}</span>
              <span>{tenant.memberCount}</span>

              <span className="label">{t('detail.createdAt')}</span>
              <span>{new Date(tenant.createdAt).toLocaleString('zh-CN')}</span>

              {tenant.activatedAt && (
                <>
                  <span className="label">{t('detail.activatedAt')}</span>
                  <span>{new Date(tenant.activatedAt).toLocaleString('zh-CN')}</span>
                </>
              )}
            </div>

            {/* Edit Actions */}
            <div style={{ marginTop: 16 }}>
              {isEditing ? (
                <>
                  <Button onClick={handleSaveEdit} variant="primary" disabled={state.isSaving}>
                    {t('detail.save')}
                  </Button>
                  <Button onClick={handleCancelEdit} style={{ marginLeft: 8 }}>
                    {t('detail.cancel')}
                  </Button>
                </>
              ) : (
                <Button onClick={handleStartEdit}>
                  {t('detail.edit')}
                </Button>
              )}
            </div>
          </div>

          <Divider />

          {/* Status Actions */}
          <div className="status-section">
            <h3>{t('detail.statusActions')}</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              {tenant.status === TenantStatus.PENDING_ACTIVATION && (
                <Button variant="primary" onClick={handleActivate} disabled={state.isSaving}>
                  {t('detail.activateTenant')}
                </Button>
              )}
              {tenant.status === TenantStatus.ACTIVE && (
                <Button variant="secondary" onClick={() => setShowSuspendModal(true)}>
                  {t('detail.suspendTenant')}
                </Button>
              )}
              {tenant.status === TenantStatus.SUSPENDED && (
                <Button variant="primary" onClick={handleActivate} disabled={state.isSaving}>
                  {t('detail.restoreTenant')}
                </Button>
              )}
              {tenant.status !== TenantStatus.TERMINATED && (
                <Button variant="danger" onClick={() => setShowTerminateModal(true)}>
                  {t('detail.terminateTenant')}
                </Button>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'members',
      label: t('detail.tabMembers'),
      children: (
        <div className="members-section">
          <p>{t('detail.membersSummary', { count: tenant.memberCount, interpolation: { count: tenant.memberCount } })}</p>
          <Button onClick={actions.viewMembers}>
            {t('detail.manageMembers')}
          </Button>
        </div>
      ),
    },
    {
      key: 'features',
      label: t('detail.tabFeatures'),
      children: (
        <div className="features-section">
          <h3>{t('detail.featureSwitches')}</h3>
          {features.length === 0 ? (
            <Empty description={t('detail.noFeatures')} />
          ) : (
            <div className="feature-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {features.map((feature) => (
                <div
                  key={feature.key}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${tokens.colors.border.default}` }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{feature.name}</div>
                    {feature.description && (
                      <div style={{ color: tokens.colors.text.secondary, fontSize: 12 }}>{feature.description}</div>
                    )}
                  </div>
                  <Switch
                    checked={feature.enabled}
                    onChange={(checked) => handleFeatureToggle(feature.key, checked)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
  ];

  // =========================================
  // Render
  // =========================================
  return (
    <div className="tenant-detail-page">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Button onClick={actions.goBack} style={{ marginRight: 16 }}>
            {t('detail.backToList')}
          </Button>
          <h1 style={{ display: 'inline', margin: 0 }}>{tenant.name}</h1>
          <Tag color={statusDisplay.color} style={{ marginLeft: 12 }}>
            {statusDisplay.label}
          </Tag>
        </div>
        <Button onClick={actions.refresh}>
          {t('detail.refresh')}
        </Button>
      </div>

      <Card>
        <Tabs
          activeKey={state.activeTab}
          onChange={(key) => actions.setActiveTab(key as typeof state.activeTab)}
          items={tabItems}
        />
      </Card>

      {/* Suspend Modal */}
      <Modal
        title={t('detail.suspendModalTitle')}
        open={showSuspendModal}
        onOk={handleSuspend}
        onCancel={() => setShowSuspendModal(false)}
        okText={t('detail.suspendModalOk')}
        cancelText={t('detail.suspendModalCancel')}
      >
        <p dangerouslySetInnerHTML={{ __html: t('detail.suspendConfirm', { interpolation: { name: tenant.name } }) }} />
        <p>{t('detail.suspendWarning')}</p>
        <Input
          placeholder={t('detail.suspendReasonPlaceholder')}
          value={suspendReason}
          onChange={(e) => setSuspendReason(e.target.value)}
          style={{ marginTop: 12 }}
        />
      </Modal>

      {/* Terminate Modal */}
      <Modal
        title={t('detail.terminateModalTitle')}
        open={showTerminateModal}
        onOk={handleTerminate}
        onCancel={() => setShowTerminateModal(false)}
        okText={t('detail.terminateModalOk')}
        cancelText={t('detail.terminateModalCancel')}
        okButtonProps={{ danger: true, disabled: !terminateReason }}
      >
        <p style={{ color: 'red' }}>
          {t('detail.terminateWarning')}
        </p>
        <p dangerouslySetInnerHTML={{ __html: t('detail.terminateConfirm', { interpolation: { name: tenant.name } }) }} />
        <Input
          placeholder={t('detail.terminateReasonPlaceholder')}
          value={terminateReason}
          onChange={(e) => setTerminateReason(e.target.value)}
          style={{ marginTop: 12 }}
        />
      </Modal>
    </div>
  );
}

export default TenantDetailPage;
