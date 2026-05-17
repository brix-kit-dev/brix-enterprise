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
 * Send Message Screen
 * 
 * [Three-Layer Separation Architecture]
 * - UI layer (this file): Responsible for rendering and user interaction
 * - Hook layer (hooks/useCompose): Encapsulates business logic and state management
 * - Data layer (api/): Communicates with backend through HttpCapability
 * 
 * <p>Used for composing and sending new messages
 * 
 * @author Brix Team
 * @since 3.0.0
 * @version 3.2.0
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Appbar,
  TextInput,
  Button,
  SegmentedButtons,
  Snackbar,
} from 'react-native-paper';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { MessageType, type SendMessageRequest } from '../types';
import { useCompose } from '../hooks';

type ComposeScreenNavigationProp = NativeStackNavigationProp<any, 'Compose'>;
type ComposeScreenRouteProp = RouteProp<{ Compose: { receiverId?: string } }, 'Compose'>;

interface Props {
  navigation: ComposeScreenNavigationProp;
  route: ComposeScreenRouteProp;
}

/**
 * Message type options
 */
const messageTypeOptions = [
  { value: MessageType.PERSONAL, label: '个人消息' },
  { value: MessageType.REMINDER, label: '提醒' },
  { value: MessageType.ANNOUNCEMENT, label: '公告' },
];

/**
 * Send message screen component
 */
export const ComposeScreen: React.FC<Props> = ({ navigation, route }) => {
  const initialReceiverId = route.params?.receiverId || '';
  
  // Use Hook to handle message sending (Three-Layer Separation Architecture)
  const { sending, success, error, send, reset } = useCompose();
  
  const [receiverId, setReceiverId] = useState(initialReceiverId);
  const [messageType, setMessageType] = useState<MessageType>(MessageType.PERSONAL);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Validate form
  const isValid = receiverId.trim() && title.trim() && content.trim();

  // Return after success
  useEffect(() => {
    if (success) {
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    }
  }, [success, navigation]);

  // Send message
  const handleSend = useCallback(async () => {
    if (!isValid) {
      return;
    }

    const request: SendMessageRequest = {
      receiverId: receiverId.trim(),
      type: messageType,
      title: title.trim(),
      content: content.trim(),
    };

    await send(request);
  }, [isValid, receiverId, messageType, title, content, send]);

  // Go back
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Clear form
  const handleClear = useCallback(() => {
    setReceiverId(initialReceiverId);
    setMessageType(MessageType.PERSONAL);
    setTitle('');
    setContent('');
    reset();
  }, [initialReceiverId, reset]);

  return (
    <View style={styles.container}>
      {/* Top navigation bar */}
      <Appbar.Header>
        <Appbar.BackAction onPress={handleGoBack} />
        <Appbar.Content title="发送消息" />
        <Appbar.Action icon="refresh" onPress={handleClear} disabled={sending} />
      </Appbar.Header>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Receiver */}
          <TextInput
            label="接收者 ID"
            value={receiverId}
            onChangeText={setReceiverId}
            mode="outlined"
            style={styles.input}
            disabled={sending}
            placeholder="请输入接收者的用户 ID"
          />

          {/* Message type */}
          <Text variant="labelLarge" style={styles.label}>消息类型</Text>
          <SegmentedButtons
            value={messageType}
            onValueChange={(value) => setMessageType(value as MessageType)}
            buttons={messageTypeOptions}
            style={styles.segmented}
            disabled={sending}
          />

          {/* Title */}
          <TextInput
            label="消息标题"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
            disabled={sending}
            placeholder="请输入消息标题"
            maxLength={100}
          />

          {/* Content */}
          <TextInput
            label="消息内容"
            value={content}
            onChangeText={setContent}
            mode="outlined"
            style={styles.contentInput}
            disabled={sending}
            placeholder="请输入消息内容..."
            multiline
            numberOfLines={8}
            maxLength={2000}
          />

          {/* Character count */}
          <Text variant="bodySmall" style={styles.charCount}>
            {content.length} / 2000 字
          </Text>

          {/* Send button */}
          <Button
            mode="contained"
            onPress={handleSend}
            loading={sending}
            disabled={!isValid || sending}
            style={styles.sendButton}
            icon="send"
          >
            发送消息
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success toast */}
      <Snackbar
        visible={success}
        onDismiss={reset}
        duration={1500}
        style={styles.successSnackbar}
      >
        ✓ 消息发送成功！
      </Snackbar>

      {/* Error toast */}
      <Snackbar
        visible={!!error}
        onDismiss={reset}
        duration={3000}
        action={{
          label: '关闭',
          onPress: reset,
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  label: {
    marginBottom: 8,
    color: '#666',
  },
  segmented: {
    marginBottom: 16,
  },
  contentInput: {
    backgroundColor: '#fff',
    minHeight: 200,
  },
  charCount: {
    textAlign: 'right',
    color: '#999',
    marginTop: 4,
    marginBottom: 16,
  },
  sendButton: {
    marginTop: 8,
    marginBottom: 32,
    paddingVertical: 8,
  },
  successSnackbar: {
    backgroundColor: '#4CAF50',
  },
});
