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
 * @file Case Nodes Hook
 * @description ViewModel layer for case node operations
 * @module @brix-sdk/enterprise-case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 blueprint MVVM architecture.
 * This hook manages case node status and transitions.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useHttp } from '@brix-sdk/runtime-sdk-react';
import type { 
  CaseNodeDTO,
  CaseNodeStatus,
  UpdateNodeStatusRequest,
} from '@brix-sdk/enterprise-case-shared';
import { createCaseNodeRepository } from '../repositories';

// ============================================================================
// Hook Result Types
// ============================================================================

/**
 * Case Nodes Hook Result Type
 */
export interface UseCaseNodesResult {
  /** Nodes for the current case */
  nodes: CaseNodeDTO[];
  /** Whether nodes are loading */
  isLoadingNodes: boolean;
  /** Reload nodes from server */
  refreshNodes: () => Promise<void>;
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
export function useCaseNodes(caseId?: string | number): UseCaseNodesResult {
  const http = useHttp();

  // State
  const [nodes, setNodes] = useState<CaseNodeDTO[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);
  const [operatingNodeId, setOperatingNodeId] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Create Repository instance
  const repository = useMemo(
    () => createCaseNodeRepository(http),
    [http]
  );

  /**
   * Load / refresh nodes for the given case
   */
  const refreshNodes = useCallback(async () => {
    if (!caseId) return;
    try {
      setIsLoadingNodes(true);
      const result = await repository.listByCaseId(Number(caseId));
      setNodes(result);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
    } finally {
      setIsLoadingNodes(false);
    }
  }, [caseId, repository]);

  // Auto-fetch nodes when caseId changes
  useEffect(() => {
    if (caseId) {
      refreshNodes();
    }
  }, [caseId, refreshNodes]);

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
      status: 'ACTIVE' as CaseNodeStatus,
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
      status: 'DONE' as CaseNodeStatus,
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
    nodes,
    isLoadingNodes,
    refreshNodes,
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
