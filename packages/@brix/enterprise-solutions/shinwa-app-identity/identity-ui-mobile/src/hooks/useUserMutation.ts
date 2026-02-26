/**
 * 用户变更 Hook
 *
 * 【三层分离架构说明】
 * - 此 Hook 位于业务逻辑层，封装用户创建/更新操作
 * - 通过 useHttp 获取 HttpCapability，再创建 UserApiService 调用后端
 * - UI层（screens/UserCreateScreen）只需调用此 Hook，无需关心数据提交细节
 *
 * @author Shinwa Team
 * @since 3.0.0
 * @version 3.2.0
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useHttp } from '@brix/runtime-sdk-react';
import { createUserApiService, type UserApiService } from '../api';
import type { UserDTO, CreateUserRequest, UpdateUserRequest } from '../types';

/**
 * useUserMutation 返回值
 */
export interface UseUserMutationReturn {
  /** 用户详情（编辑模式时） */
  user: UserDTO | null;
  /** 是否加载中 */
  loading: boolean;
  /** 是否提交中 */
  submitting: boolean;
  /** 错误信息 */
  error: string | null;
  /** 创建用户 */
  create: (request: CreateUserRequest) => Promise<UserDTO | null>;
  /** 更新用户 */
  update: (userId: string, request: UpdateUserRequest) => Promise<UserDTO | null>;
  /** 删除用户 */
  remove: (userId: string) => Promise<boolean>;
  /** 加载用户详情（用于编辑） */
  fetchUser: (userId: string) => Promise<void>;
}

/**
 * 用户变更 Hook
 *
 * @returns 用户变更状态和操作方法
 *
 * @example
 * ```tsx
 * function UserCreateScreen({ userId }: { userId?: string }) {
 *   const {
 *     user,
 *     loading,
 *     submitting,
 *     create,
 *     update,
 *     fetchUser,
 *   } = useUserMutation();
 *
 *   useEffect(() => {
 *     if (userId) fetchUser(userId);
 *   }, [userId]);
 *
 *   const handleSubmit = async (data: CreateUserRequest) => {
 *     if (userId) {
 *       await update(userId, data);
 *     } else {
 *       await create(data);
 *     }
 *   };
 *
 *   return <UserForm data={user} onSubmit={handleSubmit} />;
 * }
 * ```
 */
export function useUserMutation(): UseUserMutationReturn {
  // 获取 HttpCapability
  const http = useHttp();

  // 创建 API 服务
  const userApi: UserApiService | null = useMemo(() => {
    if (!http) return null;
    return createUserApiService(http);
  }, [http]);

  // 状态
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载用户详情
   */
  const fetchUser = useCallback(
    async (userId: string) => {
      if (!userApi) {
        setError('HTTP 能力未就绪');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await userApi.getByUserId(userId);
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载用户详情失败');
      } finally {
        setLoading(false);
      }
    },
    [userApi]
  );

  /**
   * 创建用户
   */
  const create = useCallback(
    async (request: CreateUserRequest): Promise<UserDTO | null> => {
      if (!userApi) {
        setError('HTTP 能力未就绪');
        return null;
      }

      setSubmitting(true);
      setError(null);

      try {
        const data = await userApi.create(request);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : '创建用户失败');
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [userApi]
  );

  /**
   * 更新用户
   */
  const update = useCallback(
    async (userId: string, request: UpdateUserRequest): Promise<UserDTO | null> => {
      if (!userApi) {
        setError('HTTP 能力未就绪');
        return null;
      }

      setSubmitting(true);
      setError(null);

      try {
        const data = await userApi.update(userId, request);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : '更新用户失败');
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [userApi]
  );

  /**
   * 删除用户
   */
  const remove = useCallback(
    async (userId: string): Promise<boolean> => {
      if (!userApi) {
        setError('HTTP 能力未就绪');
        return false;
      }

      setSubmitting(true);
      setError(null);

      try {
        await userApi.delete(userId);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : '删除用户失败');
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [userApi]
  );

  return {
    user,
    loading,
    submitting,
    error,
    create,
    update,
    remove,
    fetchUser,
  };
}
