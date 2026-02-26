/**
 * 消息通知模块 - Web 类型定义
 * 
 * v3.0 Runtime Shell 架构
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */

/**
 * 消息类型枚举
 */
export type MessageType = 'SYSTEM' | 'PRIVATE' | 'BROADCAST' | 'NOTIFICATION';

/**
 * 消息状态枚举
 */
export type MessageStatus = 'UNREAD' | 'READ' | 'ARCHIVED' | 'DELETED';

/**
 * 消息数据传输对象
 */
export interface MessageDTO {
  /** 消息ID */
  messageId: string;
  /** 租户ID */
  tenantId: string;
  /** 发送者ID */
  senderId: string;
  /** 发送者名称 */
  senderName?: string;
  /** 接收者ID */
  receiverId: string;
  /** 接收者名称 */
  receiverName?: string;
  /** 消息标题 */
  title: string;
  /** 消息内容 */
  content: string;
  /** 消息类型 */
  type: MessageType;
  /** 消息状态 */
  status: MessageStatus;
  /** 业务关联ID */
  referenceId?: string;
  /** 业务关联类型 */
  referenceType?: string;
  /** 创建时间 */
  createdAt: string;
  /** 阅读时间 */
  readAt?: string;
}

/**
 * 发送消息请求
 */
export interface SendMessageRequest {
  /** 接收者ID */
  receiverId: string;
  /** 消息标题 */
  title?: string;
  /** 消息内容 */
  content?: string;
  /** 消息类型 */
  type: MessageType;
  /** 模板编码 */
  templateCode?: string;
  /** 模板变量 */
  variables?: string;
  /** 业务关联ID */
  referenceId?: string;
  /** 业务关联类型 */
  referenceType?: string;
}

/**
 * 消息类型标签映射
 */
export const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  SYSTEM: '系统通知',
  PRIVATE: '私信',
  BROADCAST: '广播消息',
  NOTIFICATION: '业务通知',
};

/**
 * 消息状态标签映射
 */
export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  UNREAD: '未读',
  READ: '已读',
  ARCHIVED: '已归档',
  DELETED: '已删除',
};

/**
 * 消息类型颜色映射
 */
export const MESSAGE_TYPE_COLORS: Record<MessageType, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error'> = {
  SYSTEM: 'warning',
  PRIVATE: 'primary',
  BROADCAST: 'info',
  NOTIFICATION: 'success',
};

/**
 * API 基础路径
 */
export const API_BASE = '/api/v1/messenger/messages';
