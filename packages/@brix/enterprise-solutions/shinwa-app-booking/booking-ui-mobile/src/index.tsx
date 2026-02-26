/**
 * @file index.tsx
 * @description 预约模块 Mobile 前端入口
 * @module @shinwa/booking-ui-mobile
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
      <Text style={styles.subtitle}>Shinwa Platform 预约模块 v3.0</Text>
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
  description: 'Shinwa Platform 预约管理模块 - Mobile',
};

// 导出页面组件
export { default as BookingList } from './pages/BookingList';
export { default as BookingDetail } from './pages/BookingDetail';
export { default as BookingCreate } from './pages/BookingCreate';

// 导出类型
export * from './types';

export default BookingPlugin;
