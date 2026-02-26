/**
 * @file Intake Status Badge Component
 * @description Displays the status of an intake task with appropriate styling
 * @module @shinwa/intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Presentational component following v3.0.4 View layer principles:
 * - No business logic
 * - Receives all data via props
 * - Uses MUI Chip for consistent styling
 *
 * @author Shinwa Team
 * @date 2026-06-10
 */

import React from 'react';
import type { IntakeTaskStatus } from '@shinwa/intake-shared';
import {
  INTAKE_TASK_STATUS_LABELS,
  INTAKE_TASK_STATUS_LABELS_EN,
  INTAKE_TASK_STATUS_COLORS,
} from '@shinwa/intake-shared';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for IntakeStatusBadge component
 */
export interface IntakeStatusBadgeProps {
  /** The status to display */
  status: IntakeTaskStatus;
  /** Whether to use English labels */
  english?: boolean;
  /** Size variant */
  size?: 'small' | 'medium';
  /** Additional CSS class */
  className?: string;
}

// ============================================================================
// Color Mapping
// ============================================================================

/**
 * Maps status color names to CSS colors
 */
const colorMap: Record<string, { bg: string; text: string }> = {
  default: { bg: '#e0e0e0', text: '#616161' },
  primary: { bg: '#1976d2', text: '#ffffff' },
  warning: { bg: '#ff9800', text: '#ffffff' },
  success: { bg: '#4caf50', text: '#ffffff' },
  error: { bg: '#f44336', text: '#ffffff' },
  info: { bg: '#2196f3', text: '#ffffff' },
  secondary: { bg: '#9e9e9e', text: '#ffffff' },
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Intake Status Badge Component
 *
 * Displays the status of an intake task with appropriate color coding.
 *
 * @example
 * ```tsx
 * <IntakeStatusBadge status="ACTIVE" />
 * <IntakeStatusBadge status="COMPLETED" english />
 * <IntakeStatusBadge status="IN_REVIEW" size="small" />
 * ```
 */
export const IntakeStatusBadge: React.FC<IntakeStatusBadgeProps> = ({
  status,
  english = false,
  size = 'medium',
  className = '',
}) => {
  const label = english
    ? INTAKE_TASK_STATUS_LABELS_EN[status]
    : INTAKE_TASK_STATUS_LABELS[status];

  const colorName = INTAKE_TASK_STATUS_COLORS[status] || 'default';
  const colors = colorMap[colorName] || colorMap.default;

  const sizeStyles = size === 'small'
    ? { padding: '2px 8px', fontSize: '0.75rem' }
    : { padding: '4px 12px', fontSize: '0.875rem' };

  return (
    <span
      className={`intake-status-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '16px',
        backgroundColor: colors.bg,
        color: colors.text,
        fontWeight: 500,
        ...sizeStyles,
      }}
    >
      {label}
    </span>
  );
};

export default IntakeStatusBadge;
