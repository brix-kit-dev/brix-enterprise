/**
 * @file Node Stepper Component
 * @description Displays case workflow nodes as a vertical stepper
 * @module @shinwa/case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This is a pure presentational component following v3.0.4 View layer guidelines.
 * It renders workflow nodes with status indicators and action buttons.
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import React from 'react';
import type { CaseNodeDTO, CaseNodeStatus } from '@shinwa/case-shared';
import { CASE_NODE_STATUS_CONFIG } from '@shinwa/case-shared';

// ============================================================================
// Component Props
// ============================================================================

export interface NodeStepperProps {
  /** Array of case nodes */
  nodes: CaseNodeDTO[];
  /** Currently active/focused node ID */
  activeNodeId?: number;
  /** Whether node actions are enabled */
  editable?: boolean;
  /** Handler for node click */
  onNodeClick?: (node: CaseNodeDTO) => void;
  /** Handler for marking node as in progress */
  onMarkInProgress?: (node: CaseNodeDTO) => void;
  /** Handler for marking node as completed */
  onMarkCompleted?: (node: CaseNodeDTO) => void;
  /** Handler for skipping a node */
  onSkip?: (node: CaseNodeDTO) => void;
  /** Currently operating node ID (for loading state) */
  operatingNodeId?: number | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get node status config
 */
function getStatusConfig(status: CaseNodeStatus) {
  return CASE_NODE_STATUS_CONFIG[status] || {
    label: status,
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: '●',
  };
}

/**
 * Format date for display
 */
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Node Stepper Component
 *
 * Renders a vertical stepper showing case workflow progress.
 *
 * @example
 * ```tsx
 * <NodeStepper
 *   nodes={caseData.nodes}
 *   activeNodeId={activeNode?.id}
 *   editable={true}
 *   onMarkCompleted={handleComplete}
 * />
 * ```
 */
export const NodeStepper: React.FC<NodeStepperProps> = ({
  nodes,
  activeNodeId,
  editable = false,
  onNodeClick,
  onMarkInProgress,
  onMarkCompleted,
  onSkip,
  operatingNodeId,
}) => {
  // Sort nodes by sequence order
  const sortedNodes = [...nodes].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  return (
    <div style={styles.container}>
      {sortedNodes.map((node, index) => {
        const statusConfig = getStatusConfig(node.status);
        const isActive = node.id === activeNodeId;
        const isOperating = node.id === operatingNodeId;
        const isLast = index === sortedNodes.length - 1;
        const canStart = node.status === 'PENDING' && editable;
        const canComplete = node.status === 'IN_PROGRESS' && editable;
        const canSkip = (node.status === 'PENDING' || node.status === 'IN_PROGRESS') && editable;

        return (
          <div
            key={node.id}
            style={{
              ...styles.nodeContainer,
              ...(isActive ? styles.nodeActive : {}),
            }}
            onClick={() => onNodeClick?.(node)}
          >
            {/* Timeline connector */}
            <div style={styles.timeline}>
              {/* Status indicator */}
              <div
                style={{
                  ...styles.indicator,
                  backgroundColor: statusConfig.bgColor,
                  borderColor: statusConfig.color,
                }}
              >
                {isOperating ? (
                  <span style={styles.loadingIndicator}>⏳</span>
                ) : (
                  <span style={{ color: statusConfig.color }}>{statusConfig.icon}</span>
                )}
              </div>
              
              {/* Connector line */}
              {!isLast && (
                <div
                  style={{
                    ...styles.connector,
                    backgroundColor: node.status === 'COMPLETED' ? '#10B981' : '#E5E7EB',
                  }}
                />
              )}
            </div>

            {/* Node content */}
            <div style={styles.content}>
              <div style={styles.header}>
                <div style={styles.headerLeft}>
                  <span style={styles.nodeName}>{node.nodeName}</span>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: statusConfig.bgColor,
                      color: statusConfig.color,
                    }}
                  >
                    {statusConfig.label}
                  </span>
                </div>
                {node.completedAt && (
                  <span style={styles.completedTime}>
                    {formatDate(node.completedAt)}
                  </span>
                )}
              </div>

              {/* Node description */}
              {node.description && (
                <p style={styles.description}>{node.description}</p>
              )}

              {/* Node notes */}
              {node.notes && (
                <div style={styles.notes}>
                  <span style={styles.notesLabel}>备注:</span>
                  <span style={styles.notesText}>{node.notes}</span>
                </div>
              )}

              {/* Action buttons */}
              {editable && (canStart || canComplete || canSkip) && (
                <div style={styles.actions}>
                  {canStart && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkInProgress?.(node);
                      }}
                      disabled={isOperating}
                      style={styles.actionButton}
                    >
                      ▶️ 开始处理
                    </button>
                  )}
                  {canComplete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkCompleted?.(node);
                      }}
                      disabled={isOperating}
                      style={{
                        ...styles.actionButton,
                        ...styles.completeButton,
                      }}
                    >
                      ✓ 标记完成
                    </button>
                  )}
                  {canSkip && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSkip?.(node);
                      }}
                      disabled={isOperating}
                      style={{
                        ...styles.actionButton,
                        ...styles.skipButton,
                      }}
                    >
                      ⏭️ 跳过
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {nodes.length === 0 && (
        <div style={styles.empty}>
          暂无流程节点
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  nodeContainer: {
    display: 'flex',
    gap: '16px',
    padding: '12px',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
  },
  nodeActive: {
    backgroundColor: '#EFF6FF',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '32px',
    flexShrink: 0,
  },
  indicator: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    flexShrink: 0,
    zIndex: 1,
  },
  loadingIndicator: {
    animation: 'spin 1s linear infinite',
  },
  connector: {
    width: '2px',
    flex: 1,
    marginTop: '-2px',
    marginBottom: '-12px',
  },
  content: {
    flex: 1,
    paddingBottom: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  nodeName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111827',
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 500,
  },
  completedTime: {
    fontSize: '12px',
    color: '#6B7280',
  },
  description: {
    margin: '4px 0 8px 0',
    fontSize: '13px',
    color: '#6B7280',
    lineHeight: 1.5,
  },
  notes: {
    display: 'flex',
    gap: '4px',
    fontSize: '12px',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    padding: '6px 10px',
    borderRadius: '4px',
    marginBottom: '8px',
  },
  notesLabel: {
    fontWeight: 500,
  },
  notesText: {
    flex: 1,
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  actionButton: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 500,
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  completeButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
    color: '#FFFFFF',
  },
  skipButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    color: '#6B7280',
  },
  empty: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#6B7280',
    fontSize: '14px',
  },
};

export default NodeStepper;
