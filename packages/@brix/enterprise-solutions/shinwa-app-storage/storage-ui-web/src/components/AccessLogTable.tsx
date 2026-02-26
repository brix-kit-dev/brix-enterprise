/**
 * @file Access Log Table Component
 * @description Table component for displaying file access audit logs
 * @module @shinwa/storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Pure presentational component following v3.0.4 View layer principles:
 * 1. Receives log data and pagination info via props
 * 2. Emits pagination/filter events via callbacks
 * 3. No direct HTTP calls
 *
 * Architecture Compliance:
 * - Pure View component
 * - Data fetching handled by useFileAccessLogs hook
 * - All actions delegated to parent
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import { type CSSProperties, type ReactNode } from 'react';
import type { FileAccessLog, AccessAction } from '@shinwa/storage-shared';

// ============================================================================
// Types
// ============================================================================

/**
 * Pagination info for table
 */
export interface TablePagination {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

/**
 * Access Log Table Props
 */
export interface AccessLogTableProps {
  /** Access log entries */
  data: FileAccessLog[];

  /** Loading state */
  isLoading?: boolean;

  /** Pagination info */
  pagination?: TablePagination;

  /** Page change handler */
  onPageChange?: (page: number) => void;

  /** Page size change handler */
  onPageSizeChange?: (size: number) => void;

  /** Action filter change handler */
  onFilterAction?: (action: AccessAction | undefined) => void;

  /** Current action filter */
  filterAction?: AccessAction;

  /** Empty state message */
  emptyMessage?: string;

  /** Additional CSS class names */
  className?: string;

  /** Inline styles */
  style?: CSSProperties;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Action display configuration
 */
const ACTION_CONFIG: Record<AccessAction, { label: string; icon: string; color: string }> = {
  VIEW: { label: '查看', icon: '👁️', color: '#2196F3' },
  DOWNLOAD: { label: '下载', icon: '⬇️', color: '#4CAF50' },
  PREVIEW: { label: '预览', icon: '🔍', color: '#9C27B0' },
  SHARE: { label: '分享', icon: '🔗', color: '#FF9800' },
  DELETE: { label: '删除', icon: '🗑️', color: '#F44336' },
  UPDATE: { label: '更新', icon: '✏️', color: '#607D8B' },
};

/**
 * Page size options
 */
const PAGE_SIZES = [10, 20, 50, 100];

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E0E0E0',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: '#FAFAFA',
    borderBottom: '1px solid #E0E0E0',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 500,
    color: '#212121',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterSelect: {
    padding: '6px 12px',
    border: '1px solid #E0E0E0',
    borderRadius: '4px',
    backgroundColor: '#FFFFFF',
    fontSize: '14px',
    cursor: 'pointer',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: 500,
    color: '#757575',
    backgroundColor: '#FAFAFA',
    borderBottom: '1px solid #E0E0E0',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#212121',
    borderBottom: '1px solid #F5F5F5',
    verticalAlign: 'middle',
  },
  actionCell: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '13px',
  },
  userCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  userName: {
    fontWeight: 500,
  },
  userId: {
    fontSize: '12px',
    color: '#9E9E9E',
  },
  dateCell: {
    whiteSpace: 'nowrap',
    color: '#757575',
    fontSize: '13px',
  },
  detailsCell: {
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#757575',
    fontSize: '13px',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#FAFAFA',
    borderTop: '1px solid #E0E0E0',
  },
  footerInfo: {
    fontSize: '13px',
    color: '#757575',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pageButton: {
    padding: '6px 12px',
    border: '1px solid #E0E0E0',
    borderRadius: '4px',
    backgroundColor: '#FFFFFF',
    fontSize: '14px',
    cursor: 'pointer',
  },
  pageButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  pageSizeSelect: {
    padding: '6px 8px',
    border: '1px solid #E0E0E0',
    borderRadius: '4px',
    backgroundColor: '#FFFFFF',
    fontSize: '13px',
  },
  loadingOverlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    color: '#757575',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    color: '#9E9E9E',
    fontSize: '14px',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format date for display
 *
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ============================================================================
// Component
// ============================================================================

/**
 * Access Log Table Component
 *
 * Displays file access audit logs in a paginated table format.
 * Supports filtering by action type and pagination controls.
 *
 * @param props - Component props
 * @returns Table element
 *
 * @example
 * ```tsx
 * <AccessLogTable
 *   data={logs}
 *   isLoading={isLoading}
 *   pagination={pagination}
 *   onPageChange={setPage}
 *   onFilterAction={filterByAction}
 *   filterAction={currentFilter}
 * />
 * ```
 */
export function AccessLogTable({
  data,
  isLoading = false,
  pagination,
  onPageChange,
  onPageSizeChange,
  onFilterAction,
  filterAction,
  emptyMessage = '暂无访问记录',
  className,
  style,
}: AccessLogTableProps): JSX.Element {
  // Calculate display info
  const startItem = pagination
    ? pagination.page * pagination.size + 1
    : 1;
  const endItem = pagination
    ? Math.min(startItem + data.length - 1, pagination.total)
    : data.length;

  // Render action cell
  const renderAction = (action: AccessAction): ReactNode => {
    const config = ACTION_CONFIG[action];
    return (
      <span
        style={{
          ...styles.actionCell,
          backgroundColor: `${config.color}15`,
          color: config.color,
        }}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  };

  // Render table content
  const renderContent = (): ReactNode => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={5} style={{ padding: 0 }}>
            <div style={styles.loadingOverlay}>加载中...</div>
          </td>
        </tr>
      );
    }

    if (data.length === 0) {
      return (
        <tr>
          <td colSpan={5} style={{ padding: 0 }}>
            <div style={styles.emptyState}>{emptyMessage}</div>
          </td>
        </tr>
      );
    }

    return data.map((log) => (
      <tr key={log.id}>
        <td style={styles.td}>{renderAction(log.action)}</td>
        <td style={styles.td}>
          <div style={styles.userCell}>
            <span style={styles.userName}>{log.userName}</span>
            <span style={styles.userId}>{log.userId}</span>
          </div>
        </td>
        <td style={{ ...styles.td, ...styles.dateCell }}>
          {formatDate(log.accessedAt)}
        </td>
        <td style={{ ...styles.td, ...styles.dateCell }}>
          {log.ipAddress || '-'}
        </td>
        <td style={{ ...styles.td, ...styles.detailsCell }} title={log.details}>
          {log.details || '-'}
        </td>
      </tr>
    ));
  };

  return (
    <div className={className} style={{ ...styles.container, ...style }}>
      {/* Header with title and filters */}
      <div style={styles.header}>
        <h4 style={styles.title}>访问日志</h4>
        <div style={styles.filterBar}>
          {onFilterAction && (
            <select
              value={filterAction || ''}
              onChange={(e) =>
                onFilterAction(
                  e.target.value ? (e.target.value as AccessAction) : undefined
                )
              }
              style={styles.filterSelect}
              aria-label="筛选操作类型"
            >
              <option value="">全部操作</option>
              {Object.entries(ACTION_CONFIG).map(([action, config]) => (
                <option key={action} value={action}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>操作</th>
              <th style={styles.th}>用户</th>
              <th style={styles.th}>时间</th>
              <th style={styles.th}>IP 地址</th>
              <th style={styles.th}>详情</th>
            </tr>
          </thead>
          <tbody>{renderContent()}</tbody>
        </table>
      </div>

      {/* Footer with pagination */}
      {pagination && (
        <div style={styles.footer}>
          <div style={styles.footerInfo}>
            显示 {startItem}-{endItem}，共 {pagination.total} 条
          </div>

          <div style={styles.pagination}>
            {/* Page size selector */}
            {onPageSizeChange && (
              <select
                value={pagination.size}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                style={styles.pageSizeSelect}
                aria-label="每页条数"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} 条/页
                  </option>
                ))}
              </select>
            )}

            {/* Previous page button */}
            <button
              type="button"
              style={{
                ...styles.pageButton,
                ...(pagination.page === 0 ? styles.pageButtonDisabled : {}),
              }}
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 0}
              aria-label="上一页"
            >
              ‹ 上一页
            </button>

            {/* Page info */}
            <span style={{ fontSize: '13px', color: '#757575' }}>
              {pagination.page + 1} / {pagination.totalPages || 1}
            </span>

            {/* Next page button */}
            <button
              type="button"
              style={{
                ...styles.pageButton,
                ...(pagination.page >= pagination.totalPages - 1
                  ? styles.pageButtonDisabled
                  : {}),
              }}
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages - 1}
              aria-label="下一页"
            >
              下一页 ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
