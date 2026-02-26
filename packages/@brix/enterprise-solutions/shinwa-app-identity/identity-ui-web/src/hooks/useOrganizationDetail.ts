/**
 * @file Organization Detail ViewModel Hook
 * @description Manages state and business logic for organization detail page
 * @module identity-ui-web/hooks/useOrganizationDetail
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook implements the ViewModel layer, responsible for:
 * 1. Loading organization detail data
 * 2. Managing organization update operations
 * 3. Loading related data (users, child organizations)
 * 4. Shielding View layer from direct Repository access
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useHttp, useEventBus } from '@brix/runtime-sdk-react';
import { useNavigation } from '@brix/runtime-sdk-react';
import {
  createOrganizationRepository,
  type OrganizationRepository,
} from '../repositories';
import type {
  Organization,
  UpdateOrganizationParams,
} from '@shinwa/identity-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Organization user info
 */
export interface OrganizationUser {
  id: string;
  username: string;
  displayName: string;
}

/**
 * Organization detail state
 */
export interface OrganizationDetailState {
  /** Organization data */
  organization: Organization | null;
  /** Child organizations */
  children: Organization[];
  /** Users in organization */
  users: OrganizationUser[];
  /** Whether loading organization data */
  loading: boolean;
  /** Whether loading children */
  loadingChildren: boolean;
  /** Whether loading users */
  loadingUsers: boolean;
  /** Whether updating */
  updating: boolean;
  /** Error message */
  error: Error | null;
  /** Total user count */
  totalUsers: number;
}

/**
 * Organization detail actions
 */
export interface OrganizationDetailActions {
  /** Refresh organization data */
  refresh: () => Promise<void>;
  /** Update organization */
  update: (params: UpdateOrganizationParams) => Promise<boolean>;
  /** Delete organization */
  delete: () => Promise<boolean>;
  /** Load more users */
  loadMoreUsers: () => Promise<void>;
  /** Navigate to edit page */
  navigateToEdit: () => void;
  /** Navigate to list page */
  navigateToList: () => void;
  /** Navigate to child organization */
  navigateToChild: (childId: number) => void;
}

/**
 * useOrganizationDetail return type
 */
export type UseOrganizationDetailReturn = OrganizationDetailState & OrganizationDetailActions;

// ============================================================================
// Constants
// ============================================================================

/**
 * Organization events
 */
const ORGANIZATION_EVENTS = {
  CREATED: 'organization:created',
  UPDATED: 'organization:updated',
  DELETED: 'organization:deleted',
};

/**
 * Users page size
 */
const USERS_PAGE_SIZE = 10;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Organization Detail Hook
 * 
 * Manages organization detail state and provides actions for interaction.
 * 
 * @param options - Configuration options
 * @param options.id - Organization ID
 * @param options.code - Organization code (alternative to ID)
 * @returns Organization detail state and actions
 * 
 * @example
 * ```tsx
 * const {
 *   organization,
 *   loading,
 *   children,
 *   users,
 *   update,
 *   navigateToEdit,
 * } = useOrganizationDetail({ id: 1 });
 * ```
 */
export function useOrganizationDetail(options: {
  id?: number;
  code?: string;
}): UseOrganizationDetailReturn {
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
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [children, setChildren] = useState<Organization[]>([]);
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersPage, setUsersPage] = useState(0);

  // ─────────────────────────────────────────────────────────
  // Load Organization
  // ─────────────────────────────────────────────────────────
  const loadOrganization = useCallback(async () => {
    if (!options.id && !options.code) {
      setError(new Error('Organization ID or code is required'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let data: Organization;
      
      if (options.id) {
        data = await repository.getById(options.id);
      } else {
        data = await repository.getByCode(options.code!);
      }

      setOrganization(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load organization'));
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  }, [repository, options.id, options.code]);

  // ─────────────────────────────────────────────────────────
  // Load Children
  // ─────────────────────────────────────────────────────────
  const loadChildren = useCallback(async () => {
    if (!organization?.id) return;

    setLoadingChildren(true);

    try {
      const data = await repository.getChildren(organization.id);
      setChildren(data);
    } catch (err) {
      console.error('Failed to load children:', err);
      setChildren([]);
    } finally {
      setLoadingChildren(false);
    }
  }, [repository, organization?.id]);

  // ─────────────────────────────────────────────────────────
  // Load Users
  // ─────────────────────────────────────────────────────────
  const loadUsers = useCallback(async (page: number = 0, append: boolean = false) => {
    if (!organization?.id) return;

    setLoadingUsers(true);

    try {
      const result = await repository.getUsers(organization.id, {
        page,
        size: USERS_PAGE_SIZE,
      });

      if (append) {
        setUsers((prev) => [...prev, ...result.content]);
      } else {
        setUsers(result.content);
      }
      setTotalUsers(result.totalElements);
      setUsersPage(page);
    } catch (err) {
      console.error('Failed to load users:', err);
      if (!append) {
        setUsers([]);
        setTotalUsers(0);
      }
    } finally {
      setLoadingUsers(false);
    }
  }, [repository, organization?.id]);

  // Initial load
  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  // Load related data after organization is loaded
  useEffect(() => {
    if (organization) {
      loadChildren();
      loadUsers(0, false);
    }
  }, [organization, loadChildren, loadUsers]);

  // Subscribe to organization events
  useEffect(() => {
    const unsubscribe = eventBus.on(ORGANIZATION_EVENTS.UPDATED, (data: { id?: number }) => {
      if (data?.id === organization?.id) {
        loadOrganization();
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [eventBus, organization?.id, loadOrganization]);

  // ─────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────
  
  /**
   * Refresh organization data
   */
  const refresh = useCallback(async () => {
    await loadOrganization();
  }, [loadOrganization]);

  /**
   * Update organization
   */
  const update = useCallback(async (params: UpdateOrganizationParams): Promise<boolean> => {
    if (!organization?.id) return false;

    setUpdating(true);
    setError(null);

    try {
      const updated = await repository.update(organization.id, params);
      setOrganization(updated);
      eventBus.emit(ORGANIZATION_EVENTS.UPDATED, { id: organization.id });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update organization'));
      return false;
    } finally {
      setUpdating(false);
    }
  }, [repository, organization?.id, eventBus]);

  /**
   * Delete organization
   */
  const deleteOrganization = useCallback(async (): Promise<boolean> => {
    if (!organization?.id) return false;

    try {
      await repository.delete(organization.id);
      eventBus.emit(ORGANIZATION_EVENTS.DELETED, { id: organization.id });
      navigation.navigate('/organizations');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete organization'));
      return false;
    }
  }, [repository, organization?.id, eventBus, navigation]);

  /**
   * Load more users
   */
  const loadMoreUsers = useCallback(async () => {
    if (users.length < totalUsers) {
      await loadUsers(usersPage + 1, true);
    }
  }, [loadUsers, users.length, totalUsers, usersPage]);

  /**
   * Navigate to edit page
   */
  const navigateToEdit = useCallback(() => {
    if (organization?.id) {
      navigation.navigate(`/organizations/${organization.id}/edit`);
    }
  }, [navigation, organization?.id]);

  /**
   * Navigate to list page
   */
  const navigateToList = useCallback(() => {
    navigation.navigate('/organizations');
  }, [navigation]);

  /**
   * Navigate to child organization
   */
  const navigateToChild = useCallback((childId: number) => {
    navigation.navigate(`/organizations/${childId}`);
  }, [navigation]);

  // ─────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────
  return {
    // State
    organization,
    children,
    users,
    loading,
    loadingChildren,
    loadingUsers,
    updating,
    error,
    totalUsers,
    // Actions
    refresh,
    update,
    delete: deleteOrganization,
    loadMoreUsers,
    navigateToEdit,
    navigateToList,
    navigateToChild,
  };
}
