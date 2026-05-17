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
 * @file 日历相关类型定义
 * @description 预约日历的类型定义
 * @module @brix-sdk/enterprise-booking-shared/types
 * @version 3.0.0
 */
/**
 * 日历视图模式
 */
export type CalendarViewMode = 'day' | 'week' | 'month';
/**
 * 日历日期单元格
 */
export interface CalendarCell {
    /** 日期（ISO 8601 格式：YYYY-MM-DD） */
    date: string;
    /** 是否当前月份 */
    isCurrentMonth: boolean;
    /** 是否今天 */
    isToday: boolean;
    /** 是否被选中 */
    isSelected: boolean;
    /** 是否禁用 */
    isDisabled: boolean;
    /** 该日期的预约数量 */
    bookingCount: number;
}
/**
 * 日历选择范围
 */
export interface CalendarRange {
    /** 开始日期 */
    startDate: string;
    /** 结束日期 */
    endDate: string;
}
/**
 * 日历事件（用于日历组件显示）
 */
export interface CalendarEvent {
    /** 事件 ID（通常是预约 ID） */
    id: string;
    /** 标题 */
    title: string;
    /** 开始时间（ISO 8601 格式） */
    start: string;
    /** 结束时间（ISO 8601 格式） */
    end: string;
    /** 颜色标识 */
    color?: string;
    /** 是否全天事件 */
    allDay?: boolean;
    /** 扩展数据 */
    data?: Record<string, unknown>;
}
