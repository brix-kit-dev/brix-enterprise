/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Commercial use requires a valid Brix Enterprise license.
 */
/**
 * @file Chinese (Simplified) translations for app-intake plugin
 * @module intake-ui-web/i18n/zh-CN
 * @version 3.3.0
 */

const zhCN: Record<string, string> = {
  // Common
  'common.loading': '加载中...',
  'common.back': '返回',
  'common.backToList': '返回列表',
  'common.backToDetail': '返回详情',
  'common.cancel': '取消',
  'common.edit': '编辑',
  'common.refresh': '刷新',
  'common.status': '状态',

  // Document fields
  'doc.fileName': '文件名',
  'doc.fileSize': '文件大小',
  'doc.submitTime': '提交时间',
  'doc.submitter': '提交人',
  'doc.reviewer': '审核人',
  'doc.reviewTime': '审核时间',
  'doc.reviewComment': '审核意见',
  'doc.rejectReason': '拒绝原因',
  'doc.required': '必填',

  // Task fields
  'task.customerId': '客户ID',
  'task.relatedCase': '关联案例',
  'task.deadline': '截止日期',
  'task.createdAt': '创建时间',
  'task.createdBy': '创建人',
  'task.updatedAt': '最后更新',
  'task.priority': '优先级',
  'task.remarks': '备注',

  // Actions
  'action.approve': '通过',
  'action.reject': '拒绝',
  'action.upload': '上传',
  'action.approveAll': '全部通过',
  'action.confirmReject': '确认驳回',
  'action.activate': '激活任务',
  'action.activateShort': '激活',
  'action.submitDocuments': '提交资料',
  'action.reviewDocuments': '审核资料',
  'action.cancelTask': '取消任务',
  'action.deleteTask': '删除任务',
  'action.createTask': '创建任务',

  // Status labels
  'status.draft': '草稿',
  'status.inProgress': '进行中',
  'status.reviewing': '审核中',
  'status.completed': '已完成',
  'status.cancelled': '已取消',
  'review.pending': '待审核',
  'review.approved': '已通过',
  'review.rejected': '已驳回',

  // Page titles
  'page.taskList': '资料收集任务',
  'page.review': '审核资料',
  'page.submit': '提交资料',

  // Table headers
  'table.title': '标题',
  'table.status': '状态',
  'table.priority': '优先级',
  'table.progress': '进度',
  'table.deadline': '截止日期',
  'table.actions': '操作',

  // Messages
  'message.loading': '加载中...',
  'message.taskNotFound': '任务不存在',
  'message.reviewNotAllowed': '此任务当前状态不允许审核资料',
  'message.submitNotAllowed': '此任务当前状态不允许提交资料',
  'message.allApproved': '所有已提交的资料均已审核通过',
  'message.allSubmitted': '所有资料已提交完成，请等待审核',
  'empty.noTasks': '暂无任务',
  'empty.noSubmitted': '暂无已提交的资料',
  'confirm.cancelTask': '确定要取消此任务吗？',
  'confirm.deleteTask': '确定要删除此任务吗？此操作不可恢复。',
  'confirm.approveAll': '确定要批准所有 {count} 项待审核的资料吗？',

  // Upload
  'upload.dropzone': '点击或拖拽文件到此处上传',
  'upload.maxSize': '最大文件大小',
  'upload.uploading': '上传中...',
  'upload.success': '上传成功',
  'upload.uploadFile': '上传文件',
  'upload.unsupportedType': '不支持的文件类型',
  'upload.sizeExceeded': '文件大小超过限制',
  'upload.supportedFormats': '支持 JPG 格式',
  'upload.maxSizeHint': '单个文件最大 10MB',
  'upload.requiredHint': '必需项目必须全部提交才能完成任务',
};

export default zhCN;
