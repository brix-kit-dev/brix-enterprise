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
 * @file Contract Detail Page
 * @description Page component for viewing contract details
 * @module @brix-sdk/enterprise-contracts-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 View layer guidelines, this page component
 * only handles UI rendering and delegates all business logic
 * to ViewModel hooks.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigation, useTheme } from '@brix-sdk/runtime-sdk-react';
import { PARTY_TYPE_LABELS, SIGNATURE_STATUS_CONFIG } from '@brix-sdk/enterprise-contracts-shared';
import { useContractDetail } from '../hooks';
import { ContractStatusChip, ContractPreview, SignatureTimeline } from '../components';

// ============================================================================
// Styles
// ============================================================================

const getStyles = (tokens: any): Record<string, React.CSSProperties> => ({
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    color: tokens.colors.text.secondary,
  },
  breadcrumbLink: {
    color: tokens.colors.brand.primary,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: tokens.colors.text.primary,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: tokens.colors.text.secondary,
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  primaryButton: {
    color: tokens.colors.surface.card,
    backgroundColor: tokens.colors.brand.primary,
  },
  secondaryButton: {
    color: tokens.colors.text.primary,
    backgroundColor: tokens.colors.surface.card,
    border: `1px solid ${tokens.colors.border.subtle}`,
  },
  successButton: {
    color: tokens.colors.surface.card,
    backgroundColor: tokens.colors.status.success,
  },
  warningButton: {
    color: tokens.colors.surface.card,
    backgroundColor: tokens.colors.status.warning,
  },
  dangerButton: {
    color: tokens.colors.surface.card,
    backgroundColor: tokens.colors.status.error,
  },
  tabs: {
    display: 'flex',
    gap: '0',
    borderBottom: `2px solid ${tokens.colors.border.default}`,
    marginBottom: '24px',
  },
  tab: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 500,
    color: tokens.colors.text.secondary,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
    cursor: 'pointer',
    transition: 'color 0.2s, border-color 0.2s',
  },
  tabActive: {
    color: tokens.colors.brand.primary,
    borderBottomColor: tokens.colors.brand.primary,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: '24px',
    alignItems: 'start',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    position: 'sticky',
    top: '24px',
  },
  section: {
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: '16px 20px',
    backgroundColor: tokens.colors.surface.page,
    borderBottom: `1px solid ${tokens.colors.border.default}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: tokens.colors.text.primary,
    margin: 0,
  },
  sectionContent: {
    padding: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: tokens.colors.text.secondary,
  },
  fieldValue: {
    fontSize: '14px',
    color: tokens.colors.text.primary,
  },
  amountValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: tokens.colors.status.success,
  },
  partyCard: {
    padding: '16px',
    backgroundColor: tokens.colors.surface.page,
    borderRadius: '8px',
    marginBottom: '12px',
  },
  partyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  partyType: {
    padding: '4px 8px',
    backgroundColor: tokens.colors.brand.primary,
    color: tokens.colors.surface.card,
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  },
  partyName: {
    fontSize: '16px',
    fontWeight: 600,
    color: tokens.colors.text.primary,
  },
  partyInfo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    fontSize: '13px',
    color: tokens.colors.text.secondary,
  },
  signatureCard: {
    padding: '12px 16px',
    backgroundColor: tokens.colors.surface.card,
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: '8px',
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signatureInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  signatureName: {
    fontSize: '14px',
    fontWeight: 500,
    color: tokens.colors.text.primary,
  },
  signatureRole: {
    fontSize: '12px',
    color: tokens.colors.text.secondary,
  },
  signatureStatus: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: tokens.colors.text.secondary,
  },
  error: {
    textAlign: 'center',
    padding: '48px',
    color: tokens.colors.status.error,
    backgroundColor: tokens.colors.status.errorLight,
    borderRadius: '8px',
  },
});

// ============================================================================
// Type Definitions
// ============================================================================

type TabType = 'overview' | 'content' | 'signatures' | 'history';

// ============================================================================
// Page Component
// ============================================================================

/**
 * Contract Detail Page
 *
 * Displays detailed information about a contract instance.
 *
 * @example
 * ```tsx
 * // Route: /contracts/:id
 * <ContractDetailPage />
 * ```
 */
export const ContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigation = useNavigation();
  const { tokens } = useTheme();
  const styles = getStyles(tokens);
  
  // Active tab
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Use ViewModel hook for data fetching
  const { contract, loading, error, submitForApproval, sign, cancel } = useContractDetail(id!);

  /**
   * Navigate back to list
   */
  const handleBack = useCallback(() => {
    navigation.navigate('/contracts');
  }, [navigation]);

  /**
   * Navigate to edit page
   */
  const handleEdit = useCallback(() => {
    navigation.navigate(`/contracts/${id}/edit`);
  }, [navigation, id]);

  /**
   * Handle submit for approval
   */
  const handleSubmitForApproval = useCallback(async () => {
    if (confirm('确定要提交审批吗？')) {
      await submitForApproval();
    }
  }, [submitForApproval]);

  /**
   * Handle signing
   */
  const handleSign = useCallback(async () => {
    if (confirm('确定要签署此合同吗？签署后将产生法律效力。')) {
      await sign();
    }
  }, [sign]);

  /**
   * Handle cancel
   */
  const handleCancel = useCallback(async () => {
    if (confirm('确定要作废此合同吗？此操作不可恢复。')) {
      await cancel();
    }
  }, [cancel]);

  /**
   * Format date for display
   */
  const formatDate = (date?: Date | string): string => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN');
  };

  /**
   * Format date time for display
   */
  const formatDateTime = (date?: Date | string): string => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN');
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount?: number): string => {
    if (amount === undefined || amount === null) return '-';
    return `¥${amount.toLocaleString()}`;
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>加载中...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  // Not found state
  if (!contract) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>合同不存在</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <span style={styles.breadcrumbLink} onClick={handleBack}>合同管理</span>
        <span>/</span>
        <span>{contract.title}</span>
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>
            {contract.title}
            <ContractStatusChip status={contract.status} size="large" />
          </h1>
          <span style={styles.code}>{contract.code}</span>
        </div>
        
        <div style={styles.actions}>
          {contract.status === 'DRAFT' && (
            <>
              <button
                style={{ ...styles.button, ...styles.secondaryButton }}
                onClick={handleEdit}
              >
                编辑
              </button>
              <button
                style={{ ...styles.button, ...styles.warningButton }}
                onClick={handleSubmitForApproval}
              >
                提交审批
              </button>
            </>
          )}
          {contract.status === 'PENDING_SIGNATURE' && (
            <button
              style={{ ...styles.button, ...styles.successButton }}
              onClick={handleSign}
            >
              签署合同
            </button>
          )}
          {['DRAFT', 'PENDING_APPROVAL'].includes(contract.status) && (
            <button
              style={{ ...styles.button, ...styles.dangerButton }}
              onClick={handleCancel}
            >
              作废
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'overview' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('overview')}
        >
          概览
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'content' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('content')}
        >
          合同内容
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'signatures' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('signatures')}
        >
          签署进度
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'history' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('history')}
        >
          操作历史
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={styles.layout}>
          <div style={styles.mainContent}>
            {/* Basic Information */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>基本信息</h2>
              </div>
              <div style={styles.sectionContent}>
                <div style={styles.grid}>
                  <div style={styles.field}>
                    <span style={styles.fieldLabel}>合同名称</span>
                    <span style={styles.fieldValue}>{contract.title}</span>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.fieldLabel}>合同编号</span>
                    <span style={styles.fieldValue}>{contract.code}</span>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.fieldLabel}>使用模板</span>
                    <span style={styles.fieldValue}>{contract.templateName || '-'}</span>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.fieldLabel}>模板编号</span>
                    <span style={styles.fieldValue}>{contract.templateCode || '-'}</span>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.fieldLabel}>生效日期</span>
                    <span style={styles.fieldValue}>{formatDate(contract.effectiveDate)}</span>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.fieldLabel}>到期日期</span>
                    <span style={styles.fieldValue}>{formatDate(contract.expirationDate)}</span>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.fieldLabel}>创建时间</span>
                    <span style={styles.fieldValue}>{formatDateTime(contract.createdAt)}</span>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.fieldLabel}>最后更新</span>
                    <span style={styles.fieldValue}>{formatDateTime(contract.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Parties */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>签约各方</h2>
              </div>
              <div style={styles.sectionContent}>
                {contract.parties?.map((party, index) => (
                  <div key={party.id || index} style={styles.partyCard}>
                    <div style={styles.partyHeader}>
                      <span style={styles.partyType}>
                        {PARTY_TYPE_LABELS[party.type]}
                      </span>
                      <span style={styles.partyName}>{party.name}</span>
                    </div>
                    <div style={styles.partyInfo}>
                      <div>
                        <span style={styles.fieldLabel}>联系人：</span>
                        {party.contactName || '-'}
                      </div>
                      <div>
                        <span style={styles.fieldLabel}>电话：</span>
                        {party.contactPhone || '-'}
                      </div>
                      <div>
                        <span style={styles.fieldLabel}>邮箱：</span>
                        {party.contactEmail || '-'}
                      </div>
                      <div>
                        <span style={styles.fieldLabel}>地址：</span>
                        {party.address || '-'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={styles.sidebar}>
            {/* Amount Card */}
            <div style={styles.section}>
              <div style={styles.sectionContent}>
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>合同金额</span>
                  <span style={styles.amountValue}>
                    {formatCurrency(contract.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature Progress */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>签署进度</h2>
              </div>
              <div style={styles.sectionContent}>
                {contract.parties?.map((party, index) => {
                  const config = SIGNATURE_STATUS_CONFIG[party.signatureStatus || 'PENDING'];
                  return (
                    <div key={party.id || index} style={styles.signatureCard}>
                      <div style={styles.signatureInfo}>
                        <span style={styles.signatureName}>{party.name}</span>
                        <span style={styles.signatureRole}>
                          {PARTY_TYPE_LABELS[party.type]}
                        </span>
                      </div>
                      <span
                        style={{
                          ...styles.signatureStatus,
                          backgroundColor: config.bgColor,
                          color: config.color,
                        }}
                      >
                        {config.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <ContractPreview
          contract={contract}
          highlightVariables={false}
        />
      )}

      {activeTab === 'signatures' && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>签署进度</h2>
          </div>
          <div style={styles.sectionContent}>
            <SignatureTimeline parties={contract.parties || []} />
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>操作历史</h2>
          </div>
          <div style={styles.sectionContent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {/* Timeline items - in real app, would come from API */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '16px',
                borderBottom: `1px solid ${tokens.colors.surface.page}`,
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: tokens.colors.brand.primary,
                  marginTop: '4px',
                  flexShrink: 0,
                }}></div>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: tokens.colors.text.primary,
                    marginBottom: '4px',
                  }}>合同创建</div>
                  <div style={{
                    fontSize: '12px',
                    color: tokens.colors.text.secondary,
                  }}>
                    {formatDateTime(contract.createdAt)} · {contract.createdBy || '系统'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractDetailPage;
