/**
 * @file Partner List ViewModel Hook
 * @description Manages state and business logic for partner list page
 * @module partners-ui-web/hooks/usePartnerList
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook is the ViewModel layer implementation, responsible for:
 * 1. Managing partner list data state
 * 2. Handling filter conditions
 * 3. Providing partner operation functions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp, useEventBus, useAuth } from '@brix/runtime-sdk-react';
import { createPartnerRepository, type PartnerRepository } from '../repositories';
import type { PartnerDTO, PartnerType, PartnerStatus } from '../types';

// ============================================================================
// Constants Definition
// ============================================================================

/**
 * Partner Event Names
 */
const PARTNER_EVENTS = {
  CREATED: 'partners:partner:created',
  UPDATED: 'partners:partner:updated',
  DELETED: 'partners:partner:deleted',
  STATUS_CHANGED: 'partners:partner:status_changed',
};

/**
 * Partner Permissions
 */
const PARTNER_PERMISSIONS = {
  READ: 'partners:partner:read',
  WRITE: 'partners:partner:write',
  DELETE: 'partners:partner:delete',
  MANAGE_STATUS: 'partners:partner:manage_status',
};

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Partner List State
 */
export interface PartnerListState {
  /** Partner list */
  partners: PartnerDTO[];
  /** Is loading */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Type filter */
  typeFilter: PartnerType | null;
  /** Status filter */
  statusFilter: PartnerStatus | null;
  /** Permission state */
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManageStatus: boolean;
  };
}

/**
 * Partner List Action Methods
 */
export interface PartnerListActions {
  /** Refresh data */
  refresh: () => Promise<void>;
  /** Filter by type */
  filterByType: (type: PartnerType | null) => void;
  /** Filter by status */
  filterByStatus: (status: PartnerStatus | null) => void;
  /** Clear filters */
  clearFilters: () => void;
  /** Delete partner */
  deletePartner: (id: number) => Promise<boolean>;
  /** Activate partner */
  activatePartner: (id: number) => Promise<boolean>;
  /** Suspend partner */
  suspendPartner: (id: number, reason?: string) => Promise<boolean>;
  /** Resume partner */
  resumePartner: (id: number) => Promise<boolean>;
  /** Terminate partner */
  terminatePartner: (id: number, reason?: string) => Promise<boolean>;
}

/**
 * usePartnerList Hook Return Type
 */
export type UsePartnerListResult = PartnerListState & PartnerListActions;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Partner List ViewModel Hook
 * 
 * Functionality:
 * - Load and manage partner list data
 * - Support filtering by type and status
 * - Provide partner status management functions
 * - Subscribe to change events for auto-refresh
 * 
 * @returns Partner list state and action methods
 */
export function usePartnerList(): UsePartnerListResult {
  // ========================================================================
  // Dependencies
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
  // State Definition
  // ========================================================================
  
  const [partners, setPartners] = useState<PartnerDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<PartnerType | null>(null);
  const [statusFilter, setStatusFilter] = useState<PartnerStatus | null>(null);
  
  // Permission check
  const permissions = useMemo(() => ({
    canCreate: auth.hasPermission(PARTNER_PERMISSIONS.WRITE),
    canEdit: auth.hasPermission(PARTNER_PERMISSIONS.WRITE),
    canDelete: auth.hasPermission(PARTNER_PERMISSIONS.DELETE),
    canManageStatus: auth.hasPermission(PARTNER_PERMISSIONS.MANAGE_STATUS),
  }), [auth]);
  
  // ========================================================================
  // Data Loading
  // ========================================================================
  
  /**
   * Load partner list
   */
  const fetchData = useCallback(async (): Promise<void> => {
    if (!repository) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await repository.list({
        type: typeFilter ?? undefined,
        status: statusFilter ?? undefined,
      });
      
      setPartners(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load partner list';
      setError(message);
      console.error('[usePartnerList] Load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [repository, typeFilter, statusFilter]);
  
  // ========================================================================
  // Initial Load
  // ========================================================================
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // ========================================================================
  // Event Subscription - Auto-refresh
  // ========================================================================
  
  useEffect(() => {
    if (!eventBus) return;
    
    const unsubCreate = eventBus.on(PARTNER_EVENTS.CREATED, () => fetchData());
    const unsubUpdate = eventBus.on(PARTNER_EVENTS.UPDATED, () => fetchData());
    const unsubDelete = eventBus.on(PARTNER_EVENTS.DELETED, () => fetchData());
    const unsubStatus = eventBus.on(PARTNER_EVENTS.STATUS_CHANGED, () => fetchData());
    
    return () => {
      unsubCreate?.();
      unsubUpdate?.();
      unsubDelete?.();
      unsubStatus?.();
    };
  }, [eventBus, fetchData]);
  
  // ========================================================================
  // Action Methods
  // ========================================================================
  
  /** Refresh data */
  const refresh = useCallback(async (): Promise<void> => {
    await fetchData();
  }, [fetchData]);
  
  /** Filter by type */
  const filterByType = useCallback((type: PartnerType | null): void => {
    setTypeFilter(type);
  }, []);
  
  /** Filter by status */
  const filterByStatus = useCallback((status: PartnerStatus | null): void => {
    setStatusFilter(status);
  }, []);
  
  /** Clear filters */
  const clearFilters = useCallback((): void => {
    setTypeFilter(null);
    setStatusFilter(null);
  }, []);
  
  /** Delete partner */
  const deletePartner = useCallback(async (id: number): Promise<boolean> => {
    if (!repository) {
      setError('[usePartnerList] HttpCapability not initialized');
      return false;
    }
    
    try {
      await repository.delete(id);
      setPartners(prev => prev.filter(p => p.id !== id));
      eventBus?.emit(PARTNER_EVENTS.DELETED, { id });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete partner';
      setError(message);
      console.error('[usePartnerList] Delete failed:', err);
      return false;
    }
  }, [repository, eventBus]);
  
  /** Activate partner */
  const activatePartner = useCallback(async (id: number): Promise<boolean> => {
    if (!repository) {
      setError('[usePartnerList] HttpCapability not initialized');
      return false;
    }
    
    try {
      const updated = await repository.activate(id);
      setPartners(prev => prev.map(p => p.id === id ? updated : p));
      eventBus?.emit(PARTNER_EVENTS.STATUS_CHANGED, { id, status: 'ACTIVE' });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate partner';
      setError(message);
      console.error('[usePartnerList] Activate failed:', err);
      return false;
    }
  }, [repository, eventBus]);
  
  /** Suspend partner */
  const suspendPartner = useCallback(async (id: number, reason?: string): Promise<boolean> => {
    if (!repository) {
      setError('[usePartnerList] HttpCapability not initialized');
      return false;
    }
    
    try {
      const updated = await repository.suspend(id, reason);
      setPartners(prev => prev.map(p => p.id === id ? updated : p));
      eventBus?.emit(PARTNER_EVENTS.STATUS_CHANGED, { id, status: 'SUSPENDED', reason });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to suspend partner';
      setError(message);
      console.error('[usePartnerList] Suspend failed:', err);
      return false;
    }
  }, [repository, eventBus]);
  
  /** Resume partner */
  const resumePartner = useCallback(async (id: number): Promise<boolean> => {
    if (!repository) {
      setError('[usePartnerList] HttpCapability not initialized');
      return false;
    }
    
    try {
      const updated = await repository.resume(id);
      setPartners(prev => prev.map(p => p.id === id ? updated : p));
      eventBus?.emit(PARTNER_EVENTS.STATUS_CHANGED, { id, status: 'ACTIVE' });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resume partner';
      setError(message);
      console.error('[usePartnerList] Resume failed:', err);
      return false;
    }
  }, [repository, eventBus]);
  
  /** Terminate partner */
  const terminatePartner = useCallback(async (id: number, reason?: string): Promise<boolean> => {
    if (!repository) {
      setError('[usePartnerList] HttpCapability not initialized');
      return false;
    }
    
    try {
      const updated = await repository.terminate(id, reason);
      setPartners(prev => prev.map(p => p.id === id ? updated : p));
      eventBus?.emit(PARTNER_EVENTS.STATUS_CHANGED, { id, status: 'TERMINATED', reason });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to terminate partner';
      setError(message);
      console.error('[usePartnerList] Terminate failed:', err);
      return false;
    }
  }, [repository, eventBus]);
  
  // ========================================================================
  // Return Result
  // ========================================================================
  
  return {
    // State
    partners,
    loading,
    error,
    typeFilter,
    statusFilter,
    permissions,
    
    // Actions
    refresh,
    filterByType,
    filterByStatus,
    clearFilters,
    deletePartner,
    activatePartner,
    suspendPartner,
    resumePartner,
    terminatePartner,
  };
}
