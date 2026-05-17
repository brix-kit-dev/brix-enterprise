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
 * @file 预约模块常量定义
 * @description 状态枚举、权限代码等常量
 * @module @brix-sdk/enterprise-booking-shared/constants
 * @version 3.0.0
 */
/**
 * 预约状态映射
 *
 * 提供状态的显示名称和颜色
 */
export declare const BOOKING_STATUS: {
    readonly PENDING: {
        readonly value: "PENDING";
        readonly label: "待确认";
        readonly labelKey: "booking.status.pending";
        readonly color: "warning";
    };
    readonly CONFIRMED: {
        readonly value: "CONFIRMED";
        readonly label: "已确认";
        readonly labelKey: "booking.status.confirmed";
        readonly color: "primary";
    };
    readonly COMPLETED: {
        readonly value: "COMPLETED";
        readonly label: "已完成";
        readonly labelKey: "booking.status.completed";
        readonly color: "success";
    };
    readonly CANCELLED: {
        readonly value: "CANCELLED";
        readonly label: "已取消";
        readonly labelKey: "booking.status.cancelled";
        readonly color: "error";
    };
    readonly NO_SHOW: {
        readonly value: "NO_SHOW";
        readonly label: "爽约";
        readonly labelKey: "booking.status.noShow";
        readonly color: "default";
    };
};
/**
 * 资源类型映射
 */
export declare const RESOURCE_TYPE: {
    readonly DOCTOR: {
        readonly value: "DOCTOR";
        readonly label: "医生";
        readonly labelKey: "booking.resourceType.doctor";
        readonly icon: "medical_services";
    };
    readonly CONSULTANT: {
        readonly value: "CONSULTANT";
        readonly label: "顾问";
        readonly labelKey: "booking.resourceType.consultant";
        readonly icon: "support_agent";
    };
    readonly MEETING_ROOM: {
        readonly value: "MEETING_ROOM";
        readonly label: "会议室";
        readonly labelKey: "booking.resourceType.meetingRoom";
        readonly icon: "meeting_room";
    };
    readonly EQUIPMENT: {
        readonly value: "EQUIPMENT";
        readonly label: "设备";
        readonly labelKey: "booking.resourceType.equipment";
        readonly icon: "devices";
    };
    readonly CUSTOM: {
        readonly value: "CUSTOM";
        readonly label: "自定义";
        readonly labelKey: "booking.resourceType.custom";
        readonly icon: "category";
    };
};
/**
 * 预约模块权限代码
 *
 * 与 ui-manifest.yaml 中的 permissions 保持一致
 */
export declare const BOOKING_PERMISSIONS: {
    /** 查看预约 */
    readonly READ: "booking:read";
    /** 创建预约 */
    readonly CREATE: "booking:create";
    /** 编辑预约 */
    readonly WRITE: "booking:write";
    /** 删除预约 */
    readonly DELETE: "booking:delete";
    /** 确认预约 */
    readonly CONFIRM: "booking:confirm";
    /** 取消预约 */
    readonly CANCEL: "booking:cancel";
    /** 标记完成 */
    readonly COMPLETE: "booking:complete";
    /** 管理资源 */
    readonly MANAGE_RESOURCE: "booking:manage_resource";
};
/**
 * 预约模块 PageId
 *
 * 用于 NavigationCapability.requestNavigate()
 * 与 ui-manifest.yaml 中的 pages[].pageId 保持一致
 */
export declare const BOOKING_PAGE_IDS: {
    /** 预约列表 */
    readonly LIST: "booking:list";
    /** 预约详情 */
    readonly DETAIL: "booking:detail";
    /** 创建预约 */
    readonly CREATE: "booking:create";
    /** 日历视图 */
    readonly CALENDAR: "booking:calendar";
    /** 资源管理 */
    readonly RESOURCE_MANAGEMENT: "booking:resource-management";
};
/**
 * 预约模块菜单 ID
 */
export declare const BOOKING_MENU_IDS: {
    /** 预约管理（父菜单） */
    readonly ROOT: "booking";
    /** 预约列表 */
    readonly LIST: "booking:list";
    /** 日历视图 */
    readonly CALENDAR: "booking:calendar";
    /** 资源管理 */
    readonly RESOURCE: "booking:resource";
};
/**
 * 默认分页配置
 */
export declare const DEFAULT_PAGINATION: {
    /** 默认页码 */
    readonly PAGE: 0;
    /** 默认每页数量 */
    readonly SIZE: 10;
    /** 可选的每页数量 */
    readonly SIZE_OPTIONS: readonly [10, 20, 50, 100];
};
/**
 * 时间槽配置
 */
export declare const TIME_SLOT_CONFIG: {
    /** 默认时长（分钟） */
    readonly DEFAULT_DURATION: 30;
    /** 最小时长（分钟） */
    readonly MIN_DURATION: 15;
    /** 最大时长（分钟） */
    readonly MAX_DURATION: 240;
    /** 工作日开始时间 */
    readonly WORK_START: "08:00";
    /** 工作日结束时间 */
    readonly WORK_END: "18:00";
};
