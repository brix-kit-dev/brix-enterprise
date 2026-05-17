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
 * @file Case Status Chip Component
 * @description Displays case status with appropriate styling
 * @module @brix-sdk/enterprise-case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This is a pure presentational component following v3.0.4 View layer guidelines.
 * It renders a status badge with color and icon based on status type.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import React from 'react';
import type { CaseStatus } from '@brix-sdk/enterprise-case-shared';
import { CASE_STATUS_CONFIG } from '@brix-sdk/enterprise-case-shared';

// ============================================================================
// Component Props
// ============================================================================

export interface CaseStatusChipProps {
  /** Case status value */
  status: CaseStatus;
  /** Size variant */
  size?: 'small' | 'medium';
  /** Additional CSS class */
  className?: string;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Case Status Chip Component
 *
 * Renders a colored badge indicating the case status.
 *
 * @example
 * ```tsx
 * <CaseStatusChip status="IN_PROGRESS" />
 * <CaseStatusChip status="COMPLETED" size="small" />
 * ```
 */
export const CaseStatusChip: React.FC<CaseStatusChipProps> = ({
  status,
  size = 'medium',
  className = '',
}) => {
  const config = CASE_STATUS_CONFIG[status] || {
    label: status,
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: '●',
  };

  const sizeStyles = size === 'small' ? styles.small : styles.medium;

  return (
    <span
      className={className}
      style={{
        ...styles.chip,
        ...sizeStyles,
        backgroundColor: config.bgColor,
        color: config.color,
        borderColor: config.color,
      }}
    >
      <span style={styles.icon}>{config.icon}</span>
      {config.label}
    </span>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    borderRadius: '9999px',
    fontWeight: 500,
    border: '1px solid',
    whiteSpace: 'nowrap',
  },
  small: {
    padding: '2px 8px',
    fontSize: '12px',
  },
  medium: {
    padding: '4px 12px',
    fontSize: '13px',
  },
  icon: {
    fontSize: '10px',
  },
};

export default CaseStatusChip;
