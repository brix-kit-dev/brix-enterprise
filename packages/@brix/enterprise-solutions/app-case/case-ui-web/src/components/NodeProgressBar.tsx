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
 * @file Node Progress Bar Component
 * @description Visual workflow progress indicator for case nodes.
 *              Migrated to use UIAdapter components per v3.0.8 Blueprint Constraint 9.
 * @module @brix-sdk/enterprise-case-ui-web/components
 * @version 3.2.1
 *
 * Design Notes:
 * This component provides a horizontal stepper visualization of case workflow nodes.
 * It follows the v3.0.9 blueprint View layer architecture - pure presentational
 * component with no business logic or data fetching.
 *
 * Features:
 * - Horizontal node sequence display
 * - Status-based color coding (PENDING, ACTIVE, DONE, SKIPPED, FAILED)
 * - Compact mode for list views
 * - Full mode with labels for detail views
 * - Progress percentage indicator
 *
 * Architecture Compliance (v3.0.9 + Phase 6 Design Token Migration):
 * - View layer component using UIAdapter components via useUI() hook
 * - Platform-level visual styling via useTheme().tokens (Brix DesignTokens)
 * - Business-domain node status colors retained in caseTheme.ts constants
 * - Receives all data via props
 * - No direct HTTP calls
 * - No direct UI library imports - all UI components obtained through useUI()
 *
 * BrixUI Migration (Phase 4):
 * - Removed direct UI library imports
 * - Components obtained via useUI(): Box, Tooltip, Typography, Icon
 * - sx props converted to standard CSS style props
 * - Framework icons replaced with UIAdapter Icon component
 *
 * @author Brix Platform Team
 * @date 2026-03-18
 */

import React from 'react';
import { useUI, useTheme } from '@brix-sdk/runtime-sdk-react';
import type { CaseNodeDTO, CaseNodeStatus } from '@brix-sdk/enterprise-case-shared';
import { NODE_STATUS_COLORS } from '../theme/caseTheme';

// ============================================================================
// Types
// ============================================================================

/**
 * Node Progress Bar Props
 *
 * Properties for configuring the node progress visualization.
 */
export interface NodeProgressBarProps {
  /** Array of case nodes to display */
  nodes: CaseNodeDTO[];
  /** Compact mode for list views - shows only dots without labels */
  compact?: boolean;
  /** Maximum width constraint */
  maxWidth?: number | string;
}

/**
 * Node Item for internal rendering
 */
interface NodeItem {
  id: number;
  code: string;
  name: string;
  status: CaseNodeStatus;
  sequence: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Icon Name Mapping for Node Status
 *
 * Maps CaseNodeStatus to UIAdapter icon names.
 * These names are resolved by the MuiIcon component to actual MUI icons.
 */
const STATUS_ICON_NAMES: Record<CaseNodeStatus, string> = {
  DONE: 'check_circle',
  ACTIVE: 'play_circle',
  SKIPPED: 'skip_next',
  FAILED: 'error',
  PENDING: 'radio_button_unchecked',
};

/**
 * Calculate progress percentage from nodes
 *
 * @param nodes - Array of case nodes
 * @returns Progress percentage (0-100)
 */
function calculateProgress(nodes: NodeItem[]): number {
  if (nodes.length === 0) return 0;
  const completed = nodes.filter(n => n.status === 'DONE').length;
  return Math.round((completed / nodes.length) * 100);
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Node Progress Bar Component
 *
 * Displays a visual representation of workflow progress through case nodes.
 * Supports both compact (list view) and full (detail view) display modes.
 *
 * Uses UIAdapter components obtained via useUI() hook per v3.0.8 Blueprint.
 * All styling uses standard CSS properties via style prop instead of MUI sx.
 *
 * @param props - Component properties
 * @returns React element
 *
 * @example
 * ```tsx
 * // Compact mode for list views
 * <NodeProgressBar nodes={caseNodes} compact />
 *
 * // Full mode with labels for detail views
 * <NodeProgressBar nodes={caseNodes} />
 * ```
 */
export const NodeProgressBar: React.FC<NodeProgressBarProps> = ({
  nodes,
  compact = false,
  maxWidth,
}) => {
  // Obtain UI components from UIAdapter via runtime context
  // This ensures plugin does not directly depend on MUI
  const { Box, Tooltip, Typography, Icon } = useUI();

  // Brix semantic design tokens — platform-level visual styling (Phase 6 migration)
  const { tokens } = useTheme();

  // Transform nodes to internal items
  const items: NodeItem[] = nodes
    .map(node => ({
      id: node.id,
      code: node.nodeCode,
      name: node.nodeName,
      status: node.status,
      sequence: node.sequence,
    }))
    .sort((a, b) => a.sequence - b.sequence);

  const progress = calculateProgress(items);
  const currentNode = items.find(n => n.status === 'ACTIVE');
  const completedCount = items.filter(n => n.status === 'DONE').length;

  // =========================================================================
  // Compact Mode Rendering
  // =========================================================================

  if (compact) {
    return (
      <Box style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth }}>
        {/* Progress dots */}
        <Box style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {items.map((item) => {
            const colors = NODE_STATUS_COLORS[item.status];
            return (
              <Tooltip key={item.id} title={`${item.name} - ${item.status}`}>
                <Box
                  style={{
                    width: item.status === 'ACTIVE' ? 10 : 8,
                    height: item.status === 'ACTIVE' ? 10 : 8,
                    borderRadius: '50%',
                    backgroundColor: colors.icon,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>

        {/* Progress text */}
        <Typography variant="caption" style={{ color: tokens.colors.text.secondary, whiteSpace: 'nowrap' }}>
          {completedCount}/{items.length}
        </Typography>

        {/* Current node indicator */}
        {currentNode && (
          <Typography
            variant="caption"
            style={{
              color: NODE_STATUS_COLORS.ACTIVE.text,
              backgroundColor: NODE_STATUS_COLORS.ACTIVE.background,
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 2,
              paddingBottom: 2,
              borderRadius: 4,
              fontSize: '0.65rem',
              whiteSpace: 'nowrap',
              maxWidth: 100,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {currentNode.name}
          </Typography>
        )}
      </Box>
    );
  }

  // =========================================================================
  // Full Mode Rendering
  // =========================================================================

  return (
    <Box style={{ width: '100%', maxWidth }}>
      {/* Progress summary */}
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography variant="body2" style={{ fontWeight: 500, color: tokens.colors.text.primary }}>
          Workflow Progress
        </Typography>
        <Typography variant="caption" style={{ color: tokens.colors.text.secondary }}>
          {completedCount} of {items.length} completed ({progress}%)
        </Typography>
      </Box>

      {/* Node stepper - horizontal workflow visualization */}
      <Box
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 0,
          overflowX: 'auto',
          paddingBottom: 8,
        }}
      >
        {items.map((item, index) => {
          const colors = NODE_STATUS_COLORS[item.status];
          const isLast = index === items.length - 1;

          return (
            <Box key={item.id} style={{ display: 'flex', alignItems: 'flex-start', flex: isLast ? '0 0 auto' : 1 }}>
              {/* Node circle and label */}
              <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
                <Tooltip title={`Status: ${item.status}`}>
                  <Box
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: colors.background,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${colors.icon}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon
                      name={STATUS_ICON_NAMES[item.status]}
                      size={20}
                      color={colors.icon}
                      style={item.status === 'ACTIVE' ? { animation: 'pulse 2s infinite' } : undefined}
                    />
                  </Box>
                </Tooltip>
                <Typography
                  variant="caption"
                  style={{
                    marginTop: 8,
                    color: colors.text,
                    fontWeight: item.status === 'ACTIVE' ? 600 : 400,
                    textAlign: 'center',
                    maxWidth: 70,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.name}
                </Typography>
              </Box>

              {/* Connector line between nodes */}
              {!isLast && (
                <Box
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor: item.status === 'DONE' ? NODE_STATUS_COLORS.DONE.icon : tokens.colors.border.default,
                    marginTop: 16,
                    marginLeft: 4,
                    marginRight: 4,
                    minWidth: 20,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>

      {/* Progress bar - visual completion indicator */}
      <Box
        style={{
          marginTop: 16,
          height: 4,
          borderRadius: 2,
          backgroundColor: tokens.colors.border.default,
          overflow: 'hidden',
        }}
      >
        <Box
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: tokens.colors.status.success,
            borderRadius: 2,
            transition: `width ${tokens.motion.durationStandard} ${tokens.motion.easing}`,
          }}
        />
      </Box>
    </Box>
  );
};

export default NodeProgressBar;
