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
 * 用户详情 Hook
 *
 * 【三层分离架构说明】
 * - 此 Hook 位于业务逻辑层，封装用户详情获取和状态管理
 * - 通过 useHttp 获取 HttpCapability，再创建 UserApiService 调用后端
 * - UI层（screens/UserDetailScreen）只需调用此 Hook，无需关心数据获取细节
 *
 * @author Brix Team
 * @since 3.0.0
 * @version 3.2.0
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useHttp } from '@brix-sdk/runtime-sdk-react';
import { createUserApiService, type UserApiService } from '../api';
import type { UserDTO } from '../types';

/**
 * useUserDetail 返回值
 */
export interface UseUserDetailReturn {
  /** 用户详情 */
  user: UserDTO | null;
  /** 是否加载中 */
  loading: boolean;
  /** 是否刷新中 */
  refreshing: boolean;
  /** 是否操作中 */
  actionLoading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 刷新详情 */
  refresh: () => Promise<void>;
  /** 启用用户 */
  enable: (reason?: string) => Promise<boolean>;
  /** 禁用用户 */
  disable: (reason?: string) => Promise<boolean>;
  /** 锁定用户 */
  lock: (reason?: string) => Promise<boolean>;
  /** 解锁用户 */
  unlock: (reason?: string) => Promise<boolean>;
  /** 重置密码 */
  resetPassword: (newPassword: string) => Promise<boolean>;
}

/**
 * 用户详情 Hook
 *
 * @param userId 用户ID
 * @returns 用户详情状态和操作方法
 *
 * @example
 * ```tsx
 * function UserDetailScreen({ userId }: { userId: string }) {
 *   const {
 *     user,
 *     loading,
 *     refreshing,
 *     actionLoading,
 *     refresh,
 *     enable,
 *     disable,
 *   } = useUserDetail(userId);
 *
 *   if (loading) return <ActivityIndicator />;
 *   if (!user) return <Text>用户不存在</Text>;
 *
 *   return <UserDetailView user={user} onEnable={enable} />;
 * }
 * ```
 */
export function useUserDetail(userId: string): UseUserDetailReturn {
  // 获取 HttpCapability
  const http = useHttp();

  // 创建 API 服务
  const userApi: UserApiService | null = useMemo(() => {
    if (!http) return null;
    return createUserApiService(http);
  }, [http]);

  // 状态
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 获取用户详情
   */
  const fetchUser = useCallback(
    async (isRefresh = false) => {
      if (!userApi) {
        setError('HTTP 能力未就绪');
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const data = await userApi.getByUserId(userId);
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载用户详情失败');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userApi, userId]
  );

  /**
   * 刷新详情
   */
  const refresh = useCallback(async () => {
    await fetchUser(true);
  }, [fetchUser]);

  /**
   * 启用用户
   */
  const enable = useCallback(
    async (reason?: string): Promise<boolean> => {
      if (!userApi) return false;
      setActionLoading(true);
      try {
        await userApi.enable(userId, reason);
        await fetchUser(true);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : '启用用户失败');
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [userApi, userId, fetchUser]
  );

  /**
   * 禁用用户
   */
  const disable = useCallback(
    async (reason?: string): Promise<boolean> => {
      if (!userApi) return false;
      setActionLoading(true);
      try {
        await userApi.disable(userId, reason);
        await fetchUser(true);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : '禁用用户失败');
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [userApi, userId, fetchUser]
  );

  /**
   * 锁定用户
   */
  const lock = useCallback(
    async (reason?: string): Promise<boolean> => {
      if (!userApi) return false;
      setActionLoading(true);
      try {
        await userApi.lock(userId, reason);
        await fetchUser(true);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : '锁定用户失败');
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [userApi, userId, fetchUser]
  );

  /**
   * 解锁用户
   */
  const unlock = useCallback(
    async (reason?: string): Promise<boolean> => {
      if (!userApi) return false;
      setActionLoading(true);
      try {
        await userApi.unlock(userId, reason);
        await fetchUser(true);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : '解锁用户失败');
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [userApi, userId, fetchUser]
  );

  /**
   * 重置密码
   */
  const resetPassword = useCallback(
    async (newPassword: string): Promise<boolean> => {
      if (!userApi) return false;
      setActionLoading(true);
      try {
        await userApi.resetPassword(userId, newPassword);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : '重置密码失败');
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [userApi, userId]
  );

  // 初始加载
  useEffect(() => {
    if (userApi && userId) {
      fetchUser();
    }
  }, [userApi, userId]);

  return {
    user,
    loading,
    refreshing,
    actionLoading,
    error,
    refresh,
    enable,
    disable,
    lock,
    unlock,
    resetPassword,
  };
}
