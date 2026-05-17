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
 * @file Intake Checklist Component
 * @description Displays the list of documents required for an intake task
 * @module @brix-sdk/enterprise-intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Presentational component for displaying intake checklist items.
 * Supports different view modes for submission and review workflows.
 *
 * @author Brix Team
 * @date 2026-06-10
 */

import React from 'react';
import type { IntakeChecklistItem } from '@brix-sdk/enterprise-intake-shared';
import {
  INTAKE_ITEM_STATUS_LABELS,
  INTAKE_ITEM_STATUS_COLORS,
  INTAKE_DOCUMENT_CATEGORY_LABELS,
  INTAKE_DOCUMENT_CATEGORY_ICONS,
} from '@brix-sdk/enterprise-intake-shared';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for IntakeChecklist component
 */
export interface IntakeChecklistProps {
  /** Checklist items to display */
  items: IntakeChecklistItem[];
  /** Mode determines the available actions */
  mode?: 'view' | 'submit' | 'review';
  /** Callback when an item is clicked */
  onItemClick?: (item: IntakeChecklistItem) => void;
  /** Callback when upload is triggered */
  onUpload?: (item: IntakeChecklistItem) => void;
  /** Callback when approve is triggered */
  onApprove?: (item: IntakeChecklistItem) => void;
  /** Callback when reject is triggered */
  onReject?: (item: IntakeChecklistItem) => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * Props for IntakeChecklistItem component
 */
interface ChecklistItemProps {
  item: IntakeChecklistItem;
  mode: 'view' | 'submit' | 'review';
  onItemClick?: (item: IntakeChecklistItem) => void;
  onUpload?: (item: IntakeChecklistItem) => void;
  onApprove?: (item: IntakeChecklistItem) => void;
  onReject?: (item: IntakeChecklistItem) => void;
}

// ============================================================================
// Status Color Mapping
// ============================================================================

const statusColorMap: Record<string, { bg: string; text: string; border: string }> = {
  default: { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' },
  info: { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' },
  success: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
  error: { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' },
  secondary: { bg: '#fafafa', text: '#757575', border: '#e0e0e0' },
};

// ============================================================================
// Checklist Item Component
// ============================================================================

/**
 * Individual checklist item row
 */
const ChecklistItemRow: React.FC<ChecklistItemProps> = ({
  item,
  mode,
  onItemClick,
  onUpload,
  onApprove,
  onReject,
}) => {
  const { tokens } = useTheme();
  const statusLabel = INTAKE_ITEM_STATUS_LABELS[item.status];
  const categoryLabel = INTAKE_DOCUMENT_CATEGORY_LABELS[item.category];
  const colorName = INTAKE_ITEM_STATUS_COLORS[item.status] || 'default';
  const colors = statusColorMap[colorName] || statusColorMap.default;

  const handleClick = () => {
    onItemClick?.(item);
  };

  const canUpload = mode === 'submit' && (item.status === 'PENDING' || item.status === 'REJECTED');
  const canReview = mode === 'review' && item.status === 'SUBMITTED';

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: `1px solid ${tokens.colors.border.default}`,
        cursor: onItemClick ? 'pointer' : 'default',
        backgroundColor: colors.bg,
        transition: 'background-color 0.2s',
      }}
    >
      {/* Status indicator */}
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: colors.text,
          marginRight: '12px',
          flexShrink: 0,
        }}
      />

      {/* Document info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '4px',
          }}
        >
          <span
            style={{
              fontWeight: 500,
              color: tokens.colors.text.primary,
              marginRight: '8px',
            }}
          >
            {item.documentName}
          </span>
          {item.isRequired && (
            <span
              style={{
                fontSize: '0.75rem',
                color: tokens.colors.status.error,
                fontWeight: 500,
              }}
            >
              *必填
            </span>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: tokens.colors.text.secondary,
          }}
        >
          <span style={{ marginRight: '12px' }}>{categoryLabel}</span>
          <span
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: colors.border,
              color: colors.text,
            }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Rejection reason */}
        {item.status === 'REJECTED' && item.rejectionReason && (
          <div
            style={{
              marginTop: '8px',
              padding: '8px',
              backgroundColor: tokens.colors.status.warningLight,
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#e65100',
            }}
          >
            拒绝原因: {item.rejectionReason}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
        {canUpload && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpload?.(item);
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: tokens.colors.brand.primary,
              color: tokens.colors.surface.card,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            上传
          </button>
        )}

        {canReview && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApprove?.(item);
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject?.(item);
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
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Checklist Component
// ============================================================================

/**
 * Intake Checklist Component
 *
 * Displays a list of required documents with their status.
 * Supports view, submit, and review modes.
 *
 * @example
 * ```tsx
 * // View mode
 * <IntakeChecklist items={task.checklistItems} mode="view" />
 *
 * // Submit mode
 * <IntakeChecklist
 *   items={task.checklistItems}
 *   mode="submit"
 *   onUpload={(item) => handleUpload(item)}
 * />
 *
 * // Review mode
 * <IntakeChecklist
 *   items={task.checklistItems}
 *   mode="review"
 *   onApprove={(item) => handleApprove(item)}
 *   onReject={(item) => handleReject(item)}
 * />
 * ```
 */
export const IntakeChecklist: React.FC<IntakeChecklistProps> = ({
  items,
  mode = 'view',
  onItemClick,
  onUpload,
  onApprove,
  onReject,
  className = '',
}) => {
  const { tokens } = useTheme();

  // Sort items by display order
  const sortedItems = [...items].sort((a, b) => a.displayOrder - b.displayOrder);

  // Group by required/optional
  const requiredItems = sortedItems.filter((item) => item.isRequired);
  const optionalItems = sortedItems.filter((item) => !item.isRequired);

  return (
    <div className={`intake-checklist ${className}`}>
      {/* Required documents */}
      {requiredItems.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h4
            style={{
              margin: '0 0 12px 0',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#424242',
            }}
          >
            必需资料 ({requiredItems.length})
          </h4>
          <div
            style={{
              border: `1px solid ${tokens.colors.border.default}`,
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {requiredItems.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                mode={mode}
                onItemClick={onItemClick}
                onUpload={onUpload}
                onApprove={onApprove}
                onReject={onReject}
              />
            ))}
          </div>
        </div>
      )}

      {/* Optional documents */}
      {optionalItems.length > 0 && (
        <div>
          <h4
            style={{
              margin: '0 0 12px 0',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: tokens.colors.text.secondary,
            }}
          >
            可选资料 ({optionalItems.length})
          </h4>
          <div
            style={{
              border: `1px solid ${tokens.colors.border.default}`,
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {optionalItems.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                mode={mode}
                onItemClick={onItemClick}
                onUpload={onUpload}
                onApprove={onApprove}
                onReject={onReject}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            color: tokens.colors.text.secondary,
          }}
        >
          暂无资料清单
        </div>
      )}
    </div>
  );
};

export default IntakeChecklist;
