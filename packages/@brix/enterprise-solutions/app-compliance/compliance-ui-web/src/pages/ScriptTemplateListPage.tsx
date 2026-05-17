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
 * ScriptTemplateListPage
 * Page component for listing and searching script templates.
 * Following v3.0.4 Runtime Shell Architecture Blueprint - View Layer.
 * @module compliance-ui-web/pages/ScriptTemplateListPage
 */

import React, { useCallback, useState, useMemo } from 'react';
import { useNavigation, useTheme } from '@brix-sdk/runtime-sdk-react';
import type { ScriptTemplate } from '@brix-sdk/enterprise-compliance-shared';
import {
  ScriptTemplateStatus,
  ScriptCategory,
  ScriptScenario,
  SCRIPT_STATUS_CONFIG,
  SCRIPT_CATEGORY_CONFIG,
  SCRIPT_SCENARIO_CONFIG,
} from '@brix-sdk/enterprise-compliance-shared';
import { useScriptTemplateList } from '../hooks';
import { ScriptCard, ScriptStatusChip } from '../components';

/**
 * Props interface for ScriptTemplateListPage component.
 */
export interface ScriptTemplateListPageProps {
  /** Optional additional CSS class names */
  className?: string;
}

/**
 * ScriptTemplateListPage displays a searchable, filterable list of script templates.
 * Provides card and table view modes with pagination and bulk actions.
 * @param props - Component props
 * @returns Script template list page
 */
const ScriptTemplateListPage: React.FC<ScriptTemplateListPageProps> = ({ className = '' }) => {
  const navigation = useNavigation();
  const { tokens } = useTheme();
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchKeyword, setSearchKeyword] = useState('');

  const {
    state,
    filters,
    setFilters,
    setPage,
    refresh,
  } = useScriptTemplateList();

  /**
   * Handles navigation to template detail page.
   */
  const handleTemplateClick = useCallback((template: ScriptTemplate) => {
    navigation.navigate(`/compliance/scripts/${template.id}`);
  }, [navigation]);

  /**
   * Handles navigation to edit template page.
   */
  const handleEditTemplate = useCallback((template: ScriptTemplate) => {
    navigation.navigate(`/compliance/scripts/${template.id}/edit`);
  }, [navigation]);

  /**
   * Handles navigation to create template page.
   */
  const handleCreateClick = useCallback(() => {
    navigation.navigate('/compliance/scripts/create');
  }, [navigation]);

  /**
   * Handles search submission.
   */
  const handleSearch = useCallback(() => {
    setFilters({ keyword: searchKeyword });
  }, [setFilters, searchKeyword]);

  /**
   * Handles search input key press.
   */
  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  /**
   * Handles status filter change.
   */
  const handleStatusFilter = useCallback((status: ScriptTemplateStatus | undefined) => {
    setFilters({ status });
  }, [setFilters]);

  /**
   * Handles category filter change.
   */
  const handleCategoryFilter = useCallback((category: ScriptCategory | undefined) => {
    setFilters({ category });
  }, [setFilters]);

  /**
   * Handles scenario filter change.
   */
  const handleScenarioFilter = useCallback((scenario: ScriptScenario | undefined) => {
    setFilters({ scenario });
  }, [setFilters]);

  /**
   * Statistics summary for quick overview.
   */
  const statusCounts = useMemo(() => {
    // These would typically come from a separate stats endpoint
    // For now, we show the filter options
    return [
      { status: undefined, label: '全部', count: state.total },
      { status: ScriptTemplateStatus.DRAFT, label: '草稿', count: 0 },
      { status: ScriptTemplateStatus.PUBLISHED, label: '已发布', count: 0 },
      { status: ScriptTemplateStatus.ARCHIVED, label: '已归档', count: 0 },
    ];
  }, [state.total]);

  // Styles
  const pageStyle: React.CSSProperties = {
    padding: '24px',
    backgroundColor: tokens.colors.surface.page,
    minHeight: '100vh',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
    color: tokens.colors.text.primary,
  };

  const createButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: tokens.colors.brand.primary,
    color: tokens.colors.surface.card,
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  };

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  };

  const searchBoxStyle: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    minWidth: '280px',
  };

  const searchInputStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px 14px',
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: '8px 0 0 8px',
    fontSize: '14px',
    outline: 'none',
  };

  const searchButtonStyle: React.CSSProperties = {
    padding: '10px 16px',
    backgroundColor: '#f3f4f6',
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderLeft: 'none',
    borderRadius: '0 8px 8px 0',
    cursor: 'pointer',
    color: tokens.colors.text.secondary,
  };

  const filterGroupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const selectStyle: React.CSSProperties = {
    padding: '10px 14px',
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: tokens.colors.surface.card,
    cursor: 'pointer',
    outline: 'none',
    minWidth: '120px',
  };

  const viewToggleStyle: React.CSSProperties = {
    display: 'flex',
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: '8px',
    overflow: 'hidden',
  };

  const viewButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 12px',
    backgroundColor: isActive ? tokens.colors.brand.primary : tokens.colors.surface.card,
    color: isActive ? tokens.colors.surface.card : tokens.colors.text.secondary,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px',
  };

  const tableContainerStyle: React.CSSProperties = {
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  };

  const thStyle: React.CSSProperties = {
    padding: '14px 16px',
    textAlign: 'left',
    fontWeight: 600,
    color: tokens.colors.text.primary,
    backgroundColor: tokens.colors.surface.page,
    borderBottom: `1px solid ${tokens.colors.border.default}`,
  };

  const tdStyle: React.CSSProperties = {
    padding: '14px 16px',
    borderBottom: '1px solid #f3f4f6',
  };

  const rowStyle: React.CSSProperties = {
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  };

  const paginationStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
    padding: '16px',
  };

  const pageButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    backgroundColor: isActive ? tokens.colors.brand.primary : tokens.colors.surface.card,
    color: isActive ? tokens.colors.surface.card : tokens.colors.text.primary,
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  });

  const emptyStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '12px',
    color: tokens.colors.text.secondary,
  };

  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px',
  };

  return (
    <div className={`script-template-list-page ${className}`} style={pageStyle}>
      {/* Page Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>话术模板管理</h1>
        <button style={createButtonStyle} onClick={handleCreateClick}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          创建模板
        </button>
      </div>

      {/* Toolbar */}
      <div style={toolbarStyle}>
        {/* Search */}
        <div style={searchBoxStyle}>
          <input
            type="text"
            placeholder="搜索话术模板..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            style={searchInputStyle}
          />
          <button style={searchButtonStyle} onClick={handleSearch}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div style={filterGroupStyle}>
          <select
            style={selectStyle}
            value={filters.status || ''}
            onChange={(e) => handleStatusFilter(e.target.value as ScriptTemplateStatus || undefined)}
          >
            <option value="">全部状态</option>
            {Object.entries(SCRIPT_STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <select
            style={selectStyle}
            value={filters.category || ''}
            onChange={(e) => handleCategoryFilter(e.target.value as ScriptCategory || undefined)}
          >
            <option value="">全部分类</option>
            {Object.entries(SCRIPT_CATEGORY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <select
            style={selectStyle}
            value={filters.scenario || ''}
            onChange={(e) => handleScenarioFilter(e.target.value as ScriptScenario || undefined)}
          >
            <option value="">全部场景</option>
            {Object.entries(SCRIPT_SCENARIO_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>

        {/* View toggle */}
        <div style={viewToggleStyle}>
          <button
            style={viewButtonStyle(viewMode === 'card')}
            onClick={() => setViewMode('card')}
            title="卡片视图"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            style={viewButtonStyle(viewMode === 'table')}
            onClick={() => setViewMode('table')}
            title="列表视图"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Refresh button */}
        <button
          style={{ ...searchButtonStyle, borderRadius: '8px', border: `1px solid ${tokens.colors.border.subtle}` }}
          onClick={refresh}
          title="刷新"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Content */}
      {state.loading ? (
        <div style={loadingStyle}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${tokens.colors.border.default}`,
            borderTopColor: tokens.colors.brand.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : state.data.length === 0 ? (
        <div style={emptyStyle}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={tokens.colors.border.subtle} strokeWidth="1.5" style={{ marginBottom: '16px' }}>
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p style={{ margin: '0 0 16px', fontSize: '16px' }}>暂无话术模板</p>
          <button style={createButtonStyle} onClick={handleCreateClick}>
            创建第一个模板
          </button>
        </div>
      ) : viewMode === 'card' ? (
        <div style={gridStyle}>
          {state.data.map((template) => (
            <ScriptCard
              key={template.id}
              script={template}
              onClick={handleTemplateClick}
              onEdit={handleEditTemplate}
              showActions
            />
          ))}
        </div>
      ) : (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>模板名称</th>
                <th style={thStyle}>分类</th>
                <th style={thStyle}>场景</th>
                <th style={thStyle}>状态</th>
                <th style={thStyle}>更新时间</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {state.data.map((template) => (
                <tr
                  key={template.id}
                  style={rowStyle}
                  onClick={() => handleTemplateClick(template)}
                >
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{template.name}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: SCRIPT_CATEGORY_CONFIG[template.category]?.backgroundColor || '#f3f4f6',
                      color: SCRIPT_CATEGORY_CONFIG[template.category]?.color || tokens.colors.text.secondary,
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}>
                      {SCRIPT_CATEGORY_CONFIG[template.category]?.label || template.category}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: SCRIPT_SCENARIO_CONFIG[template.scenario]?.backgroundColor || '#f3f4f6',
                      color: SCRIPT_SCENARIO_CONFIG[template.scenario]?.color || tokens.colors.text.secondary,
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}>
                      {SCRIPT_SCENARIO_CONFIG[template.scenario]?.label || template.scenario}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <ScriptStatusChip status={template.status} size="small" />
                  </td>
                  <td style={{ ...tdStyle, color: tokens.colors.text.secondary, fontSize: '13px' }}>
                    {new Date(template.updatedAt).toLocaleString('zh-CN')}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button
                      style={{ padding: '4px 8px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: tokens.colors.brand.primary }}
                      onClick={(e) => { e.stopPropagation(); handleEditTemplate(template); }}
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {state.totalPages > 1 && (
        <div style={paginationStyle}>
          <button
            style={pageButtonStyle(false)}
            onClick={() => setPage(state.page - 1)}
            disabled={state.page === 1}
          >
            上一页
          </button>
          
          {Array.from({ length: Math.min(state.totalPages, 5) }, (_, i) => {
            let pageNum = i + 1;
            if (state.totalPages > 5 && state.page > 3) {
              pageNum = state.page - 2 + i;
              if (pageNum > state.totalPages) pageNum = state.totalPages - (4 - i);
            }
            return (
              <button
                key={pageNum}
                style={pageButtonStyle(state.page === pageNum)}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            style={pageButtonStyle(false)}
            onClick={() => setPage(state.page + 1)}
            disabled={state.page === state.totalPages}
          >
            下一页
          </button>
          
          <span style={{ marginLeft: '16px', fontSize: '14px', color: tokens.colors.text.secondary }}>
            共 {state.total} 条
          </span>
        </div>
      )}
    </div>
  );
};

export default ScriptTemplateListPage;
