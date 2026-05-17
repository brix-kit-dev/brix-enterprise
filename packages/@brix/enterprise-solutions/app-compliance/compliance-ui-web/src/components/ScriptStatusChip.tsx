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
 * ScriptStatusChip Component
 * Displays a colored badge/chip indicating the script template status.
 * Following v3.0.4 Runtime Shell Architecture Blueprint.
 * @module compliance-ui-web/components/ScriptStatusChip
 */

import React, { memo, useMemo } from 'react';
import { ScriptTemplateStatus, SCRIPT_STATUS_CONFIG } from '@brix-sdk/enterprise-compliance-shared';

/**
 * Props interface for ScriptStatusChip component.
 */
export interface ScriptStatusChipProps {
  /** The status value to display */
  status: ScriptTemplateStatus;
  /** Optional size variant */
  size?: 'small' | 'medium' | 'large';
  /** Optional additional CSS class names */
  className?: string;
  /** Whether to show the status icon */
  showIcon?: boolean;
}

/**
 * Mapping of status values to icon elements.
 */
const STATUS_ICONS: Record<ScriptTemplateStatus, React.ReactNode> = {
  [ScriptTemplateStatus.DRAFT]: (
    <svg className="script-status-icon" viewBox="0 0 20 20" fill="currentColor">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  ),
  [ScriptTemplateStatus.PUBLISHED]: (
    <svg className="script-status-icon" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  [ScriptTemplateStatus.ARCHIVED]: (
    <svg className="script-status-icon" viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
      <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  ),
};

/**
 * Component that displays the script template status as a styled chip/badge.
 * Uses configuration from compliance-shared for consistent status display.
 * Supports different sizes and optional icon display.
 * @param props - Component props including status, size, and display options
 * @returns Styled status chip element
 * @example
 * ```tsx
 * <ScriptStatusChip
 *   status={ScriptTemplateStatus.PUBLISHED}
 *   size="medium"
 *   showIcon={true}
 * />
 * ```
 */
export const ScriptStatusChip: React.FC<ScriptStatusChipProps> = memo(({
  status,
  size = 'medium',
  className = '',
  showIcon = true,
}) => {
  const config = useMemo(() => SCRIPT_STATUS_CONFIG[status], [status]);

  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'small':
        return 'script-status-chip--small';
      case 'large':
        return 'script-status-chip--large';
      default:
        return 'script-status-chip--medium';
    }
  }, [size]);

  const chipStyle: React.CSSProperties = useMemo(() => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: size === 'small' ? '2px 6px' : size === 'large' ? '6px 14px' : '4px 10px',
    borderRadius: '12px',
    fontSize: size === 'small' ? '11px' : size === 'large' ? '14px' : '12px',
    fontWeight: 500,
    lineHeight: 1.4,
    backgroundColor: config.backgroundColor,
    color: config.color,
    border: `1px solid ${config.borderColor || 'transparent'}`,
  }), [config, size]);

  const iconStyle: React.CSSProperties = {
    width: size === 'small' ? '12px' : size === 'large' ? '18px' : '14px',
    height: size === 'small' ? '12px' : size === 'large' ? '18px' : '14px',
    flexShrink: 0,
  };

  return (
    <span
      className={`script-status-chip ${sizeClasses} ${className}`}
      style={chipStyle}
      data-status={status}
      role="status"
      aria-label={`Script status: ${config.label}`}
    >
      {showIcon && (
        <span style={iconStyle} className="script-status-chip__icon">
          {STATUS_ICONS[status]}
        </span>
      )}
      <span className="script-status-chip__label">{config.label}</span>
    </span>
  );
});

ScriptStatusChip.displayName = 'ScriptStatusChip';

export default ScriptStatusChip;
