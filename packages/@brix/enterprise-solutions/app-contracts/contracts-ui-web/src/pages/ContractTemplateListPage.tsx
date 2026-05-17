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
 * @file Contract Template List Page
 * @description Page component for listing contract templates
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

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigation, useTheme } from '@brix-sdk/runtime-sdk-react';
import type { ContractTemplateStatus, ContractTemplateQueryParams } from '@brix-sdk/enterprise-contracts-shared';
import { TEMPLATE_STATUS_CONFIG } from '@brix-sdk/enterprise-contracts-shared';
import { useContractTemplateList } from '../hooks';
import { TemplateStatusChip } from '../components';

// ============================================================================
// Styles
// ============================================================================

const getStyles = (tokens: any): Record<string, React.CSSProperties> => ({
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: tokens.colors.text.primary,
    margin: 0,
  },
  createButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: tokens.colors.surface.card,
    backgroundColor: tokens.colors.brand.primary,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterBar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: tokens.colors.surface.page,
    borderRadius: '8px',
  },
  filterItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
    color: tokens.colors.text.secondary,
  },
  input: {
    padding: '8px 12px',
    fontSize: '14px',
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: '6px',
    outline: 'none',
    minWidth: '200px',
  },
  select: {
    padding: '8px 12px',
    fontSize: '14px',
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: '6px',
    outline: 'none',
    backgroundColor: tokens.colors.surface.card,
    minWidth: '150px',
    cursor: 'pointer',
  },
  searchButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: tokens.colors.surface.card,
    backgroundColor: tokens.colors.brand.primary,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    alignSelf: 'flex-end',
  },
  resetButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: tokens.colors.text.primary,
    backgroundColor: tokens.colors.surface.card,
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: '6px',
    cursor: 'pointer',
    alignSelf: 'flex-end',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    color: tokens.colors.text.secondary,
    backgroundColor: tokens.colors.surface.page,
    borderBottom: `1px solid ${tokens.colors.border.default}`,
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: tokens.colors.text.primary,
    borderBottom: `1px solid ${tokens.colors.surface.page}`,
  },
  row: {
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  rowHover: {
    backgroundColor: tokens.colors.surface.page,
  },
  templateName: {
    fontWeight: 500,
    color: tokens.colors.text.primary,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: tokens.colors.text.secondary,
  },
  version: {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: tokens.colors.border.default,
    borderRadius: '4px',
    fontSize: '12px',
    color: tokens.colors.text.primary,
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  editButton: {
    color: tokens.colors.brand.primary,
    backgroundColor: tokens.colors.brand.primaryLight,
  },
  publishButton: {
    color: tokens.colors.status.success,
    backgroundColor: tokens.colors.status.successLight,
  },
  deprecateButton: {
    color: tokens.colors.text.disabled,
    backgroundColor: tokens.colors.surface.page,
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '24px',
    padding: '12px 0',
  },
  pageInfo: {
    fontSize: '14px',
    color: tokens.colors.text.secondary,
  },
  pageButtons: {
    display: 'flex',
    gap: '8px',
  },
  pageButton: {
    padding: '8px 16px',
    fontSize: '14px',
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: '6px',
    cursor: 'pointer',
    backgroundColor: tokens.colors.surface.card,
    color: tokens.colors.text.primary,
  },
  pageButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
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
  empty: {
    textAlign: 'center',
    padding: '48px',
    color: tokens.colors.text.disabled,
    backgroundColor: tokens.colors.surface.page,
    borderRadius: '8px',
  },
});

// ============================================================================
// Page Component
// ============================================================================

/**
 * Contract Template List Page
 *
 * Displays a searchable, paginated list of contract templates.
 *
 * @example
 * ```tsx
 * <ContractTemplateListPage />
 * ```
 */
export const ContractTemplateListPage: React.FC = () => {
  const navigation = useNavigation();
  const { tokens } = useTheme();
  const styles = getStyles(tokens);
  
  // Filter state
  const [filters, setFilters] = useState<ContractTemplateQueryParams>({
    page: 1,
    size: 10,
  });
  
  // Use ViewModel hook for data fetching
  const { templates, loading, error, total, totalPages, refetch } = useContractTemplateList(filters);
  
  // Hover state for table rows
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  /**
   * Handle filter change
   */
  const handleFilterChange = useCallback((key: keyof ContractTemplateQueryParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Handle search
   */
  const handleSearch = useCallback(() => {
    setFilters(prev => ({ ...prev, page: 1 }));
    refetch();
  }, [refetch]);

  /**
   * Handle reset filters
   */
  const handleReset = useCallback(() => {
    setFilters({ page: 1, size: 10 });
  }, []);

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  }, []);

  /**
   * Navigate to create page
   */
  const handleCreate = useCallback(() => {
    navigation.navigate('/contracts/templates/create');
  }, [navigation]);

  /**
   * Navigate to detail page
   */
  const handleRowClick = useCallback((id: string) => {
    navigation.navigate(`/contracts/templates/${id}`);
  }, [navigation]);

  /**
   * Handle edit action
   */
  const handleEdit = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigation.navigate(`/contracts/templates/${id}/edit`);
  }, [navigation]);

  /**
   * Format date for display
   */
  const formatDate = (date?: Date | string): string => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN');
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>合同模板管理</h1>
        <button style={styles.createButton} onClick={handleCreate}>
          <span>+</span>
          <span>新建模板</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div style={styles.filterBar}>
        <div style={styles.filterItem}>
          <label style={styles.label}>模板名称</label>
          <input
            type="text"
            style={styles.input}
            placeholder="输入模板名称搜索"
            value={filters.name || ''}
            onChange={(e) => handleFilterChange('name', e.target.value)}
          />
        </div>
        
        <div style={styles.filterItem}>
          <label style={styles.label}>模板编号</label>
          <input
            type="text"
            style={styles.input}
            placeholder="输入模板编号搜索"
            value={filters.code || ''}
            onChange={(e) => handleFilterChange('code', e.target.value)}
          />
        </div>
        
        <div style={styles.filterItem}>
          <label style={styles.label}>状态</label>
          <select
            style={styles.select}
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value as ContractTemplateStatus || undefined)}
          >
            <option value="">全部状态</option>
            {Object.entries(TEMPLATE_STATUS_CONFIG).map(([value, config]) => (
              <option key={value} value={value}>{config.label}</option>
            ))}
          </select>
        </div>
        
        <div style={styles.filterItem}>
          <label style={styles.label}>分类</label>
          <input
            type="text"
            style={{ ...styles.input, minWidth: '150px' }}
            placeholder="输入分类"
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          />
        </div>
        
        <button style={styles.searchButton} onClick={handleSearch}>
          搜索
        </button>
        <button style={styles.resetButton} onClick={handleReset}>
          重置
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={styles.loading}>加载中...</div>
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : templates.length === 0 ? (
        <div style={styles.empty}>
          <p>暂无合同模板</p>
          <button style={{ ...styles.createButton, margin: '16px auto' }} onClick={handleCreate}>
            创建第一个模板
          </button>
        </div>
      ) : (
        <>
          {/* Table */}
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>模板名称</th>
                <th style={styles.th}>模板编号</th>
                <th style={styles.th}>版本</th>
                <th style={styles.th}>分类</th>
                <th style={styles.th}>状态</th>
                <th style={styles.th}>创建时间</th>
                <th style={styles.th}>更新时间</th>
                <th style={styles.th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr
                  key={template.id}
                  style={{
                    ...styles.row,
                    ...(hoveredRow === template.id ? styles.rowHover : {}),
                  }}
                  onClick={() => handleRowClick(template.id!)}
                  onMouseEnter={() => setHoveredRow(template.id!)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td style={styles.td}>
                    <span style={styles.templateName}>{template.name}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.code}>{template.code}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.version}>v{template.version || '1.0'}</span>
                  </td>
                  <td style={styles.td}>{template.category || '-'}</td>
                  <td style={styles.td}>
                    <TemplateStatusChip status={template.status} />
                  </td>
                  <td style={styles.td}>{formatDate(template.createdAt)}</td>
                  <td style={styles.td}>{formatDate(template.updatedAt)}</td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={{ ...styles.actionButton, ...styles.editButton }}
                        onClick={(e) => handleEdit(e, template.id!)}
                      >
                        编辑
                      </button>
                      {template.status === 'DRAFT' && (
                        <button
                          style={{ ...styles.actionButton, ...styles.publishButton }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Call publish action via ViewModel
                          }}
                        >
                          发布
                        </button>
                      )}
                      {template.status === 'PUBLISHED' && (
                        <button
                          style={{ ...styles.actionButton, ...styles.deprecateButton }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Call deprecate action via ViewModel
                          }}
                        >
                          停用
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={styles.pagination}>
            <span style={styles.pageInfo}>
              共 {total} 条记录，第 {filters.page} / {totalPages} 页
            </span>
            <div style={styles.pageButtons}>
              <button
                style={{
                  ...styles.pageButton,
                  ...(filters.page === 1 ? styles.pageButtonDisabled : {}),
                }}
                onClick={() => handlePageChange(filters.page! - 1)}
                disabled={filters.page === 1}
              >
                上一页
              </button>
              <button
                style={{
                  ...styles.pageButton,
                  ...(filters.page === totalPages ? styles.pageButtonDisabled : {}),
                }}
                onClick={() => handlePageChange(filters.page! + 1)}
                disabled={filters.page === totalPages}
              >
                下一页
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContractTemplateListPage;
