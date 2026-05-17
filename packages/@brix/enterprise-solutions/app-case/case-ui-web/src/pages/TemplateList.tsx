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
 * @file Template List Page
 * @description View layer - List and manage case templates
 * @module @brix-sdk/enterprise-case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 blueprint three-layer architecture: View → ViewModel → Repository
 * - View layer: Pure presentational component
 * - Data fetching through useTemplateList hook
 * - Direct HTTP/fetch/axios calls are prohibited
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import React, { useState, useCallback } from 'react';
import { useNavigation } from '@brix-sdk/runtime-sdk-react';
import { useTemplateList } from '../hooks/useTemplate';
import type { CaseTemplateDTO, CaseType } from '@brix-sdk/enterprise-case-shared';
import { CASE_TYPE_CONFIG } from '@brix-sdk/enterprise-case-shared';

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Template List Page Component
 */
const TemplateListPage: React.FC = () => {
  const navigation = useNavigation();
  const [typeFilter, setTypeFilter] = useState<CaseType | ''>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Data hook
  const {
    items: templates,
    isLoading,
    error,
    refresh,
    deleteItem,
    activateTemplate,
    deactivateTemplate,
  } = useTemplateList();

  // =========================================================================
  // Derived Data
  // =========================================================================

  const filteredTemplates = templates.filter(template => {
    if (typeFilter && template.caseType !== typeFilter) return false;
    if (statusFilter === 'active' && !template.isActive) return false;
    if (statusFilter === 'inactive' && template.isActive) return false;
    return true;
  });

  // =========================================================================
  // Event Handlers
  // =========================================================================

  const handleCreate = useCallback(() => {
    navigation.navigate('/template/create');
  }, [navigation]);

  const handleView = useCallback((template: CaseTemplateDTO) => {
    navigation.navigate(`/template/${template.id}`);
  }, [navigation]);

  const handleEdit = useCallback((template: CaseTemplateDTO) => {
    navigation.navigate(`/template/${template.id}/edit`);
  }, [navigation]);

  const handleToggleActive = useCallback(async (template: CaseTemplateDTO) => {
    try {
      if (template.isActive) {
        await deactivateTemplate(template.id);
      } else {
        await activateTemplate(template.id);
      }
      refresh();
    } catch (err) {
      alert('操作失败: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [activateTemplate, deactivateTemplate, refresh]);

  const handleDelete = useCallback(async (template: CaseTemplateDTO) => {
    if (window.confirm(`确定要删除模板 "${template.name}" 吗？此操作不可撤销。`)) {
      try {
        await deleteItem(template.id);
        refresh();
      } catch (err) {
        alert('删除失败: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
  }, [deleteItem, refresh]);

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>案例模板</h1>
          <span style={styles.count}>
            共 {filteredTemplates.length} 个模板
          </span>
        </div>
        <button onClick={handleCreate} style={styles.createButton}>
          + 创建模板
        </button>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>案例类型</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CaseType | '')}
            style={styles.filterSelect}
          >
            <option value="">全部类型</option>
            {Object.entries(CASE_TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>状态</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            style={styles.filterSelect}
          >
            <option value="all">全部状态</option>
            <option value="active">已启用</option>
            <option value="inactive">已禁用</option>
          </select>
        </div>

        <button onClick={refresh} style={styles.refreshButton}>
          🔄 刷新
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={styles.loading}>
          <span style={styles.spinner}>⏳</span>
          加载中...
        </div>
      ) : error ? (
        <div style={styles.error}>
          <span style={styles.errorIcon}>⚠️</span>
          <span>加载失败: {error.message}</span>
          <button onClick={refresh} style={styles.retryButton}>
            重试
          </button>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>📋</span>
          <span style={styles.emptyText}>暂无模板</span>
          <button onClick={handleCreate} style={styles.emptyButton}>
            创建第一个模板
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredTemplates.map((template) => {
            const typeConfig = CASE_TYPE_CONFIG[template.caseType] || {
              label: template.caseType,
              color: '#6B7280',
              bgColor: '#F3F4F6',
              icon: '📋',
            };

            return (
              <div
                key={template.id}
                style={{
                  ...styles.card,
                  opacity: template.isActive ? 1 : 0.7,
                }}
              >
                {/* Card Header */}
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitleRow}>
                    <h3 style={styles.cardTitle}>{template.name}</h3>
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
                  <span
                    style={{
                      ...styles.typeBadge,
                      backgroundColor: typeConfig.bgColor,
                      color: typeConfig.color,
                    }}
                  >
                    {typeConfig.icon} {typeConfig.label}
                  </span>
                </div>

                {/* Description */}
                {template.description && (
                  <p style={styles.cardDescription}>{template.description}</p>
                )}

                {/* Meta */}
                <div style={styles.cardMeta}>
                  {template.nodeCount !== undefined && (
                    <span style={styles.metaItem}>
                      📋 {template.nodeCount} 个节点
                    </span>
                  )}
                  <span style={styles.metaItem}>
                    📅 {new Date(template.updatedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>

                {/* Actions */}
                <div style={styles.cardActions}>
                  <button
                    onClick={() => handleView(template)}
                    style={styles.actionButton}
                  >
                    查看
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    style={styles.actionButton}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleToggleActive(template)}
                    style={{
                      ...styles.actionButton,
                      color: template.isActive ? '#DC2626' : '#059669',
                    }}
                  >
                    {template.isActive ? '禁用' : '启用'}
                  </button>
                  <button
                    onClick={() => handleDelete(template)}
                    style={{ ...styles.actionButton, color: '#DC2626' }}
                  >
                    删除
                  </button>
                </div>
              </div>
            );
          })}
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
    maxWidth: '1200px',
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
  headerLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
  },
  count: {
    fontSize: '14px',
    color: '#6B7280',
  },
  createButton: {
    padding: '10px 20px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  filters: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '16px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#6B7280',
  },
  filterSelect: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    minWidth: '150px',
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    marginLeft: 'auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #E5E7EB',
    transition: 'box-shadow 0.2s',
  },
  cardHeader: {
    marginBottom: '12px',
  },
  cardTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
  },
  statusBadge: {
    display: 'inline-flex',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
  },
  typeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  },
  cardDescription: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    color: '#6B7280',
    lineHeight: 1.5,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  cardMeta: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #F3F4F6',
  },
  metaItem: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  actionButton: {
    padding: '6px 12px',
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#374151',
    cursor: 'pointer',
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
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 20px',
    color: '#6B7280',
    gap: '12px',
  },
  emptyIcon: {
    fontSize: '48px',
    opacity: 0.5,
  },
  emptyText: {
    fontSize: '16px',
    color: '#9CA3AF',
  },
  emptyButton: {
    padding: '10px 20px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '8px',
  },
};

export default TemplateListPage;
