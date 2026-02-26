/**
 * @file Contract List Page
 * @description Page component for listing contract instances
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
import { useNavigation } from '@brix/runtime-sdk-react';
import type { ContractStatus, ContractQueryParams } from '@shinwa/contracts-shared';
import { CONTRACT_STATUS_CONFIG } from '@shinwa/contracts-shared';
import { useContractList } from '../hooks';
import { ContractStatusChip, ContractCard } from '../components';

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
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
    color: '#111827',
    margin: 0,
  },
  createButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    backgroundColor: '#3B82F6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  statCardActive: {
    boxShadow: '0 0 0 2px #3B82F6',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6B7280',
  },
  filterBar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    flexWrap: 'wrap',
  },
  filterItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#6B7280',
  },
  input: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    outline: 'none',
    minWidth: '180px',
  },
  select: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    outline: 'none',
    backgroundColor: '#fff',
    minWidth: '140px',
    cursor: 'pointer',
  },
  dateInput: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    outline: 'none',
    minWidth: '150px',
  },
  searchButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    backgroundColor: '#3B82F6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    alignSelf: 'flex-end',
  },
  resetButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    backgroundColor: '#fff',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    cursor: 'pointer',
    alignSelf: 'flex-end',
  },
  viewToggle: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
  },
  viewButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#6B7280',
    backgroundColor: '#fff',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  viewButtonActive: {
    color: '#fff',
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: '#374151',
    borderBottom: '1px solid #F3F4F6',
  },
  row: {
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  rowHover: {
    backgroundColor: '#F9FAFB',
  },
  contractTitle: {
    fontWeight: 500,
    color: '#111827',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#6B7280',
  },
  amount: {
    fontWeight: 600,
    color: '#059669',
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
    color: '#6B7280',
  },
  pageButtons: {
    display: 'flex',
    gap: '8px',
  },
  pageButton: {
    padding: '8px 16px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    cursor: 'pointer',
    backgroundColor: '#fff',
    color: '#374151',
  },
  pageButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
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
  empty: {
    textAlign: 'center',
    padding: '48px',
    color: '#9CA3AF',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
  },
};

// ============================================================================
// Type Definitions
// ============================================================================

type ViewMode = 'card' | 'table';

interface StatusStat {
  status: ContractStatus | 'ALL';
  count: number;
  label: string;
  color: string;
}

// ============================================================================
// Page Component
// ============================================================================

/**
 * Contract List Page
 *
 * Displays a searchable, paginated list of contracts.
 *
 * @example
 * ```tsx
 * <ContractListPage />
 * ```
 */
export const ContractListPage: React.FC = () => {
  const navigation = useNavigation();
  
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  
  // Filter state
  const [filters, setFilters] = useState<ContractQueryParams>({
    page: 1,
    size: 12,
  });
  
  // Use ViewModel hook for data fetching
  const { contracts, loading, error, total, totalPages, refetch } = useContractList(filters);
  
  // Hover state for table rows
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Status statistics (mock data - in real app, would come from API)
  const statusStats: StatusStat[] = [
    { status: 'ALL', count: total, label: '全部', color: '#374151' },
    { status: 'DRAFT', count: 0, label: '草稿', color: '#6B7280' },
    { status: 'PENDING_APPROVAL', count: 0, label: '待审批', color: '#F59E0B' },
    { status: 'PENDING_SIGNATURE', count: 0, label: '待签署', color: '#3B82F6' },
    { status: 'ACTIVE', count: 0, label: '生效中', color: '#059669' },
  ];

  /**
   * Handle filter change
   */
  const handleFilterChange = useCallback((key: keyof ContractQueryParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Handle status filter from stats cards
   */
  const handleStatusFilter = useCallback((status: ContractStatus | 'ALL') => {
    if (status === 'ALL') {
      setFilters(prev => {
        const { status: _, ...rest } = prev;
        return { ...rest, page: 1 };
      });
    } else {
      setFilters(prev => ({
        ...prev,
        status,
        page: 1,
      }));
    }
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
    setFilters({ page: 1, size: 12 });
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
    navigation.navigate('/contracts/create');
  }, [navigation]);

  /**
   * Navigate to detail page
   */
  const handleRowClick = useCallback((id: string) => {
    navigation.navigate(`/contracts/${id}`);
  }, [navigation]);

  /**
   * Format date for display
   */
  const formatDate = (date?: Date | string): string => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN');
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount?: number): string => {
    if (amount === undefined || amount === null) return '-';
    return `¥${amount.toLocaleString()}`;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>合同管理</h1>
        <button style={styles.createButton} onClick={handleCreate}>
          <span>+</span>
          <span>新建合同</span>
        </button>
      </div>

      {/* Status Statistics */}
      <div style={styles.stats}>
        {statusStats.map((stat) => (
          <div
            key={stat.status}
            style={{
              ...styles.statCard,
              ...(filters.status === stat.status || (stat.status === 'ALL' && !filters.status)
                ? styles.statCardActive
                : {}),
            }}
            onClick={() => handleStatusFilter(stat.status)}
          >
            <div style={{ ...styles.statValue, color: stat.color }}>
              {stat.count}
            </div>
            <div style={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={styles.filterBar}>
        <div style={styles.filterItem}>
          <label style={styles.label}>合同名称</label>
          <input
            type="text"
            style={styles.input}
            placeholder="输入合同名称"
            value={filters.title || ''}
            onChange={(e) => handleFilterChange('title', e.target.value)}
          />
        </div>
        
        <div style={styles.filterItem}>
          <label style={styles.label}>合同编号</label>
          <input
            type="text"
            style={styles.input}
            placeholder="输入合同编号"
            value={filters.code || ''}
            onChange={(e) => handleFilterChange('code', e.target.value)}
          />
        </div>
        
        <div style={styles.filterItem}>
          <label style={styles.label}>状态</label>
          <select
            style={styles.select}
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value as ContractStatus || undefined)}
          >
            <option value="">全部状态</option>
            {Object.entries(CONTRACT_STATUS_CONFIG).map(([value, config]) => (
              <option key={value} value={value}>{config.label}</option>
            ))}
          </select>
        </div>
        
        <div style={styles.filterItem}>
          <label style={styles.label}>签署日期起</label>
          <input
            type="date"
            style={styles.dateInput}
            value={filters.signedDateFrom || ''}
            onChange={(e) => handleFilterChange('signedDateFrom', e.target.value)}
          />
        </div>
        
        <div style={styles.filterItem}>
          <label style={styles.label}>签署日期止</label>
          <input
            type="date"
            style={styles.dateInput}
            value={filters.signedDateTo || ''}
            onChange={(e) => handleFilterChange('signedDateTo', e.target.value)}
          />
        </div>
        
        <button style={styles.searchButton} onClick={handleSearch}>
          搜索
        </button>
        <button style={styles.resetButton} onClick={handleReset}>
          重置
        </button>
      </div>

      {/* View Toggle */}
      <div style={styles.viewToggle}>
        <button
          style={{
            ...styles.viewButton,
            ...(viewMode === 'card' ? styles.viewButtonActive : {}),
          }}
          onClick={() => setViewMode('card')}
        >
          卡片视图
        </button>
        <button
          style={{
            ...styles.viewButton,
            ...(viewMode === 'table' ? styles.viewButtonActive : {}),
          }}
          onClick={() => setViewMode('table')}
        >
          表格视图
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={styles.loading}>加载中...</div>
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : contracts.length === 0 ? (
        <div style={styles.empty}>
          <p>暂无合同</p>
          <button style={{ ...styles.createButton, margin: '16px auto' }} onClick={handleCreate}>
            创建第一份合同
          </button>
        </div>
      ) : viewMode === 'card' ? (
        /* Card Grid View */
        <div style={styles.cardGrid}>
          {contracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              onClick={() => handleRowClick(contract.id!)}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>合同名称</th>
              <th style={styles.th}>合同编号</th>
              <th style={styles.th}>签约方</th>
              <th style={styles.th}>金额</th>
              <th style={styles.th}>状态</th>
              <th style={styles.th}>生效日期</th>
              <th style={styles.th}>到期日期</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => (
              <tr
                key={contract.id}
                style={{
                  ...styles.row,
                  ...(hoveredRow === contract.id ? styles.rowHover : {}),
                }}
                onClick={() => handleRowClick(contract.id!)}
                onMouseEnter={() => setHoveredRow(contract.id!)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td style={styles.td}>
                  <span style={styles.contractTitle}>{contract.title}</span>
                </td>
                <td style={styles.td}>
                  <span style={styles.code}>{contract.code}</span>
                </td>
                <td style={styles.td}>
                  {contract.parties?.map(p => p.name).join('、') || '-'}
                </td>
                <td style={styles.td}>
                  <span style={styles.amount}>{formatCurrency(contract.totalAmount)}</span>
                </td>
                <td style={styles.td}>
                  <ContractStatusChip status={contract.status} />
                </td>
                <td style={styles.td}>{formatDate(contract.effectiveDate)}</td>
                <td style={styles.td}>{formatDate(contract.expirationDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {contracts.length > 0 && (
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
      )}
    </div>
  );
};

export default ContractListPage;
