/**
 * @file Plugin Configuration Type Definitions
 * @description Type definitions related to plugin configuration (types only, no hardcoded data)
 * @module host-standalone-web/config/plugins.config
 * @version 3.2.0
 *
 * [Design Principle] Following v3.0.4 blueprint ultra-thin Host principle
 * - Host does not hardcode any plugin list
 * - Plugin list is dynamically fetched from backend /api/plugins
 * - This file only defines types for use by other modules
 *
 * [v3.2.0 Cleanup]
 * - Removed duplicate hostCoreMenus definition (merged into menu.config.ts)
 * - Retained PluginDeclaration type for plugin discovery
 *
 * @see plugin-discovery.ts Plugin list fetching service
 * @see manifest-loader.ts Plugin manifest loading service
 * @see menu.config.ts Host core menu configuration
 */

/**
 * Plugin Declaration Info (aligned with backend API response format)
 *
 * Plugin information returned from /api/plugins endpoint
 */
export interface PluginDeclaration {
  /** Plugin unique identifier */
  id: string;
  /** Plugin display name */
  name: string;
  /** Module Federation remote entry URL */
  remoteEntry: string;
  /** UI Manifest JSON URL */
  manifestUrl: string;
  /** Whether enabled */
  enabled: boolean;
  /** Priority (lower number = higher priority) */
  priority: number;
}

/**
 * Host Menu Configuration Type
 *
 * @deprecated Please use MenuItem type from menu.config.ts
 * This type is retained only for backward compatibility
 */
export interface HostMenuConfig {
  /** Menu item ID */
  id: string;
  /** Menu title */
  title: string;
  /** Icon (optional) */
  icon?: string;
  /** Route path */
  path: string;
  /** Sort weight */
  order: number;
}

// ========== Removed Duplicate Definitions ==========
//
// hostCoreMenus has been moved to menu.config.ts
// Please use: import { hostCoreMenus } from './menu.config';
//
