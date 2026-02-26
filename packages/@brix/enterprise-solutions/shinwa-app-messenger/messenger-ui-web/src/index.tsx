/**
 * 消息通知模块 - Web UI 入口
 * 
 * v3.0 Runtime Shell 架构
 * 导出所有页面组件供 Module Federation 使用
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */

// 页面组件
export { default as InboxPage } from './pages/InboxPage';
export { default as MessageDetailPage } from './pages/MessageDetailPage';
export { default as ComposePage } from './pages/ComposePage';

// 类型定义
export * from './types';
