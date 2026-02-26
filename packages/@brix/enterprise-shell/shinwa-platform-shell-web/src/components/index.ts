/**
 * @file Layout Component Exports
 * @description Export all layout-related components
 * @module @shinwa/shinwa-platform-shell-web/components
 * @version 3.2.0
 *
 * [Architecture Position]
 * This module exports all layout components pre-assembled in the Shell layer.
 * Host layer imports directly, following the Host thin-layer principle.
 */

// ========== Layout Container Component ==========
export { LayoutContainer, type LayoutContainerProps } from './LayoutContainer';

// ========== Top Navigation Bar Component ==========
export { AppHeader, type AppHeaderProps } from './AppHeader';

// ========== Sidebar Component ==========
export { AppSidebar, type AppSidebarProps, type SidebarMenuItem } from './AppSidebar';

// ========== Dynamic Route Component ==========
export {
  DynamicPluginRoutes,
  renderDynamicRoutes,
  convertToRouteObjects,
  type DynamicPluginRoutesProps,
  type DynamicRoutesOptions,
  type AggregatedRoute,
} from './DynamicPluginRoutes';
