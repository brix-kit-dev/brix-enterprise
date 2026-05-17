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
 * @file 预约模块事件定义
 * @description 定义预约模块发布和订阅的事件类型
 * @module @brix-sdk/enterprise-booking-shared/events
 * @version 3.0.0
 *
 * 【设计说明】
 * 遵循 v3.0 Manifest-Driven 架构，事件定义与 ui-manifest.yaml 中的
 * events 声明保持一致。
 *
 * 【事件命名规范】
 * - 格式：<plugin>:<action>
 * - 示例：booking:created, booking:cancelled
 *
 * 【架构红线】
 * ❌ 事件 payload 中禁止包含函数
 * ❌ 事件 payload 中禁止包含循环引用
 * ✅ 事件 payload 必须可 JSON 序列化
 */
/**
 * 预约模块事件类型常量
 *
 * 与 ui-manifest.yaml 中的 events.published 保持一致
 */
export declare const BOOKING_EVENTS: {
    /** 预约创建成功 */
    readonly CREATED: "booking:created";
    /** 预约已确认 */
    readonly CONFIRMED: "booking:confirmed";
    /** 预约已取消 */
    readonly CANCELLED: "booking:cancelled";
    /** 预约已完成 */
    readonly COMPLETED: "booking:completed";
    /** 预约爽约 */
    readonly NO_SHOW: "booking:no_show";
};
/**
 * 预约事件类型联合
 */
export type BookingEventType = typeof BOOKING_EVENTS[keyof typeof BOOKING_EVENTS];
/**
 * 预约创建事件 Payload
 *
 * 事件类型：booking:created
 * 触发时机：预约成功创建后
 * 作用域：global（所有插件可订阅）
 */
export interface BookingCreatedPayload {
    /** 预约 ID */
    id: number;
    /** 预约编号 */
    bookingNo: string;
    /** 客户 ID */
    customerId: string;
    /** 资源 ID */
    resourceId: number;
    /** 资源名称 */
    resourceName: string;
    /** 预约日期 */
    date: string;
    /** 开始时间 */
    startTime: string;
    /** 结束时间 */
    endTime: string;
}
/**
 * 预约确认事件 Payload
 *
 * 事件类型：booking:confirmed
 * 触发时机：预约被确认后
 * 作用域：global
 */
export interface BookingConfirmedPayload {
    /** 预约 ID */
    id: number;
    /** 预约编号 */
    bookingNo: string;
    /** 确认时间（ISO 8601 格式） */
    confirmedAt: string;
    /** 确认人 ID */
    confirmedBy: string;
}
/**
 * 预约取消事件 Payload
 *
 * 事件类型：booking:cancelled
 * 触发时机：预约被取消后
 * 作用域：global
 */
export interface BookingCancelledPayload {
    /** 预约 ID */
    id: number;
    /** 预约编号 */
    bookingNo: string;
    /** 取消原因 */
    reason: string;
    /** 取消时间（ISO 8601 格式） */
    cancelledAt: string;
    /** 取消人 ID */
    cancelledBy: string;
}
/**
 * 预约完成事件 Payload
 *
 * 事件类型：booking:completed
 * 触发时机：预约服务完成后
 * 作用域：global
 */
export interface BookingCompletedPayload {
    /** 预约 ID */
    id: number;
    /** 预约编号 */
    bookingNo: string;
    /** 完成时间（ISO 8601 格式） */
    completedAt: string;
}
/**
 * 预约爽约事件 Payload
 *
 * 事件类型：booking:no_show
 * 触发时机：客户未按时到达
 * 作用域：global
 */
export interface BookingNoShowPayload {
    /** 预约 ID */
    id: number;
    /** 预约编号 */
    bookingNo: string;
    /** 标记时间（ISO 8601 格式） */
    markedAt: string;
}
/**
 * 用户选择事件 Payload（来自 identity 插件）
 *
 * 事件类型：user:selected
 * 来源插件：identity
 * 作用：当在其他模块选择了用户，预约模块可据此筛选该用户的预约
 */
export interface UserSelectedPayload {
    /** 用户 ID */
    userId: string;
    /** 用户名称 */
    userName: string;
}
/**
 * 预约事件 Payload 映射
 *
 * 用于提供类型安全的事件订阅
 */
export interface BookingEventPayloadMap {
    [BOOKING_EVENTS.CREATED]: BookingCreatedPayload;
    [BOOKING_EVENTS.CONFIRMED]: BookingConfirmedPayload;
    [BOOKING_EVENTS.CANCELLED]: BookingCancelledPayload;
    [BOOKING_EVENTS.COMPLETED]: BookingCompletedPayload;
    [BOOKING_EVENTS.NO_SHOW]: BookingNoShowPayload;
}
