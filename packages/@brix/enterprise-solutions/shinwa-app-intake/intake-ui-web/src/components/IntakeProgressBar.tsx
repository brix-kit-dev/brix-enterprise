/**
 * @file Intake Progress Bar Component
 * @description Displays the completion progress of an intake task
 * @module @shinwa/intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Presentational component for visualizing intake task progress.
 * Shows completed vs total items with percentage.
 *
 * @author Shinwa Team
 * @date 2026-06-10
 */

import React from 'react';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for IntakeProgressBar component
 */
export interface IntakeProgressBarProps {
  /** Number of completed items */
  completed: number;
  /** Total number of items */
  total: number;
  /** Whether to show percentage text */
  showPercentage?: boolean;
  /** Whether to show item count text */
  showCount?: boolean;
  /** Height of the progress bar */
  height?: number;
  /** Additional CSS class */
  className?: string;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Intake Progress Bar Component
 *
 * Visualizes the completion progress of an intake task.
 *
 * @example
 * ```tsx
 * <IntakeProgressBar completed={3} total={5} />
 * <IntakeProgressBar completed={3} total={5} showPercentage />
 * <IntakeProgressBar completed={3} total={5} showCount height={8} />
 * ```
 */
export const IntakeProgressBar: React.FC<IntakeProgressBarProps> = ({
  completed,
  total,
  showPercentage = true,
  showCount = false,
  height = 6,
  className = '',
}) => {
  // Calculate percentage
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Determine color based on progress
  const getProgressColor = (): string => {
    if (percentage === 100) return '#4caf50'; // Green - complete
    if (percentage >= 50) return '#2196f3'; // Blue - good progress
    if (percentage > 0) return '#ff9800'; // Orange - started
    return '#e0e0e0'; // Gray - not started
  };

  return (
    <div className={`intake-progress-bar ${className}`}>
      {/* Text labels */}
      {(showPercentage || showCount) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
            fontSize: '0.75rem',
            color: '#666',
          }}
        >
          {showPercentage && <span>{percentage}%</span>}
          {showCount && (
            <span>
              {completed} / {total}
            </span>
          )}
        </div>
      )}

      {/* Progress bar container */}
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: '#e0e0e0',
          borderRadius: `${height / 2}px`,
          overflow: 'hidden',
        }}
      >
        {/* Progress fill */}
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: getProgressColor(),
            borderRadius: `${height / 2}px`,
            transition: 'width 0.3s ease-in-out, background-color 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};

export default IntakeProgressBar;
