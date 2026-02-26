/**
 * @file Role List ViewModel Hook
 * @description Manages state and business logic for role list page
 * @module identity-ui-web/hooks/useRoleList
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook implements the ViewModel layer, responsible for:
 * 1. Managing role list state (loading, data, error)
 * 2. Encapsulating search and filter logic
 * 3. Shielding View layer from direct Repository access
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useHttp, useEventBus } from '@brix/runtime-sdk-react';
import { useNavigation } from '@brix/runtime-sdk-react';
import {
  createRoleRepository,
  type RoleRepository,
  type Role,
} from '../repositories';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Role list filter criteria
 */
export interface RoleListFilters {
  /** Search keyword */
  keyword: string;
  /** Show only enabled roles */
  enabledOnly: boolean;
  /** Show only custom (non-builtin) roles */
  customOnly: boolean;
}

/**
 * Role list state
 */
export interface RoleListState {
  /** Role list data */
  roles: Role[];
  /** Filtered role list */
  filteredRoles: Role[];
  /** Whether loading */
  loading: boolean;
  /** Error message */
  error: Error | null;
  /** Filter criteria */
  filters: RoleListFilters;
  /** Selected role IDs */
  selectedIds: number[];
}

/**
 * Role list actions
 */
export interface RoleListActions {
  /** Refresh list */
  refresh: () => Promise<void>;
  /** Update filter criteria */
  setFilters: (filters: Partial<RoleListFilters>) => void;
  /** Select role */
  selectRole: (id: number) => void;
  /** Select all */
  selectAll: () => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Navigate to role detail */
  navigateToDetail: (id: number) => void;
  /** Navigate to create page */
  navigateToCreate: () => void;
  /** Delete role */
  deleteRole: (id: number) => Promise<boolean>;
  /** Toggle role enabled status */
  toggleRoleEnabled: (id: number, enabled: boolean) => Promise<boolean>;
}

/**
 * useRoleList return type
 */
export type UseRoleListReturn = RoleListState & RoleListActions;

// ============================================================================
// Constants
// ============================================================================

/**
 * Default filters
 */
const DEFAULT_FILTERS: RoleListFilters = {
  keyword: '',
  enabledOnly: false,
  customOnly: false,
};

/**
 * Role events
 */
const ROLE_EVENTS = {
  CREATED: 'role:created',
  UPDATED: 'role:updated',
  DELETED: 'role:deleted',
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Role List Hook
 * 
 * Manages role list state and provides actions for interaction.
 * 
 * @returns Role list state and actions
 * 
 * @example
 * ```tsx
 * const {
 *   roles,
 *   filteredRoles,
 *   loading,
 *   filters,
 *   setFilters,
 *   navigateToDetail,
 * } = useRoleList();
 * ```
 */
export function useRoleList(): UseRoleListReturn {
  const httpCapability = useHttp();
  const eventBus = useEventBus();
  const navigation = useNavigation();

  // Create Repository instance
  const repository: RoleRepository = useMemo(
    () => createRoleRepository(httpCapability),
    [httpCapability]
  );

  // ─────────────────────────────────────────────────────────
  // State Management
  // ─────────────────────────────────────────────────────────
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFiltersState] = useState<RoleListFilters>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // ─────────────────────────────────────────────────────────
  // Computed: Filtered Roles
  // ─────────────────────────────────────────────────────────
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      // Keyword filter
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        const matchesName = role.name.toLowerCase().includes(keyword);
        const matchesCode = role.code.toLowerCase().includes(keyword);
        const matchesDescription = role.description?.toLowerCase().includes(keyword);
        
        if (!matchesName && !matchesCode && !matchesDescription) {
          return false;
        }
      }

      // Enabled only filter
      if (filters.enabledOnly && !role.enabled) {
        return false;
      }

      // Custom only filter (exclude built-in roles)
      if (filters.customOnly && role.builtIn) {
        return false;
      }

      return true;
    });
  }, [roles, filters]);

  // ─────────────────────────────────────────────────────────
  // Load Roles
  // ─────────────────────────────────────────────────────────
  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await repository.list();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load roles'));
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [repository]);

  // Initial load
  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  // Subscribe to role events
  useEffect(() => {
    const handlers = [
      eventBus.on(ROLE_EVENTS.CREATED, () => loadRoles()),
      eventBus.on(ROLE_EVENTS.UPDATED, () => loadRoles()),
      eventBus.on(ROLE_EVENTS.DELETED, () => loadRoles()),
    ];

    return () => {
      handlers.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [eventBus, loadRoles]);

  // ─────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────
  
  /**
   * Refresh list
   */
  const refresh = useCallback(async () => {
    await loadRoles();
  }, [loadRoles]);

  /**
   * Update filters
   */
  const setFilters = useCallback((newFilters: Partial<RoleListFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Select role
   */
  const selectRole = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  /**
   * Select all
   */
  const selectAll = useCallback(() => {
    setSelectedIds(filteredRoles.map((role) => role.id));
  }, [filteredRoles]);

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
    navigation.navigate(`/roles/${id}`);
  }, [navigation]);

  /**
   * Navigate to create
   */
  const navigateToCreate = useCallback(() => {
    navigation.navigate('/roles/create');
  }, [navigation]);

  /**
   * Delete role
   */
  const deleteRole = useCallback(async (id: number): Promise<boolean> => {
    try {
      await repository.delete(id);
      eventBus.emit(ROLE_EVENTS.DELETED, { id });
      return true;
    } catch (err) {
      console.error('Failed to delete role:', err);
      return false;
    }
  }, [repository, eventBus]);

  /**
   * Toggle role enabled status
   */
  const toggleRoleEnabled = useCallback(async (id: number, enabled: boolean): Promise<boolean> => {
    try {
      await repository.update(id, { enabled });
      eventBus.emit(ROLE_EVENTS.UPDATED, { id });
      return true;
    } catch (err) {
      console.error('Failed to toggle role enabled:', err);
      return false;
    }
  }, [repository, eventBus]);

  // ─────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────
  return {
    // State
    roles,
    filteredRoles,
    loading,
    error,
    filters,
    selectedIds,
    // Actions
    refresh,
    setFilters,
    selectRole,
    selectAll,
    clearSelection,
    navigateToDetail,
    navigateToCreate,
    deleteRole,
    toggleRoleEnabled,
  };
}
