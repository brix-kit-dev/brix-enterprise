/**
 * @file Case Module Status and Type Constants
 * @description Type mappings, status enums, and display configurations
 * @module @shinwa/case-shared/constants
 * @version 3.0.0
 * 
 * Design Notes:
 * Constants provide UI display metadata (labels, colors, icons) for enum values.
 * These are used by both Web and Mobile frontends for consistent rendering.
 */

import type { CaseStatus, CasePriority, CaseNodeStatus, CaseNodeType, ScheduleItemStatus, ScheduleItemType, TimelineEventType } from '../types';

// ============================================================================
// Case Status Constants
// ============================================================================

/**
 * Case Status Configuration
 * 
 * Provides display names, colors, and icons for case statuses.
 */
export const CASE_STATUS = {
  DRAFT: {
    value: 'DRAFT' as CaseStatus,
    label: '草稿',
    labelKey: 'case.status.draft',
    color: 'default',
    icon: 'edit_note',
    description: '案例处于草稿状态，尚未提交',
  },
  PENDING: {
    value: 'PENDING' as CaseStatus,
    label: '待处理',
    labelKey: 'case.status.pending',
    color: 'warning',
    icon: 'schedule',
    description: '案例已提交，等待初始处理',
  },
  IN_PROGRESS: {
    value: 'IN_PROGRESS' as CaseStatus,
    label: '进行中',
    labelKey: 'case.status.inProgress',
    color: 'primary',
    icon: 'play_circle',
    description: '案例正在积极处理中',
  },
  ON_HOLD: {
    value: 'ON_HOLD' as CaseStatus,
    label: '已暂停',
    labelKey: 'case.status.onHold',
    color: 'info',
    icon: 'pause_circle',
    description: '案例暂时挂起',
  },
  COMPLETED: {
    value: 'COMPLETED' as CaseStatus,
    label: '已完成',
    labelKey: 'case.status.completed',
    color: 'success',
    icon: 'check_circle',
    description: '案例已成功完成',
  },
  CANCELLED: {
    value: 'CANCELLED' as CaseStatus,
    label: '已取消',
    labelKey: 'case.status.cancelled',
    color: 'error',
    icon: 'cancel',
    description: '案例已被用户或系统取消',
  },
} as const;

/**
 * Case Status List
 * 
 * Array of all case statuses for dropdown selections.
 */
export const CASE_STATUS_LIST = Object.values(CASE_STATUS);

// ============================================================================
// Case Priority Constants
// ============================================================================

/**
 * Case Priority Configuration
 */
export const CASE_PRIORITY = {
  LOW: {
    value: 'LOW' as CasePriority,
    label: '低',
    labelKey: 'case.priority.low',
    color: 'default',
    icon: 'arrow_downward',
    level: 1,
  },
  NORMAL: {
    value: 'NORMAL' as CasePriority,
    label: '普通',
    labelKey: 'case.priority.normal',
    color: 'info',
    icon: 'remove',
    level: 2,
  },
  HIGH: {
    value: 'HIGH' as CasePriority,
    label: '高',
    labelKey: 'case.priority.high',
    color: 'warning',
    icon: 'arrow_upward',
    level: 3,
  },
  URGENT: {
    value: 'URGENT' as CasePriority,
    label: '紧急',
    labelKey: 'case.priority.urgent',
    color: 'error',
    icon: 'priority_high',
    level: 4,
  },
} as const;

/**
 * Case Priority List
 */
export const CASE_PRIORITY_LIST = Object.values(CASE_PRIORITY);

// ============================================================================
// Case Node Status Constants
// ============================================================================

/**
 * Case Node Status Configuration
 */
export const CASE_NODE_STATUS = {
  PENDING: {
    value: 'PENDING' as CaseNodeStatus,
    label: '待开始',
    labelKey: 'case.node.status.pending',
    color: 'default',
    icon: 'hourglass_empty',
  },
  ACTIVE: {
    value: 'ACTIVE' as CaseNodeStatus,
    label: '进行中',
    labelKey: 'case.node.status.active',
    color: 'primary',
    icon: 'play_arrow',
  },
  DONE: {
    value: 'DONE' as CaseNodeStatus,
    label: '已完成',
    labelKey: 'case.node.status.done',
    color: 'success',
    icon: 'check',
  },
  SKIPPED: {
    value: 'SKIPPED' as CaseNodeStatus,
    label: '已跳过',
    labelKey: 'case.node.status.skipped',
    color: 'info',
    icon: 'skip_next',
  },
  FAILED: {
    value: 'FAILED' as CaseNodeStatus,
    label: '失败',
    labelKey: 'case.node.status.failed',
    color: 'error',
    icon: 'error',
  },
} as const;

/**
 * Case Node Status List
 */
export const CASE_NODE_STATUS_LIST = Object.values(CASE_NODE_STATUS);

// ============================================================================
// Case Node Type Constants
// ============================================================================

/**
 * Case Node Type Configuration
 */
export const CASE_NODE_TYPE = {
  PACKAGE_SELECT: {
    value: 'PACKAGE_SELECT' as CaseNodeType,
    label: '套餐选择',
    labelKey: 'case.node.type.packageSelect',
    icon: 'inventory_2',
    color: 'primary',
  },
  INTAKE: {
    value: 'INTAKE' as CaseNodeType,
    label: '资料收集',
    labelKey: 'case.node.type.intake',
    icon: 'folder_open',
    color: 'info',
  },
  APPOINTMENT: {
    value: 'APPOINTMENT' as CaseNodeType,
    label: '预约安排',
    labelKey: 'case.node.type.appointment',
    icon: 'event',
    color: 'secondary',
  },
  ARRIVAL: {
    value: 'ARRIVAL' as CaseNodeType,
    label: '到达确认',
    labelKey: 'case.node.type.arrival',
    icon: 'flight_land',
    color: 'success',
  },
  EXAMINATION: {
    value: 'EXAMINATION' as CaseNodeType,
    label: '医疗检查',
    labelKey: 'case.node.type.examination',
    icon: 'medical_services',
    color: 'primary',
  },
  REPORT: {
    value: 'REPORT' as CaseNodeType,
    label: '报告生成',
    labelKey: 'case.node.type.report',
    icon: 'description',
    color: 'info',
  },
  TRANSLATION: {
    value: 'TRANSLATION' as CaseNodeType,
    label: '翻译服务',
    labelKey: 'case.node.type.translation',
    icon: 'translate',
    color: 'secondary',
  },
  FOLLOW_UP: {
    value: 'FOLLOW_UP' as CaseNodeType,
    label: '随访关怀',
    labelKey: 'case.node.type.followUp',
    icon: 'support_agent',
    color: 'warning',
  },
  COMPLETION: {
    value: 'COMPLETION' as CaseNodeType,
    label: '案例完成',
    labelKey: 'case.node.type.completion',
    icon: 'task_alt',
    color: 'success',
  },
  CUSTOM: {
    value: 'CUSTOM' as CaseNodeType,
    label: '自定义节点',
    labelKey: 'case.node.type.custom',
    icon: 'extension',
    color: 'default',
  },
} as const;

/**
 * Case Node Type List
 */
export const CASE_NODE_TYPE_LIST = Object.values(CASE_NODE_TYPE);

// ============================================================================
// Schedule Item Status Constants
// ============================================================================

/**
 * Schedule Item Status Configuration
 */
export const SCHEDULE_ITEM_STATUS = {
  SCHEDULED: {
    value: 'SCHEDULED' as ScheduleItemStatus,
    label: '已安排',
    labelKey: 'case.schedule.status.scheduled',
    color: 'info',
    icon: 'event_available',
  },
  IN_PROGRESS: {
    value: 'IN_PROGRESS' as ScheduleItemStatus,
    label: '进行中',
    labelKey: 'case.schedule.status.inProgress',
    color: 'primary',
    icon: 'play_circle',
  },
  COMPLETED: {
    value: 'COMPLETED' as ScheduleItemStatus,
    label: '已完成',
    labelKey: 'case.schedule.status.completed',
    color: 'success',
    icon: 'check_circle',
  },
  CANCELLED: {
    value: 'CANCELLED' as ScheduleItemStatus,
    label: '已取消',
    labelKey: 'case.schedule.status.cancelled',
    color: 'error',
    icon: 'cancel',
  },
  RESCHEDULED: {
    value: 'RESCHEDULED' as ScheduleItemStatus,
    label: '已改期',
    labelKey: 'case.schedule.status.rescheduled',
    color: 'warning',
    icon: 'update',
  },
} as const;

/**
 * Schedule Item Status List
 */
export const SCHEDULE_ITEM_STATUS_LIST = Object.values(SCHEDULE_ITEM_STATUS);

// ============================================================================
// Schedule Item Type Constants
// ============================================================================

/**
 * Schedule Item Type Configuration
 */
export const SCHEDULE_ITEM_TYPE = {
  APPOINTMENT: {
    value: 'APPOINTMENT' as ScheduleItemType,
    label: '医疗预约',
    labelKey: 'case.schedule.type.appointment',
    icon: 'medical_services',
    color: 'primary',
  },
  TRANSPORT: {
    value: 'TRANSPORT' as ScheduleItemType,
    label: '交通安排',
    labelKey: 'case.schedule.type.transport',
    icon: 'directions_car',
    color: 'info',
  },
  ACCOMMODATION: {
    value: 'ACCOMMODATION' as ScheduleItemType,
    label: '住宿安排',
    labelKey: 'case.schedule.type.accommodation',
    icon: 'hotel',
    color: 'secondary',
  },
  MEAL: {
    value: 'MEAL' as ScheduleItemType,
    label: '用餐安排',
    labelKey: 'case.schedule.type.meal',
    icon: 'restaurant',
    color: 'warning',
  },
  TRANSLATION: {
    value: 'TRANSLATION' as ScheduleItemType,
    label: '翻译服务',
    labelKey: 'case.schedule.type.translation',
    icon: 'translate',
    color: 'success',
  },
  CUSTOM: {
    value: 'CUSTOM' as ScheduleItemType,
    label: '其他',
    labelKey: 'case.schedule.type.custom',
    icon: 'event_note',
    color: 'default',
  },
} as const;

/**
 * Schedule Item Type List
 */
export const SCHEDULE_ITEM_TYPE_LIST = Object.values(SCHEDULE_ITEM_TYPE);

// ============================================================================
// Timeline Event Type Constants
// ============================================================================

/**
 * Timeline Event Type Configuration
 */
export const TIMELINE_EVENT_TYPE = {
  CASE_CREATED: {
    value: 'CASE_CREATED' as TimelineEventType,
    label: '案例创建',
    labelKey: 'case.timeline.type.caseCreated',
    icon: 'add_circle',
    color: 'success',
  },
  CASE_UPDATED: {
    value: 'CASE_UPDATED' as TimelineEventType,
    label: '案例更新',
    labelKey: 'case.timeline.type.caseUpdated',
    icon: 'edit',
    color: 'info',
  },
  STATUS_CHANGED: {
    value: 'STATUS_CHANGED' as TimelineEventType,
    label: '状态变更',
    labelKey: 'case.timeline.type.statusChanged',
    icon: 'swap_horiz',
    color: 'warning',
  },
  NODE_STARTED: {
    value: 'NODE_STARTED' as TimelineEventType,
    label: '节点开始',
    labelKey: 'case.timeline.type.nodeStarted',
    icon: 'play_arrow',
    color: 'primary',
  },
  NODE_COMPLETED: {
    value: 'NODE_COMPLETED' as TimelineEventType,
    label: '节点完成',
    labelKey: 'case.timeline.type.nodeCompleted',
    icon: 'check',
    color: 'success',
  },
  PARAMETER_SET: {
    value: 'PARAMETER_SET' as TimelineEventType,
    label: '参数设置',
    labelKey: 'case.timeline.type.parameterSet',
    icon: 'settings',
    color: 'info',
  },
  FILE_UPLOADED: {
    value: 'FILE_UPLOADED' as TimelineEventType,
    label: '文件上传',
    labelKey: 'case.timeline.type.fileUploaded',
    icon: 'upload_file',
    color: 'secondary',
  },
  DOCUMENT_SIGNED: {
    value: 'DOCUMENT_SIGNED' as TimelineEventType,
    label: '文档签署',
    labelKey: 'case.timeline.type.documentSigned',
    icon: 'draw',
    color: 'success',
  },
  SCHEDULE_UPDATED: {
    value: 'SCHEDULE_UPDATED' as TimelineEventType,
    label: '行程更新',
    labelKey: 'case.timeline.type.scheduleUpdated',
    icon: 'event',
    color: 'info',
  },
  NOTE_ADDED: {
    value: 'NOTE_ADDED' as TimelineEventType,
    label: '备注添加',
    labelKey: 'case.timeline.type.noteAdded',
    icon: 'note_add',
    color: 'default',
  },
  ASSIGNMENT_CHANGED: {
    value: 'ASSIGNMENT_CHANGED' as TimelineEventType,
    label: '分配变更',
    labelKey: 'case.timeline.type.assignmentChanged',
    icon: 'person_add',
    color: 'warning',
  },
  CUSTOM: {
    value: 'CUSTOM' as TimelineEventType,
    label: '自定义事件',
    labelKey: 'case.timeline.type.custom',
    icon: 'bookmark',
    color: 'default',
  },
} as const;

/**
 * Timeline Event Type List
 */
export const TIMELINE_EVENT_TYPE_LIST = Object.values(TIMELINE_EVENT_TYPE);
