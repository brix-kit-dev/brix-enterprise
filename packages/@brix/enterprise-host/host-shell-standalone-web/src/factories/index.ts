/**
 * @file Factories module entry
 * @description Re-exports all factory functions
 * @module host-standalone-web/factories
 * @version 3.1.0
 * 
 * 【架构说明】
 * 工厂模块集中导出所有页面和组件工厂函数，
 * 支持 App.tsx 的代码拆分，减少文件大小。
 */

export {
  createLoginPageFactory,
  createRegisterPageFactory,
  createDashboardPageFactory,
  createErrorPagesFactory,
  createAllPages,
  type NavigationService,
  type PageAuthService,
  type SocialProvider,
  type PageFactoryDeps,
} from './pages.factory';
