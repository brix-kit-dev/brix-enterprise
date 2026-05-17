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
 * @file Intake Document Card Component
 * @description Card component for displaying a submitted document
 * @module @brix-sdk/enterprise-intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Displays document details including status, submission info,
 * and review status. Used in both customer and reviewer views.
 *
 * @author Brix Team
 * @date 2026-06-10
 */

import React from 'react';
import type { IntakeChecklistItem } from '@brix-sdk/enterprise-intake-shared';
import {
  INTAKE_ITEM_STATUS_LABELS,
  INTAKE_DOCUMENT_CATEGORY_LABELS,
  INTAKE_REVIEW_STATUS_LABELS,
} from '@brix-sdk/enterprise-intake-shared';
import { useTheme } from '@brix-sdk/runtime-sdk-react';

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
  const { tokens } = useTheme();
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
        border: `1px solid ${tokens.colors.border.default}`,
        borderRadius: '8px',
        backgroundColor: tokens.colors.surface.card,
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
                color: tokens.colors.text.primary,
              }}
            >
              {item.documentName}
            </h4>
            <div style={{ fontSize: '0.75rem', color: tokens.colors.text.secondary }}>
              {categoryLabel}
              {item.isRequired && (
                <span style={{ color: tokens.colors.status.error, marginLeft: '8px' }}>*必填</span>
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
              color: tokens.colors.text.secondary,
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
            backgroundColor: tokens.colors.surface.page,
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
              <div style={{ color: tokens.colors.text.secondary, marginBottom: '2px' }}>文件名</div>
              <div style={{ color: tokens.colors.text.primary }}>{item.submittedFileName || '-'}</div>
            </div>
            <div>
              <div style={{ color: tokens.colors.text.secondary, marginBottom: '2px' }}>文件大小</div>
              <div style={{ color: tokens.colors.text.primary }}>{formatFileSize(item.submittedFileSize)}</div>
            </div>
            <div>
              <div style={{ color: tokens.colors.text.secondary, marginBottom: '2px' }}>提交时间</div>
              <div style={{ color: tokens.colors.text.primary }}>{formatDate(item.submittedAt)}</div>
            </div>
            <div>
              <div style={{ color: tokens.colors.text.secondary, marginBottom: '2px' }}>提交人</div>
              <div style={{ color: tokens.colors.text.primary }}>{item.submittedBy || '-'}</div>
            </div>
          </div>

          {/* Review info */}
          {(item.status === 'APPROVED' || item.status === 'REJECTED') && (
            <div
              style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: `1px solid ${tokens.colors.border.default}`,
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
                  <div style={{ color: tokens.colors.text.secondary, marginBottom: '2px' }}>审核人</div>
                  <div style={{ color: tokens.colors.text.primary }}>{item.reviewedBy || '-'}</div>
                </div>
                <div>
                  <div style={{ color: tokens.colors.text.secondary, marginBottom: '2px' }}>审核时间</div>
                  <div style={{ color: tokens.colors.text.primary }}>{formatDate(item.reviewedAt)}</div>
                </div>
              </div>

              {item.reviewComment && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ color: tokens.colors.text.secondary, marginBottom: '2px' }}>审核意见</div>
                  <div style={{ color: tokens.colors.text.primary }}>{item.reviewComment}</div>
                </div>
              )}

              {item.rejectionReason && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '8px',
                    backgroundColor: tokens.colors.status.warningLight,
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
                backgroundColor: tokens.colors.surface.page,
                border: `1px solid ${tokens.colors.border.default}`,
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
                backgroundColor: tokens.colors.status.success,
                color: tokens.colors.surface.card,
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
                backgroundColor: tokens.colors.status.error,
                color: tokens.colors.surface.card,
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
