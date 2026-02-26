/**
 * Message Module Navigation Configuration
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InboxScreen } from './screens/InboxScreen';
import { MessageDetailScreen } from './screens/MessageDetailScreen';
import { ComposeScreen } from './screens/ComposeScreen';

/**
 * Route name constants
 */
export const MessengerRoutes = {
  Inbox: 'Inbox',
  MessageDetail: 'MessageDetail',
  Compose: 'Compose',
} as const;

/**
 * Route parameter types
 */
export type MessengerStackParamList = {
  [MessengerRoutes.Inbox]: undefined;
  [MessengerRoutes.MessageDetail]: { messageId: string };
  [MessengerRoutes.Compose]: { receiverId?: string } | undefined;
};

const Stack = createNativeStackNavigator<MessengerStackParamList>();

/**
 * Message Module Navigator
 */
export const MessengerNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName={MessengerRoutes.Inbox}
      screenOptions={{
        headerShown: false, // Use custom Appbar
      }}
    >
      <Stack.Screen 
        name={MessengerRoutes.Inbox} 
        component={InboxScreen}
        options={{
          title: '收件箱',
        }}
      />
      <Stack.Screen 
        name={MessengerRoutes.MessageDetail} 
        component={MessageDetailScreen}
        options={{
          title: '消息详情',
        }}
      />
      <Stack.Screen 
        name={MessengerRoutes.Compose} 
        component={ComposeScreen}
        options={{
          title: '发送消息',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};
