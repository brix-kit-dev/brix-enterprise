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
 * @file Partner Edit ViewModel Hook
 * @description Manages state and business logic for partner edit page
 * @module partners-ui-web/hooks/usePartnerEdit
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook is a ViewModel layer implementation, responsible for:
 * 1. Loading existing partner data
 * 2. Managing update form state
 * 3. Submitting update requests
 * 4. Publishing update events
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useHttp, useEventBus, useNavigation } from '@brix-sdk/runtime-sdk-react';
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
};

/**
 * Page IDs
 */
const PARTNER_PAGE_IDS = {
  LIST: 'partners-list',
  DETAIL: 'partners-detail',
};

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Partner edit state
 */
export interface PartnerEditState {
  /** Original partner data loaded from server */
  partner: PartnerDTO | null;
  /** Whether loading partner data */
  loading: boolean;
  /** Whether submitting update */
  submitting: boolean;
  /** Error message */
  error: string | null;
  /** Whether update was successful */
  updateSuccess: boolean;
}

/**
 * Partner edit action methods
 */
export interface PartnerEditActions {
  /** Update partner */
  updatePartner: (data: UpdatePartnerRequest) => Promise<PartnerDTO | null>;
  /** Refresh partner data from server */
  refresh: () => Promise<void>;
  /** Clear error */
  clearError: () => void;
  /** Navigate to list page */
  navigateToList: () => void;
  /** Navigate to detail page */
  navigateToDetail: () => void;
}

/**
 * usePartnerEdit Hook return type
 */
export type UsePartnerEditResult = PartnerEditState & PartnerEditActions;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Partner Edit ViewModel Hook
 * 
 * Functionality:
 * - Load partner data by ID
 * - Submit partner update request
 * - Publish event after successful update
 * - Provide navigation functions
 * 
 * @param partnerId - The ID of the partner to edit
 * @returns Partner edit state and action methods
 */
export function usePartnerEdit(partnerId: number): UsePartnerEditResult {
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
  
  const [partner, setPartner] = useState<PartnerDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // ========================================================================
  // Data Loading
  // ========================================================================
  
  /**
   * Load partner data from server
   */
  const loadPartner = useCallback(async () => {
    if (!repository || !partnerId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await repository.getById(partnerId);
      setPartner(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load partner';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [repository, partnerId]);
  
  // Load partner data on mount
  useEffect(() => {
    loadPartner();
  }, [loadPartner]);
  
  // ========================================================================
  // Action Methods
  // ========================================================================
  
  /**
   * Update partner
   * 
   * @param data - Update partner request data
   * @returns Updated partner data on success, null on failure
   */
  const updatePartner = useCallback(async (
    data: UpdatePartnerRequest
  ): Promise<PartnerDTO | null> => {
    if (!repository || !partner) {
      setError('[usePartnerEdit] Repository or partner not initialized');
      return null;
    }
    
    setSubmitting(true);
    setError(null);
    setUpdateSuccess(false);
    
    try {
      const updatedPartner = await repository.update(partner.id, data);
      setPartner(updatedPartner);
      setUpdateSuccess(true);
      
      // Publish update event
      eventBus?.emit(PARTNER_EVENTS.UPDATED, {
        id: updatedPartner.id,
        partnerCode: updatedPartner.partnerCode,
        name: updatedPartner.name,
        partnerType: updatedPartner.partnerType,
      });
      
      return updatedPartner;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update partner';
      setError(message);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [repository, partner, eventBus]);
  
  /**
   * Refresh partner data
   */
  const refresh = useCallback(async (): Promise<void> => {
    await loadPartner();
  }, [loadPartner]);
  
  /**
   * Clear error
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);
  
  /**
   * Navigate to list page
   */
  const navigateToList = useCallback((): void => {
    navigation?.navigate(PARTNER_PAGE_IDS.LIST);
  }, [navigation]);
  
  /**
   * Navigate to detail page
   */
  const navigateToDetail = useCallback((): void => {
    if (partner) {
      navigation?.navigate(PARTNER_PAGE_IDS.DETAIL, { id: partner.id });
    }
  }, [navigation, partner]);
  
  // ========================================================================
  // Return Result
  // ========================================================================
  
  return {
    // State
    partner,
    loading,
    submitting,
    error,
    updateSuccess,
    
    // Actions
    updatePartner,
    refresh,
    clearError,
    navigateToList,
    navigateToDetail,
  };
}
