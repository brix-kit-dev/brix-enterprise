/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Commercial use requires a valid Brix Enterprise license.
 */
/**
 * @file Chinese (Simplified) translations for app-booking plugin
 * @module booking-ui-web/i18n/zh-CN
 * @version 3.3.0
 */

const zhCN: Record<string, string> = {
  // Common
  'common.title': '预约管理',
  'common.booking': '预约',
  'common.loading': '加载中...',
  'common.back': '返回',
  'common.retry': '重试',

  // List page
  'list.title': '预约列表',
  'list.searchPlaceholder': '搜索预约编号/联系人...',
  'list.createBtn': '新建预约',
  'list.bookingNo': '预约编号',
  'list.resourceName': '资源名称',
  'list.bookedDate': '预约日期',
  'list.timeSlot': '时间段',
  'list.contactName': '联系人',
  'list.contactPhone': '联系电话',
  'list.status': '状态',
  'list.actions': '操作',
  'list.viewDetail': '查看详情',
  'list.cancel': '取消预约',
  'list.confirm': '确认',
  'list.complete': '完成',
  'list.noShow': '未到',
  'list.reschedule': '改期',

  // Detail page
  'detail.title': '预约详情',
  'detail.basicInfo': '基本信息',
  'detail.resourceInfo': '资源信息',
  'detail.contactInfo': '联系信息',
  'detail.statusInfo': '状态信息',
  'detail.id': 'ID',
  'detail.bookingNo': '预约编号',
  'detail.resourceType': '资源类型',
  'detail.resourceName': '资源名称',
  'detail.bookedDate': '预约日期',
  'detail.startTime': '开始时间',
  'detail.endTime': '结束时间',
  'detail.userId': '用户ID',
  'detail.contactName': '联系人',
  'detail.contactPhone': '联系电话',
  'detail.status': '状态',
  'detail.sourceType': '来源类型',
  'detail.sourceId': '来源ID',
  'detail.remark': '备注',
  'detail.createdAt': '创建时间',
  'detail.updatedAt': '更新时间',
  'detail.confirmedAt': '确认时间',
  'detail.cancelledAt': '取消时间',
  'detail.cancelReason': '取消原因',
  'detail.completedAt': '完成时间',
  'detail.notFound': '数据不存在',

  // Create page
  'create.title': '新建预约',
  'create.selectResource': '选择资源',
  'create.selectDate': '选择日期',
  'create.selectTime': '选择时间段',
  'create.contactInfo': '联系信息',
  'create.contactName': '联系人',
  'create.contactPhone': '联系电话',
  'create.remark': '备注',
  'create.submitBtn': '提交预约',
  'create.cancelBtn': '取消',
  'create.migrating': '此页面正在迁移中...',

  // Resource management
  'resource.title': '资源管理',
  'resource.list': '资源列表',
  'resource.create': '新建资源',
  'resource.edit': '编辑资源',
  'resource.resourceCode': '资源编码',
  'resource.resourceName': '资源名称',
  'resource.resourceType': '资源类型',
  'resource.description': '描述',
  'resource.location': '位置',
  'resource.capacity': '容量',
  'resource.maxConcurrent': '最大并发数',
  'resource.advanceDays': '可提前预约天数',
  'resource.cancelDeadlineHours': '取消截止时间(小时)',
  'resource.enabled': '启用状态',
  'resource.enable': '启用',
  'resource.disable': '禁用',
  'resource.migrating': '此页面正在迁移中...',

  // Time slot
  'slot.available': '可预约',
  'slot.booked': '已约满',
  'slot.expired': '已过期',
  'slot.remaining': '剩余',
  'slot.fewLeft': '剩余较少',
  'slot.noSlots': '暂无可用时间槽',

  // Booking status
  'status.PENDING': '待确认',
  'status.CONFIRMED': '已确认',
  'status.COMPLETED': '已完成',
  'status.CANCELLED': '已取消',
  'status.NO_SHOW': '未到场',

  // Resource types
  'resourceType.ROOM': '会议室',
  'resourceType.EQUIPMENT': '设备',
  'resourceType.PERSON': '人员',
  'resourceType.SERVICE': '服务',
  'resourceType.OTHER': '其他',

  // Messages
  'message.createSuccess': '预约创建成功',
  'message.confirmSuccess': '预约确认成功',
  'message.cancelSuccess': '预约取消成功',
  'message.completeSuccess': '预约完成',
  'message.rescheduleSuccess': '改期成功',
  'message.noShowSuccess': '已标记为未到',

  // Calendar
  'calendar.today': '今天',
  'calendar.more': '更多',
  'calendar.weekdays.0': '日',
  'calendar.weekdays.1': '一',
  'calendar.weekdays.2': '二',
  'calendar.weekdays.3': '三',
  'calendar.weekdays.4': '四',
  'calendar.weekdays.5': '五',
  'calendar.weekdays.6': '六',
  'calendar.view': '日历视图',

  // Permissions
  'error.noConfirmPermission': '您没有确认预约的权限',
  'error.noCancelPermission': '您没有取消预约的权限',
  'error.noCompletePermission': '您没有完成预约的权限',
  'error.noCreatePermission': '您没有创建预约的权限',

  // Actions
  'action.confirm': '确认',
  'action.cancel': '取消',
  'action.complete': '完成',
  'action.noShow': '未到',
  'action.reschedule': '改期',
  'action.search': '搜索',
  'action.create': '新建预约',

  // Cancellation
  'prompt.cancelReason': '请输入取消原因',
  'cancellation.userCancel': '用户取消',
  'reschedule.hint': '改期模式：请选择新的预约时间',
};

export default zhCN;
