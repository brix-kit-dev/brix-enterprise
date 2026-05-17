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
 * 用户详情页面 - React Native
 * 
 * 【三层分离架构】
 * - UI层（本文件）：负责渲染和用户交互
 * - Hook层（hooks/useUserDetail）：封装业务逻辑和状态管理
 * - 数据层（api/）：通过 HttpCapability 与后端通信
 * 
 * v3.0 Runtime Shell 架构
 * 迁移自: plugin-user-mobile/screens/UserDetailScreen.tsx
 * 
 * @author Brix Team
 * @since 3.0.0
 * @version 3.2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Avatar,
  Chip,
  Button,
  ActivityIndicator,
  Divider,
  Card,
  Dialog,
  Portal,
  TextInput,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUserDetail } from '../hooks';
import type { UserDTO, IdentityStackParamList } from '../types';
import { USER_ROLE_LABELS, USER_STATUS_LABELS, USER_STATUS_COLORS } from '../types';

type RouteProps = RouteProp<IdentityStackParamList, 'UserDetail'>;
type NavigationProp = NativeStackNavigationProp<IdentityStackParamList, 'UserDetail'>;

/**
 * 用户详情页面组件
 */
export default function UserDetailScreen(): React.ReactElement {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { userId } = route.params;
  
  // 使用 Hook 获取用户详情（三层分离架构）
  const {
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
  } = useUserDetail(userId);
  
  // 密码重置对话框
  const [passwordDialogVisible, setPasswordDialogVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');

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

  // 编辑用户
  const handleEdit = useCallback(() => {
    navigation.navigate('UserCreate', { userId });
  }, [navigation, userId]);

  // 启用用户
  const handleEnable = useCallback(async () => {
    const success = await enable('管理员启用');
    if (success) {
      Alert.alert('成功', '用户已启用');
    }
  }, [enable]);

  // 禁用用户
  const handleDisable = useCallback(() => {
    Alert.alert('确认', '确定要禁用该用户吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          const success = await disable('管理员禁用');
          if (success) {
            Alert.alert('成功', '用户已禁用');
          }
        },
      },
    ]);
  }, [disable]);

  // 锁定用户
  const handleLock = useCallback(() => {
    Alert.alert('确认', '确定要锁定该用户吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          const success = await lock('管理员锁定');
          if (success) {
            Alert.alert('成功', '用户已锁定');
          }
        },
      },
    ]);
  }, [lock]);

  // 解锁用户
  const handleUnlock = useCallback(async () => {
    const success = await unlock('管理员解锁');
    if (success) {
      Alert.alert('成功', '用户已解锁');
    }
  }, [unlock]);

  // 重置密码
  const handleResetPassword = useCallback(async () => {
    if (!newPassword) {
      Alert.alert('错误', '请输入新密码');
      return;
    }
    
    const success = await resetPassword(newPassword);
    if (success) {
      setPasswordDialogVisible(false);
      setNewPassword('');
      Alert.alert('成功', '密码已重置');
    }
  }, [newPassword, resetPassword]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text>用户不存在</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* 头像和基本信息 */}
        <Card style={styles.card}>
          <Card.Content style={styles.profileSection}>
            <Avatar.Text
              size={80}
              label={user.displayName?.charAt(0) || user.username.charAt(0).toUpperCase()}
            />
            <Text variant="headlineSmall" style={styles.displayName}>
              {user.displayName || user.username}
            </Text>
            <Text variant="bodyMedium" style={styles.username}>
              @{user.username}
            </Text>
            <View style={styles.chips}>
              <Chip mode="outlined" style={styles.chip}>
                {USER_ROLE_LABELS[user.role] || user.role}
              </Chip>
              <Chip
                style={[
                  styles.chip,
                  { backgroundColor: USER_STATUS_COLORS[user.status] },
                ]}
                textStyle={{ color: '#fff' }}
              >
                {USER_STATUS_LABELS[user.status] || user.status}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* 详细信息 */}
        <Card style={styles.card}>
          <Card.Title title="详细信息" />
          <Card.Content>
            <InfoRow label="用户ID" value={user.userId} />
            <Divider style={styles.divider} />
            <InfoRow label="租户ID" value={user.tenantId} />
            <Divider style={styles.divider} />
            <InfoRow label="邮箱" value={user.email || '-'} />
            <Divider style={styles.divider} />
            <InfoRow label="手机号" value={user.phone || '-'} />
            <Divider style={styles.divider} />
            <InfoRow label="创建时间" value={new Date(user.createdAt).toLocaleString()} />
            <Divider style={styles.divider} />
            <InfoRow
              label="最后登录"
              value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-'}
            />
          </Card.Content>
        </Card>

        {/* 操作按钮 */}
        <Card style={styles.card}>
          <Card.Title title="操作" />
          <Card.Content style={styles.actions}>
            <Button
              mode="outlined"
              icon="pencil"
              onPress={handleEdit}
              style={styles.actionButton}
            >
              编辑
            </Button>
            <Button
              mode="outlined"
              icon="key"
              onPress={() => setPasswordDialogVisible(true)}
              style={styles.actionButton}
            >
              重置密码
            </Button>
          </Card.Content>
          <Divider />
          <Card.Content style={styles.statusActions}>
            {user.status === 'ACTIVE' && (
              <>
                <Button
                  mode="outlined"
                  icon="lock"
                  textColor="#ff9800"
                  onPress={handleLock}
                  disabled={actionLoading}
                  style={styles.statusButton}
                >
                  锁定
                </Button>
                <Button
                  mode="outlined"
                  icon="cancel"
                  textColor="#f44336"
                  onPress={handleDisable}
                  disabled={actionLoading}
                  style={styles.statusButton}
                >
                  禁用
                </Button>
              </>
            )}
            {user.status === 'LOCKED' && (
              <Button
                mode="outlined"
                icon="lock-open"
                textColor="#4caf50"
                onPress={handleUnlock}
                disabled={actionLoading}
                style={styles.statusButton}
              >
                解锁
              </Button>
            )}
            {user.status === 'DISABLED' && (
              <Button
                mode="outlined"
                icon="check-circle"
                textColor="#4caf50"
                onPress={handleEnable}
                disabled={actionLoading}
                style={styles.statusButton}
              >
                启用
              </Button>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* 密码重置对话框 */}
      <Portal>
        <Dialog
          visible={passwordDialogVisible}
          onDismiss={() => setPasswordDialogVisible(false)}
        >
          <Dialog.Title>重置密码</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="新密码"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPasswordDialogVisible(false)}>取消</Button>
            <Button onPress={handleResetPassword} disabled={!newPassword || actionLoading}>
              确认
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

/**
 * 信息行组件
 */
function InfoRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.infoRow}>
      <Text variant="bodySmall" style={styles.infoLabel}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={styles.infoValue}>
        {value}
      </Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  displayName: {
    marginTop: 12,
    fontWeight: 'bold',
  },
  username: {
    color: '#666',
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    marginHorizontal: 4,
  },
  divider: {
    marginVertical: 8,
  },
  infoRow: {
    paddingVertical: 4,
  },
  infoLabel: {
    color: '#666',
  },
  infoValue: {
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 16,
  },
  statusButton: {
    marginRight: 8,
  },
});
