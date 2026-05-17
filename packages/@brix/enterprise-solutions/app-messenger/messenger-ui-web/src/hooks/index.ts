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
 * @file Hooks 层统一入口
 * @description 导出所有 ViewModel Hooks
 * @module messenger-ui-web/hooks
 * @version 3.2.0
 * 
 * 【v3.2 前后端分离架构】
 * Hooks 层作为 ViewModel 层，负责：
 * 1. 管理页面状态
 * 2. 封装业务逻辑
 * 3. 调用 Repository 层获取数据
 * 4. 订阅和发布事件
 */

// 收件箱 Hook
export { useInbox } from './useInbox';
export type { UseInboxResult, InboxState, InboxActions } from './useInbox';

// 发件箱 Hook
export { useOutbox } from './useOutbox';
export type { UseOutboxResult, OutboxState, OutboxActions } from './useOutbox';

// 消息详情 Hook
export { useMessageDetail } from './useMessageDetail';
export type { UseMessageDetailResult, MessageDetailState, MessageDetailActions } from './useMessageDetail';

// 消息发送 Hook
export { useSendMessage } from './useSendMessage';
export type { UseSendMessageResult, SendMessageState, SendMessageActions } from './useSendMessage';

// 未读数量 Hook
export { useUnreadCount } from './useUnreadCount';
export type { UseUnreadCountResult } from './useUnreadCount';
