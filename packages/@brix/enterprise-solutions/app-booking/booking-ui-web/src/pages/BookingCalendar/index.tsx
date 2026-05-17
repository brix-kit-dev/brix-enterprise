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
 * 预约日历页面
 * 
 * @module booking-ui-web
 * @version 3.0.0
 * 
 * 【v3.0 Manifest-Driven 架构】
 * - 页面组件，对应 ui-manifest.yaml 中的 pageId: "booking:calendar"
 * - 通过 NavigationCapability 接收参数和导航
 * - 通过 AuthCapability 检查权限
 * - 通过 EventBusCapability 发布/订阅事件
 * 
 * 功能说明：
 * - 展示预约日历视图
 * - 支持切换日期
 * - 点击日期可创建预约
 * - 点击预约可查看详情
 * 
 * @see ui-manifest.yaml pages[pageId="booking:calendar"]
 */

import React from 'react';
import {
  useNavigation,
  useEventBus,
  useUI,
  useI18n,
} from '@brix-sdk/runtime-sdk-react';
import BookingCalendarComponent from '../../components/BookingCalendar';
import { BOOKING_PAGE_IDS, BOOKING_EVENTS } from 'booking-shared';
import type { BookingDTO } from '../../types';
import type { BookingSelectedPayload } from 'booking-shared';

/**
 * 预约日历页面组件
 * 
 * 【使用能力契约】
 * - useNavigation: 获取页面参数，执行导航
 * - useEventBus: 发布预约选中事件
 * 
 * 【页面生命周期】
 * 1. 挂载时获取页面参数（可选的 resourceId）
 * 2. 渲染日历组件
 * 3. 用户点击预约时发布事件并导航到详情页
 * 4. 用户点击日期时导航到创建页
 */
export default function BookingCalendar(): React.ReactElement {
  const { Box, Typography, Paper } = useUI();
  const { t } = useI18n();
  const navigation = useNavigation();
  const eventBus = useEventBus();

  /**
   * 处理预约点击事件
   * 
   * 【v3.0 架构】使用 PageId 导航，不直接操作 URL
   * 同时发布事件，供其他模块响应
   */
  const handleBookingClick = (booking: BookingDTO) => {
    // 发布预约选中事件
    const payload: BookingSelectedPayload = {
      bookingId: booking.id,
      resourceId: booking.resourceId,
      resourceName: booking.resourceName,
    };
    eventBus.emit(BOOKING_EVENTS.SELECTED, payload);

    // 导航到详情页（使用 PageId）
    navigation.requestNavigate(BOOKING_PAGE_IDS.DETAIL, {
      id: String(booking.id),
    });
  };

  /**
   * 处理日期点击事件
   * 
   * 导航到创建预约页面，传递选中的日期
   */
  const handleDateClick = (date: Date) => {
    navigation.requestNavigate(BOOKING_PAGE_IDS.CREATE, {
      date: date.toISOString().split('T')[0], // YYYY-MM-DD 格式
    });
  };

  return (
    <Box style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Box style={{ paddingTop: 24, paddingBottom: 24 }}>
        {/* 页面标题 */}
        <Paper style={{ padding: 24 }}>
          <Typography variant="h5" gutterBottom>
            {t('booking.page.calendar.title', '日历视图')}
          </Typography>
          
          {/* 日历组件 */}
          <BookingCalendarComponent
            onBookingClick={handleBookingClick}
            onDateClick={handleDateClick}
          />
        </Paper>
      </Box>
    </Box>
  );
}
