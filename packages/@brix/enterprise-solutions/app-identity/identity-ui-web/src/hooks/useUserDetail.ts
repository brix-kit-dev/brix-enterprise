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
 * @file User Detail ViewModel Hook
 * @description Manage user detail page state and business logic
 * @module identity-ui-web/hooks/useUserDetail
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook is the ViewModel layer implementation, responsible for:
 * 1. Loading and managing user detail data
 * 2. Handling user information updates and status changes
 * 3. Publishing relevant events to notify other components
 * 
 * Usage:
 * ```tsx
 * function UserDetailPage({ userId }: { userId: string }) {
 *   const { 
 *     user, loading, error,
 *     updateUser, enableUser, disableUser 
 *   } = useUserDetail(userId);
 *   
 *   // Pure render logic
 * }
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp, useEventBus, useAuth } from '@brix-sdk/runtime-sdk-react';
import { createUserRepository, type UserRepository } from '../repositories';
import type { User, UpdateUserParams } from 'identity-shared';
import { IDENTITY_EVENTS, IDENTITY_PERMISSIONS } from 'identity-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * User detail state
 */
export interface UserDetailState {
  /** User data */
  user: User | null;
  /** Whether loading */
  loading: boolean;
  /** Whether submitting */
  submitting: boolean;
  /** Error message */
  error: string | null;
  /** Permission state */
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canResetPassword: boolean;
  };
}

/**
 * User detail action methods
 */
export interface UserDetailActions {
  /** Refresh user data */
  refresh: () => Promise<void>;
  /** Update user information */
  updateUser: (params: UpdateUserParams) => Promise<boolean>;
  /** Delete user */
  deleteUser: () => Promise<boolean>;
  /** Enable user */
  enableUser: (reason?: string) => Promise<boolean>;
  /** Disable user */
  disableUser: (reason?: string) => Promise<boolean>;
  /** Lock user */
  lockUser: (reason?: string) => Promise<boolean>;
  /** Unlock user */
  unlockUser: (reason?: string) => Promise<boolean>;
  /** Reset password */
  resetPassword: (newPassword: string) => Promise<boolean>;
}

/**
 * useUserDetail Hook return type
 */
export type UseUserDetailResult = UserDetailState & UserDetailActions;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * User Detail ViewModel Hook
 * 
 * Features:
 * - Load user details by user ID
 * - Provide user information update functionality
 * - Provide user status change functionality (enable/disable/lock/unlock)
 * - Provide password reset functionality
 * - Subscribe to user change events for automatic data refresh
 * 
 * Event Publications:
 * - user:updated - After user update
 * - user:deleted - After user deletion
 * - user:status-changed - After user status change
 * - user:password-reset - After password reset
 * 
 * @param userId - User ID
 * @returns User detail state and action methods
 * 
 * @example
 * ```tsx
 * function UserDetailPage({ userId }: { userId: string }) {
 *   const { user, loading, updateUser, permissions } = useUserDetail(userId);
 *   
 *   if (loading) return <Spinner />;
 *   if (!user) return <NotFound />;
 *   
 *   return (
 *     <UserForm 
 *       user={user}
 *       readOnly={!permissions.canEdit}
 *       onSubmit={updateUser}
 *     />
 *   );
 * }
 * ```
 */
export function useUserDetail(userId: string): UseUserDetailResult {
  // ========================================================================
  // Dependency Acquisition
  // ========================================================================
  
  const http = useHttp();
  const eventBus = useEventBus();
  const auth = useAuth();
  
  // Repository instance
  const repository = useMemo<UserRepository | null>(
    () => http ? createUserRepository(http) : null,
    [http]
  );
  
  // ========================================================================
  // State Definitions
  // ========================================================================
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Permission check
  const permissions = useMemo(() => ({
    canEdit: auth.hasPermission(IDENTITY_PERMISSIONS.USER_UPDATE),
    canDelete: auth.hasPermission(IDENTITY_PERMISSIONS.USER_DELETE),
    canResetPassword: auth.hasPermission(IDENTITY_PERMISSIONS.USER_PASSWORD_RESET),
  }), [auth]);
  
  // ========================================================================
  // Data Loading
  // ========================================================================
  
  /**
   * Load user details
   */
  const fetchData = useCallback(async (): Promise<void> => {
    if (!repository || !userId) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await repository.getById(userId);
      setUser(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load user details';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [repository, userId]);
  
  // ========================================================================
  // Initial Load and Reload on userId Change
  // ========================================================================
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // ========================================================================
  // Event Subscriptions - Auto Refresh
  // ========================================================================
  
  useEffect(() => {
    if (!eventBus || !userId) return;
    
    // Refresh data after user update
    const unsubUpdate = eventBus.on(IDENTITY_EVENTS.USER_UPDATED, (payload: { userId: string }) => {
      if (payload.userId === userId) {
        fetchData();
      }
    });
    
    // Refresh data after user status change
    const unsubStatus = eventBus.on(IDENTITY_EVENTS.USER_STATUS_CHANGED, (payload: { userId: string }) => {
      if (payload.userId === userId) {
        fetchData();
      }
    });
    
    return () => {
      unsubUpdate?.();
      unsubStatus?.();
    };
  }, [eventBus, userId, fetchData]);
  
  // ========================================================================
  // Action Methods
  // ========================================================================
  
  /** Refresh data */
  const refresh = useCallback(async (): Promise<void> => {
    await fetchData();
  }, [fetchData]);
  
  /** Update user information */
  const updateUser = useCallback(async (params: UpdateUserParams): Promise<boolean> => {
    if (!repository || !userId) {
      setError('[useUserDetail] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const updatedUser = await repository.update(userId, params);
      setUser(updatedUser);
      
      // Publish update event
      eventBus?.emit(IDENTITY_EVENTS.USER_UPDATED, {
        userId,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
      });
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, userId, eventBus]);
  
  /** Delete user */
  const deleteUser = useCallback(async (): Promise<boolean> => {
    if (!repository || !userId) {
      setError('[useUserDetail] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      await repository.delete(userId);
      
      // Publish delete event
      eventBus?.emit(IDENTITY_EVENTS.USER_DELETED, { userId });
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, userId, eventBus]);
  
  /** Enable user */
  const enableUser = useCallback(async (reason?: string): Promise<boolean> => {
    if (!repository || !userId) {
      setError('[useUserDetail] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      await repository.enable(userId, reason);
      
      // Publish status change event
      eventBus?.emit(IDENTITY_EVENTS.USER_STATUS_CHANGED, {
        userId,
        previousStatus: user?.status,
        newStatus: 'ACTIVE',
        reason,
        changedAt: new Date().toISOString(),
      });
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable user';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, userId, user?.status, eventBus]);
  
  /** Disable user */
  const disableUser = useCallback(async (reason?: string): Promise<boolean> => {
    if (!repository || !userId) {
      setError('[useUserDetail] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      await repository.disable(userId, reason);
      
      // Publish status change event
      eventBus?.emit(IDENTITY_EVENTS.USER_STATUS_CHANGED, {
        userId,
        previousStatus: user?.status,
        newStatus: 'DISABLED',
        reason,
        changedAt: new Date().toISOString(),
      });
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable user';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, userId, user?.status, eventBus]);
  
  /** Lock user */
  const lockUser = useCallback(async (reason?: string): Promise<boolean> => {
    if (!repository || !userId) {
      setError('[useUserDetail] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      await repository.lock(userId, reason);
      
      // Publish status change event
      eventBus?.emit(IDENTITY_EVENTS.USER_STATUS_CHANGED, {
        userId,
        previousStatus: user?.status,
        newStatus: 'LOCKED',
        reason,
        changedAt: new Date().toISOString(),
      });
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to lock user';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, userId, user?.status, eventBus]);
  
  /** Unlock user */
  const unlockUser = useCallback(async (reason?: string): Promise<boolean> => {
    if (!repository || !userId) {
      setError('[useUserDetail] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      await repository.unlock(userId, reason);
      
      // Publish status change event
      eventBus?.emit(IDENTITY_EVENTS.USER_STATUS_CHANGED, {
        userId,
        previousStatus: user?.status,
        newStatus: 'ACTIVE',
        reason,
        changedAt: new Date().toISOString(),
      });
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unlock user';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, userId, user?.status, eventBus]);
  
  /** Reset password */
  const resetPassword = useCallback(async (newPassword: string): Promise<boolean> => {
    if (!repository || !userId) {
      setError('[useUserDetail] HttpCapability not initialized');
      return false;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      await repository.resetPassword(userId, newPassword);
      
      // Publish password reset event
      eventBus?.emit(IDENTITY_EVENTS.USER_PASSWORD_RESET, {
        userId,
        resetAt: new Date().toISOString(),
      });
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repository, userId, eventBus]);
  
  // ========================================================================
  // Return Result
  // ========================================================================
  
  return {
    // 状态
    user,
    loading,
    submitting,
    error,
    permissions,
    
    // 操作
    refresh,
    updateUser,
    deleteUser,
    enableUser,
    disableUser,
    lockUser,
    unlockUser,
    resetPassword,
  };
}
