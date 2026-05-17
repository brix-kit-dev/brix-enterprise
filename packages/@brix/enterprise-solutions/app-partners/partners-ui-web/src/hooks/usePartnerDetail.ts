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
 * @file Partner Detail ViewModel Hook
 * @description Manages state and business logic for partner detail page
 * @module partners-ui-web/hooks/usePartnerDetail
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook is a ViewModel layer implementation, responsible for:
 * 1. Loading and managing partner detail data
 * 2. Handling partner information updates
 * 3. Providing status management operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp, useEventBus, useAuth } from '@brix-sdk/runtime-sdk-react';
import { createPartnerRepository, type PartnerRepository } from '../repositories';
import type { PartnerDTO, UpdatePartnerRequest } from '../types';

// ============================================================================
// Constants
// ============================================================================

/**
 * Partner event names
 */
const PARTNER_EVENTS = {
  UPDATED: 'partners:partner:updated',
  DELETED: 'partners:partner:deleted',
  STATUS_CHANGED: 'partners:partner:status_changed',
};

/**
 * Partner permissions
 */
const PARTNER_PERMISSIONS = {
  WRITE: 'partners:partner:write',
  DELETE: 'partners:partner:delete',
  MANAGE_STATUS: 'partners:partner:manage_status',
};

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Partner detail state
 */
export interface PartnerDetailState {
  /** Partner data */
  partner: PartnerDTO | null;
  /** Whether loading */
  loading: boolean;
  /** Whether submitting */
  submitting: boolean;
  /** Error message */
  error: string | null;
  /** Permission status */
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canManageStatus: boolean;
  };
}

/**
 * Partner detail action methods
 */
export interface PartnerDetailActions {
  /** Refresh data */
  refresh: () => Promise<void>;
  /** Update partner */
  updatePartner: (data: UpdatePartnerRequest) => Promise<boolean>;
  /** Delete partner */
  deletePartner: () => Promise<boolean>;
  /** Activate partner */
  activatePartner: () => Promise<boolean>;
  /** Suspend partner */
  suspendPartner: (reason?: string) => Promise<boolean>;
  /** Resume partner */
  resumePartner: () => Promise<boolean>;
  /** Terminate partner */
  terminatePartner: (reason?: string) => Promise<boolean>;
}

/**
 * usePartnerDetail Hook return type
 */
export type UsePartnerDetailResult = PartnerDetailState & PartnerDetailActions;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Partner Detail ViewModel Hook
 * 
 * Functionality:
 * - Load partner details by ID
 * - Provide partner information update
 * - Provide status management features (activate/suspend/resume/terminate)
 * 
 * @param partnerId - Partner ID
 * @returns Partner detail state and action methods
 */
export function usePartnerDetail(partnerId: number): UsePartnerDetailResult {
  // ========================================================================
  // Dependency Injection
  // ========================================================================
  
  const http = useHttp();
  const eventBus = useEventBus();
  const auth = useAuth();
  
  // Repository instance
  const repository = useMemo<PartnerRepository | null>(
    () => http ? createPartnerRepository(http) : null,
    [http]
  );
  
  // ========================================================================
  // State Definitions
  // ========================================================================
  
  const [partner, setPartner] = useState<PartnerDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Permission check
  const permissions = useMemo(() => ({
    canEdit: auth.hasPermission(PARTNER_PERMISSIONS.WRITE),
    canDelete: auth.hasPermission(PARTNER_PERMISSIONS.DELETE),
    canManageStatus: auth.hasPermission(PARTNER_PERMISSIONS.MANAGE_STATUS),
  }), [auth]);
  
  // ========================================================================
  // Data Loading
  // ========================================================================
  
  /**
   * Load partner details
   */
  const fetchData = useCallback(async (): Promise<void> => {
    if (!repository || !partnerId) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await repository.getById(partnerId);
      setPartner(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load partner details';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [repository, partnerId]);
  
  // ========================================================================
  // Initial Load
  // ========================================================================
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // ========================================================================
  // Action Methods
  // ========================================================================
  
  /** Refresh data */
  const refresh = useCallback(async (): Promise<void> => {
    await fetchData();
  }, [fetchData]);
  
  /** Update partner */
  const updatePartner = useCallback(async (data: UpdatePartnerRequest): Promise<boolean> => {
    if (!repository || !partnerId) {
      setError('[usePartnerDetail] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const updated = await repository.update(partnerId, data);
      setPartner(updated);
      eventBus?.emit(PARTNER_EVENTS.UPDATED, { id: partnerId, partner: updated });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update partner';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, partnerId, eventBus]);
  
  /** Delete partner */
  const deletePartner = useCallback(async (): Promise<boolean> => {
    if (!repository || !partnerId) {
      setError('[usePartnerDetail] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      await repository.delete(partnerId);
      eventBus?.emit(PARTNER_EVENTS.DELETED, { id: partnerId });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete partner';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, partnerId, eventBus]);
  
  /** Activate partner */
  const activatePartner = useCallback(async (): Promise<boolean> => {
    if (!repository || !partnerId) {
      setError('[usePartnerDetail] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const updated = await repository.activate(partnerId);
      setPartner(updated);
      eventBus?.emit(PARTNER_EVENTS.STATUS_CHANGED, { id: partnerId, status: 'ACTIVE' });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate partner';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, partnerId, eventBus]);
  
  /** Suspend partner */
  const suspendPartner = useCallback(async (reason?: string): Promise<boolean> => {
    if (!repository || !partnerId) {
      setError('[usePartnerDetail] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const updated = await repository.suspend(partnerId, reason);
      setPartner(updated);
      eventBus?.emit(PARTNER_EVENTS.STATUS_CHANGED, { id: partnerId, status: 'SUSPENDED', reason });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to suspend partner';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, partnerId, eventBus]);
  
  /** Resume partner */
  const resumePartner = useCallback(async (): Promise<boolean> => {
    if (!repository || !partnerId) {
      setError('[usePartnerDetail] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const updated = await repository.resume(partnerId);
      setPartner(updated);
      eventBus?.emit(PARTNER_EVENTS.STATUS_CHANGED, { id: partnerId, status: 'ACTIVE' });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resume partner';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, partnerId, eventBus]);
  
  /** Terminate partner */
  const terminatePartner = useCallback(async (reason?: string): Promise<boolean> => {
    if (!repository || !partnerId) {
      setError('[usePartnerDetail] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const updated = await repository.terminate(partnerId, reason);
      setPartner(updated);
      eventBus?.emit(PARTNER_EVENTS.STATUS_CHANGED, { id: partnerId, status: 'TERMINATED', reason });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to terminate partner';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, partnerId, eventBus]);
  
  // ========================================================================
  // Return Result
  // ========================================================================
  
  return {
    // 状态
    partner,
    loading,
    submitting,
    error,
    permissions,
    
    // 操作
    refresh,
    updatePartner,
    deletePartner,
    activatePartner,
    suspendPartner,
    resumePartner,
    terminatePartner,
  };
}
