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
 * ScriptCard Component
 * Displays a script template summary card with key information.
 * Following v3.0.4 Runtime Shell Architecture Blueprint.
 * @module compliance-ui-web/components/ScriptCard
 */

import React, { memo, useMemo, useCallback } from 'react';
import type { ScriptTemplate } from '@brix-sdk/enterprise-compliance-shared';
import { SCRIPT_CATEGORY_CONFIG, SCRIPT_SCENARIO_CONFIG } from '@brix-sdk/enterprise-compliance-shared';
import { ScriptStatusChip } from './ScriptStatusChip';

/**
 * Props interface for ScriptCard component.
 */
export interface ScriptCardProps {
  /** The script template data to display */
  script: ScriptTemplate;
  /** Click handler for the card */
  onClick?: (script: ScriptTemplate) => void;
  /** Click handler for edit action */
  onEdit?: (script: ScriptTemplate) => void;
  /** Click handler for copy action */
  onCopy?: (script: ScriptTemplate) => void;
  /** Click handler for delete action */
  onDelete?: (script: ScriptTemplate) => void;
  /** Whether the card is in selected state */
  selected?: boolean;
  /** Whether to show action buttons */
  showActions?: boolean;
  /** Optional additional CSS class names */
  className?: string;
}

/**
 * Formats a date string for display.
 * @param dateString - ISO date string to format
 * @returns Formatted date string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Truncates text to a maximum length with ellipsis.
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Component that displays a script template summary as a card.
 * Shows template name, category, scenario, status, and metadata.
 * Supports selection state and action buttons.
 * @param props - Component props including script data and event handlers
 * @returns Styled script template card element
 * @example
 * ```tsx
 * <ScriptCard
 *   script={scriptTemplate}
 *   onClick={handleCardClick}
 *   onEdit={handleEdit}
 *   showActions={true}
 * />
 * ```
 */
export const ScriptCard: React.FC<ScriptCardProps> = memo(({
  script,
  onClick,
  onEdit,
  onCopy,
  onDelete,
  selected = false,
  showActions = true,
  className = '',
}) => {
  const categoryConfig = useMemo(
    () => SCRIPT_CATEGORY_CONFIG[script.category],
    [script.category]
  );

  const scenarioConfig = useMemo(
    () => SCRIPT_SCENARIO_CONFIG[script.scenario],
    [script.scenario]
  );

  const handleCardClick = useCallback(() => {
    onClick?.(script);
  }, [onClick, script]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(script);
  }, [onEdit, script]);

  const handleCopyClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy?.(script);
  }, [onCopy, script]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(script);
  }, [onDelete, script]);

  const cardStyle: React.CSSProperties = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: selected ? '#f0f9ff' : '#ffffff',
    border: `1px solid ${selected ? '#3b82f6' : '#e5e7eb'}`,
    boxShadow: selected ? '0 2px 8px rgba(59, 130, 246, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
  }), [selected, onClick]);

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const metaRowStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '12px',
  };

  const tagStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  };

  const categoryTagStyle: React.CSSProperties = {
    ...tagStyle,
    backgroundColor: categoryConfig?.backgroundColor || '#f3f4f6',
    color: categoryConfig?.color || '#6b7280',
  };

  const scenarioTagStyle: React.CSSProperties = {
    ...tagStyle,
    backgroundColor: scenarioConfig?.backgroundColor || '#f3f4f6',
    color: scenarioConfig?.color || '#6b7280',
  };

  const previewStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: 1.5,
    marginBottom: '12px',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
  };

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '12px',
    marginTop: 'auto',
  };

  const timestampStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#9ca3af',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
  };

  const actionButtonStyle: React.CSSProperties = {
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#6b7280',
    transition: 'all 0.2s ease',
  };

  return (
    <div
      className={`script-card ${selected ? 'script-card--selected' : ''} ${className}`}
      style={cardStyle}
      onClick={handleCardClick}
      role="button"
      tabIndex={onClick ? 0 : undefined}
      aria-selected={selected}
      data-script-id={script.id}
    >
      {/* Header with title and status */}
      <div style={headerStyle} className="script-card__header">
        <h3 style={titleStyle} className="script-card__title" title={script.name}>
          {script.name}
        </h3>
        <ScriptStatusChip status={script.status} size="small" />
      </div>

      {/* Meta tags row */}
      <div style={metaRowStyle} className="script-card__meta">
        <span style={categoryTagStyle} className="script-card__category">
          {categoryConfig?.label || script.category}
        </span>
        <span style={scenarioTagStyle} className="script-card__scenario">
          {scenarioConfig?.label || script.scenario}
        </span>
        {script.variables && script.variables.length > 0 && (
          <span style={{ ...tagStyle, backgroundColor: '#eff6ff', color: '#3b82f6' }}>
            {script.variables.length} 个变量
          </span>
        )}
      </div>

      {/* Content preview */}
      <p style={previewStyle} className="script-card__preview">
        {truncateText(script.content, 100)}
      </p>

      {/* Footer with timestamp and actions */}
      <div style={footerStyle} className="script-card__footer">
        <span style={timestampStyle} className="script-card__timestamp">
          更新于 {formatDate(script.updatedAt)}
        </span>

        {showActions && (
          <div style={actionsStyle} className="script-card__actions">
            {onEdit && (
              <button
                style={actionButtonStyle}
                className="script-card__action script-card__action--edit"
                onClick={handleEditClick}
                title="编辑"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}
            {onCopy && (
              <button
                style={actionButtonStyle}
                className="script-card__action script-card__action--copy"
                onClick={handleCopyClick}
                title="复制"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                style={{ ...actionButtonStyle, color: '#ef4444' }}
                className="script-card__action script-card__action--delete"
                onClick={handleDeleteClick}
                title="删除"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

ScriptCard.displayName = 'ScriptCard';

export default ScriptCard;
