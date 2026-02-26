/**
 * @file Layout Components Export Entry
 * @description Export all layout-related sub-components
 * @module @shinwa/shinwa-platform-shell-web/layouts/components
 * @version 3.2.0
 *
 * [Module Structure]
 * ```text
 * layouts/components/
 * +-- index.ts              This file (export entry)
 * +-- SimpleSidebar.tsx     Sidebar component
 * +-- AppHeader.tsx         Header component
 * +-- LayoutHelpers.tsx     Helper components (Loading/Error/404, etc.)
 * +-- LazyComponentFactory.tsx  Lazy loading factory
 * +-- menuIcons.tsx         Icon mapping
 * ```
 */

// ============================================================================
// Component Exports
// ============================================================================

export { SimpleSidebar } from './SimpleSidebar';
export type { SimpleSidebarProps, MenuItem } from './SimpleSidebar';

export { AppHeader } from './AppHeader';
export type { AppHeaderProps } from './AppHeader';

export {
  LoadingSpinner,
  UnauthorizedPage,
  NotFoundPage,
  PluginLoadErrorPage,
} from './LayoutHelpers';
export type {
  LoadingSpinnerProps,
  UnauthorizedPageProps,
  NotFoundPageProps,
  PluginLoadErrorPageProps,
} from './LayoutHelpers';

export {
  createLazyComponent,
  clearComponentCache,
  clearAllComponentCache,
  getComponentCacheStats,
} from './LazyComponentFactory';
export type {
  AggregatedRoute,
  ModuleLoader,
} from './LazyComponentFactory';

// ============================================================================
// Utility Function Exports
// ============================================================================

export { getMenuIcon, hasIcon, getAvailableIcons } from './menuIcons';
