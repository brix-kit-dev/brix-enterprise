/**
 * 身份认证模块 - Mobile Hooks 导出
 *
 * 【三层分离架构说明】
 * - UI层（screens/）：负责渲染和用户交互，不直接调用 API
 * - Hook层（hooks/）：封装业务逻辑和状态管理，调用 Repository
 * - 数据层（api/）：通过 HttpCapability 与后端通信
 *
 * @author Shinwa Team
 * @since 3.0.0
 * @version 3.2.0
 */

export { useUserList, type UseUserListOptions, type UseUserListReturn } from './useUserList';
export { useUserDetail, type UseUserDetailReturn } from './useUserDetail';
export { useUserMutation, type UseUserMutationReturn } from './useUserMutation';
