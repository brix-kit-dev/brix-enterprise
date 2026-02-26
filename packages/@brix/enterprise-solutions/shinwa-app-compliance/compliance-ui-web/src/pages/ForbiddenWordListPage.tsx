/**
 * ForbiddenWordListPage
 * Page component for managing forbidden words with filtering and bulk operations.
 * Following v3.0.4 Runtime Shell Architecture Blueprint - View Layer.
 * @module compliance-ui-web/pages/ForbiddenWordListPage
 */

import React, { useCallback, useState, useRef } from 'react';
import { useNavigation } from '@brix/runtime-sdk-react';
import type { ForbiddenWord } from '@shinwa/compliance-shared';
import {
  ForbiddenWordSeverity,
  ForbiddenWordCategory,
  SEVERITY_CONFIG,
  FORBIDDEN_CATEGORY_CONFIG,
} from '@shinwa/compliance-shared';
import { useForbiddenWordList, useForbiddenWordBulkImport, useForbiddenWordExport } from '../hooks';
import { ForbiddenWordTable, SeverityChip } from '../components';

/**
 * Props interface for ForbiddenWordListPage component.
 */
export interface ForbiddenWordListPageProps {
  /** Optional additional CSS class names */
  className?: string;
}

/**
 * ForbiddenWordListPage displays a comprehensive view of forbidden words
 * with search, filtering, bulk import/export, and inline actions.
 * @param props - Component props
 * @returns Forbidden word list page
 */
const ForbiddenWordListPage: React.FC<ForbiddenWordListPageProps> = ({ className = '' }) => {
  const navigation = useNavigation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const {
    state,
    filters,
    setFilters,
    setPage,
    toggleStatus,
    deleteWord,
    refresh,
  } = useForbiddenWordList();

  const { upload: uploadImport, state: importState } = useForbiddenWordBulkImport();
  const { exportWords, state: exportState } = useForbiddenWordExport();

  /**
   * Handles navigation to create page.
   */
  const handleCreateClick = useCallback(() => {
    navigation.navigate('/compliance/forbidden-words/create');
  }, [navigation]);

  /**
   * Handles navigation to edit page.
   */
  const handleEditWord = useCallback((word: ForbiddenWord) => {
    navigation.navigate(`/compliance/forbidden-words/${word.id}/edit`);
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
   * Handles severity filter change.
   */
  const handleSeverityFilter = useCallback((severity: ForbiddenWordSeverity | undefined) => {
    setFilters({ severity });
  }, [setFilters]);

  /**
   * Handles category filter change.
   */
  const handleCategoryFilter = useCallback((category: ForbiddenWordCategory | undefined) => {
    setFilters({ category });
  }, [setFilters]);

  /**
   * Handles active status filter change.
   */
  const handleActiveFilter = useCallback((isActive: boolean | undefined) => {
    setFilters({ isActive });
  }, [setFilters]);

  /**
   * Handles toggle status action.
   */
  const handleToggleStatus = useCallback(async (word: ForbiddenWord) => {
    await toggleStatus(word.id);
    refresh();
  }, [toggleStatus, refresh]);

  /**
   * Handles delete action with confirmation.
   */
  const handleDeleteWord = useCallback(async (word: ForbiddenWord) => {
    // In production, this would use a modal dialog
    if (window.confirm(`确定要删除禁用词 "${word.word}" 吗？`)) {
      await deleteWord(word.id);
      refresh();
    }
  }, [deleteWord, refresh]);

  /**
   * Handles import file selection.
   */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setShowImportModal(true);
    }
  }, []);

  /**
   * Handles bulk import submission.
   */
  const handleImportSubmit = useCallback(async () => {
    if (!importFile) return;

    try {
      await uploadImport(importFile);
      setShowImportModal(false);
      setImportFile(null);
      refresh();
    } catch (error) {
      console.error('Import failed:', error);
    }
  }, [importFile, uploadImport, refresh]);

  /**
   * Handles export action.
   */
  const handleExport = useCallback(async () => {
    try {
      const blob = await exportWords(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forbidden-words-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [exportWords, filters]);

  /**
   * Triggers file input click.
   */
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Styles
  const pageStyle: React.CSSProperties = {
    padding: '24px',
    backgroundColor: '#f9fafb',
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
    color: '#1f2937',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
  };

  const primaryButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...primaryButtonStyle,
    backgroundColor: '#ffffff',
    color: '#374151',
    border: '1px solid #d1d5db',
  };

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#ffffff',
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
    border: '1px solid #d1d5db',
    borderRadius: '8px 0 0 8px',
    fontSize: '14px',
    outline: 'none',
  };

  const searchButtonStyle: React.CSSProperties = {
    padding: '10px 16px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderLeft: 'none',
    borderRadius: '0 8px 8px 0',
    cursor: 'pointer',
    color: '#6b7280',
  };

  const filterGroupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const selectStyle: React.CSSProperties = {
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '120px',
  };

  const statsContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  };

  const statCardStyle = (bgColor: string): React.CSSProperties => ({
    padding: '16px',
    backgroundColor: bgColor,
    borderRadius: '12px',
    textAlign: 'center',
  });

  const statValueStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '4px',
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#6b7280',
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  };

  const paginationStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
  };

  const pageInfoStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
  };

  const pageButtonsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
  };

  const pageButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    backgroundColor: isActive ? '#3b82f6' : '#ffffff',
    color: isActive ? '#ffffff' : '#374151',
    border: '1px solid #d1d5db',
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
    color: '#6b7280',
  };

  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px',
  };

  // Modal styles
  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    width: '400px',
    maxWidth: '90vw',
  };

  const modalTitleStyle: React.CSSProperties = {
    margin: '0 0 16px',
    fontSize: '18px',
    fontWeight: 600,
    color: '#1f2937',
  };

  const modalActionsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  };

  return (
    <div className={`forbidden-word-list-page ${className}`} style={pageStyle}>
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".xlsx,.xls,.csv"
        onChange={handleFileSelect}
      />

      {/* Page Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>禁用词管理</h1>
        <div style={actionsStyle}>
          <button style={secondaryButtonStyle} onClick={triggerFileInput}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            导入
          </button>
          <button
            style={secondaryButtonStyle}
            onClick={handleExport}
            disabled={exportState.loading}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {exportState.loading ? '导出中...' : '导出'}
          </button>
          <button style={primaryButtonStyle} onClick={handleCreateClick}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            添加禁用词
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div style={statsContainerStyle}>
        <div style={statCardStyle('#ffffff')}>
          <div style={{ ...statValueStyle, color: '#3b82f6' }}>{state.total || 0}</div>
          <div style={statLabelStyle}>总数量</div>
        </div>
        <div style={statCardStyle('#fef2f2')}>
          <div style={{ ...statValueStyle, color: '#dc2626' }}>
            {state.data.filter(w => w.severity === ForbiddenWordSeverity.CRITICAL).length}
          </div>
          <div style={statLabelStyle}>严重违规</div>
        </div>
        <div style={statCardStyle('#f0fdf4')}>
          <div style={{ ...statValueStyle, color: '#10b981' }}>
            {state.data.filter(w => w.isActive).length}
          </div>
          <div style={statLabelStyle}>已启用</div>
        </div>
        <div style={statCardStyle('#fefce8')}>
          <div style={{ ...statValueStyle, color: '#f59e0b' }}>
            {state.data.filter(w => !w.isActive).length}
          </div>
          <div style={statLabelStyle}>已禁用</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={toolbarStyle}>
        {/* Search */}
        <div style={searchBoxStyle}>
          <input
            type="text"
            placeholder="搜索禁用词..."
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
            value={filters.severity || ''}
            onChange={(e) => handleSeverityFilter(e.target.value as ForbiddenWordSeverity || undefined)}
          >
            <option value="">全部等级</option>
            {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <select
            style={selectStyle}
            value={filters.category || ''}
            onChange={(e) => handleCategoryFilter(e.target.value as ForbiddenWordCategory || undefined)}
          >
            <option value="">全部分类</option>
            {Object.entries(FORBIDDEN_CATEGORY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <select
            style={selectStyle}
            value={filters.isActive === undefined ? '' : String(filters.isActive)}
            onChange={(e) => {
              const val = e.target.value;
              handleActiveFilter(val === '' ? undefined : val === 'true');
            }}
          >
            <option value="">全部状态</option>
            <option value="true">已启用</option>
            <option value="false">已禁用</option>
          </select>
        </div>

        {/* Refresh button */}
        <button
          style={{ ...searchButtonStyle, borderRadius: '8px', border: '1px solid #d1d5db' }}
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
            border: '3px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : state.data.length === 0 ? (
        <div style={contentStyle}>
          <div style={emptyStyle}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ marginBottom: '16px' }}>
              <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <p style={{ margin: '0 0 16px', fontSize: '16px' }}>暂无禁用词</p>
            <button style={primaryButtonStyle} onClick={handleCreateClick}>
              添加第一个禁用词
            </button>
          </div>
        </div>
      ) : (
        <div style={contentStyle}>
          <ForbiddenWordTable
            words={state.data}
            onToggle={handleToggleStatus}
            onEdit={handleEditWord}
            onDelete={handleDeleteWord}
          />

          {/* Pagination */}
          {state.totalPages > 1 && (
            <div style={paginationStyle}>
              <div style={pageInfoStyle}>
                显示 {(state.page - 1) * state.pageSize + 1} - {Math.min(state.page * state.pageSize, state.total)} 条，共 {state.total} 条
              </div>
              <div style={pageButtonsStyle}>
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
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div style={modalOverlayStyle} onClick={() => setShowImportModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={modalTitleStyle}>导入禁用词</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
              已选择文件: <strong>{importFile?.name}</strong>
            </p>
            <p style={{ color: '#6b7280', fontSize: '13px' }}>
              支持的格式: Excel (.xlsx, .xls), CSV (.csv)
            </p>
            {importState.error && (
              <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px' }}>
                导入失败: {importState.error}
              </p>
            )}
            <div style={modalActionsStyle}>
              <button
                style={secondaryButtonStyle}
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                }}
              >
                取消
              </button>
              <button
                style={importState.loading ? { ...primaryButtonStyle, opacity: 0.5 } : primaryButtonStyle}
                onClick={handleImportSubmit}
                disabled={importState.loading}
              >
                {importState.loading ? '导入中...' : '确认导入'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForbiddenWordListPage;
