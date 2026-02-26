/**
 * @file Menu Configuration Type Definitions
 * @description Menu-related type definitions (types and Host core menus only, plugin menus are dynamically loaded)
 * @module host-standalone-web/config/menu.config
 * @version 3.0.5
 *
 * [Design Principle] Following v3.0.4 blueprint Manifest-Driven architecture
 * - Host only defines its own core menus (Dashboard, Settings)
 * - Plugin menus are declared by each plugin's ui-manifest.json
 * - Runtime dynamically aggregates via usePluginSystem hook
 *
 * @see usePluginSystem.ts Dynamic plugin menu loading
 */

/**
 * Menu Item Type
 */
export interface MenuItem {
  /** Menu Key (used for expand/active state) */
  key: string;
  /** Menu ID */
  id?: string;
  /** Menu title */
  title: string;
  /** Menu icon */
  icon?: string;
  /** Menu path */
  path?: string;
  /** Sort weight (lower number = earlier position) */
  order?: number;
  /** Sub-menu items */
  children?: MenuItem[];
  /** Whether hidden */
  hidden?: boolean;
  /** Source (host or plugin id) */
  source?: string;
}

/**
 * Host Core Menus
 *
 * Contains only core function entries provided by the Host layer.
 * Plugin menus are declared by each plugin manifest and dynamically loaded at runtime.
 */
export const hostCoreMenus: MenuItem[] = [
  {
    key: 'dashboard',
    id: 'dashboard',
    title: '工作台',
    icon: '📊',
    path: '/dashboard',
    order: 0,
    source: 'host',
  },
  {
    key: 'settings',
    id: 'settings',
    title: '系统设置',
    icon: '⚙️',
    path: '/settings',
    order: 9999, // Sorted last
    source: 'host',
  },
];

/**
 * [Deprecated] Old static menu configuration
 *
 * @deprecated Please use usePluginSystem hook to get dynamic menus
 * This export is retained only for backward compatibility and will be removed in the next version
 */
export const menuConfig: MenuItem[] = hostCoreMenus;
