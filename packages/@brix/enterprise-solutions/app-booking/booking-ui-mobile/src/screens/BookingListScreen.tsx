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
 * 预约列表屏幕 - Mobile
 * 
 * @module @brix-sdk/enterprise-booking-ui-mobile
 * @version 3.0.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import type { BookingDTO, BookingStatus } from '../types';

/**
 * 状态颜色映射
 */
const statusColors: Record<BookingStatus, string> = {
  PENDING: '#ff9800',
  CONFIRMED: '#2196f3',
  COMPLETED: '#4caf50',
  CANCELLED: '#f44336',
  NO_SHOW: '#9e9e9e',
};

/**
 * 状态文本映射
 */
const statusTexts: Record<BookingStatus, string> = {
  PENDING: '待确认',
  CONFIRMED: '已确认',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  NO_SHOW: '未到场',
};

interface BookingListScreenProps {
  /**
   * 导航到详情页
   */
  onNavigateToDetail?: (id: number) => void;
  /**
   * 导航到创建页
   */
  onNavigateToCreate?: () => void;
}

/**
 * 预约列表屏幕组件
 */
export default function BookingListScreen({
  onNavigateToDetail,
  onNavigateToCreate,
}: BookingListScreenProps): React.ReactElement {
  const [data, setData] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 加载数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: 替换为实际 API 调用
      // const response = await api.getMyBookings();
      // setData(response);
      
      // 模拟数据
      await new Promise(resolve => setTimeout(resolve, 500));
      setData([
        {
          id: 1,
          bookingNo: 'BK20260128001',
          resourceId: 1,
          resourceType: 'ROOM',
          resourceName: '会议室A',
          bookedDate: '2026-01-29',
          startTime: '09:00',
          endTime: '10:00',
          userId: 1,
          contactName: '张三',
          contactPhone: '13800138000',
          status: 'PENDING',
          tenantId: 1,
          createdAt: '2026-01-28T10:00:00',
          updatedAt: '2026-01-28T10:00:00',
        },
        {
          id: 2,
          bookingNo: 'BK20260128002',
          resourceId: 2,
          resourceType: 'EQUIPMENT',
          resourceName: '投影仪',
          bookedDate: '2026-01-30',
          startTime: '14:00',
          endTime: '16:00',
          userId: 1,
          contactName: '李四',
          contactPhone: '13900139000',
          status: 'CONFIRMED',
          tenantId: 1,
          createdAt: '2026-01-28T11:00:00',
          updatedAt: '2026-01-28T11:30:00',
        },
      ]);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, []);

  // 首次加载
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // 渲染列表项
  const renderItem = ({ item }: { item: BookingDTO }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onNavigateToDetail?.(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.bookingNo}>{item.bookingNo}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
          <Text style={styles.statusText}>{statusTexts[item.status]}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <Text style={styles.resourceName}>{item.resourceName}</Text>
        <Text style={styles.dateTime}>
          {item.bookedDate} {item.startTime} - {item.endTime}
        </Text>
        <Text style={styles.contact}>
          联系人: {item.contactName} {item.contactPhone}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // 空列表
  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>暂无预约</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.title}>我的预约</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={onNavigateToCreate}
        >
          <Text style={styles.createButtonText}>新建预约</Text>
        </TouchableOpacity>
      </View>

      {/* 列表 */}
      {loading && !refreshing ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2196f3" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={data.length === 0 ? styles.emptyList : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingNo: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    gap: 4,
  },
  resourceName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 14,
    color: '#333',
  },
  contact: {
    fontSize: 13,
    color: '#666',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  emptyList: {
    flexGrow: 1,
  },
});
