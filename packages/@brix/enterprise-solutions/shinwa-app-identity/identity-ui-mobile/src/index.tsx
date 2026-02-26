/**
 * 身份认证模块 - Mobile UI 入口
 * 
 * v3.0 Runtime Shell 架构
 * 导出所有移动端页面组件
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */

// 页面组件
export { default as UserListScreen } from './screens/UserListScreen';
export { default as UserDetailScreen } from './screens/UserDetailScreen';
export { default as UserCreateScreen } from './screens/UserCreateScreen';

// 导航配置
export { default as IdentityNavigation } from './navigation';

// 类型定义
export * from './types';
