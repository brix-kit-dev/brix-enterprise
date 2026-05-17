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
 * @file index.tsx
 * @description 预约模块 Mobile 前端入口
 * @module @brix-sdk/enterprise-booking-ui-mobile
 * @version 3.0.0
 * 
 * 生成时间: 2026-01-28
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * 预约模块主组件
 */
export const BookingPlugin: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>预约管理</Text>
      <Text style={styles.subtitle}>Brix Platform 预约模块 v3.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
});

/**
 * 插件元信息
 */
export const pluginMeta = {
  name: 'booking',
  displayName: '预约管理',
  version: '3.0.0-SNAPSHOT',
  description: 'Brix Platform 预约管理模块 - Mobile',
};

// Export screen components (React Native convention: screens, not pages)
export { BookingListScreen as BookingList } from './screens';
export { BookingDetailScreen as BookingDetail } from './screens';
export { BookingCreateScreen as BookingCreate } from './screens';

// 导出类型
export * from './types';

export default BookingPlugin;
