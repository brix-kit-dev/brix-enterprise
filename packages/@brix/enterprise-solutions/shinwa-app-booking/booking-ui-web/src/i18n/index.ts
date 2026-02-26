/**
 * Internationalization resource management
 * 
 * @module booking-ui-web
 * @version 3.0.0
 * 
 * Features:
 * - Load booking module translation resources
 * - Add to host's i18n instance
 */

import i18n from 'i18next';

// 中文翻译
const zhCN = {
  booking: {
    // 通用
    title: '预约管理',
    booking: '预约',
    
    // 列表页
    list: {
      title: '预约列表',
      searchPlaceholder: '搜索预约编号/联系人...',
      createBtn: '新建预约',
      bookingNo: '预约编号',
      resourceName: '资源名称',
      bookedDate: '预约日期',
      timeSlot: '时间段',
      contactName: '联系人',
      contactPhone: '联系电话',
      status: '状态',
      actions: '操作',
      viewDetail: '查看详情',
      cancel: '取消预约',
      confirm: '确认',
      complete: '完成',
      noShow: '未到',
      reschedule: '改期',
    },
    
    // 详情页
    detail: {
      title: '预约详情',
      basicInfo: '基本信息',
      resourceInfo: '资源信息',
      contactInfo: '联系信息',
      statusInfo: '状态信息',
      id: 'ID',
      bookingNo: '预约编号',
      resourceType: '资源类型',
      resourceName: '资源名称',
      bookedDate: '预约日期',
      startTime: '开始时间',
      endTime: '结束时间',
      userId: '用户ID',
      contactName: '联系人',
      contactPhone: '联系电话',
      status: '状态',
      sourceType: '来源类型',
      sourceId: '来源ID',
      remark: '备注',
      createdAt: '创建时间',
      updatedAt: '更新时间',
      confirmedAt: '确认时间',
      cancelledAt: '取消时间',
      cancelReason: '取消原因',
      completedAt: '完成时间',
    },
    
    // 创建页
    create: {
      title: '新建预约',
      selectResource: '选择资源',
      selectDate: '选择日期',
      selectTime: '选择时间段',
      contactInfo: '联系信息',
      contactName: '联系人',
      contactPhone: '联系电话',
      remark: '备注',
      submitBtn: '提交预约',
      cancelBtn: '取消',
    },
    
    // 资源管理
    resource: {
      title: '资源管理',
      list: '资源列表',
      create: '新建资源',
      edit: '编辑资源',
      resourceCode: '资源编码',
      resourceName: '资源名称',
      resourceType: '资源类型',
      description: '描述',
      location: '位置',
      capacity: '容量',
      maxConcurrent: '最大并发数',
      advanceDays: '可提前预约天数',
      cancelDeadlineHours: '取消截止时间(小时)',
      enabled: '启用状态',
      enable: '启用',
      disable: '禁用',
    },
    
    // 时间槽
    slot: {
      available: '可预约',
      booked: '已约满',
      expired: '已过期',
      remaining: '剩余',
    },
    
    // 状态
    status: {
      PENDING: '待确认',
      CONFIRMED: '已确认',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
      NO_SHOW: '未到场',
    },
    
    // 资源类型
    resourceType: {
      ROOM: '会议室',
      EQUIPMENT: '设备',
      PERSON: '人员',
      SERVICE: '服务',
      OTHER: '其他',
    },
    
    // 消息
    message: {
      createSuccess: '预约创建成功',
      confirmSuccess: '预约确认成功',
      cancelSuccess: '预约取消成功',
      completeSuccess: '预约完成',
      rescheduleSuccess: '改期成功',
      noShowSuccess: '已标记为未到',
    },
  },
};

// 英文翻译
const enUS = {
  booking: {
    title: 'Booking Management',
    booking: 'Booking',
    
    list: {
      title: 'Booking List',
      searchPlaceholder: 'Search booking no./contact...',
      createBtn: 'New Booking',
      bookingNo: 'Booking No.',
      resourceName: 'Resource',
      bookedDate: 'Date',
      timeSlot: 'Time Slot',
      contactName: 'Contact',
      contactPhone: 'Phone',
      status: 'Status',
      actions: 'Actions',
      viewDetail: 'View Detail',
      cancel: 'Cancel',
      confirm: 'Confirm',
      complete: 'Complete',
      noShow: 'No Show',
      reschedule: 'Reschedule',
    },
    
    detail: {
      title: 'Booking Detail',
      basicInfo: 'Basic Info',
      resourceInfo: 'Resource Info',
      contactInfo: 'Contact Info',
      statusInfo: 'Status Info',
      id: 'ID',
      bookingNo: 'Booking No.',
      resourceType: 'Resource Type',
      resourceName: 'Resource Name',
      bookedDate: 'Booked Date',
      startTime: 'Start Time',
      endTime: 'End Time',
      userId: 'User ID',
      contactName: 'Contact Name',
      contactPhone: 'Contact Phone',
      status: 'Status',
      sourceType: 'Source Type',
      sourceId: 'Source ID',
      remark: 'Remark',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      confirmedAt: 'Confirmed At',
      cancelledAt: 'Cancelled At',
      cancelReason: 'Cancel Reason',
      completedAt: 'Completed At',
    },
    
    create: {
      title: 'New Booking',
      selectResource: 'Select Resource',
      selectDate: 'Select Date',
      selectTime: 'Select Time Slot',
      contactInfo: 'Contact Information',
      contactName: 'Contact Name',
      contactPhone: 'Contact Phone',
      remark: 'Remark',
      submitBtn: 'Submit',
      cancelBtn: 'Cancel',
    },
    
    resource: {
      title: 'Resource Management',
      list: 'Resource List',
      create: 'New Resource',
      edit: 'Edit Resource',
      resourceCode: 'Resource Code',
      resourceName: 'Resource Name',
      resourceType: 'Resource Type',
      description: 'Description',
      location: 'Location',
      capacity: 'Capacity',
      maxConcurrent: 'Max Concurrent',
      advanceDays: 'Advance Days',
      cancelDeadlineHours: 'Cancel Deadline (hours)',
      enabled: 'Enabled',
      enable: 'Enable',
      disable: 'Disable',
    },
    
    slot: {
      available: 'Available',
      booked: 'Fully Booked',
      expired: 'Expired',
      remaining: 'Remaining',
    },
    
    status: {
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      NO_SHOW: 'No Show',
    },
    
    resourceType: {
      ROOM: 'Room',
      EQUIPMENT: 'Equipment',
      PERSON: 'Person',
      SERVICE: 'Service',
      OTHER: 'Other',
    },
    
    message: {
      createSuccess: 'Booking created successfully',
      confirmSuccess: 'Booking confirmed',
      cancelSuccess: 'Booking cancelled',
      completeSuccess: 'Booking completed',
      rescheduleSuccess: 'Rescheduled successfully',
      noShowSuccess: 'Marked as no show',
    },
  },
};

/**
 * 添加插件翻译资源到基座 i18n 实例
 */
export function addPluginTranslations(): void {
  // 仅在尚未添加时添加
  if (!i18n.hasResourceBundle('zh-CN', 'translation')) {
    i18n.addResourceBundle('zh-CN', 'translation', zhCN, true, true);
  } else if (!i18n.exists('booking.title', { lng: 'zh-CN' })) {
    i18n.addResourceBundle('zh-CN', 'translation', zhCN, true, true);
  }
  
  if (!i18n.hasResourceBundle('en-US', 'translation')) {
    i18n.addResourceBundle('en-US', 'translation', enUS, true, true);
  } else if (!i18n.exists('booking.title', { lng: 'en-US' })) {
    i18n.addResourceBundle('en-US', 'translation', enUS, true, true);
  }
}
