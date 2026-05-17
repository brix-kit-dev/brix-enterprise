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
 * @file Case Priority Chip Component
 * @description Displays case priority with appropriate styling
 * @module @brix-sdk/enterprise-case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This is a pure presentational component following v3.0.4 View layer guidelines.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import React from 'react';
import type { CasePriority } from '@brix-sdk/enterprise-case-shared';
import { CASE_PRIORITY_CONFIG } from '@brix-sdk/enterprise-case-shared';

// ============================================================================
// Component Props
// ============================================================================

export interface CasePriorityChipProps {
  /** Case priority value */
  priority: CasePriority;
  /** Size variant */
  size?: 'small' | 'medium';
  /** Additional CSS class */
  className?: string;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Case Priority Chip Component
 *
 * Renders a colored badge indicating the case priority.
 *
 * @example
 * ```tsx
 * <CasePriorityChip priority="HIGH" />
 * ```
 */
export const CasePriorityChip: React.FC<CasePriorityChipProps> = ({
  priority,
  size = 'medium',
  className = '',
}) => {
  const config = CASE_PRIORITY_CONFIG[priority] || {
    label: priority,
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
    borderRadius: '4px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  small: {
    padding: '2px 6px',
    fontSize: '11px',
  },
  medium: {
    padding: '3px 8px',
    fontSize: '12px',
  },
  icon: {
    fontSize: '10px',
  },
};

export default CasePriorityChip;
