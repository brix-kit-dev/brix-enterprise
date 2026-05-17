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
 * @file User Create ViewModel Hook
 * @description Manage user creation page state and business logic
 * @module identity-ui-web/hooks/useUserCreate
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook is the ViewModel layer implementation, responsible for:
 * 1. Managing user creation form submission state
 * 2. Handling creation requests and error handling
 * 3. Publishing creation success events
 * 
 * Usage:
 * ```tsx
 * function UserCreatePage() {
 *   const { 
 *     submitting, error, roles,
 *     createUser, loadRoles 
 *   } = useUserCreate();
 *   
 *   // Pure render logic
 * }
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp, useEventBus, useNavigation } from '@brix-sdk/runtime-sdk-react';
import { 
  createUserRepository, 
  createRoleRepository,
  type UserRepository,
  type RoleRepository,
  type Role,
} from '../repositories';
import type { User, CreateUserParams } from 'identity-shared';
import { IDENTITY_EVENTS, IDENTITY_PAGE_IDS } from 'identity-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * User creation state
 */
export interface UserCreateState {
  /** Whether submitting */
  submitting: boolean;
  /** Error message */
  error: string | null;
  /** Available roles list */
  roles: Role[];
  /** Whether roles are loading */
  rolesLoading: boolean;
  /** Created user (for displaying success message) */
  createdUser: User | null;
}

/**
 * User creation action methods
 */
export interface UserCreateActions {
  /** Create user */
  createUser: (params: CreateUserParams) => Promise<boolean>;
  /** Load available roles list */
  loadRoles: () => Promise<void>;
  /** Clear error */
  clearError: () => void;
  /** Reset state (for creating more users) */
  reset: () => void;
  /** Navigate to list page */
  navigateToList: () => void;
  /** Navigate to user detail page */
  navigateToDetail: (userId: string) => void;
}

/**
 * useUserCreate Hook return type
 */
export type UseUserCreateResult = UserCreateState & UserCreateActions;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * User Create ViewModel Hook
 * 
 * Features:
 * - Manage user creation form submission state
 * - Load available roles list for dropdown selection
 * - Publish event and support navigation after successful creation
 * 
 * Event Publications:
 * - user:created - After successful user creation
 * 
 * @returns User creation state and action methods
 * 
 * @example
 * ```tsx
 * function UserCreatePage() {
 *   const { 
 *     submitting, error, roles,
 *     createUser, navigateToList 
 *   } = useUserCreate();
 *   
 *   const handleSubmit = async (data: CreateUserParams) => {
 *     const success = await createUser(data);
 *     if (success) {
 *       navigateToList();
 *     }
 *   };
 *   
 *   return (
 *     <UserForm 
 *       roles={roles}
 *       onSubmit={handleSubmit}
 *       onCancel={navigateToList}
 *       submitting={submitting}
 *       error={error}
 *     />
 *   );
 * }
 * ```
 */
export function useUserCreate(): UseUserCreateResult {
  // ========================================================================
  // Dependency Acquisition
  // ========================================================================
  
  const http = useHttp();
  const eventBus = useEventBus();
  const navigation = useNavigation();
  
  // Repository instances
  const userRepository = useMemo<UserRepository | null>(
    () => http ? createUserRepository(http) : null,
    [http]
  );
  
  const roleRepository = useMemo<RoleRepository | null>(
    () => http ? createRoleRepository(http) : null,
    [http]
  );
  
  // ========================================================================
  // State Definitions
  // ========================================================================
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  
  // ========================================================================
  // Load Roles List
  // ========================================================================
  
  /**
   * Load available roles list
   */
  const loadRoles = useCallback(async (): Promise<void> => {
    if (!roleRepository) {
      return;
    }
    
    setRolesLoading(true);
    
    try {
      const data = await roleRepository.listAvailable();
      setRoles(data);
    } catch (err) {
      // Roles loading failure doesn't block creation flow, just log
    } finally {
      setRolesLoading(false);
    }
  }, [roleRepository]);
  
  // Initial load roles list
  useEffect(() => {
    loadRoles();
  }, [loadRoles]);
  
  // ========================================================================
  // Create User
  // ========================================================================
  
  /**
   * Create user
   * 
   * @param params - Creation parameters
   * @returns Whether creation succeeded
   */
  const createUser = useCallback(async (params: CreateUserParams): Promise<boolean> => {
    if (!userRepository) {
      setError('[useUserCreate] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const user = await userRepository.create(params);
      setCreatedUser(user);
      
      // Publish creation event
      eventBus?.emit(IDENTITY_EVENTS.USER_CREATED, {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.roles?.[0] || 'USER',
        createdAt: user.createdAt,
      });
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [userRepository, eventBus]);
  
  // ========================================================================
  // Helper Actions
  // ========================================================================
  
  /** Clear error */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);
  
  /** Reset state */
  const reset = useCallback((): void => {
    setError(null);
    setCreatedUser(null);
    setSubmitting(false);
  }, []);
  
  /** Navigate to list page */
  const navigateToList = useCallback((): void => {
    navigation.requestNavigate(IDENTITY_PAGE_IDS.USER_LIST);
  }, [navigation]);
  
  /** Navigate to detail page */
  const navigateToDetail = useCallback((userId: string): void => {
    navigation.requestNavigate(IDENTITY_PAGE_IDS.USER_DETAIL, { id: userId });
  }, [navigation]);
  
  // ========================================================================
  // Return Result
  // ========================================================================
  
  return {
    // 状态
    submitting,
    error,
    roles,
    rolesLoading,
    createdUser,
    
    // 操作
    createUser,
    loadRoles,
    clearError,
    reset,
    navigateToList,
    navigateToDetail,
  };
}
