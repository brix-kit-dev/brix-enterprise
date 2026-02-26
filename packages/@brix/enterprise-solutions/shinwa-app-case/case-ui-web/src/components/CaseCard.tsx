/**
 * @file Case Card Component
 * @description Card component for displaying case summary in list
 * @module @shinwa/case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This is a pure presentational component following v3.0.4 View layer guidelines.
 * It receives data as props and renders the case summary card.
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import React from 'react';
import type { CaseSummary, CaseType } from '@shinwa/case-shared';
import { CASE_TYPE_CONFIG } from '@shinwa/case-shared';
import { CaseStatusChip } from './CaseStatusChip';
import { CasePriorityChip } from './CasePriorityChip';

// ============================================================================
// Component Props
// ============================================================================

export interface CaseCardProps {
  /** Case summary data */
  data: CaseSummary;
  /** Click handler */
  onClick?: (caseData: CaseSummary) => void;
  /** Delete handler */
  onDelete?: (id: number, e: React.MouseEvent) => void;
  /** Whether the card is selected */
  selected?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format date to localized string
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Get case type display info
 */
function getCaseTypeInfo(caseType: CaseType) {
  return CASE_TYPE_CONFIG[caseType] || {
    label: caseType,
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: '📋',
  };
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Case Card Component
 *
 * Renders a summary card for a case with status, priority, and metadata.
 *
 * @example
 * ```tsx
 * <CaseCard
 *   data={caseSummary}
 *   onClick={handleClick}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export const CaseCard: React.FC<CaseCardProps> = ({
  data,
  onClick,
  onDelete,
  selected = false,
}) => {
  const typeInfo = getCaseTypeInfo(data.caseType);

  const handleClick = () => {
    if (onClick) {
      onClick(data);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(data.id, e);
    }
  };

  return (
    <div
      style={{
        ...styles.card,
        ...(selected ? styles.selected : {}),
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      {/* Card Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.caseCode}>{data.caseCode}</span>
          <span
            style={{
              ...styles.typeTag,
              backgroundColor: typeInfo.bgColor,
              color: typeInfo.color,
            }}
          >
            {typeInfo.icon} {typeInfo.label}
          </span>
        </div>
        <div style={styles.headerRight}>
          <CasePriorityChip priority={data.priority} size="small" />
        </div>
      </div>

      {/* Case Title */}
      <h3 style={styles.title}>{data.title}</h3>

      {/* Case Description (if exists) */}
      {data.description && (
        <p style={styles.description}>
          {data.description.length > 100
            ? `${data.description.substring(0, 100)}...`
            : data.description}
        </p>
      )}

      {/* Customer Info */}
      {data.customerName && (
        <div style={styles.customer}>
          <span style={styles.customerIcon}>👤</span>
          <span style={styles.customerName}>{data.customerName}</span>
        </div>
      )}

      {/* Card Footer */}
      <div style={styles.footer}>
        <div style={styles.footerLeft}>
          <CaseStatusChip status={data.status} size="small" />
          <span style={styles.progress}>
            {data.completedNodeCount}/{data.totalNodeCount} 节点
          </span>
        </div>
        <div style={styles.footerRight}>
          <span style={styles.date}>{formatDate(data.createdAt)}</span>
          {onDelete && (
            <button
              onClick={handleDelete}
              style={styles.deleteButton}
              title="删除"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {data.totalNodeCount > 0 && (
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${(data.completedNodeCount / data.totalNodeCount) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  selected: {
    borderColor: '#3B82F6',
    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
  },
  caseCode: {
    fontSize: '12px',
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  typeTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    lineHeight: 1.4,
  },
  description: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    color: '#6B7280',
    lineHeight: 1.5,
  },
  customer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '12px',
  },
  customerIcon: {
    fontSize: '12px',
  },
  customerName: {
    fontSize: '13px',
    color: '#374151',
    fontWeight: 500,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  footerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  progress: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  date: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    fontSize: '14px',
    opacity: 0.6,
    transition: 'opacity 0.2s',
  },
  progressBar: {
    marginTop: '12px',
    height: '4px',
    backgroundColor: '#E5E7EB',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
};

export default CaseCard;
