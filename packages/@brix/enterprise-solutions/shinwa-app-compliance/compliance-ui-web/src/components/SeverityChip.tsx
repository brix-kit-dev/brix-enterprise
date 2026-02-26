/**
 * SeverityChip Component
 * Displays a colored badge/chip indicating the forbidden word severity level.
 * Following v3.0.4 Runtime Shell Architecture Blueprint.
 * @module compliance-ui-web/components/SeverityChip
 */

import React, { memo, useMemo } from 'react';
import { ForbiddenWordSeverity, SEVERITY_CONFIG } from '@shinwa/compliance-shared';

/**
 * Props interface for SeverityChip component.
 */
export interface SeverityChipProps {
  /** The severity level to display */
  severity: ForbiddenWordSeverity;
  /** Optional size variant */
  size?: 'small' | 'medium' | 'large';
  /** Optional additional CSS class names */
  className?: string;
  /** Whether to show the severity icon */
  showIcon?: boolean;
  /** Whether to show severity level indicator (dots) */
  showLevel?: boolean;
}

/**
 * Mapping of severity levels to icon elements.
 */
const SEVERITY_ICONS: Record<ForbiddenWordSeverity, React.ReactNode> = {
  [ForbiddenWordSeverity.LOW]: (
    <svg className="severity-icon" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
  [ForbiddenWordSeverity.MEDIUM]: (
    <svg className="severity-icon" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  [ForbiddenWordSeverity.HIGH]: (
    <svg className="severity-icon" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  [ForbiddenWordSeverity.CRITICAL]: (
    <svg className="severity-icon" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 008.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
    </svg>
  ),
};

/**
 * Mapping of severity levels to dot count for visual indicator.
 */
const SEVERITY_LEVEL_DOTS: Record<ForbiddenWordSeverity, number> = {
  [ForbiddenWordSeverity.LOW]: 1,
  [ForbiddenWordSeverity.MEDIUM]: 2,
  [ForbiddenWordSeverity.HIGH]: 3,
  [ForbiddenWordSeverity.CRITICAL]: 4,
};

/**
 * Component that displays the forbidden word severity as a styled chip/badge.
 * Uses configuration from compliance-shared for consistent severity display.
 * Supports different sizes, optional icons, and level indicators.
 * @param props - Component props including severity, size, and display options
 * @returns Styled severity chip element
 * @example
 * ```tsx
 * <SeverityChip
 *   severity={ForbiddenWordSeverity.HIGH}
 *   size="medium"
 *   showIcon={true}
 *   showLevel={true}
 * />
 * ```
 */
export const SeverityChip: React.FC<SeverityChipProps> = memo(({
  severity,
  size = 'medium',
  className = '',
  showIcon = true,
  showLevel = false,
}) => {
  const config = useMemo(() => SEVERITY_CONFIG[severity], [severity]);
  const dotCount = SEVERITY_LEVEL_DOTS[severity];

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

  const dotStyle: React.CSSProperties = {
    width: size === 'small' ? '4px' : size === 'large' ? '8px' : '6px',
    height: size === 'small' ? '4px' : size === 'large' ? '8px' : '6px',
    borderRadius: '50%',
    backgroundColor: config.color,
  };

  const dotContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    marginLeft: '4px',
  };

  return (
    <span
      className={`severity-chip severity-chip--${size} ${className}`}
      style={chipStyle}
      data-severity={severity}
      role="status"
      aria-label={`Severity: ${config.label}`}
    >
      {showIcon && (
        <span style={iconStyle} className="severity-chip__icon">
          {SEVERITY_ICONS[severity]}
        </span>
      )}
      <span className="severity-chip__label">{config.label}</span>
      {showLevel && (
        <span style={dotContainerStyle} className="severity-chip__level">
          {Array.from({ length: dotCount }).map((_, index) => (
            <span key={index} style={dotStyle} className="severity-chip__dot" />
          ))}
        </span>
      )}
    </span>
  );
});

SeverityChip.displayName = 'SeverityChip';

export default SeverityChip;
