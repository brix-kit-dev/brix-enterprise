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
 * @file Role Detail ViewModel Hook
 * @description Manages state and business logic for role detail page
 * @module identity-ui-web/hooks/useRoleDetail
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This Hook implements the ViewModel layer, responsible for:
 * 1. Loading role detail data
 * 2. Managing role update operations
 * 3. Managing permission assignments
 * 4. Shielding View layer from direct Repository access
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useHttp, useEventBus } from '@brix-sdk/runtime-sdk-react';
import { useNavigation } from '@brix-sdk/runtime-sdk-react';
import {
  createRoleRepository,
  type RoleRepository,
  type Role,
  type UpdateRoleParams,
} from '../repositories';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Permission category
 */
export interface PermissionCategory {
  /** Category key */
  key: string;
  /** Category name */
  name: string;
  /** Permissions in this category */
  permissions: Permission[];
}

/**
 * Permission definition
 */
export interface Permission {
  /** Permission code */
  code: string;
  /** Permission name */
  name: string;
  /** Permission description */
  description?: string;
  /** Whether currently assigned */
  assigned: boolean;
}

/**
 * Role detail state
 */
export interface RoleDetailState {
  /** Role data */
  role: Role | null;
  /** All available permissions grouped by category */
  permissionCategories: PermissionCategory[];
  /** Whether loading role data */
  loading: boolean;
  /** Whether loading permissions */
  loadingPermissions: boolean;
  /** Whether updating */
  updating: boolean;
  /** Error message */
  error: Error | null;
  /** Whether form has changes */
  isDirty: boolean;
}

/**
 * Role detail actions
 */
export interface RoleDetailActions {
  /** Refresh role data */
  refresh: () => Promise<void>;
  /** Update role basic info */
  updateBasicInfo: (params: { name?: string; description?: string }) => Promise<boolean>;
  /** Toggle permission assignment */
  togglePermission: (permissionCode: string) => void;
  /** Assign all permissions in a category */
  assignCategoryPermissions: (categoryKey: string) => void;
  /** Remove all permissions in a category */
  removeCategoryPermissions: (categoryKey: string) => void;
  /** Save permission changes */
  savePermissions: () => Promise<boolean>;
  /** Reset permission changes */
  resetPermissions: () => void;
  /** Delete role */
  delete: () => Promise<boolean>;
  /** Navigate to list page */
  navigateToList: () => void;
}

/**
 * useRoleDetail return type
 */
export type UseRoleDetailReturn = RoleDetailState & RoleDetailActions;

// ============================================================================
// Constants
// ============================================================================

/**
 * Role events
 */
const ROLE_EVENTS = {
  CREATED: 'role:created',
  UPDATED: 'role:updated',
  DELETED: 'role:deleted',
};

/**
 * Available permission definitions
 * 
 * In production, this would be fetched from the backend.
 */
const AVAILABLE_PERMISSIONS: PermissionCategory[] = [
  {
    key: 'users',
    name: '用户管理',
    permissions: [
      { code: 'user:read', name: '查看用户', description: '查看用户列表和详情', assigned: false },
      { code: 'user:create', name: '创建用户', description: '创建新用户', assigned: false },
      { code: 'user:update', name: '编辑用户', description: '修改用户信息', assigned: false },
      { code: 'user:delete', name: '删除用户', description: '删除用户', assigned: false },
      { code: 'user:reset-password', name: '重置密码', description: '重置用户密码', assigned: false },
    ],
  },
  {
    key: 'roles',
    name: '角色管理',
    permissions: [
      { code: 'role:read', name: '查看角色', description: '查看角色列表和详情', assigned: false },
      { code: 'role:create', name: '创建角色', description: '创建新角色', assigned: false },
      { code: 'role:update', name: '编辑角色', description: '修改角色信息', assigned: false },
      { code: 'role:delete', name: '删除角色', description: '删除角色', assigned: false },
      { code: 'role:assign', name: '分配角色', description: '为用户分配角色', assigned: false },
    ],
  },
  {
    key: 'organizations',
    name: '组织管理',
    permissions: [
      { code: 'org:read', name: '查看组织', description: '查看组织架构', assigned: false },
      { code: 'org:create', name: '创建组织', description: '创建组织单元', assigned: false },
      { code: 'org:update', name: '编辑组织', description: '修改组织信息', assigned: false },
      { code: 'org:delete', name: '删除组织', description: '删除组织单元', assigned: false },
    ],
  },
  {
    key: 'partners',
    name: '合作方管理',
    permissions: [
      { code: 'partner:read', name: '查看合作方', description: '查看合作方信息', assigned: false },
      { code: 'partner:create', name: '创建合作方', description: '添加新合作方', assigned: false },
      { code: 'partner:update', name: '编辑合作方', description: '修改合作方信息', assigned: false },
      { code: 'partner:delete', name: '删除合作方', description: '删除合作方', assigned: false },
      { code: 'partner:approve', name: '审批合作方', description: '审批合作方申请', assigned: false },
    ],
  },
  {
    key: 'products',
    name: '产品管理',
    permissions: [
      { code: 'product:read', name: '查看产品', description: '查看产品信息', assigned: false },
      { code: 'product:create', name: '创建产品', description: '创建新产品', assigned: false },
      { code: 'product:update', name: '编辑产品', description: '修改产品信息', assigned: false },
      { code: 'product:delete', name: '删除产品', description: '删除产品', assigned: false },
      { code: 'product:publish', name: '上架产品', description: '发布产品', assigned: false },
    ],
  },
  {
    key: 'system',
    name: '系统管理',
    permissions: [
      { code: 'system:config', name: '系统配置', description: '修改系统配置', assigned: false },
      { code: 'system:audit', name: '审计日志', description: '查看审计日志', assigned: false },
      { code: 'system:backup', name: '数据备份', description: '执行数据备份', assigned: false },
    ],
  },
];

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Role Detail Hook
 * 
 * Manages role detail state and provides actions for interaction.
 * 
 * @param options - Configuration options
 * @param options.id - Role ID
 * @returns Role detail state and actions
 * 
 * @example
 * ```tsx
 * const {
 *   role,
 *   loading,
 *   permissionCategories,
 *   togglePermission,
 *   savePermissions,
 * } = useRoleDetail({ id: 1 });
 * ```
 */
export function useRoleDetail(options: { id?: number }): UseRoleDetailReturn {
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
  const [role, setRole] = useState<Role | null>(null);
  const [currentPermissions, setCurrentPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ─────────────────────────────────────────────────────────
  // Computed: Permission Categories with Assignment Status
  // ─────────────────────────────────────────────────────────
  const permissionCategories = useMemo(() => {
    return AVAILABLE_PERMISSIONS.map((category) => ({
      ...category,
      permissions: category.permissions.map((perm) => ({
        ...perm,
        assigned: currentPermissions.includes(perm.code),
      })),
    }));
  }, [currentPermissions]);

  // ─────────────────────────────────────────────────────────
  // Computed: Is Dirty (has unsaved changes)
  // ─────────────────────────────────────────────────────────
  const isDirty = useMemo(() => {
    if (!role) return false;
    
    const original = new Set(role.permissions);
    const current = new Set(currentPermissions);
    
    if (original.size !== current.size) return true;
    
    for (const perm of original) {
      if (!current.has(perm)) return true;
    }
    
    return false;
  }, [role, currentPermissions]);

  // ─────────────────────────────────────────────────────────
  // Load Role
  // ─────────────────────────────────────────────────────────
  const loadRole = useCallback(async () => {
    if (!options.id) {
      setError(new Error('Role ID is required'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await repository.getById(options.id);
      setRole(data);
      setCurrentPermissions(data.permissions || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load role'));
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [repository, options.id]);

  // Initial load
  useEffect(() => {
    loadRole();
  }, [loadRole]);

  // Subscribe to role events
  useEffect(() => {
    const unsubscribe = eventBus.on(ROLE_EVENTS.UPDATED, (data: { id?: number }) => {
      if (data?.id === role?.id) {
        loadRole();
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [eventBus, role?.id, loadRole]);

  // ─────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────
  
  /**
   * Refresh role data
   */
  const refresh = useCallback(async () => {
    await loadRole();
  }, [loadRole]);

  /**
   * Update role basic info
   */
  const updateBasicInfo = useCallback(async (params: { name?: string; description?: string }): Promise<boolean> => {
    if (!role?.id) return false;

    setUpdating(true);
    setError(null);

    try {
      const updated = await repository.update(role.id, params);
      setRole(updated);
      eventBus.emit(ROLE_EVENTS.UPDATED, { id: role.id });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update role'));
      return false;
    } finally {
      setUpdating(false);
    }
  }, [repository, role?.id, eventBus]);

  /**
   * Toggle permission assignment
   */
  const togglePermission = useCallback((permissionCode: string) => {
    setCurrentPermissions((prev) =>
      prev.includes(permissionCode)
        ? prev.filter((p) => p !== permissionCode)
        : [...prev, permissionCode]
    );
  }, []);

  /**
   * Assign all permissions in a category
   */
  const assignCategoryPermissions = useCallback((categoryKey: string) => {
    const category = AVAILABLE_PERMISSIONS.find((c) => c.key === categoryKey);
    if (!category) return;

    const categoryCodes = category.permissions.map((p) => p.code);
    setCurrentPermissions((prev) => {
      const existing = new Set(prev);
      categoryCodes.forEach((code) => existing.add(code));
      return Array.from(existing);
    });
  }, []);

  /**
   * Remove all permissions in a category
   */
  const removeCategoryPermissions = useCallback((categoryKey: string) => {
    const category = AVAILABLE_PERMISSIONS.find((c) => c.key === categoryKey);
    if (!category) return;

    const categoryCodes = new Set(category.permissions.map((p) => p.code));
    setCurrentPermissions((prev) => prev.filter((p) => !categoryCodes.has(p)));
  }, []);

  /**
   * Save permission changes
   */
  const savePermissions = useCallback(async (): Promise<boolean> => {
    if (!role?.id) return false;

    setUpdating(true);
    setError(null);

    try {
      const updated = await repository.update(role.id, { permissions: currentPermissions });
      setRole(updated);
      eventBus.emit(ROLE_EVENTS.UPDATED, { id: role.id });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save permissions'));
      return false;
    } finally {
      setUpdating(false);
    }
  }, [repository, role?.id, currentPermissions, eventBus]);

  /**
   * Reset permission changes
   */
  const resetPermissions = useCallback(() => {
    if (role) {
      setCurrentPermissions(role.permissions || []);
    }
  }, [role]);

  /**
   * Delete role
   */
  const deleteRole = useCallback(async (): Promise<boolean> => {
    if (!role?.id) return false;

    try {
      await repository.delete(role.id);
      eventBus.emit(ROLE_EVENTS.DELETED, { id: role.id });
      navigation.navigate('/roles');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete role'));
      return false;
    }
  }, [repository, role?.id, eventBus, navigation]);

  /**
   * Navigate to list page
   */
  const navigateToList = useCallback(() => {
    navigation.navigate('/roles');
  }, [navigation]);

  // ─────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────
  return {
    // State
    role,
    permissionCategories,
    loading,
    loadingPermissions,
    updating,
    error,
    isDirty,
    // Actions
    refresh,
    updateBasicInfo,
    togglePermission,
    assignCategoryPermissions,
    removeCategoryPermissions,
    savePermissions,
    resetPermissions,
    delete: deleteRole,
    navigateToList,
  };
}
