/**
 * @file Layout Component Exports
 * @description Export all layout components
 * @module @shinwa/shinwa-platform-shell-web/layouts
 * @version 3.2.0
 *
 * [v3.2.0 Refactoring]
 * AppLayout has been split into multiple independent components:
 * - AppHeader: Header component
 * - SimpleSidebar: Sidebar component
 * - LayoutHelpers: Helper components (Loading/Error/404)
 * - LazyComponentFactory: Lazy loading factory
 */

// ============================================================================
// Base Layout Components
// ============================================================================

export { ConsoleLayout, type ConsoleLayoutProps } from './ConsoleLayout';
export { PortalLayout, type PortalLayoutProps } from './PortalLayout';
export { MinimalLayout, type MinimalLayoutProps } from './MinimalLayout';
export {
  ProtectedLayout,
  type ProtectedLayoutProps,
  type LayoutDimensions,
  type LayoutBranding,
  type LayoutUser,
} from './ProtectedLayout';

// ============================================================================
// Manifest-Driven Dynamic Components (v3.2.0)
// ============================================================================

/**
 * [Dynamic Layout System]
 * Implemented according to v3.0.4 blueprint:
 * - AppLayout: One-stop application layout, integrating menus and routes
 *   (Self-contained with all dynamic menu and route logic, no external dependencies)
 */
export { 
  AppLayout, 
  type AppLayoutProps,
  type HostPluginConfig,
  type UIPluginManifest,
  type AggregatedRoute,
  type LayoutState,
  type PermissionChecker,
  type ModuleLoader,
  type MenuItem,
} from './AppLayout';

// ============================================================================
// Sub-component Exports (for advanced customization)
// ============================================================================

export {
  // Components
  AppHeader,
  SimpleSidebar,
  LoadingSpinner,
  UnauthorizedPage,
  NotFoundPage,
  PluginLoadErrorPage,
  // Factory functions
  createLazyComponent,
  clearComponentCache,
  clearAllComponentCache,
  getComponentCacheStats,
  // Icon utilities
  getMenuIcon,
  hasIcon,
  getAvailableIcons,
} from './components';

export type {
  AppHeaderProps,
  SimpleSidebarProps,
  LoadingSpinnerProps,
  UnauthorizedPageProps,
  NotFoundPageProps,
  PluginLoadErrorPageProps,
} from './components';
