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
 * 身份认证模块 - Mobile 导航配置
 * 
 * v3.0 Runtime Shell 架构
 * 使用 React Navigation Native Stack
 * 
 * @author Brix Team
 * @since 3.0.0
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { IdentityStackParamList } from './types';
import UserListScreen from './screens/UserListScreen';
import UserDetailScreen from './screens/UserDetailScreen';
import UserCreateScreen from './screens/UserCreateScreen';

const Stack = createNativeStackNavigator<IdentityStackParamList>();

/**
 * 身份认证模块导航器
 * 
 * 提供用户管理相关页面的导航栈
 */
export default function IdentityNavigation(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="UserList"
      screenOptions={{
        headerTitleAlign: 'center',
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="UserList"
        component={UserListScreen}
        options={{
          title: '用户管理',
        }}
      />
      <Stack.Screen
        name="UserDetail"
        component={UserDetailScreen}
        options={{
          title: '用户详情',
        }}
      />
      <Stack.Screen
        name="UserCreate"
        component={UserCreateScreen}
        options={{
          title: '创建用户',
        }}
      />
    </Stack.Navigator>
  );
}
