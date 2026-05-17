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
 * @file Template Status Chip Component
 * @description Displays template status with appropriate color and icon
 * @module @brix-sdk/enterprise-contracts-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Pure presentational component following v3.0.4 View layer guidelines.
 * Receives data as props and renders the status badge.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import React from 'react';
import type { TemplateStatus } from '@brix-sdk/enterprise-contracts-shared';
import { TEMPLATE_STATUS_CONFIG } from '@brix-sdk/enterprise-contracts-shared';

// ============================================================================
// Component Props
// ============================================================================

export interface TemplateStatusChipProps {
  /** Template status value */
  status: TemplateStatus;
  /** Chip size variant */
  size?: 'small' | 'medium' | 'large';
  /** Show icon */
  showIcon?: boolean;
}

// ============================================================================
// Styles
// ============================================================================

const getStyles = (size: 'small' | 'medium' | 'large', config: { color: string; bgColor: string }) => ({
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: size === 'small' ? '2px' : '4px',
    padding: size === 'small' ? '2px 6px' : size === 'medium' ? '4px 10px' : '6px 14px',
    borderRadius: '12px',
    fontSize: size === 'small' ? '11px' : size === 'medium' ? '12px' : '14px',
    fontWeight: 500,
    color: config.color,
    backgroundColor: config.bgColor,
    whiteSpace: 'nowrap' as const,
  },
  icon: {
    fontSize: size === 'small' ? '10px' : size === 'medium' ? '12px' : '14px',
  },
});

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Template Status Chip Component
 *
 * Renders a colored badge indicating the template status.
 *
 * @example
 * ```tsx
 * <TemplateStatusChip status="ACTIVE" size="medium" />
 * ```
 */
export const TemplateStatusChip: React.FC<TemplateStatusChipProps> = ({
  status,
  size = 'medium',
  showIcon = true,
}) => {
  const config = TEMPLATE_STATUS_CONFIG[status] || {
    label: status,
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: '📄',
  };

  const styles = getStyles(size, config);

  return (
    <span style={styles.chip}>
      {showIcon && <span style={styles.icon}>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
};

export default TemplateStatusChip;
