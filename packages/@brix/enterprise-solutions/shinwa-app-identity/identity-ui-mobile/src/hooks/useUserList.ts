/**
 * 用户列表 Hook
 *
 * 【三层分离架构说明】
 * - 此 Hook 位于业务逻辑层，封装用户列表的获取和状态管理
 * - 通过 useHttp 获取 HttpCapability，再创建 UserApiService 调用后端
 * - UI层（screens/UserListScreen）只需调用此 Hook，无需关心数据获取细节
 *
 * @author Shinwa Team
 * @since 3.0.0
 * @version 3.2.0
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useHttp } from '@brix/runtime-sdk-react';
import { createUserApiService, type UserApiService } from '../api';
import type { UserDTO } from '../types';

/**
 * 分页响应类型
 */
interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * useUserList 参数选项
 */
export interface UseUserListOptions {
  /** 租户ID */
  tenantId?: string;
  /** 初始页码 */
  initialPage?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 是否自动加载 */
  autoFetch?: boolean;
}

/**
 * useUserList 返回值
 */
export interface UseUserListReturn {
  /** 用户列表 */
  users: UserDTO[];
  /** 是否加载中 */
  loading: boolean;
  /** 是否刷新中 */
  refreshing: boolean;
  /** 是否加载更多中 */
  loadingMore: boolean;
  /** 错误信息 */
  error: string | null;
  /** 是否还有更多数据 */
  hasMore: boolean;
  /** 当前页码 */
  page: number;
  /** 搜索关键词 */
  searchQuery: string;
  /** 设置搜索关键词 */
  setSearchQuery: (query: string) => void;
  /** 刷新列表 */
  refresh: () => Promise<void>;
  /** 加载更多 */
  loadMore: () => void;
  /** 重新加载 */
  reload: () => Promise<void>;
}

/**
 * 用户列表 Hook
 *
 * @param options 配置选项
 * @returns 用户列表状态和操作方法
 *
 * @example
 * ```tsx
 * function UserListScreen() {
 *   const {
 *     users,
 *     loading,
 *     refreshing,
 *     hasMore,
 *     refresh,
 *     loadMore,
 *     searchQuery,
 *     setSearchQuery,
 *   } = useUserList({ tenantId: 'default' });
 *
 *   return (
 *     <FlatList
 *       data={users}
 *       refreshing={refreshing}
 *       onRefresh={refresh}
 *       onEndReached={loadMore}
 *     />
 *   );
 * }
 * ```
 */
export function useUserList(options: UseUserListOptions = {}): UseUserListReturn {
  const {
    tenantId = 'default',
    initialPage = 0,
    pageSize = 20,
    autoFetch = true,
  } = options;

  // 获取 HttpCapability
  const http = useHttp();

  // 创建 API 服务
  const userApi: UserApiService | null = useMemo(() => {
    if (!http) return null;
    return createUserApiService(http);
  }, [http]);

  // 状态
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * 获取用户列表
   */
  const fetchUsers = useCallback(
    async (isRefresh = false) => {
      if (!userApi) {
        setError('HTTP 能力未就绪');
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
        setPage(0);
      } else if (page === 0) {
        setLoading(true);
      }

      setError(null);

      try {
        const response: PageResponse<UserDTO> = await userApi.list({
          tenantId,
          page: isRefresh ? 0 : page,
          size: pageSize,
          keyword: searchQuery || undefined,
        });

        if (isRefresh || page === 0) {
          setUsers(response.content);
        } else {
          setUsers((prev) => [...prev, ...response.content]);
        }

        setHasMore(response.number < response.totalPages - 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载用户列表失败');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [userApi, tenantId, page, pageSize, searchQuery]
  );

  /**
   * 刷新列表
   */
  const refresh = useCallback(async () => {
    await fetchUsers(true);
  }, [fetchUsers]);

  /**
   * 加载更多
   */
  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    setPage((prev) => prev + 1);
  }, [hasMore, loadingMore, loading]);

  /**
   * 重新加载（搜索变化时）
   */
  const reload = useCallback(async () => {
    setPage(0);
    await fetchUsers(true);
  }, [fetchUsers]);

  // 自动加载
  useEffect(() => {
    if (autoFetch && userApi) {
      fetchUsers();
    }
  }, [autoFetch, userApi, page, searchQuery]);

  return {
    users,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    page,
    searchQuery,
    setSearchQuery,
    refresh,
    loadMore,
    reload,
  };
}
