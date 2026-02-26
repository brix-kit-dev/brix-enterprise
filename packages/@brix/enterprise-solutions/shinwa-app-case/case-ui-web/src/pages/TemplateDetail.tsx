/**
 * @file Template Detail Page
 * @description View layer - View template detail with workflow nodes
 * @module @shinwa/case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 blueprint three-layer architecture: View → ViewModel → Repository
 * - View layer: Pure presentational component
 * - Data fetching through useTemplateDetail hook
 * - Direct HTTP/fetch/axios calls are prohibited
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigation } from '@brix/runtime-sdk-react';
import { useTemplateDetail } from '../hooks/useTemplate';
import { CASE_TYPE_CONFIG } from '@shinwa/case-shared';

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Template Detail Page Component
 */
const TemplateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigation = useNavigation();

  // Data hook
  const {
    item: template,
    isLoading,
    error,
    refresh,
    deleteItem,
    activateTemplate,
    deactivateTemplate,
  } = useTemplateDetail(id || '');

  // =========================================================================
  // Event Handlers
  // =========================================================================

  const handleBack = useCallback(() => {
    navigation.navigate('/template');
  }, [navigation]);

  const handleEdit = useCallback(() => {
    navigation.navigate(`/template/${id}/edit`);
  }, [navigation, id]);

  const handleToggleActive = useCallback(async () => {
    if (!template) return;
    try {
      if (template.isActive) {
        await deactivateTemplate();
      } else {
        await activateTemplate();
      }
      refresh();
    } catch (err) {
      alert('操作失败: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [template, activateTemplate, deactivateTemplate, refresh]);

  const handleDelete = useCallback(async () => {
    if (!template) return;
    if (window.confirm(`确定要删除模板 "${template.name}" 吗？此操作不可撤销。`)) {
      try {
        await deleteItem();
        navigation.navigate('/template');
      } catch (err) {
        alert('删除失败: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
  }, [template, deleteItem, navigation]);

  const handleCreateCase = useCallback(() => {
    navigate(`/case/create?templateId=${id}`);
  }, [navigate, id]);

  // =========================================================================
  // Render States
  // =========================================================================

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <span style={styles.spinner}>⏳</span>
          加载中...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <span style={styles.errorIcon}>⚠️</span>
          <span>加载失败: {error.message}</span>
          <button onClick={refresh} style={styles.retryButton}>
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div style={styles.container}>
        <div style={styles.notFound}>
          <span style={styles.notFoundIcon}>🔍</span>
          <span>未找到模板数据</span>
          <button onClick={handleBack} style={styles.backButton}>
            返回列表
          </button>
        </div>
      </div>
    );
  }

  const typeConfig = CASE_TYPE_CONFIG[template.caseType] || {
    label: template.caseType,
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: '📋',
  };

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.header}>
        <button onClick={handleBack} style={styles.backLink}>
          ← 返回列表
        </button>
        <div style={styles.headerActions}>
          <button onClick={refresh} style={styles.actionButton}>
            🔄 刷新
          </button>
          <button onClick={handleEdit} style={styles.actionButton}>
            ✏️ 编辑
          </button>
          <button onClick={handleToggleActive} style={styles.actionButton}>
            {template.isActive ? '🔒 禁用' : '✅ 启用'}
          </button>
          <button onClick={handleDelete} style={styles.deleteButton}>
            🗑️ 删除
          </button>
        </div>
      </div>

      {/* Template Info Card */}
      <div style={styles.infoCard}>
        <div style={styles.infoHeader}>
          <div style={styles.infoLeft}>
            <span
              style={{
                ...styles.typeBadge,
                backgroundColor: typeConfig.bgColor,
                color: typeConfig.color,
              }}
            >
              {typeConfig.icon} {typeConfig.label}
            </span>
            <span
              style={{
                ...styles.statusBadge,
                backgroundColor: template.isActive ? '#D1FAE5' : '#F3F4F6',
                color: template.isActive ? '#059669' : '#6B7280',
              }}
            >
              {template.isActive ? '已启用' : '已禁用'}
            </span>
          </div>
          <button onClick={handleCreateCase} style={styles.createCaseButton}>
            + 使用此模板创建案例
          </button>
        </div>

        <h1 style={styles.templateTitle}>{template.name}</h1>

        {template.description && (
          <p style={styles.templateDescription}>{template.description}</p>
        )}

        <div style={styles.metaGrid}>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>创建时间</span>
            <span style={styles.metaValue}>
              {new Date(template.createdAt).toLocaleString('zh-CN')}
            </span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>更新时间</span>
            <span style={styles.metaValue}>
              {new Date(template.updatedAt).toLocaleString('zh-CN')}
            </span>
          </div>
          {template.createdBy && (
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>创建者</span>
              <span style={styles.metaValue}>{template.createdBy}</span>
            </div>
          )}
        </div>
      </div>

      {/* Workflow Nodes */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          📋 工作流程节点
          {template.nodes && (
            <span style={styles.sectionCount}>{template.nodes.length} 个节点</span>
          )}
        </h2>

        {template.nodes && template.nodes.length > 0 ? (
          <div style={styles.nodeList}>
            {template.nodes.map((node, index) => (
              <div key={node.id || index} style={styles.nodeCard}>
                <div style={styles.nodeIndex}>{index + 1}</div>
                <div style={styles.nodeContent}>
                  <div style={styles.nodeName}>{node.name}</div>
                  {node.description && (
                    <div style={styles.nodeDescription}>{node.description}</div>
                  )}
                  <div style={styles.nodeMeta}>
                    {node.estimatedDays !== undefined && (
                      <span style={styles.nodeMetaItem}>
                        ⏱️ 预计 {node.estimatedDays} 天
                      </span>
                    )}
                    {node.isRequired !== undefined && (
                      <span style={styles.nodeMetaItem}>
                        {node.isRequired ? '🔴 必需' : '🔵 可选'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyNodes}>
            <span style={styles.emptyNodesIcon}>📝</span>
            <span>暂无工作流程节点</span>
            <button onClick={handleEdit} style={styles.emptyNodesButton}>
              编辑添加节点
            </button>
          </div>
        )}
      </div>

      {/* Default Parameters */}
      {template.defaultParameters && Object.keys(template.defaultParameters).length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>⚙️ 默认参数</h2>
          <div style={styles.paramTable}>
            <div style={styles.paramHeader}>
              <span style={styles.paramHeaderCell}>参数名</span>
              <span style={styles.paramHeaderCell}>默认值</span>
            </div>
            {Object.entries(template.defaultParameters).map(([key, value]) => (
              <div key={key} style={styles.paramRow}>
                <span style={styles.paramKey}>{key}</span>
                <span style={styles.paramValue}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '900px',
    margin: '0 auto',
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  backLink: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    color: '#6B7280',
    cursor: 'pointer',
    padding: '8px 0',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    padding: '8px 16px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: '#FEE2E2',
    border: '1px solid #FECACA',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#DC2626',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #E5E7EB',
  },
  infoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  infoLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  typeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
  },
  statusBadge: {
    display: 'inline-flex',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
  },
  createCaseButton: {
    padding: '10px 20px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  templateTitle: {
    margin: '0 0 12px 0',
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
  },
  templateDescription: {
    margin: '0 0 20px 0',
    fontSize: '15px',
    color: '#6B7280',
    lineHeight: 1.6,
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #E5E7EB',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metaLabel: {
    fontSize: '12px',
    color: '#9CA3AF',
    fontWeight: 500,
  },
  metaValue: {
    fontSize: '14px',
    color: '#111827',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #E5E7EB',
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionCount: {
    fontSize: '13px',
    fontWeight: 400,
    color: '#6B7280',
  },
  nodeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  nodeCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
  },
  nodeIndex: {
    width: '32px',
    height: '32px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
    flexShrink: 0,
  },
  nodeContent: {
    flex: 1,
  },
  nodeName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '4px',
  },
  nodeDescription: {
    fontSize: '13px',
    color: '#6B7280',
    lineHeight: 1.5,
    marginBottom: '8px',
  },
  nodeMeta: {
    display: 'flex',
    gap: '12px',
  },
  nodeMetaItem: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  emptyNodes: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    color: '#6B7280',
    gap: '8px',
  },
  emptyNodesIcon: {
    fontSize: '32px',
    opacity: 0.5,
  },
  emptyNodesButton: {
    padding: '8px 16px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  paramTable: {
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  paramHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    backgroundColor: '#F9FAFB',
    padding: '12px 16px',
    borderBottom: '1px solid #E5E7EB',
  },
  paramHeaderCell: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  paramRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    padding: '12px 16px',
    borderBottom: '1px solid #F3F4F6',
  },
  paramKey: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    fontFamily: 'monospace',
  },
  paramValue: {
    fontSize: '14px',
    color: '#6B7280',
    wordBreak: 'break-word',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 20px',
    color: '#6B7280',
    gap: '8px',
  },
  spinner: {
    fontSize: '24px',
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 20px',
    color: '#DC2626',
    gap: '12px',
  },
  errorIcon: {
    fontSize: '48px',
  },
  retryButton: {
    padding: '10px 20px',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  notFound: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 20px',
    color: '#6B7280',
    gap: '12px',
  },
  notFoundIcon: {
    fontSize: '48px',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '8px',
  },
};

export default TemplateDetailPage;
