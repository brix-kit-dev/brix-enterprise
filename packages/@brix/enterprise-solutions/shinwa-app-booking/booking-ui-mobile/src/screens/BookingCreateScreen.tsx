/**
 * 新建预约屏幕 - Mobile
 * 
 * @module @shinwa/booking-ui-mobile
 * @version 3.0.0
 * 
 * [v3.2 Refactoring Notes]
 * Styles extracted to BookingCreateScreen.styles.ts to keep this file under 500 lines.
 * 
 * 【中文技术要点】
 * 样式定义已提取到 BookingCreateScreen.styles.ts，保持组件文件精简。
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { BookableResourceDTO, TimeSlotDTO, CreateBookingRequest, ResourceType } from '../types';
import { styles } from './BookingCreateScreen.styles';

/**
 * 步骤定义
 */
const STEPS = ['选择资源', '选择时间', '填写信息'];

interface BookingCreateScreenProps {
  /**
   * 返回上一页
   */
  onGoBack?: () => void;
  /**
   * 创建成功后的回调
   */
  onSuccess?: (bookingId: number) => void;
}

/**
 * 新建预约屏幕组件
 */
export default function BookingCreateScreen({
  onGoBack,
  onSuccess,
}: BookingCreateScreenProps): React.ReactElement {
  // 步骤状态
  const [currentStep, setCurrentStep] = useState(0);
  
  // 数据状态
  const [resources, setResources] = useState<BookableResourceDTO[]>([]);
  const [selectedResource, setSelectedResource] = useState<BookableResourceDTO | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slots, setSlots] = useState<TimeSlotDTO[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotDTO | null>(null);
  
  // 表单状态
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [remark, setRemark] = useState('');
  
  // UI 状态
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 加载资源列表
  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        // TODO: 替换为实际 API 调用
        await new Promise(resolve => setTimeout(resolve, 500));
        setResources([
          {
            id: 1,
            resourceCode: 'ROOM-A',
            resourceName: '会议室A',
            resourceType: 'ROOM',
            description: '可容纳20人的大会议室',
            location: '3楼东侧',
            capacity: 20,
            maxConcurrent: 1,
            advanceDays: 7,
            cancelDeadlineHours: 2,
            sortOrder: 1,
            enabled: true,
          },
          {
            id: 2,
            resourceCode: 'ROOM-B',
            resourceName: '会议室B',
            resourceType: 'ROOM',
            description: '可容纳10人的小会议室',
            location: '3楼西侧',
            capacity: 10,
            maxConcurrent: 1,
            advanceDays: 7,
            cancelDeadlineHours: 2,
            sortOrder: 2,
            enabled: true,
          },
          {
            id: 3,
            resourceCode: 'PROJ-001',
            resourceName: '投影仪',
            resourceType: 'EQUIPMENT',
            description: '爱普生高清投影仪',
            maxConcurrent: 1,
            advanceDays: 3,
            cancelDeadlineHours: 1,
            sortOrder: 3,
            enabled: true,
          },
        ]);
      } catch (err) {
        console.error('加载资源失败', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  // 生成日期选项（今天起7天内）
  const getDateOptions = useCallback(() => {
    const dates: string[] = [];
    const today = new Date();
    const maxDays = selectedResource?.advanceDays || 7;
    
    for (let i = 0; i < maxDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, [selectedResource]);

  // 加载时间槽
  useEffect(() => {
    if (!selectedResource || !selectedDate) {
      setSlots([]);
      return;
    }
    
    const fetchSlots = async () => {
      setLoading(true);
      try {
        // TODO: 替换为实际 API 调用
        await new Promise(resolve => setTimeout(resolve, 300));
        setSlots([
          { slotId: '1', resourceId: selectedResource.id, date: selectedDate, startTime: '09:00', endTime: '10:00', maxBookings: 1, bookedCount: 0, availableCount: 1, available: true, expired: false },
          { slotId: '2', resourceId: selectedResource.id, date: selectedDate, startTime: '10:00', endTime: '11:00', maxBookings: 1, bookedCount: 0, availableCount: 1, available: true, expired: false },
          { slotId: '3', resourceId: selectedResource.id, date: selectedDate, startTime: '11:00', endTime: '12:00', maxBookings: 1, bookedCount: 1, availableCount: 0, available: false, expired: false },
          { slotId: '4', resourceId: selectedResource.id, date: selectedDate, startTime: '14:00', endTime: '15:00', maxBookings: 1, bookedCount: 0, availableCount: 1, available: true, expired: false },
          { slotId: '5', resourceId: selectedResource.id, date: selectedDate, startTime: '15:00', endTime: '16:00', maxBookings: 1, bookedCount: 0, availableCount: 1, available: true, expired: false },
        ]);
      } catch (err) {
        console.error('加载时间槽失败', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [selectedResource, selectedDate]);

  // 选择资源
  const handleSelectResource = (resource: BookableResourceDTO) => {
    setSelectedResource(resource);
    setSelectedDate('');
    setSelectedSlot(null);
  };

  // 选择日期
  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  // 选择时间槽
  const handleSelectSlot = (slot: TimeSlotDTO) => {
    if (slot.available) {
      setSelectedSlot(slot);
    }
  };

  // 上一步
  const handlePrevStep = () => {
    if (currentStep === 0) {
      onGoBack?.();
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  // 下一步
  const handleNextStep = () => {
    if (currentStep === 0 && !selectedResource) {
      Alert.alert('提示', '请选择资源');
      return;
    }
    if (currentStep === 1 && (!selectedDate || !selectedSlot)) {
      Alert.alert('提示', '请选择日期和时间');
      return;
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // 提交预约
  const handleSubmit = async () => {
    if (!contactName.trim()) {
      Alert.alert('提示', '请填写联系人');
      return;
    }
    if (!contactPhone.trim()) {
      Alert.alert('提示', '请填写联系电话');
      return;
    }
    if (!selectedResource || !selectedSlot) {
      return;
    }

    setSubmitting(true);
    try {
      // TODO: 替换为实际 API 调用
      const request: CreateBookingRequest = {
        resourceId: selectedResource.id,
        resourceType: selectedResource.resourceType,
        bookedDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        userId: 0,
        contactName,
        contactPhone,
        remark,
      };
      
      await new Promise(resolve => setTimeout(resolve, 500));
      Alert.alert('成功', '预约创建成功', [
        { text: '确定', onPress: () => onSuccess?.(1) },
      ]);
    } catch (err) {
      Alert.alert('错误', '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染步骤指示器
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => (
        <View key={step} style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            index <= currentStep && styles.stepCircleActive,
          ]}>
            <Text style={[
              styles.stepNumber,
              index <= currentStep && styles.stepNumberActive,
            ]}>
              {index + 1}
            </Text>
          </View>
          <Text style={[
            styles.stepLabel,
            index === currentStep && styles.stepLabelActive,
          ]}>
            {step}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevStep}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>新建预约</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* 步骤指示器 */}
      {renderStepIndicator()}

      {/* 内容区 */}
      <ScrollView style={styles.content}>
        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color="#2196f3" />
          </View>
        )}

        {/* 步骤1：选择资源 */}
        {currentStep === 0 && (
          <View style={styles.stepContent}>
            {resources.map((resource) => (
              <TouchableOpacity
                key={resource.id}
                style={[
                  styles.resourceCard,
                  selectedResource?.id === resource.id && styles.resourceCardSelected,
                ]}
                onPress={() => handleSelectResource(resource)}
              >
                <Text style={styles.resourceName}>{resource.resourceName}</Text>
                <Text style={styles.resourceDesc}>{resource.description}</Text>
                {resource.location && (
                  <Text style={styles.resourceLocation}>位置: {resource.location}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 步骤2：选择时间 */}
        {currentStep === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionLabel}>选择日期</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
              {getDateOptions().map((date) => (
                <TouchableOpacity
                  key={date}
                  style={[
                    styles.dateItem,
                    selectedDate === date && styles.dateItemSelected,
                  ]}
                  onPress={() => handleSelectDate(date)}
                >
                  <Text style={[
                    styles.dateText,
                    selectedDate === date && styles.dateTextSelected,
                  ]}>
                    {date.slice(5)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedDate && (
              <>
                <Text style={styles.sectionLabel}>选择时间</Text>
                <View style={styles.slotGrid}>
                  {slots.map((slot) => (
                    <TouchableOpacity
                      key={slot.slotId}
                      style={[
                        styles.slotItem,
                        selectedSlot?.slotId === slot.slotId && styles.slotItemSelected,
                        !slot.available && styles.slotItemDisabled,
                      ]}
                      onPress={() => handleSelectSlot(slot)}
                      disabled={!slot.available}
                    >
                      <Text style={[
                        styles.slotText,
                        selectedSlot?.slotId === slot.slotId && styles.slotTextSelected,
                        !slot.available && styles.slotTextDisabled,
                      ]}>
                        {slot.startTime}-{slot.endTime}
                      </Text>
                      {!slot.available && (
                        <Text style={styles.slotBooked}>已约满</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* 步骤3：填写信息 */}
        {currentStep === 2 && (
          <View style={styles.stepContent}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>预约信息</Text>
              <Text style={styles.summaryText}>资源: {selectedResource?.resourceName}</Text>
              <Text style={styles.summaryText}>日期: {selectedDate}</Text>
              <Text style={styles.summaryText}>时间: {selectedSlot?.startTime} - {selectedSlot?.endTime}</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>联系人 *</Text>
              <TextInput
                style={styles.formInput}
                value={contactName}
                onChangeText={setContactName}
                placeholder="请输入联系人姓名"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>联系电话 *</Text>
              <TextInput
                style={styles.formInput}
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="请输入联系电话"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>备注</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={remark}
                onChangeText={setRemark}
                placeholder="请输入备注信息（可选）"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* 底部按钮 */}
      <View style={styles.footer}>
        {currentStep < STEPS.length - 1 ? (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextStep}
          >
            <Text style={styles.nextButtonText}>下一步</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>提交预约</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
