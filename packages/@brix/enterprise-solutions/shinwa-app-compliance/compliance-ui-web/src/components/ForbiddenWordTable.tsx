/**
 * ForbiddenWordTable Component
 * Displays a table/list of forbidden words with filtering and actions.
 * Following v3.0.4 Runtime Shell Architecture Blueprint.
 * @module compliance-ui-web/components/ForbiddenWordTable
 */

import React, { memo, useMemo, useCallback } from 'react';
import type { ForbiddenWord } from '@shinwa/compliance-shared';
import { FORBIDDEN_CATEGORY_CONFIG } from '@shinwa/compliance-shared';
import { SeverityChip } from './SeverityChip';

/**
 * Props interface for ForbiddenWordTable component.
 */
export interface ForbiddenWordTableProps {
  /** Array of forbidden words to display */
  words: ForbiddenWord[];
  /** Loading state indicator */
  loading?: boolean;
  /** Handler for word click/selection */
  onWordClick?: (word: ForbiddenWord) => void;
  /** Handler for edit action */
  onEdit?: (word: ForbiddenWord) => void;
  /** Handler for delete action */
  onDelete?: (word: ForbiddenWord) => void;
  /** Handler for toggle active status */
  onToggleStatus?: (word: ForbiddenWord) => void;
  /** Currently selected word ID */
  selectedId?: string;
  /** Whether to show action column */
  showActions?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Optional additional CSS class names */
  className?: string;
}

/**
 * Formats a date string for display.
 * @param dateString - ISO date string to format
 * @returns Formatted date and time string
 */
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Component that displays forbidden words in a table format.
 * Supports sorting, selection, and inline actions.
 * @param props - Component props including words array and handlers
 * @returns Styled forbidden word table
 * @example
 * ```tsx
 * <ForbiddenWordTable
 *   words={forbiddenWords}
 *   onWordClick={handleSelect}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onToggleStatus={handleToggle}
 *   showActions={true}
 * />
 * ```
 */
export const ForbiddenWordTable: React.FC<ForbiddenWordTableProps> = memo(({
  words,
  loading = false,
  onWordClick,
  onEdit,
  onDelete,
  onToggleStatus,
  selectedId,
  showActions = true,
  emptyMessage = '暂无禁用词数据',
  className = '',
}) => {
  const handleRowClick = useCallback((word: ForbiddenWord) => {
    onWordClick?.(word);
  }, [onWordClick]);

  const handleEditClick = useCallback((e: React.MouseEvent, word: ForbiddenWord) => {
    e.stopPropagation();
    onEdit?.(word);
  }, [onEdit]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, word: ForbiddenWord) => {
    e.stopPropagation();
    onDelete?.(word);
  }, [onDelete]);

  const handleToggleClick = useCallback((e: React.MouseEvent, word: ForbiddenWord) => {
    e.stopPropagation();
    onToggleStatus?.(word);
  }, [onToggleStatus]);

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  };

  const headerRowStyle: React.CSSProperties = {
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  };

  const headerCellStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    color: '#374151',
    whiteSpace: 'nowrap',
  };

  const bodyRowStyle = (isSelected: boolean): React.CSSProperties => ({
    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
    borderBottom: '1px solid #f3f4f6',
    cursor: onWordClick ? 'pointer' : 'default',
    transition: 'background-color 0.15s ease',
  });

  const cellStyle: React.CSSProperties = {
    padding: '12px 16px',
    color: '#1f2937',
    verticalAlign: 'middle',
  };

  const wordCellStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 500,
  };

  const actionCellStyle: React.CSSProperties = {
    ...cellStyle,
    textAlign: 'right',
    whiteSpace: 'nowrap',
  };

  const actionButtonStyle: React.CSSProperties = {
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#6b7280',
    marginLeft: '4px',
    transition: 'all 0.15s ease',
  };

  const toggleStyle = (isActive: boolean): React.CSSProperties => ({
    position: 'relative',
    width: '36px',
    height: '20px',
    backgroundColor: isActive ? '#10b981' : '#d1d5db',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    border: 'none',
    padding: 0,
  });

  const toggleKnobStyle = (isActive: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: '2px',
    left: isActive ? '18px' : '2px',
    width: '16px',
    height: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    transition: 'left 0.2s ease',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  });

  const emptyStyle: React.CSSProperties = {
    padding: '48px 16px',
    textAlign: 'center',
    color: '#9ca3af',
  };

  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '48px',
  };

  if (loading) {
    return (
      <div style={loadingStyle} className="forbidden-word-table__loading">
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div style={emptyStyle} className="forbidden-word-table__empty">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1.5"
          style={{ marginBottom: '12px' }}
        >
          <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9m-12 12H5a2 2 0 0 1-2-2V9m0 0h18" />
        </svg>
        <p style={{ margin: 0 }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`forbidden-word-table ${className}`} style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr style={headerRowStyle}>
            <th style={headerCellStyle}>禁用词</th>
            <th style={headerCellStyle}>严重程度</th>
            <th style={headerCellStyle}>分类</th>
            <th style={headerCellStyle}>描述</th>
            <th style={{ ...headerCellStyle, textAlign: 'center' }}>状态</th>
            <th style={headerCellStyle}>更新时间</th>
            {showActions && <th style={{ ...headerCellStyle, textAlign: 'right' }}>操作</th>}
          </tr>
        </thead>
        <tbody>
          {words.map((word) => (
            <tr
              key={word.id}
              style={bodyRowStyle(word.id === selectedId)}
              onClick={() => handleRowClick(word)}
              className="forbidden-word-table__row"
            >
              <td style={wordCellStyle}>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                }}>
                  {word.word}
                </span>
              </td>
              <td style={cellStyle}>
                <SeverityChip severity={word.severity} size="small" showIcon />
              </td>
              <td style={cellStyle}>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  backgroundColor: FORBIDDEN_CATEGORY_CONFIG[word.category]?.backgroundColor || '#f3f4f6',
                  color: FORBIDDEN_CATEGORY_CONFIG[word.category]?.color || '#6b7280',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}>
                  {FORBIDDEN_CATEGORY_CONFIG[word.category]?.label || word.category}
                </span>
              </td>
              <td style={{ ...cellStyle, color: '#6b7280', maxWidth: '200px' }}>
                <span style={{
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {word.description || '-'}
                </span>
              </td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>
                {onToggleStatus ? (
                  <button
                    style={toggleStyle(word.isActive)}
                    onClick={(e) => handleToggleClick(e, word)}
                    title={word.isActive ? '点击禁用' : '点击启用'}
                    aria-label={word.isActive ? '禁用此词' : '启用此词'}
                  >
                    <span style={toggleKnobStyle(word.isActive)} />
                  </button>
                ) : (
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    backgroundColor: word.isActive ? '#d1fae5' : '#f3f4f6',
                    color: word.isActive ? '#059669' : '#6b7280',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}>
                    {word.isActive ? '启用' : '禁用'}
                  </span>
                )}
              </td>
              <td style={{ ...cellStyle, fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                {formatDateTime(word.updatedAt)}
              </td>
              {showActions && (
                <td style={actionCellStyle}>
                  {onEdit && (
                    <button
                      style={actionButtonStyle}
                      onClick={(e) => handleEditClick(e, word)}
                      title="编辑"
                      className="forbidden-word-table__action--edit"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      style={{ ...actionButtonStyle, color: '#ef4444' }}
                      onClick={(e) => handleDeleteClick(e, word)}
                      title="删除"
                      className="forbidden-word-table__action--delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

ForbiddenWordTable.displayName = 'ForbiddenWordTable';

export default ForbiddenWordTable;
