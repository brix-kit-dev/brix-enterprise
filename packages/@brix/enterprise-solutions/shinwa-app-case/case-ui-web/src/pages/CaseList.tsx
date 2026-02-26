/**
 * @file Case List Page
 * @description View layer - Case list with search, filter, and pagination
 * @module @shinwa/case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 blueprint three-layer architecture: View → ViewModel → Repository
 * - View layer: Pure presentational component with no business logic
 * - Data and operations obtained through useCaseList Hook
 * - Direct HTTP/fetch/axios calls are prohibited
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import React, { useState, useCallback } from 'react';
import { useNavigation } from '@brix/runtime-sdk-react';
import { useCaseList } from '../hooks/useCase';
import { CaseCard } from '../components/CaseCard';
import type { CaseSummary, CaseStatus } from '@shinwa/case-shared';
import { CASE_STATUS_CONFIG } from '@shinwa/case-shared';

// ============================================================================
// Status Filter Options
// ============================================================================

const STATUS_OPTIONS: Array<{ value: CaseStatus | undefined; label: string }> = [
  { value: undefined, label: '全部状态' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'PENDING', label: '待处理' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
  { value: 'ON_HOLD', label: '已暂停' },
];

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Case List Page Component
 */
const CaseListPage: React.FC = () => {
  const navigation = useNavigation();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus | undefined>(undefined);

  const {
    items,
    isLoading,
    error,
    pagination,
    params,
    refresh,
    setPage,
    search,
    filterByStatus,
    deleteItem,
  } = useCaseList();

  /**
   * Navigate to case detail page
   */
  const handleViewDetail = useCallback((caseData: CaseSummary) => {
    navigation.navigate(`/case/${caseData.id}`);
  }, [navigation]);

  /**
   * Navigate to create page
   */
  const handleCreate = useCallback(() => {
    navigation.navigate('/case/create');
  }, [navigation]);

  /**
   * Handle search input
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  }, []);

  /**
   * Handle search submit
   */
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    search(searchKeyword);
  }, [search, searchKeyword]);

  /**
   * Handle status filter change
   */
  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as CaseStatus | '';
    const status = value === '' ? undefined : value;
    setSelectedStatus(status);
    filterByStatus(status);
  }, [filterByStatus]);

  /**
   * Handle delete with confirmation
   */
  const handleDelete = useCallback(async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除此案例吗？此操作不可撤销。')) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert('删除失败: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
  }, [deleteItem]);

  // =========================================================================
  // Render States
  // =========================================================================

  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <span style={styles.spinner}>⏳</span>
          加载中...
        </div>
      </div>
    );
  }

  // Error state
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

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>案例管理</h1>
          <span style={styles.count}>
            共 {pagination.total} 条记录
          </span>
        </div>
        <button onClick={handleCreate} style={styles.createButton}>
          + 新建案例
        </button>
      </div>

      {/* Filter Bar */}
      <div style={styles.filterBar}>
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
          <input
            type="text"
            value={searchKeyword}
            onChange={handleSearchChange}
            placeholder="搜索案例编号、标题、客户名称..."
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchButton}>
            🔍
          </button>
        </form>

        {/* Status Filter */}
        <select
          value={selectedStatus ?? ''}
          onChange={handleStatusChange}
          style={styles.filterSelect}
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value ?? 'all'} value={option.value ?? ''}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Refresh Button */}
        <button onClick={refresh} style={styles.refreshButton} title="刷新">
          🔄
        </button>
      </div>

      {/* Active Filters Display */}
      {(params.keyword || params.status) && (
        <div style={styles.activeFilters}>
          <span style={styles.activeFiltersLabel}>当前筛选:</span>
          {params.keyword && (
            <span style={styles.filterTag}>
              关键词: {params.keyword}
              <button
                onClick={() => {
                  setSearchKeyword('');
                  search('');
                }}
                style={styles.filterTagRemove}
              >
                ×
              </button>
            </span>
          )}
          {params.status && (
            <span style={styles.filterTag}>
              状态: {CASE_STATUS_CONFIG[params.status]?.label || params.status}
              <button
                onClick={() => {
                  setSelectedStatus(undefined);
                  filterByStatus(undefined);
                }}
                style={styles.filterTagRemove}
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* Case List */}
      <div style={styles.listContainer}>
        {items.length === 0 ? (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>📭</span>
            <span>暂无案例数据</span>
            <button onClick={handleCreate} style={styles.emptyButton}>
              创建第一个案例
            </button>
          </div>
        ) : (
          <div style={styles.cardGrid}>
            {items.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                data={caseItem}
                onClick={handleViewDetail}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page === 0}
            style={{
              ...styles.pageButton,
              ...(pagination.page === 0 ? styles.pageButtonDisabled : {}),
            }}
          >
            ← 上一页
          </button>
          
          <div style={styles.pageNumbers}>
            {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (pagination.totalPages <= 7) {
                pageNum = i;
              } else if (pagination.page < 4) {
                pageNum = i;
              } else if (pagination.page > pagination.totalPages - 5) {
                pageNum = pagination.totalPages - 7 + i;
              } else {
                pageNum = pagination.page - 3 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  style={{
                    ...styles.pageNumber,
                    ...(pagination.page === pageNum ? styles.pageNumberActive : {}),
                  }}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages - 1}
            style={{
              ...styles.pageButton,
              ...(pagination.page >= pagination.totalPages - 1 ? styles.pageButtonDisabled : {}),
            }}
          >
            下一页 →
          </button>
        </div>
      )}

      {/* Loading Overlay (when refreshing) */}
      {isLoading && items.length > 0 && (
        <div style={styles.loadingOverlay}>
          <span style={styles.spinner}>⏳</span>
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
    position: 'relative',
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
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  filterBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    alignItems: 'center',
  },
  searchForm: {
    display: 'flex',
    flex: 1,
    maxWidth: '400px',
  },
  searchInput: {
    flex: 1,
    padding: '10px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px 0 0 8px',
    fontSize: '14px',
    outline: 'none',
  },
  searchButton: {
    padding: '10px 16px',
    backgroundColor: '#E5E7EB',
    border: '1px solid #D1D5DB',
    borderLeft: 'none',
    borderRadius: '0 8px 8px 0',
    cursor: 'pointer',
    fontSize: '14px',
  },
  filterSelect: {
    padding: '10px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    minWidth: '120px',
  },
  refreshButton: {
    padding: '10px 12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  activeFilters: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  activeFiltersLabel: {
    fontSize: '13px',
    color: '#6B7280',
  },
  filterTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    backgroundColor: '#EFF6FF',
    borderRadius: '9999px',
    fontSize: '12px',
    color: '#3B82F6',
  },
  filterTagRemove: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginLeft: '4px',
    color: '#3B82F6',
    fontWeight: 'bold',
    padding: '0 2px',
  },
  listContainer: {
    minHeight: '400px',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '16px',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#6B7280',
    gap: '12px',
  },
  emptyIcon: {
    fontSize: '48px',
  },
  emptyButton: {
    marginTop: '12px',
    padding: '8px 16px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#6B7280',
    gap: '8px',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#DC2626',
    gap: '8px',
  },
  errorIcon: {
    fontSize: '24px',
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginLeft: '12px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
    padding: '16px 0',
  },
  pageButton: {
    padding: '8px 16px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    transition: 'all 0.2s',
  },
  pageButtonDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
    cursor: 'not-allowed',
  },
  pageNumbers: {
    display: 'flex',
    gap: '4px',
  },
  pageNumber: {
    padding: '8px 12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    minWidth: '40px',
    textAlign: 'center',
  },
  pageNumberActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    color: '#FFFFFF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
};

export default CaseListPage;
