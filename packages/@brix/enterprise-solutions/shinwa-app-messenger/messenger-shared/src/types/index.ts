/**
 * @fileoverview 类型定义索引
 * @description 导出所有消息模块的类型定义
 * @version 3.0.0
 * @module @shinwa/messenger-shared/types
 */

export type {
  // 基础类型
  MessageType,
  MessageStatus,
  // 数据传输对象
  MessageDTO,
  // 请求参数
  CreateMessageParams,
  UpdateMessageParams,
  MessageQueryParams,
  // 响应类型
  MessageListResponse,
  MessageDetailResponse,
} from './message';
