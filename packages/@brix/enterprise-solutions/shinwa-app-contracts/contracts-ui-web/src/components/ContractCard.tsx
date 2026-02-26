/**
 * @file Contract Card Component
 * @description Card component for displaying contract summary in list
 * @module @shinwa/contracts-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Pure presentational component following v3.0.4 View layer guidelines.
 * Receives data as props and renders the contract summary card.
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import React from 'react';
import type { ContractSummary } from '@shinwa/contracts-shared';
import { ContractStatusChip } from './ContractStatusChip';

// ============================================================================
// Component Props
// ============================================================================

export interface ContractCardProps {
  /** Contract summary data */
  data: ContractSummary;
  /** Click handler */
  onClick?: (contract: ContractSummary) => void;
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
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format currency amount
 */
function formatAmount(amount: number | undefined, currency: string | undefined): string {
  if (amount === undefined) return '-';
  const cur = currency || 'CNY';
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: cur,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '12px',
  },
  selected: {
    borderColor: '#3B82F6',
    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  contractNo: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#3B82F6',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 8px 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  parties: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '13px',
    color: '#6B7280',
  },
  partyLabel: {
    fontWeight: 500,
    color: '#374151',
  },
  separator: {
    color: '#D1D5DB',
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #F3F4F6',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  metaLabel: {
    fontSize: '11px',
    color: '#9CA3AF',
  },
  metaValue: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
  },
  signProgress: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#6B7280',
  },
  progressBar: {
    width: '60px',
    height: '4px',
    backgroundColor: '#E5E7EB',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    transition: 'width 0.3s ease',
  },
  deleteButton: {
    padding: '4px 8px',
    fontSize: '12px',
    color: '#EF4444',
    backgroundColor: 'transparent',
    border: '1px solid #FCA5A5',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Contract Card Component
 *
 * Renders a summary card for a contract with status, parties, and metadata.
 *
 * @example
 * ```tsx
 * <ContractCard
 *   data={contractSummary}
 *   onClick={handleClick}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export const ContractCard: React.FC<ContractCardProps> = ({
  data,
  onClick,
  onDelete,
  selected = false,
}) => {
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

  // Calculate signature progress
  const signProgress = data.partyCount > 0 
    ? Math.round((data.signedCount / data.partyCount) * 100) 
    : 0;

  return (
    <div
      style={{
        ...styles.card,
        ...(selected ? styles.selected : {}),
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Card Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.contractNo}>{data.contractNo}</span>
          <ContractStatusChip status={data.status} size="small" />
        </div>
        {onDelete && data.status === 'DRAFT' && (
          <button
            style={styles.deleteButton}
            onClick={handleDelete}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#FEE2E2';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            删除
          </button>
        )}
      </div>

      {/* Contract Title */}
      <h3 style={styles.title}>{data.title}</h3>

      {/* Parties Info */}
      <div style={styles.parties}>
        <span style={styles.partyLabel}>甲方:</span>
        <span>{data.partyAName}</span>
        <span style={styles.separator}>|</span>
        <span style={styles.partyLabel}>乙方:</span>
        <span>{data.partyBName}</span>
      </div>

      {/* Meta Information */}
      <div style={styles.meta}>
        <div style={styles.metaItem}>
          <span style={styles.metaLabel}>模板</span>
          <span style={styles.metaValue}>{data.templateName}</span>
        </div>
        <div style={styles.metaItem}>
          <span style={styles.metaLabel}>金额</span>
          <span style={styles.metaValue}>{formatAmount(data.amount, data.currency)}</span>
        </div>
        <div style={styles.metaItem}>
          <span style={styles.metaLabel}>有效期</span>
          <span style={styles.metaValue}>
            {formatDate(data.startDate)} ~ {formatDate(data.endDate)}
          </span>
        </div>
        <div style={styles.metaItem}>
          <span style={styles.metaLabel}>签署进度</span>
          <div style={styles.signProgress}>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${signProgress}%` }} />
            </div>
            <span>{data.signedCount}/{data.partyCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractCard;
