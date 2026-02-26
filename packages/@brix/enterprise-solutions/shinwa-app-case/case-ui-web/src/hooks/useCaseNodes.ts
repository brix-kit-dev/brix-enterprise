/**
 * @file Case Nodes Hook
 * @description ViewModel layer for case node operations
 * @module @shinwa/case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 blueprint MVVM architecture.
 * This hook manages case node status and transitions.
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import { useState, useCallback, useMemo } from 'react';
import { useHttp } from '@brix/runtime-sdk-react';
import type { 
  CaseNodeDTO,
  CaseNodeStatus,
  UpdateNodeStatusRequest,
} from '@shinwa/case-shared';
import { createCaseNodeRepository } from '../repositories';

// ============================================================================
// Hook Result Types
// ============================================================================

/**
 * Case Nodes Hook Result Type
 */
export interface UseCaseNodesResult {
  /** Current operating node */
  operatingNodeId: number | null;
  /** Operation error */
  error: Error | null;
  /** Update node status */
  updateStatus: (caseId: number, nodeId: number, request: UpdateNodeStatusRequest) => Promise<CaseNodeDTO>;
  /** Mark node as in progress */
  markInProgress: (caseId: number, nodeId: number) => Promise<CaseNodeDTO>;
  /** Mark node as completed */
  markCompleted: (caseId: number, nodeId: number, notes?: string) => Promise<CaseNodeDTO>;
  /** Skip a node */
  skipNode: (caseId: number, nodeId: number, reason: string) => Promise<CaseNodeDTO>;
  /** Reset error state */
  resetError: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Case Nodes Hook
 *
 * Encapsulates node status update logic.
 *
 * @returns Node operation state and methods
 *
 * @example
 * ```tsx
 * const { updateStatus, markCompleted, operatingNodeId, error } = useCaseNodes();
 * 
 * const handleComplete = async () => {
 *   await markCompleted(caseId, nodeId, 'Customer confirmed');
 * };
 * ```
 */
export function useCaseNodes(): UseCaseNodesResult {
  const http = useHttp();

  // State
  const [operatingNodeId, setOperatingNodeId] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Create Repository instance
  const repository = useMemo(
    () => createCaseNodeRepository(http),
    [http]
  );

  /**
   * Update node status with request object
   */
  const updateStatus = useCallback(async (
    caseId: number,
    nodeId: number,
    request: UpdateNodeStatusRequest
  ): Promise<CaseNodeDTO> => {
    try {
      setOperatingNodeId(nodeId);
      setError(null);

      const updated = await repository.updateStatus(caseId, nodeId, request);
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setOperatingNodeId(null);
    }
  }, [repository]);

  /**
   * Mark node as in progress
   */
  const markInProgress = useCallback(async (
    caseId: number,
    nodeId: number
  ): Promise<CaseNodeDTO> => {
    return updateStatus(caseId, nodeId, {
      status: 'IN_PROGRESS' as CaseNodeStatus,
    });
  }, [updateStatus]);

  /**
   * Mark node as completed
   */
  const markCompleted = useCallback(async (
    caseId: number,
    nodeId: number,
    notes?: string
  ): Promise<CaseNodeDTO> => {
    return updateStatus(caseId, nodeId, {
      status: 'COMPLETED' as CaseNodeStatus,
      notes,
      completedAt: new Date().toISOString(),
    });
  }, [updateStatus]);

  /**
   * Skip a node with reason
   */
  const skipNode = useCallback(async (
    caseId: number,
    nodeId: number,
    reason: string
  ): Promise<CaseNodeDTO> => {
    return updateStatus(caseId, nodeId, {
      status: 'SKIPPED' as CaseNodeStatus,
      notes: reason,
    });
  }, [updateStatus]);

  /**
   * Reset error state
   */
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    operatingNodeId,
    error,
    updateStatus,
    markInProgress,
    markCompleted,
    skipNode,
    resetError,
  };
}

export default useCaseNodes;
