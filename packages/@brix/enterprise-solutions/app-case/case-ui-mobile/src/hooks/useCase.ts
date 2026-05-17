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
 * @file Case 模块 Hooks（Mobile）
 * @description ViewModel 层 — 业务逻辑和状态管理
 * @module @brix-sdk/enterprise-case-ui-mobile
 * @version 3.0.0-SNAPSHOT
 *
 * 由 @brix-sdk/create-brix 2026-02-23 自动生成
 *
 * 【设计说明】
 * 遵循 MVVM 分层架构，Hooks 作为 ViewModel 层：
 * 1. 封装业务逻辑和状态管理
 * 2. 调用 Repository 获取数据
 * 3. 向 View 层提供响应式状态和操作方法
 *
 * 【架构红线】
 * - Hooks 不直接访问 HttpCapability，通过 Repository 层
 * - Hooks 不包含 UI 渲染逻辑
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRuntimeContext } from '@brix-sdk/runtime-sdk-react';
import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-mobile';
import { HttpCapabilityType } from '@brix-sdk/runtime-sdk-api-mobile';
import type { CaseDTO, PagedResponse } from '@brix-sdk/enterprise-case-shared';
import { createCaseRepository } from '../repositories/CaseRepository.js';

// ============================================================================
// 列表 Hook
// ============================================================================

/**
 * Case 模块 列表 Hook 返回类型
 */
export interface UseCaseResult {
  /** 数据列表 */
  items: CaseDTO[];
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否正在刷新 */
  isRefreshing: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 下拉刷新 */
  onRefresh: () => Promise<void>;
  /** 加载更多 */
  onLoadMore: () => Promise<void>;
  /** 点击项目 */
  onItemPress: (item: CaseDTO) => void;
}

/**
 * Case 模块 列表 Hook
 *
 * @returns 列表状态和操作方法
 *
 * @example
 * ```tsx
 * const { items, isLoading, onRefresh } = useCase();
 * ```
 */
export function useCase(): UseCaseResult {
  const context = useRuntimeContext();
  const httpCapability = useMemo(() => {
    const cap = context.getCapability<HttpCapability>(HttpCapabilityType);
    if (!cap) throw new Error('[case-ui-mobile] HttpCapability not registered');
    return cap;
  }, [context]);
  const [items, setItems] = useState<CaseDTO[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Repository instance (memoized per httpCapability)
  const repository = useMemo(
    () => createCaseRepository(httpCapability),
    [httpCapability]
  );

  // 加载数据
  const loadData = useCallback(async (pageNum: number, refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response: PagedResponse<CaseDTO> = await repository.list({
        page: pageNum,
        size: 20,
      });

      if (refresh) {
        setItems(response.content);
      } else {
        setItems(prev => [...prev, ...response.content]);
      }

      setPage(pageNum);
      setHasMore(!response.last);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [repository]);

  // 初始加载
  useEffect(() => {
    loadData(0, true);
  }, []);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    await loadData(0, true);
  }, [loadData]);

  // 加载更多
  const onLoadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      await loadData(page + 1);
    }
  }, [isLoading, hasMore, page, loadData]);

  // 点击项目
  const onItemPress = useCallback((_item: CaseDTO) => {
    // Navigation handled by screen-level routing
  }, []);

  return {
    items,
    isLoading,
    isRefreshing,
    error,
    onRefresh,
    onLoadMore,
    onItemPress,
  };
}

// ============================================================================
// 详情 Hook
// ============================================================================

/**
 * Case 模块 详情 Hook 返回类型
 */
export interface UseCaseDetailResult {
  /** 详情数据 */
  item: CaseDTO | null;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 刷新 */
  refresh: () => Promise<void>;
}

/**
 * Case 模块 详情 Hook
 *
 * @param id 资源 ID
 * @returns 详情状态和操作方法
 */
export function useCaseDetail(id: string): UseCaseDetailResult {
  const context = useRuntimeContext();
  const httpCapability = useMemo(() => {
    const cap = context.getCapability<HttpCapability>(HttpCapabilityType);
    if (!cap) throw new Error('[case-ui-mobile] HttpCapability not registered');
    return cap;
  }, [context]);
  const [item, setItem] = useState<CaseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Repository instance (memoized per httpCapability)
  const repository = useMemo(
    () => createCaseRepository(httpCapability),
    [httpCapability]
  );

  // 加载详情
  const loadDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await repository.getById(Number(id));
      setItem(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [id, repository]);

  // 初始加载
  useEffect(() => {
    loadDetail();
  }, [id]);

  return {
    item,
    isLoading,
    error,
    refresh: loadDetail,
  };
}
