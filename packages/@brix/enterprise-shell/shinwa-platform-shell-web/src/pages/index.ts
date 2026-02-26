/**
 * @file pages Module Exports
 * @description Page exports for Web host package
 * @module @shinwa/shinwa-platform-shell-web/pages
 * @version 3.2.0
 */

// Dashboard
export { createDashboardPage, createSimpleDashboardPage } from './DashboardPage';

// Error Pages
export {
  createNotFoundPage,
  createSimpleNotFoundPage,
  createUnauthorizedPage,
  createSimpleUnauthorizedPage,
} from './ErrorPages';

// Placeholder Page (v3.2.0)
export {
  PlaceholderPage,
  createSimplePlaceholderPage,
  type PlaceholderPageProps,
  type SimplePlaceholderConfig,
} from './PlaceholderPage';

// Types
export type {
  // Common types
  ShellBranding,
  NavigationService,
  ShellRoutes,
  // Dashboard types
  StatCard,
  QuickAction,
  DashboardDataProvider,
  DashboardPageConfig,
  SimpleDashboardConfig,
  // Error types
  ErrorPageConfig,
  SimpleErrorPageConfig,
} from './types';
