/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 * 
 * @fileoverview useTenantDetail - ViewModel Hook for Tenant Detail Page
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp, useEventBus, useNavigation } from '@brix-sdk/runtime-sdk-react';
import { createTenantAdminRepository } from '../repositories';
import type { 
  TenantDTO, 
  TenantFeatureDTO,
  UpdateTenantRequest,
} from '@brix-sdk/tenant-shared';
import { TenantEvents, TenantStatus } from '@brix-sdk/tenant-shared';

type TenantEventPayload = { tenantId: string };

/**
 * Tenant Detail ViewModel State
 */
export interface TenantDetailState {
  /** Tenant data */
  tenant: TenantDTO | null;
  /** Feature flags */
  features: TenantFeatureDTO[];
  /** Loading state */
  isLoading: boolean;
  /** Saving state */
  isSaving: boolean;
  /** Error message */
  error: string | null;
  /** Active tab */
  activeTab: 'info' | 'members' | 'features' | 'audit';
}

/**
 * Tenant Detail ViewModel Actions
 */
export interface TenantDetailActions {
  /** Refresh tenant data */
  refresh: () => Promise<void>;
  /** Update tenant info */
  updateTenant: (request: UpdateTenantRequest) => Promise<void>;
  /** Activate tenant */
  activateTenant: () => Promise<void>;
  /** Suspend tenant */
  suspendTenant: (reason?: string) => Promise<void>;
  /** Terminate tenant */
  terminateTenant: (reason: string) => Promise<void>;
  /** Toggle feature flag */
  toggleFeature: (featureKey: string, enabled: boolean) => Promise<void>;
  /** Change active tab */
  setActiveTab: (tab: TenantDetailState['activeTab']) => void;
  /** Navigate to members page */
  viewMembers: () => void;
  /** Navigate back to list */
  goBack: () => void;
}

/**
 * useTenantDetail Hook - ViewModel for Tenant Detail Page
 * 
 * @param tenantId - Tenant ID to display
 *
 * @example
 * ```tsx
 * function TenantDetailPage({ tenantId }: { tenantId: string }) {
 *   const { state, actions } = useTenantDetail(tenantId);
 *   
 *   if (state.isLoading) return <Spin />;
 *   if (!state.tenant) return <Empty />;
 *   
 *   return (
 *     <TenantInfo 
 *       tenant={state.tenant}
 *       onSave={actions.updateTenant}
 *     />
 *   );
 * }
 * ```
 */
export function useTenantDetail(tenantId: string): { state: TenantDetailState; actions: TenantDetailActions } {
  // =========================================
  // Capabilities
  // =========================================
  const http = useHttp();
  const eventBus = useEventBus();
  const navigation = useNavigation();
  
  // =========================================
  // Repository
  // =========================================
  const repository = useMemo(() => createTenantAdminRepository(http), [http]);
  
  // =========================================
  // State
  // =========================================
  const [tenant, setTenant] = useState<TenantDTO | null>(null);
  const [features, setFeatures] = useState<TenantFeatureDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TenantDetailState['activeTab']>('info');
  
  // =========================================
  // Data Fetching
  // =========================================
  const fetchTenant = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [tenantData, featureData] = await Promise.all([
        repository.getTenant(tenantId),
        repository.getFeatures(tenantId),
      ]);
      
      setTenant(tenantData);
      setFeatures(featureData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tenant');
    } finally {
      setIsLoading(false);
    }
  }, [repository, tenantId]);
  
  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);
  
  // =========================================
  // Event Subscriptions
  // =========================================
  useEffect(() => {
    const subscribe = eventBus.on as unknown as <T>(
      eventType: string,
      handler: (payload: T) => void
    ) => void | (() => void);
    const handleTenantUpdate = (payload: TenantEventPayload | { payload: TenantEventPayload }) => {
      const eventPayload = 'payload' in payload ? payload.payload : payload;
      if (eventPayload.tenantId === tenantId) {
        fetchTenant();
      }
    };
    
    const unsubscribes = [
      subscribe(TenantEvents.TENANT_UPDATED, handleTenantUpdate),
      subscribe(TenantEvents.TENANT_ACTIVATED, handleTenantUpdate),
      subscribe(TenantEvents.TENANT_SUSPENDED, handleTenantUpdate),
    ];
    
    return () => {
      unsubscribes.forEach((unsub) => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
    };
  }, [eventBus, tenantId, fetchTenant]);

  const navigateTo = useCallback((path: string) => {
    if (navigation.requestNavigate) {
      void navigation.requestNavigate(path);
      return;
    }
    navigation.navigate(path);
  }, [navigation]);
  
  // =========================================
  // Actions
  // =========================================
  const actions: TenantDetailActions = useMemo(() => ({
    refresh: fetchTenant,
    
    updateTenant: async (request: UpdateTenantRequest) => {
      setIsSaving(true);
      try {
        const updated = await repository.updateTenant(tenantId, request);
        setTenant(updated);
        eventBus.emit(TenantEvents.TENANT_UPDATED, { tenantId });
      } finally {
        setIsSaving(false);
      }
    },
    
    activateTenant: async () => {
      setIsSaving(true);
      try {
        await repository.activateTenant(tenantId);
        setTenant((prev) => prev ? { ...prev, status: TenantStatus.ACTIVE } : null);
        eventBus.emit(TenantEvents.TENANT_ACTIVATED, { tenantId });
      } finally {
        setIsSaving(false);
      }
    },
    
    suspendTenant: async (reason?: string) => {
      setIsSaving(true);
      try {
        await repository.suspendTenant(tenantId, reason);
        setTenant((prev) => prev ? { ...prev, status: TenantStatus.SUSPENDED } : null);
        eventBus.emit(TenantEvents.TENANT_SUSPENDED, { tenantId, reason });
      } finally {
        setIsSaving(false);
      }
    },
    
    terminateTenant: async (reason: string) => {
      setIsSaving(true);
      try {
        await repository.terminateTenant(tenantId, reason);
        eventBus.emit(TenantEvents.TENANT_TERMINATED, { tenantId, reason });
        // Navigate back to list after termination
        navigateTo('/admin/tenants');
      } finally {
        setIsSaving(false);
      }
    },
    
    toggleFeature: async (featureKey: string, enabled: boolean) => {
      try {
        const updated = await repository.updateFeature(tenantId, featureKey, enabled);
        setFeatures((prev) =>
          prev.map((f) => (f.key === featureKey ? updated : f))
        );
      } catch (err) {
        throw err;
      }
    },
    
    setActiveTab,
    
    viewMembers: () => {
      navigateTo(`/admin/tenants/${tenantId}/members`);
    },
    
    goBack: () => {
      navigateTo('/admin/tenants');
    },
  }), [fetchTenant, repository, tenantId, eventBus, navigateTo]);
  
  // =========================================
  // Return ViewModel
  // =========================================
  const state: TenantDetailState = {
    tenant,
    features,
    isLoading,
    isSaving,
    error,
    activeTab,
  };
  
  return { state, actions };
}

export default useTenantDetail;
