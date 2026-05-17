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
 * @file 预约模块共享类型定义
 * @description 预约业务的核心类型定义，供 Web 和 Mobile 端共用
 * @module @brix-sdk/enterprise-booking-shared/types
 * @version 3.0.0
 *
 * 【设计说明】
 * 本文件定义预约模块的核心业务类型，遵循以下原则：
 * 1. 与后端 DTO 保持一致
 * 2. 不包含任何平台特定类型
 * 3. 使用接口而非类，便于序列化
 *
 * 【类型分类】
 * - 预约相关：Booking、BookingStatus、CreateBookingParams
 * - 资源相关：Resource、ResourceType
 * - 时间槽相关：TimeSlot、TimeSlotStatus
 */
/**
 * 预约状态
 *
 * 与后端 BookingStatus 枚举保持一致
 */
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
/**
 * 资源类型
 *
 * 可预约资源的分类
 */
export type ResourceType = 'DOCTOR' | 'CONSULTANT' | 'MEETING_ROOM' | 'EQUIPMENT' | 'CUSTOM';
/**
 * 时间槽状态
 */
export type TimeSlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'PAST';
/**
 * 预约数据传输对象
 *
 * 与后端 BookingDTO 保持一致
 */
export interface Booking {
    /** 预约 ID */
    id: number;
    /** 预约编号（业务编号） */
    bookingNo: string;
    /** 预约状态 */
    status: BookingStatus;
    /** 资源 ID */
    resourceId: number;
    /** 资源名称 */
    resourceName: string;
    /** 资源类型 */
    resourceType: ResourceType;
    /** 预约日期（ISO 8601 格式：YYYY-MM-DD） */
    reservedDate: string;
    /** 开始时间（HH:mm 格式） */
    startTime: string;
    /** 结束时间（HH:mm 格式） */
    endTime: string;
    /** 联系人姓名 */
    contactName: string;
    /** 联系电话 */
    contactPhone: string;
    /** 备注 */
    remarks?: string;
    /** 创建时间（ISO 8601 格式） */
    createdAt: string;
    /** 更新时间（ISO 8601 格式） */
    updatedAt?: string;
    /** 确认时间（ISO 8601 格式） */
    confirmedAt?: string;
    /** 取消时间（ISO 8601 格式） */
    cancelledAt?: string;
    /** 取消原因 */
    cancelReason?: string;
}
/**
 * 创建预约参数
 */
export interface CreateBookingParams {
    /** 资源 ID */
    resourceId: number;
    /** 预约日期（ISO 8601 格式：YYYY-MM-DD） */
    reservedDate: string;
    /** 开始时间（HH:mm 格式） */
    startTime: string;
    /** 结束时间（HH:mm 格式） */
    endTime: string;
    /** 联系人姓名 */
    contactName: string;
    /** 联系电话 */
    contactPhone: string;
    /** 备注 */
    remarks?: string;
}
/**
 * 更新预约参数
 */
export interface UpdateBookingParams {
    /** 预约日期（ISO 8601 格式：YYYY-MM-DD） */
    reservedDate?: string;
    /** 开始时间（HH:mm 格式） */
    startTime?: string;
    /** 结束时间（HH:mm 格式） */
    endTime?: string;
    /** 联系人姓名 */
    contactName?: string;
    /** 联系电话 */
    contactPhone?: string;
    /** 备注 */
    remarks?: string;
}
/**
 * 取消预约参数
 */
export interface CancelBookingParams {
    /** 取消原因 */
    reason: string;
}
/**
 * 可预约资源
 */
export interface Resource {
    /** 资源 ID */
    id: number;
    /** 资源名称 */
    name: string;
    /** 资源类型 */
    type: ResourceType;
    /** 资源描述 */
    description?: string;
    /** 服务时长（分钟） */
    serviceDuration: number;
    /** 是否启用 */
    enabled: boolean;
    /** 头像/图片 URL */
    avatarUrl?: string;
    /** 扩展属性 */
    metadata?: Record<string, unknown>;
}
/**
 * 时间槽
 */
export interface TimeSlot {
    /** 开始时间（HH:mm 格式） */
    startTime: string;
    /** 结束时间（HH:mm 格式） */
    endTime: string;
    /** 时间槽状态 */
    status: TimeSlotStatus;
    /** 已预约数量（如果支持多人预约） */
    bookedCount?: number;
    /** 最大预约数量 */
    maxCapacity?: number;
}
/**
 * 日期时间槽
 */
export interface DateTimeSlots {
    /** 日期（ISO 8601 格式：YYYY-MM-DD） */
    date: string;
    /** 该日期的时间槽列表 */
    slots: TimeSlot[];
}
/**
 * 预约列表查询参数
 */
export interface BookingListQuery {
    /** 状态过滤 */
    status?: BookingStatus;
    /** 资源 ID 过滤 */
    resourceId?: number;
    /** 开始日期 */
    startDate?: string;
    /** 结束日期 */
    endDate?: string;
    /** 关键字搜索 */
    keyword?: string;
    /** 页码（从 0 开始） */
    page?: number;
    /** 每页数量 */
    size?: number;
}
/**
 * 分页响应
 */
export interface PagedResponse<T> {
    /** 数据内容 */
    content: T[];
    /** 总元素数量 */
    totalElements: number;
    /** 总页数 */
    totalPages: number;
    /** 当前页码 */
    page: number;
    /** 每页数量 */
    size: number;
}
