/**
 * @file Partner Create ViewModel Hook
 * @description Manages state and business logic for partner creation page
 * @module partners-ui-web/hooks/usePartnerCreate
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook is a ViewModel layer implementation, responsible for:
 * 1. Managing creation form state
 * 2. Submitting creation requests
 * 3. Publishing creation events
 */

import { useState, useCallback, useMemo } from 'react';
import { useHttp, useEventBus, useNavigation } from '@brix/runtime-sdk-react';
import { createPartnerRepository, type PartnerRepository } from '../repositories';
import type { PartnerDTO, CreatePartnerRequest } from '../types';

// ============================================================================
// Constants
// ============================================================================

/**
 * Partner event names
 */
const PARTNER_EVENTS = {
  CREATED: 'partners:partner:created',
};

/**
 * Page IDs
 */
const PARTNER_PAGE_IDS = {
  LIST: 'partners-list',
  DETAIL: 'partners-detail',
  CREATE: 'partners-create',
};

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Partner creation state
 */
export interface PartnerCreateState {
  /** Whether submitting */
  submitting: boolean;
  /** Error message */
  error: string | null;
  /** Partner data created successfully */
  createdPartner: PartnerDTO | null;
}

/**
 * Partner creation action methods
 */
export interface PartnerCreateActions {
  /** Create partner */
  createPartner: (data: CreatePartnerRequest) => Promise<PartnerDTO | null>;
  /** Clear error */
  clearError: () => void;
  /** Reset state */
  reset: () => void;
  /** Navigate to list page */
  navigateToList: () => void;
  /** Navigate to detail page */
  navigateToDetail: (partnerId: number) => void;
}

/**
 * usePartnerCreate Hook return type
 */
export type UsePartnerCreateResult = PartnerCreateState & PartnerCreateActions;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Partner Create ViewModel Hook
 * 
 * Functionality:
 * - Submit partner creation request
 * - Publish event after successful creation
 * - Provide reset and navigation functions
 * 
 * @returns Partner creation state and action methods
 */
export function usePartnerCreate(): UsePartnerCreateResult {
  // ========================================================================
  // Dependency Injection
  // ========================================================================
  
  const http = useHttp();
  const eventBus = useEventBus();
  const navigation = useNavigation();
  
  // Repository instance
  const repository = useMemo<PartnerRepository | null>(
    () => http ? createPartnerRepository(http) : null,
    [http]
  );
  
  // ========================================================================
  // State Definitions
  // ========================================================================
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPartner, setCreatedPartner] = useState<PartnerDTO | null>(null);
  
  // ========================================================================
  // Action Methods
  // ========================================================================
  
  /**
   * Create partner
   * 
   * @param data - Create partner request data
   * @returns Partner data on success, null on failure
   */
  const createPartner = useCallback(async (
    data: CreatePartnerRequest
  ): Promise<PartnerDTO | null> => {
    if (!repository) {
      setError('[usePartnerCreate] HttpCapability not initialized');
      return null;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const partner = await repository.create(data);
      setCreatedPartner(partner);
      
      // Publish creation event
      eventBus?.emit(PARTNER_EVENTS.CREATED, {
        id: partner.id,
        partnerCode: partner.partnerCode,
        name: partner.name,
        partnerType: partner.partnerType,
      });
      
      return partner;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create partner';
      setError(message);
      console.error('[usePartnerCreate] Creation failed:', err);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [repository, eventBus]);
  
  /** Clear error */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);
  
  /** Reset state */
  const reset = useCallback((): void => {
    setSubmitting(false);
    setError(null);
    setCreatedPartner(null);
  }, []);
  
  /** Navigate to list page */
  const navigateToList = useCallback((): void => {
    navigation?.navigate(PARTNER_PAGE_IDS.LIST);
  }, [navigation]);
  
  /** Navigate to detail page */
  const navigateToDetail = useCallback((partnerId: number): void => {
    navigation?.navigate(PARTNER_PAGE_IDS.DETAIL, { id: partnerId });
  }, [navigation]);
  
  // ========================================================================
  // Return Result
  // ========================================================================
  
  return {
    // 状态
    submitting,
    error,
    createdPartner,
    
    // 操作
    createPartner,
    clearError,
    reset,
    navigateToList,
    navigateToDetail,
  };
}
