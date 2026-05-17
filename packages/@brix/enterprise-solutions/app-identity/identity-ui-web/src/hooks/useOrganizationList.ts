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
 * @file Organization List ViewModel Hook
 * @description Manages state and business logic for organization list page
 * @module identity-ui-web/hooks/useOrganizationList
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook implements the ViewModel layer, responsible for:
 * 1. Managing organization list state (loading, data, error)
 * 2. Encapsulating search and filter logic
 * 3. Handling pagination
 * 4. Shielding View layer from direct Repository access
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useHttp, useEventBus } from '@brix-sdk/runtime-sdk-react';
import { useNavigation } from '@brix-sdk/runtime-sdk-react';
import {
  createOrganizationRepository,
  type OrganizationRepository,
} from '../repositories';
import type {
  Organization,
  OrganizationType,
  OrganizationStatus,
  OrganizationListQuery,
} from '@brix-sdk/enterprise-identity-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Organization list filter criteria
 */
export interface OrganizationListFilters {
  /** Search keyword */
  keyword: string;
  /** Organization type filter */
  type: OrganizationType | '';
  /** Status filter */
  status: OrganizationStatus | '';
  /** Parent ID filter */
  parentId?: number;
}

/**
 * Organization list pagination state
 */
export interface OrganizationListPagination {
  /** Current page (0-based) */
  page: number;
  /** Page size */
  size: number;
  /** Total elements */
  totalElements: number;
  /** Total pages */
  totalPages: number;
}

/**
 * Organization list state
 */
export interface OrganizationListState {
  /** Organization list data */
  organizations: Organization[];
  /** Whether loading */
  loading: boolean;
  /** Error message */
  error: Error | null;
  /** Filter criteria */
  filters: OrganizationListFilters;
  /** Pagination state */
  pagination: OrganizationListPagination;
  /** Selected organization IDs */
  selectedIds: number[];
}

/**
 * Organization list actions
 */
export interface OrganizationListActions {
  /** Refresh list */
  refresh: () => Promise<void>;
  /** Update filter criteria */
  setFilters: (filters: Partial<OrganizationListFilters>) => void;
  /** Update pagination */
  setPage: (page: number) => void;
  /** Update page size */
  setPageSize: (size: number) => void;
  /** Select organization */
  selectOrganization: (id: number) => void;
  /** Select all */
  selectAll: () => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Navigate to organization detail */
  navigateToDetail: (id: number) => void;
  /** Navigate to create page */
  navigateToCreate: () => void;
  /** Delete organization */
  deleteOrganization: (id: number) => Promise<boolean>;
}

/**
 * useOrganizationList return type
 */
export type UseOrganizationListReturn = OrganizationListState & OrganizationListActions;

// ============================================================================
// Constants
// ============================================================================

/**
 * Default filters
 */
const DEFAULT_FILTERS: OrganizationListFilters = {
  keyword: '',
  type: '',
  status: '',
  parentId: undefined,
};

/**
 * Default pagination
 */
const DEFAULT_PAGINATION: OrganizationListPagination = {
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
};

/**
 * Organization events
 */
const ORGANIZATION_EVENTS = {
  CREATED: 'organization:created',
  UPDATED: 'organization:updated',
  DELETED: 'organization:deleted',
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Organization List Hook
 * 
 * Manages organization list state and provides actions for interaction.
 * 
 * @returns Organization list state and actions
 * 
 * @example
 * ```tsx
 * const {
 *   organizations,
 *   loading,
 *   filters,
 *   setFilters,
 *   navigateToDetail,
 * } = useOrganizationList();
 * ```
 */
export function useOrganizationList(): UseOrganizationListReturn {
  const httpCapability = useHttp();
  const eventBus = useEventBus();
  const navigation = useNavigation();

  // Create Repository instance
  const repository: OrganizationRepository = useMemo(
    () => createOrganizationRepository(httpCapability),
    [httpCapability]
  );

  // ─────────────────────────────────────────────────────────
  // State Management
  // ─────────────────────────────────────────────────────────
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFiltersState] = useState<OrganizationListFilters>(DEFAULT_FILTERS);
  const [pagination, setPagination] = useState<OrganizationListPagination>(DEFAULT_PAGINATION);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // ─────────────────────────────────────────────────────────
  // Load Organizations
  // ─────────────────────────────────────────────────────────
  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const query: OrganizationListQuery = {
        page: pagination.page,
        size: pagination.size,
        keyword: filters.keyword || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
        parentId: filters.parentId,
      };
      
      const result = await repository.getList(query);
      
      setOrganizations(result.content);
      setPagination((prev) => ({
        ...prev,
        totalElements: result.totalElements,
        totalPages: result.totalPages,
      }));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load organizations'));
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, [repository, filters, pagination.page, pagination.size]);

  // Initial load
  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  // Subscribe to organization events
  useEffect(() => {
    const handlers = [
      eventBus.on(ORGANIZATION_EVENTS.CREATED, () => loadOrganizations()),
      eventBus.on(ORGANIZATION_EVENTS.UPDATED, () => loadOrganizations()),
      eventBus.on(ORGANIZATION_EVENTS.DELETED, () => loadOrganizations()),
    ];

    return () => {
      handlers.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [eventBus, loadOrganizations]);

  // ─────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────
  
  /**
   * Refresh list
   */
  const refresh = useCallback(async () => {
    await loadOrganizations();
  }, [loadOrganizations]);

  /**
   * Update filters
   */
  const setFilters = useCallback((newFilters: Partial<OrganizationListFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 0 })); // Reset to first page
  }, []);

  /**
   * Update page
   */
  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  /**
   * Update page size
   */
  const setPageSize = useCallback((size: number) => {
    setPagination((prev) => ({ ...prev, size, page: 0 }));
  }, []);

  /**
   * Select organization
   */
  const selectOrganization = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  /**
   * Select all
   */
  const selectAll = useCallback(() => {
    setSelectedIds(organizations.map((org) => org.id));
  }, [organizations]);

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  /**
   * Navigate to detail
   */
  const navigateToDetail = useCallback((id: number) => {
    navigation.navigate(`/organizations/${id}`);
  }, [navigation]);

  /**
   * Navigate to create
   */
  const navigateToCreate = useCallback(() => {
    navigation.navigate('/organizations/create');
  }, [navigation]);

  /**
   * Delete organization
   */
  const deleteOrganization = useCallback(async (id: number): Promise<boolean> => {
    try {
      await repository.delete(id);
      eventBus.emit(ORGANIZATION_EVENTS.DELETED, { id });
      return true;
    } catch (err) {
      return false;
    }
  }, [repository, eventBus]);

  // ─────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────
  return {
    // State
    organizations,
    loading,
    error,
    filters,
    pagination,
    selectedIds,
    // Actions
    refresh,
    setFilters,
    setPage,
    setPageSize,
    selectOrganization,
    selectAll,
    clearSelection,
    navigateToDetail,
    navigateToCreate,
    deleteOrganization,
  };
}
