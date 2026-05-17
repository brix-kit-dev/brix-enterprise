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
 * Message Detail Screen
 * 
 * [Three-Layer Separation Architecture]
 * - UI layer (this file): Responsible for rendering and user interaction
 * - Hook layer (hooks/useMessageDetail): Encapsulates business logic and state management
 * - Data layer (api/): Communicates with backend through HttpCapability
 * 
 * <p>Displays the detailed content of a single message
 * 
 * @author Brix Team
 * @since 3.0.0
 * @version 3.2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  Appbar,
  Card,
  Chip,
  Button,
  ActivityIndicator,
  Divider,
  Snackbar,
} from 'react-native-paper';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { MessageDTO } from '../types';
import { useMessageDetail } from '../hooks';

type MessageDetailScreenNavigationProp = NativeStackNavigationProp<any, 'MessageDetail'>;
type MessageDetailScreenRouteProp = RouteProp<{ MessageDetail: { messageId: string } }, 'MessageDetail'>;

interface Props {
  navigation: MessageDetailScreenNavigationProp;
  route: MessageDetailScreenRouteProp;
}

/**
 * Colors corresponding to message types
 */
const typeColors: Record<string, string> = {
  SYSTEM: '#1976D2',
  PERSONAL: '#388E3C',
  ANNOUNCEMENT: '#F57C00',
  REMINDER: '#7B1FA2',
  MARKETING: '#C2185B',
};

/**
 * Message status labels
 */
const statusLabels: Record<string, string> = {
  UNREAD: '未读',
  READ: '已读',
  ARCHIVED: '已归档',
  DELETED: '已删除',
};

/**
 * Message detail screen component
 */
export const MessageDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { messageId } = route.params;
  
  // Use Hook to get message detail (Three-Layer Separation Architecture)
  const {
    message,
    loading,
    actionLoading,
    error,
    archive,
    deleteMessage,
  } = useMessageDetail(messageId);

  // Archive message
  const handleArchive = useCallback(async () => {
    if (!message) return;
    await archive();
  }, [message, archive]);

  // Delete message
  const handleDelete = useCallback(() => {
    Alert.alert(
      '确认删除',
      '确定要删除这条消息吗？删除后无法恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteMessage();
            if (success) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  }, [deleteMessage, navigation]);

  // Go back
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={handleGoBack} />
          <Appbar.Content title="消息详情" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  if (!message) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={handleGoBack} />
          <Appbar.Content title="消息详情" />
        </Appbar.Header>
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall">消息不存在</Text>
          <Button mode="contained" onPress={handleGoBack} style={styles.backButton}>
            返回
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top navigation bar */}
      <Appbar.Header>
        <Appbar.BackAction onPress={handleGoBack} />
        <Appbar.Content title="消息详情" />
        <Appbar.Action 
          icon="archive" 
          onPress={handleArchive} 
          disabled={message.status === 'ARCHIVED' || actionLoading}
        />
        <Appbar.Action 
          icon="delete" 
          onPress={handleDelete} 
          disabled={actionLoading}
        />
      </Appbar.Header>

      {/* Message content */}
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            {/* Title and type */}
            <View style={styles.header}>
              <Text variant="headlineSmall" style={styles.title}>
                {message.title}
              </Text>
              <Chip 
                mode="flat" 
                compact 
                style={{ backgroundColor: typeColors[message.type] || '#757575' }}
                textStyle={styles.chipText}
              >
                {message.type}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            {/* Meta info */}
            <View style={styles.metaInfo}>
              <View style={styles.metaRow}>
                <Text variant="bodyMedium" style={styles.metaLabel}>发送者:</Text>
                <Text variant="bodyMedium">{message.senderName || message.senderId}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text variant="bodyMedium" style={styles.metaLabel}>发送时间:</Text>
                <Text variant="bodyMedium">
                  {new Date(message.createdAt).toLocaleString('zh-CN')}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text variant="bodyMedium" style={styles.metaLabel}>状态:</Text>
                <Chip mode="outlined" compact>
                  {statusLabels[message.status] || message.status}
                </Chip>
              </View>
              {message.readAt && (
                <View style={styles.metaRow}>
                  <Text variant="bodyMedium" style={styles.metaLabel}>已读时间:</Text>
                  <Text variant="bodyMedium">
                    {new Date(message.readAt).toLocaleString('zh-CN')}
                  </Text>
                </View>
              )}
              {message.referenceId && (
                <View style={styles.metaRow}>
                  <Text variant="bodyMedium" style={styles.metaLabel}>关联业务:</Text>
                  <Text variant="bodyMedium">
                    {message.referenceType}: {message.referenceId}
                  </Text>
                </View>
              )}
            </View>

            <Divider style={styles.divider} />

            {/* Message body */}
            <Text variant="bodyLarge" style={styles.messageContent}>
              {message.content}
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Error toast */}
      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={3000}
        action={{
          label: '关闭',
          onPress: () => setError(null),
        }}
      >
        {error}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    marginRight: 12,
  },
  chipText: {
    color: '#fff',
    fontSize: 12,
  },
  divider: {
    marginVertical: 16,
  },
  metaInfo: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    color: '#666',
    width: 80,
  },
  messageContent: {
    lineHeight: 24,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginTop: 16,
  },
});
