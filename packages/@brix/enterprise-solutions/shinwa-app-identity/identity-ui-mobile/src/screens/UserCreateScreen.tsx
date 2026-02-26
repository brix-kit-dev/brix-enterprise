/**
 * 用户创建/编辑页面 - React Native
 * 
 * 【三层分离架构】
 * - UI层（本文件）：负责渲染和用户交互
 * - Hook层（hooks/useUserMutation）：封装业务逻辑和状态管理
 * - 数据层（api/）：通过 HttpCapability 与后端通信
 * 
 * v3.0 Runtime Shell 架构
 * 迁移自: plugin-user-mobile/screens/UserCreateScreen.tsx
 * 
 * @author Shinwa Team
 * @since 3.0.0
 * @version 3.2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  HelperText,
  SegmentedButtons,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUserMutation } from '../hooks';
import type {
  UserDTO,
  CreateUserRequest,
  UpdateUserRequest,
  UserRole,
  IdentityStackParamList,
} from '../types';
import { USER_ROLE_LABELS } from '../types';

type RouteProps = RouteProp<IdentityStackParamList, 'UserCreate'>;
type NavigationProp = NativeStackNavigationProp<IdentityStackParamList, 'UserCreate'>;

/**
 * 用户创建/编辑页面组件
 */
export default function UserCreateScreen(): React.ReactElement {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const userId = route.params?.userId;
  const isEdit = !!userId;
  
  // 使用 Hook 处理用户变更（三层分离架构）
  const {
    user,
    loading: fetchLoading,
    submitting,
    error,
    create,
    update,
    fetchUser,
  } = useUserMutation();

  // 表单状态
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    password: '',
    email: undefined,
    phone: undefined,
    displayName: undefined,
    avatarUrl: undefined,
    role: 'USER',
    tenantId: 'default',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 加载用户详情（编辑模式）
  useEffect(() => {
    if (isEdit && userId) {
      fetchUser(userId);
    }
  }, [isEdit, userId, fetchUser]);

  // 加载用户数据到表单
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        password: '',
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        tenantId: user.tenantId,
      });
    }
  }, [user]);

  // 显示错误
  useEffect(() => {
    if (error) {
      Alert.alert('错误', error);
    }
  }, [error]);

  // 设置标题
  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? '编辑用户' : '创建用户',
    });
  }, [navigation, isEdit]);

  // 表单字段变更处理
  const handleChange = useCallback((field: keyof CreateUserRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // 表单验证
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username?.trim()) {
      newErrors.username = '用户名不能为空';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名长度不能少于3位';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = '用户名只能包含字母、数字和下划线';
    }
    
    if (!isEdit && !formData.password?.trim()) {
      newErrors.password = '密码不能为空';
    } else if (!isEdit && formData.password && formData.password.length < 6) {
      newErrors.password = '密码长度不能少于6位';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确';
    }
    
    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = '手机号格式不正确';
    }
    
    if (!formData.tenantId?.trim()) {
      newErrors.tenantId = '租户ID不能为空';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isEdit]);

  // 提交表单
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    
    if (isEdit && userId) {
      const updateRequest: UpdateUserRequest = {
        email: formData.email,
        phone: formData.phone,
        displayName: formData.displayName,
        avatarUrl: formData.avatarUrl,
        role: formData.role,
      };
      const result = await update(userId, updateRequest);
      if (result) {
        Alert.alert('成功', '用户信息已更新', [
          { text: '确定', onPress: () => navigation.goBack() },
        ]);
      }
    } else {
      const result = await create(formData);
      if (result) {
        Alert.alert('成功', '用户创建成功', [
          { text: '确定', onPress: () => navigation.goBack() },
        ]);
      }
    }
  }, [formData, isEdit, userId, navigation, validate, create, update]);

  if (fetchLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 角色选项
  const roleOptions = Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 基本信息 */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          基本信息
        </Text>

        <TextInput
          label="用户名 *"
          value={formData.username}
          onChangeText={(text) => handleChange('username', text)}
          mode="outlined"
          style={styles.input}
          disabled={isEdit}
          error={!!errors.username}
        />
        {errors.username && (
          <HelperText type="error" visible>
            {errors.username}
          </HelperText>
        )}

        {!isEdit && (
          <>
            <TextInput
              label="密码 *"
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
              mode="outlined"
              style={styles.input}
              secureTextEntry
              error={!!errors.password}
            />
            {errors.password && (
              <HelperText type="error" visible>
                {errors.password}
              </HelperText>
            )}
          </>
        )}

        <TextInput
          label="显示名称"
          value={formData.displayName || ''}
          onChangeText={(text) => handleChange('displayName', text)}
          mode="outlined"
          style={styles.input}
        />

        <Text variant="bodyMedium" style={styles.roleLabel}>
          角色
        </Text>
        <SegmentedButtons
          value={formData.role}
          onValueChange={(value) => handleChange('role', value as UserRole)}
          buttons={roleOptions}
          style={styles.segmented}
        />

        {/* 联系方式 */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 24 }]}>
          联系方式
        </Text>

        <TextInput
          label="邮箱"
          value={formData.email || ''}
          onChangeText={(text) => handleChange('email', text)}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          error={!!errors.email}
        />
        {errors.email && (
          <HelperText type="error" visible>
            {errors.email}
          </HelperText>
        )}

        <TextInput
          label="手机号"
          value={formData.phone || ''}
          onChangeText={(text) => handleChange('phone', text)}
          mode="outlined"
          style={styles.input}
          keyboardType="phone-pad"
          error={!!errors.phone}
        />
        {errors.phone && (
          <HelperText type="error" visible>
            {errors.phone}
          </HelperText>
        )}

        {/* 其他信息 */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 24 }]}>
          其他信息
        </Text>

        <TextInput
          label="租户ID *"
          value={formData.tenantId}
          onChangeText={(text) => handleChange('tenantId', text)}
          mode="outlined"
          style={styles.input}
          disabled={isEdit}
          error={!!errors.tenantId}
        />
        {errors.tenantId && (
          <HelperText type="error" visible>
            {errors.tenantId}
          </HelperText>
        )}

        <TextInput
          label="头像URL"
          value={formData.avatarUrl || ''}
          onChangeText={(text) => handleChange('avatarUrl', text)}
          mode="outlined"
          style={styles.input}
          autoCapitalize="none"
        />

        {/* 提交按钮 */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.button}
            disabled={submitting}
          >
            取消
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={submitting}
            disabled={submitting}
          >
            {isEdit ? '保存' : '创建'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  roleLabel: {
    marginBottom: 8,
    color: '#666',
  },
  segmented: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  button: {
    minWidth: 100,
  },
});
