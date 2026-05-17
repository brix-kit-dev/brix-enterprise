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
 * @file Case 模块 列表页（Mobile）
 * @description React Native 列表页组件
 * @module @brix-sdk/enterprise-case-ui-mobile
 * @version 3.0.0-SNAPSHOT
 *
 * 由 @brix-sdk/create-brix 2026-02-23 自动生成
 *
 * 【设计说明】
 * 遵循 MVVM 分层架构：
 * - View 层（本文件）：纯 UI 渲染，不包含业务逻辑
 * - ViewModel 层（hooks/）：业务逻辑和状态管理
 * - Repository 层：数据访问（通过 shared 模块）
 *
 * 【架构红线】
 * - 禁止在 View 层直接调用 Repository
 * - 禁止直接使用 fetch/axios
 * - 所有能力通过 RuntimeContext 获取
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useCase } from '../hooks/useCase.js';
import type { CaseDTO } from '@brix-sdk/enterprise-case-shared';

/**
 * Case 模块 列表页组件
 */
export default function CaseList(): React.ReactElement {
  const {
    items,
    isLoading,
    isRefreshing,
    error,
    onRefresh,
    onLoadMore,
    onItemPress,
  } = useCase();

  // 加载状态
  if (isLoading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  // 错误状态
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>加载失败: {error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 空状态
  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>暂无数据</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <CaseItem item={item} onPress={() => onItemPress(item)} />
        )}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

/**
 * 列表项组件
 */
interface CaseItemProps {
  item: CaseDTO;
  onPress: () => void;
}

function CaseItem({ item, onPress }: CaseItemProps): React.ReactElement {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.itemMeta}>
          <Text style={styles.itemStatus}>{item.status}</Text>
          <Text style={styles.itemDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============================================================================
// 样式
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  item: {
    backgroundColor: '#FFF',
    padding: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemStatus: {
    fontSize: 12,
    color: '#1976D2',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
});
