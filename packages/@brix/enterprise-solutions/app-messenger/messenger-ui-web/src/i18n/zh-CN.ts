/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Commercial use requires a valid Brix Enterprise license.
 */
/**
 * @file Chinese (Simplified) translations for app-messenger plugin
 * @module messenger-ui-web/i18n/zh-CN
 * @version 3.3.0
 */

const zhCN: Record<string, string> = {
  // Message types
  'type.system': '系统通知',
  'type.private': '私信',
  'type.broadcast': '广播消息',
  'type.business': '业务通知',

  // Message status
  'status.unread': '未读',
  'status.read': '已读',
  'status.archived': '已归档',
  'status.deleted': '已删除',

  // Type config with descriptions
  'typeConfig.system': '系统消息',
  'typeConfig.systemDesc': '由系统自动生成的重要通知',
  'typeConfig.notification': '通知消息',
  'typeConfig.notificationDesc': '业务模块产生的通知',
  'typeConfig.private': '私信消息',
  'typeConfig.privateDesc': '用户之间的私密对话',
  'typeConfig.broadcast': '广播消息',
  'typeConfig.broadcastDesc': '发送给所有用户的公告',

  // Status descriptions
  'statusDesc.unread': '消息已送达但未被查看',
  'statusDesc.read': '消息已被接收者查看',
  'statusDesc.archived': '消息已被归档保存',
  'statusDesc.deleted': '消息已被软删除',

  // Inbox page
  'page.inbox': '消息中心',
  'action.compose': '写消息',
  'filter.all': '全部',
  'filter.unread': '未读',
  'filter.read': '已读',
  'filter.archived': '已归档',
  'empty.noMessages': '暂无消息',
  'action.markRead': '标记已读',
  'action.markAllRead': '全部已读',
  'action.archive': '归档',
  'action.delete': '删除',
  'action.selected': '已选择',
  'pagination.prev': '上一页',
  'pagination.next': '下一页',

  // Time labels
  'time.justNow': '刚刚',
  'time.minutesAgo': '{count} 分钟前',
  'time.hoursAgo': '{count} 小时前',
  'time.daysAgo': '{count} 天前',

  // Compose page
  'compose.title': '发送消息',
  'compose.replyTitle': '回复消息',
  'compose.recipient': '接收者',
  'compose.recipientPlaceholder': '输入接收者ID或用户名',
  'compose.type': '消息类型',
  'compose.subject': '标题',
  'compose.subjectPlaceholder': '输入消息标题',
  'compose.content': '内容',
  'compose.contentPlaceholder': '输入消息内容...',
  'compose.cancel': '取消',
  'compose.send': '发送',

  // Validation
  'validation.recipientRequired': '接收者不能为空',
  'validation.subjectRequired': '标题不能为空',
  'validation.subjectMaxLength': '标题长度不能超过200字符',
  'validation.contentRequired': '内容不能为空',
  'validation.contentMaxLength': '内容长度不能超过5000字符',

  // Message detail
  'detail.title': '消息详情',
  'detail.back': '返回',
  'detail.reply': '回复',
  'detail.notFound': '消息不存在',
  'detail.readAt': '已读于',
  'detail.relatedBusiness': '关联业务',

  // Error messages
  'error.loadFailed': '加载收件箱失败',
  'error.markReadFailed': '标记已读失败',
  'error.batchMarkReadFailed': '批量标记已读失败',
  'error.markAllReadFailed': '全部标记已读失败',
  'error.archiveFailed': '归档消息失败',
  'error.deleteFailed': '删除消息失败',
};

export default zhCN;
