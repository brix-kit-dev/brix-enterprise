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
 * 用户列表页面 - React Native
 * 
 * 【三层分离架构】
 * - UI层（本文件）：负责渲染和用户交互
 * - Hook层（hooks/useUserList）：封装业务逻辑和状态管理
 * - 数据层（api/）：通过 HttpCapability 与后端通信
 * 
 * v3.0 Runtime Shell 架构
 * 迁移自: plugin-user-mobile/screens/UserListScreen.tsx
 * 
 * @author Brix Team
 * @since 3.0.0
 * @version 3.2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Searchbar,
  Avatar,
  Chip,
  FAB,
  ActivityIndicator,
  Divider,
  Card,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTenant } from '@brix-sdk/platform-tenant-web';
import { useUserList } from '../hooks';
import type { UserDTO, IdentityStackParamList } from '../types';
import { USER_ROLE_LABELS, USER_STATUS_LABELS, USER_STATUS_COLORS } from '../types';

type NavigationProp = NativeStackNavigationProp<IdentityStackParamList, 'UserList'>;

/**
 * 用户列表页面组件
 */
export default function UserListScreen(): React.ReactElement {
  const navigation = useNavigation<NavigationProp>();
  const { tenant } = useTenant();
  
  // 使用 Hook 获取用户列表（三层分离架构）
  const {
    users,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    searchQuery,
    setSearchQuery,
    refresh,
    loadMore,
  } = useUserList({ tenantId: tenant?.id ?? '' });

  // 显示错误
  useEffect(() => {
    if (error) {
      Alert.alert('错误', error);
    }
  }, [error]);

  // 刷新
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // 加载更多
  const handleLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);

  // 搜索
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  // 导航到详情
  const handleUserPress = useCallback((user: UserDTO) => {
    navigation.navigate('UserDetail', { userId: user.userId });
  }, [navigation]);

  // 导航到创建
  const handleCreate = useCallback(() => {
    navigation.navigate('UserCreate', undefined);
  }, [navigation]);

  // 渲染用户项
  const renderUserItem = useCallback(({ item }: { item: UserDTO }) => (
    <TouchableOpacity onPress={() => handleUserPress(item)}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Avatar.Text
            size={48}
            label={item.displayName?.charAt(0) || item.username.charAt(0).toUpperCase()}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text variant="titleMedium" style={styles.userName}>
              {item.displayName || item.username}
            </Text>
            <Text variant="bodySmall" style={styles.userUsername}>
              @{item.username}
            </Text>
            <View style={styles.chips}>
              <Chip
                mode="outlined"
                compact
                style={styles.chip}
                textStyle={styles.chipText}
              >
                {USER_ROLE_LABELS[item.role] || item.role}
              </Chip>
              <Chip
                compact
                style={[
                  styles.chip,
                  { backgroundColor: USER_STATUS_COLORS[item.status] },
                ]}
                textStyle={[styles.chipText, { color: '#fff' }]}
              >
                {USER_STATUS_LABELS[item.status] || item.status}
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  ), [handleUserPress]);

  // 渲染列表底部
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" />
      </View>
    );
  }, [loadingMore]);

  // 渲染空状态
  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <Text variant="bodyLarge">暂无用户数据</Text>
      </View>
    );
  }, [loading]);

  if (loading && users.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <Searchbar
        placeholder="搜索用户..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      {/* 用户列表 */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.userId}
        renderItem={renderUserItem}
        ItemSeparatorComponent={Divider}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
      />
      
      {/* 创建按钮 */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  card: {
    marginVertical: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
  },
  userUsername: {
    color: '#666',
    marginBottom: 4,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    height: 24,
  },
  chipText: {
    fontSize: 10,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
