/**
 * @file Intake Document Card Component
 * @description Card component for displaying a submitted document
 * @module @shinwa/intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Displays document details including status, submission info,
 * and review status. Used in both customer and reviewer views.
 *
 * @author Shinwa Team
 * @date 2026-06-10
 */

import React from 'react';
import type { IntakeChecklistItem } from '@shinwa/intake-shared';
import {
  INTAKE_ITEM_STATUS_LABELS,
  INTAKE_DOCUMENT_CATEGORY_LABELS,
  INTAKE_REVIEW_STATUS_LABELS,
} from '@shinwa/intake-shared';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for IntakeDocumentCard component
 */
export interface IntakeDocumentCardProps {
  /** The checklist item to display */
  item: IntakeChecklistItem;
  /** Whether to show detailed information */
  detailed?: boolean;
  /** Whether to show review actions */
  showActions?: boolean;
  /** Callback when card is clicked */
  onClick?: () => void;
  /** Callback when view document is clicked */
  onViewDocument?: () => void;
  /** Callback when approve is clicked */
  onApprove?: () => void;
  /** Callback when reject is clicked */
  onReject?: () => void;
  /** Additional CSS class */
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format file size for display
 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format date for display
 */
function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Get status color
 */
function getStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'APPROVED':
      return { bg: '#e8f5e9', text: '#2e7d32' };
    case 'REJECTED':
      return { bg: '#ffebee', text: '#c62828' };
    case 'SUBMITTED':
      return { bg: '#e3f2fd', text: '#1565c0' };
    case 'PENDING':
      return { bg: '#f5f5f5', text: '#616161' };
    case 'WAIVED':
      return { bg: '#fafafa', text: '#757575' };
    default:
      return { bg: '#f5f5f5', text: '#616161' };
  }
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Intake Document Card Component
 *
 * Displays document submission details in a card format.
 *
 * @example
 * ```tsx
 * <IntakeDocumentCard item={checklistItem} />
 *
 * <IntakeDocumentCard
 *   item={checklistItem}
 *   detailed
 *   showActions
 *   onApprove={() => handleApprove(item.id)}
 *   onReject={() => handleReject(item.id)}
 * />
 * ```
 */
export const IntakeDocumentCard: React.FC<IntakeDocumentCardProps> = ({
  item,
  detailed = false,
  showActions = false,
  onClick,
  onViewDocument,
  onApprove,
  onReject,
  className = '',
}) => {
  const statusLabel = INTAKE_ITEM_STATUS_LABELS[item.status];
  const categoryLabel = INTAKE_DOCUMENT_CATEGORY_LABELS[item.category];
  const statusColors = getStatusColor(item.status);

  const hasDocument = !!item.submittedDocumentId;
  const canReview = item.status === 'SUBMITTED';

  return (
    <div
      className={`intake-document-card ${className}`}
      onClick={onClick}
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#fff',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: detailed ? '1px solid #f0f0f0' : 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '8px',
          }}
        >
          <div style={{ flex: 1 }}>
            <h4
              style={{
                margin: '0 0 4px 0',
                fontSize: '1rem',
                fontWeight: 500,
                color: '#212121',
              }}
            >
              {item.documentName}
            </h4>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              {categoryLabel}
              {item.isRequired && (
                <span style={{ color: '#f44336', marginLeft: '8px' }}>*必填</span>
              )}
            </div>
          </div>

          {/* Status badge */}
          <span
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 500,
              backgroundColor: statusColors.bg,
              color: statusColors.text,
            }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Description */}
        {item.description && (
          <p
            style={{
              margin: '8px 0 0 0',
              fontSize: '0.875rem',
              color: '#666',
            }}
          >
            {item.description}
          </p>
        )}
      </div>

      {/* Document details (when submitted) */}
      {detailed && hasDocument && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#fafafa',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              fontSize: '0.875rem',
            }}
          >
            <div>
              <div style={{ color: '#666', marginBottom: '2px' }}>文件名</div>
              <div style={{ color: '#212121' }}>{item.submittedFileName || '-'}</div>
            </div>
            <div>
              <div style={{ color: '#666', marginBottom: '2px' }}>文件大小</div>
              <div style={{ color: '#212121' }}>{formatFileSize(item.submittedFileSize)}</div>
            </div>
            <div>
              <div style={{ color: '#666', marginBottom: '2px' }}>提交时间</div>
              <div style={{ color: '#212121' }}>{formatDate(item.submittedAt)}</div>
            </div>
            <div>
              <div style={{ color: '#666', marginBottom: '2px' }}>提交人</div>
              <div style={{ color: '#212121' }}>{item.submittedBy || '-'}</div>
            </div>
          </div>

          {/* Review info */}
          {(item.status === 'APPROVED' || item.status === 'REJECTED') && (
            <div
              style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #e0e0e0',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  fontSize: '0.875rem',
                }}
              >
                <div>
                  <div style={{ color: '#666', marginBottom: '2px' }}>审核人</div>
                  <div style={{ color: '#212121' }}>{item.reviewedBy || '-'}</div>
                </div>
                <div>
                  <div style={{ color: '#666', marginBottom: '2px' }}>审核时间</div>
                  <div style={{ color: '#212121' }}>{formatDate(item.reviewedAt)}</div>
                </div>
              </div>

              {item.reviewComment && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ color: '#666', marginBottom: '2px' }}>审核意见</div>
                  <div style={{ color: '#212121' }}>{item.reviewComment}</div>
                </div>
              )}

              {item.rejectionReason && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '8px',
                    backgroundColor: '#fff3e0',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ color: '#e65100', fontSize: '0.75rem', marginBottom: '2px' }}>
                    拒绝原因
                  </div>
                  <div style={{ color: '#e65100' }}>{item.rejectionReason}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {(showActions || onViewDocument) && hasDocument && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          {onViewDocument && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDocument();
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#424242',
              }}
            >
              查看文档
            </button>
          )}

          {showActions && canReview && onApprove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApprove();
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              通过
            </button>
          )}

          {showActions && canReview && onReject && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject();
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f44336',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              拒绝
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default IntakeDocumentCard;
