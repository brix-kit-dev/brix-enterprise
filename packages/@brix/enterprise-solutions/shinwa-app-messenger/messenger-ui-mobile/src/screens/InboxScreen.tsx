/**
 * Inbox Screen
 * 
 * [Three-Layer Separation Architecture]
 * - UI layer (this file): Responsible for rendering and user interaction
 * - Hook layer (hooks/useInbox): Encapsulates business logic and state management
 * - Data layer (api/): Communicates with backend through HttpCapability
 * 
 * <p>Displays the user's received message list
 * 
 * @author Shinwa Team
 * @since 3.0.0
 * @version 3.2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Appbar,
  Card,
  Chip,
  Badge,
  Divider,
  ActivityIndicator,
  FAB,
  Snackbar,
  Menu,
  IconButton,
} from 'react-native-paper';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MessageDTO, MessageStatus } from '../types';
import { useInbox } from '../hooks';
import { MessengerRoutes } from '../navigation';

type InboxScreenNavigationProp = NativeStackNavigationProp<any, 'Inbox'>;

interface Props {
  navigation: InboxScreenNavigationProp;
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
 * Message list item component
 */
const MessageItem: React.FC<{
  message: MessageDTO;
  onPress: () => void;
}> = ({ message, onPress }) => {
  const isUnread = message.status === 'UNREAD';
  
  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={[styles.messageCard, isUnread && styles.unreadCard]}>
        <Card.Content>
          <View style={styles.messageHeader}>
            <View style={styles.titleRow}>
              {isUnread && <Badge size={8} style={styles.unreadBadge} />}
              <Text 
                variant="titleMedium" 
                style={[styles.title, isUnread && styles.unreadTitle]}
                numberOfLines={1}
              >
                {message.title}
              </Text>
            </View>
            <Chip 
              mode="flat" 
              compact 
              style={{ backgroundColor: typeColors[message.type] || '#757575' }}
              textStyle={styles.chipText}
            >
              {message.type}
            </Chip>
          </View>
          
          <Text 
            variant="bodyMedium" 
            style={styles.content}
            numberOfLines={2}
          >
            {message.content}
          </Text>
          
          <View style={styles.footer}>
            <Text variant="bodySmall" style={styles.sender}>
              来自: {message.senderName || message.senderId}
            </Text>
            <Text variant="bodySmall" style={styles.time}>
              {new Date(message.createdAt).toLocaleString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

/**
 * Inbox screen component
 */
export const InboxScreen: React.FC<Props> = ({ navigation }) => {
  // Use Hook to get inbox data (Three-Layer Separation Architecture)
  const {
    messages,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    unreadCount,
    refresh,
    loadMore,
    markAllAsRead,
    archive,
    deleteMessage,
  } = useInbox({ autoFetch: true });
  
  const [menuVisible, setMenuVisible] = useState(false);

  // Display error
  useEffect(() => {
    if (error) {
      // Error handling
    }
  }, [error]);

  // Refresh
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // Load more
  const handleLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);

  // Click message
  const handleMessagePress = useCallback((message: MessageDTO) => {
    navigation.navigate(MessengerRoutes.MessageDetail, { messageId: message.messageId });
  }, [navigation]);

  // Mark all as read
  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
    setMenuVisible(false);
  }, [markAllAsRead]);

  // Navigate to compose
  const handleCompose = useCallback(() => {
    navigation.navigate(MessengerRoutes.Compose);
  }, [navigation]);

  // Render message item
  const renderItem = useCallback(({ item }: { item: MessageDTO }) => (
    <MessageItem message={item} onPress={() => handleMessagePress(item)} />
  ), [handleMessagePress]);

  // Render list footer
  const renderFooter = useCallback(() => {
    if (!hasMore) {
      return (
        <Text style={styles.endText}>— 没有更多消息了 —</Text>
      );
    }
    if (loadingMore) {
      return <ActivityIndicator style={styles.loadingMore} />;
    }
    return null;
  }, [hasMore, loadingMore]);

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text variant="headlineSmall" style={styles.emptyText}>
          📭 暂无消息
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtext}>
          您的收件箱是空的
        </Text>
      </View>
    );
  }, [loading]);

  return (
    <View style={styles.container}>
      {/* Top navigation bar */}
      <Appbar.Header>
        <Appbar.Content 
          title="收件箱" 
          subtitle={unreadCount > 0 ? `${unreadCount} 条未读` : undefined}
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action 
              icon="dots-vertical" 
              onPress={() => setMenuVisible(true)} 
            />
          }
        >
          <Menu.Item 
            onPress={handleMarkAllRead} 
            title="全部标记已读"
            leadingIcon="check-all"
          />
          <Divider />
          <Menu.Item 
            onPress={() => {
              setStatusFilter(undefined);
              setMenuVisible(false);
              handleRefresh();
            }} 
            title="全部消息"
          />
          <Menu.Item 
            onPress={() => {
              setStatusFilter('UNREAD' as MessageStatus);
              setMenuVisible(false);
              handleRefresh();
            }} 
            title="仅未读"
          />
        </Menu>
      </Appbar.Header>

      {/* Message list */}
      {loading && page === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.messageId}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Compose message button */}
      <FAB
        icon="pencil"
        style={styles.fab}
        onPress={handleCompose}
      />

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
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  messageCard: {
    backgroundColor: '#fff',
  },
  unreadCard: {
    backgroundColor: '#E3F2FD',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#1976D2',
    marginRight: 8,
  },
  title: {
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  chipText: {
    color: '#fff',
    fontSize: 10,
  },
  content: {
    color: '#666',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sender: {
    color: '#999',
  },
  time: {
    color: '#999',
  },
  separator: {
    height: 12,
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
  loadingMore: {
    paddingVertical: 16,
  },
  endText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
