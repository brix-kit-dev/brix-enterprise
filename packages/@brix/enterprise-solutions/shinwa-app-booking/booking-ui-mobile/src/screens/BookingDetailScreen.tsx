/**
 * 预约详情屏幕 - Mobile
 * 
 * @module @shinwa/booking-ui-mobile
 * @version 3.0.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
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

interface BookingDetailScreenProps {
  /**
   * 预约ID
   */
  bookingId: number;
  /**
   * 返回上一页
   */
  onGoBack?: () => void;
}

/**
 * 详情字段组件
 */
const DetailField: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || '-'}</Text>
  </View>
);

/**
 * 预约详情屏幕组件
 */
export default function BookingDetailScreen({
  bookingId,
  onGoBack,
}: BookingDetailScreenProps): React.ReactElement {
  const [data, setData] = useState<BookingDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载详情
  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: 替换为实际 API 调用
      // const response = await api.getBookingById(bookingId);
      // setData(response);
      
      // 模拟数据
      await new Promise(resolve => setTimeout(resolve, 500));
      setData({
        id: bookingId,
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
        remark: '项目进度讨论会',
        tenantId: 1,
        createdAt: '2026-01-28T10:00:00',
        updatedAt: '2026-01-28T10:00:00',
      });
    } catch (err) {
      console.error('加载详情失败', err);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // 确认预约
  const handleConfirm = () => {
    Alert.alert('确认预约', '确定要确认该预约吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认',
        onPress: async () => {
          // TODO: 调用 API
          Alert.alert('成功', '预约已确认');
          fetchDetail();
        },
      },
    ]);
  };

  // 取消预约
  const handleCancel = () => {
    Alert.prompt(
      '取消预约',
      '请输入取消原因',
      [
        { text: '返回', style: 'cancel' },
        {
          text: '确认取消',
          style: 'destructive',
          onPress: async (reason) => {
            // TODO: 调用 API
            Alert.alert('成功', '预约已取消');
            fetchDetail();
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  // 完成预约
  const handleComplete = () => {
    Alert.alert('完成预约', '确定要标记该预约为已完成吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认',
        onPress: async () => {
          // TODO: 调用 API
          Alert.alert('成功', '预约已完成');
          fetchDetail();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2196f3" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.error}>
        <Text>数据不存在</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>预约详情</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* 状态卡片 */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[data.status] }]}>
            <Text style={styles.statusText}>{statusTexts[data.status]}</Text>
          </View>
          <Text style={styles.bookingNo}>{data.bookingNo}</Text>
        </View>

        {/* 基本信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          <DetailField label="资源名称" value={data.resourceName} />
          <DetailField label="预约日期" value={data.bookedDate} />
          <DetailField label="时间段" value={`${data.startTime} - ${data.endTime}`} />
        </View>

        {/* 联系信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>联系信息</Text>
          <DetailField label="联系人" value={data.contactName} />
          <DetailField label="联系电话" value={data.contactPhone} />
          <DetailField label="备注" value={data.remark} />
        </View>

        {/* 时间信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>时间信息</Text>
          <DetailField label="创建时间" value={data.createdAt} />
          <DetailField label="更新时间" value={data.updatedAt} />
          {data.confirmedAt && <DetailField label="确认时间" value={data.confirmedAt} />}
          {data.cancelledAt && (
            <>
              <DetailField label="取消时间" value={data.cancelledAt} />
              <DetailField label="取消原因" value={data.cancelReason} />
            </>
          )}
          {data.completedAt && <DetailField label="完成时间" value={data.completedAt} />}
        </View>
      </ScrollView>

      {/* 操作按钮 */}
      <View style={styles.actions}>
        {data.status === 'PENDING' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.actionButtonText}>确认预约</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.actionButtonText}>取消预约</Text>
            </TouchableOpacity>
          </>
        )}
        {data.status === 'CONFIRMED' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleComplete}
          >
            <Text style={styles.actionButtonText}>完成预约</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  backText: {
    fontSize: 16,
    color: '#2196f3',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bookingNo: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666',
  },
  fieldValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#2196f3',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  completeButton: {
    backgroundColor: '#4caf50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
