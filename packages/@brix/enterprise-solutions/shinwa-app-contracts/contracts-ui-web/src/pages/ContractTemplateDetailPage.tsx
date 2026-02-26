/**
 * @file Contract Template Detail Page
 * @description Page component for viewing contract template details
 * @module @shinwa/contracts-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 View layer guidelines, this page component
 * only handles UI rendering and delegates all business logic
 * to ViewModel hooks.
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigation } from '@brix/runtime-sdk-react';
import { TEMPLATE_STATUS_CONFIG, VARIABLE_TYPE_LABELS } from '@shinwa/contracts-shared';
import { useContractTemplateDetail } from '../hooks';
import { TemplateStatusChip, ContractPreview } from '../components';

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
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
    color: '#6B7280',
  },
  breadcrumbLink: {
    color: '#3B82F6',
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
    color: '#111827',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#6B7280',
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
    color: '#fff',
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    color: '#374151',
    backgroundColor: '#fff',
    border: '1px solid #D1D5DB',
  },
  successButton: {
    color: '#fff',
    backgroundColor: '#059669',
  },
  dangerButton: {
    color: '#fff',
    backgroundColor: '#EF4444',
  },
  tabs: {
    display: 'flex',
    gap: '0',
    borderBottom: '2px solid #E5E7EB',
    marginBottom: '24px',
  },
  tab: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#6B7280',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
    cursor: 'pointer',
    transition: 'color 0.2s, border-color 0.2s',
  },
  tabActive: {
    color: '#3B82F6',
    borderBottomColor: '#3B82F6',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: '16px 20px',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#374151',
    margin: 0,
  },
  sectionContent: {
    padding: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
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
    color: '#6B7280',
  },
  fieldValue: {
    fontSize: '14px',
    color: '#111827',
  },
  variableList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  variableItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '6px',
  },
  variableOrder: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#3B82F6',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600,
    flexShrink: 0,
  },
  variableInfo: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '16px',
  },
  variableKey: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#3B82F6',
  },
  variableRequired: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
  },
  requiredYes: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
  },
  requiredNo: {
    backgroundColor: '#E5E7EB',
    color: '#6B7280',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  historyItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '16px',
    borderBottom: '1px solid #F3F4F6',
  },
  historyDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#3B82F6',
    marginTop: '4px',
    flexShrink: 0,
  },
  historyContent: {
    flex: 1,
  },
  historyAction: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#111827',
    marginBottom: '4px',
  },
  historyMeta: {
    fontSize: '12px',
    color: '#6B7280',
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#6B7280',
  },
  error: {
    textAlign: 'center',
    padding: '48px',
    color: '#EF4444',
    backgroundColor: '#FEF2F2',
    borderRadius: '8px',
  },
};

// ============================================================================
// Type Definitions
// ============================================================================

type TabType = 'info' | 'preview' | 'history';

// ============================================================================
// Page Component
// ============================================================================

/**
 * Contract Template Detail Page
 *
 * Displays detailed information about a contract template.
 *
 * @example
 * ```tsx
 * // Route: /contracts/templates/:id
 * <ContractTemplateDetailPage />
 * ```
 */
export const ContractTemplateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigation = useNavigation();
  
  // Active tab
  const [activeTab, setActiveTab] = useState<TabType>('info');
  
  // Use ViewModel hook for data fetching
  const { template, loading, error, publish, deprecate, archive } = useContractTemplateDetail(id!);

  /**
   * Navigate back to list
   */
  const handleBack = useCallback(() => {
    navigation.navigate('/contracts/templates');
  }, [navigation]);

  /**
   * Navigate to edit page
   */
  const handleEdit = useCallback(() => {
    navigation.navigate(`/contracts/templates/${id}/edit`);
  }, [navigation, id]);

  /**
   * Handle create contract from template
   */
  const handleCreateContract = useCallback(() => {
    navigation.navigate(`/contracts/create?templateId=${id}`);
  }, [navigation, id]);

  /**
   * Handle publish template
   */
  const handlePublish = useCallback(async () => {
    if (confirm('确定要发布此模板吗？发布后将可用于创建合同。')) {
      await publish();
    }
  }, [publish]);

  /**
   * Handle deprecate template
   */
  const handleDeprecate = useCallback(async () => {
    if (confirm('确定要停用此模板吗？停用后将无法用于创建新合同。')) {
      await deprecate();
    }
  }, [deprecate]);

  /**
   * Format date for display
   */
  const formatDate = (date?: Date | string): string => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN');
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
  if (!template) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>模板不存在</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <span style={styles.breadcrumbLink} onClick={handleBack}>合同模板</span>
        <span>/</span>
        <span>{template.name}</span>
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>
            {template.name}
            <TemplateStatusChip status={template.status} />
          </h1>
          <span style={styles.code}>{template.code}</span>
        </div>
        
        <div style={styles.actions}>
          {template.status === 'DRAFT' && (
            <>
              <button
                style={{ ...styles.button, ...styles.secondaryButton }}
                onClick={handleEdit}
              >
                编辑
              </button>
              <button
                style={{ ...styles.button, ...styles.successButton }}
                onClick={handlePublish}
              >
                发布
              </button>
            </>
          )}
          {template.status === 'PUBLISHED' && (
            <>
              <button
                style={{ ...styles.button, ...styles.primaryButton }}
                onClick={handleCreateContract}
              >
                创建合同
              </button>
              <button
                style={{ ...styles.button, ...styles.secondaryButton }}
                onClick={handleDeprecate}
              >
                停用
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'info' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('info')}
        >
          基本信息
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'preview' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('preview')}
        >
          模板预览
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
      {activeTab === 'info' && (
        <>
          {/* Basic Information Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>基本信息</h2>
            </div>
            <div style={styles.sectionContent}>
              <div style={styles.grid}>
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>模板名称</span>
                  <span style={styles.fieldValue}>{template.name}</span>
                </div>
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>模板编号</span>
                  <span style={styles.fieldValue}>{template.code}</span>
                </div>
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>版本</span>
                  <span style={styles.fieldValue}>v{template.version || '1.0'}</span>
                </div>
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>分类</span>
                  <span style={styles.fieldValue}>{template.category || '-'}</span>
                </div>
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>创建时间</span>
                  <span style={styles.fieldValue}>{formatDate(template.createdAt)}</span>
                </div>
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>更新时间</span>
                  <span style={styles.fieldValue}>{formatDate(template.updatedAt)}</span>
                </div>
              </div>
              {template.description && (
                <div style={{ ...styles.field, marginTop: '24px' }}>
                  <span style={styles.fieldLabel}>描述</span>
                  <span style={styles.fieldValue}>{template.description}</span>
                </div>
              )}
            </div>
          </div>

          {/* Variables Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                变量定义 ({template.variables?.length || 0})
              </h2>
            </div>
            <div style={styles.sectionContent}>
              {template.variables && template.variables.length > 0 ? (
                <div style={styles.variableList}>
                  {template.variables.map((variable, index) => (
                    <div key={variable.key} style={styles.variableItem}>
                      <span style={styles.variableOrder}>{index + 1}</span>
                      <div style={styles.variableInfo}>
                        <div style={styles.field}>
                          <span style={styles.fieldLabel}>变量名</span>
                          <span style={styles.variableKey}>
                            {'{{' + variable.key + '}}'}
                          </span>
                        </div>
                        <div style={styles.field}>
                          <span style={styles.fieldLabel}>显示名称</span>
                          <span style={styles.fieldValue}>{variable.label}</span>
                        </div>
                        <div style={styles.field}>
                          <span style={styles.fieldLabel}>类型</span>
                          <span style={styles.fieldValue}>
                            {VARIABLE_TYPE_LABELS[variable.type]}
                          </span>
                        </div>
                        <div style={styles.field}>
                          <span style={styles.fieldLabel}>必填</span>
                          <span
                            style={{
                              ...styles.variableRequired,
                              ...(variable.required ? styles.requiredYes : styles.requiredNo),
                            }}
                          >
                            {variable.required ? '是' : '否'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#9CA3AF', textAlign: 'center', padding: '24px' }}>
                  暂无变量定义
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'preview' && (
        <ContractPreview
          template={template}
          highlightVariables={true}
        />
      )}

      {activeTab === 'history' && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>操作历史</h2>
          </div>
          <div style={styles.sectionContent}>
            <div style={styles.historyList}>
              {/* Mock history data - in real app, this would come from API */}
              <div style={styles.historyItem}>
                <div style={styles.historyDot}></div>
                <div style={styles.historyContent}>
                  <div style={styles.historyAction}>模板创建</div>
                  <div style={styles.historyMeta}>
                    {formatDate(template.createdAt)} · {template.createdBy || '系统'}
                  </div>
                </div>
              </div>
              {template.status !== 'DRAFT' && (
                <div style={styles.historyItem}>
                  <div style={{ ...styles.historyDot, backgroundColor: '#059669' }}></div>
                  <div style={styles.historyContent}>
                    <div style={styles.historyAction}>模板发布</div>
                    <div style={styles.historyMeta}>
                      {formatDate(template.updatedAt)} · {template.updatedBy || '系统'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractTemplateDetailPage;
