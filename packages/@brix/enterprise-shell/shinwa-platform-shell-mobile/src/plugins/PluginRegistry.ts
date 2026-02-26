/**
 * Plugin Registry - Central Registry for Plugin Management
 * 
 * This class manages the registration and retrieval of plugin modules
 * within the mobile shell. It provides a centralized API for plugin
 * discovery and access.
 * 
 * @module @shinwa/shinwa-platform-shell-mobile/plugins
 * @since 3.1.0
 */

import type { PluginModule, PluginManifest, PluginRegistryEntry } from './types';
import type { RouteConfig } from '../navigation/types';

/**
 * PluginRegistry Class
 * 
 * Central registry for managing plugin modules. Provides methods for
 * registration, lookup, and lifecycle management.
 * 
 * 插件模块的中央注册表。提供注册、查找和生命周期管理的方法
 * 
 * @example
 * ```typescript
 * const registry = new PluginRegistry();
 * 
 * // Register a plugin
 * registry.register(manifest, pluginModule);
 * 
 * // Get plugin by ID
 * const plugin = registry.get('booking');
 * 
 * // Get all registered routes
 * const routes = registry.getRoutes();
 * ```
 */
export class PluginRegistry {
  private plugins: Map<string, PluginRegistryEntry> = new Map();

  /**
   * Register a plugin module
   * @param manifest - Plugin manifest
   * @param module - Plugin module
   */
  register(manifest: PluginManifest, module: PluginModule): void {
    if (this.plugins.has(manifest.id)) {
      console.warn(`Plugin ${manifest.id} is already registered. Skipping.`);
      return;
    }

    this.plugins.set(manifest.id, {
      manifest,
      module,
      loadedAt: new Date()
    });
  }

  /**
   * Unregister a plugin
   * @param id - Plugin ID
   * @returns true if plugin was unregistered
   */
  unregister(id: string): boolean {
    const entry = this.plugins.get(id);
    if (entry?.module.destroy) {
      entry.module.destroy();
    }
    return this.plugins.delete(id);
  }

  /**
   * Get a plugin by ID
   * @param id - Plugin ID
   * @returns Plugin entry or undefined
   */
  get(id: string): PluginRegistryEntry | undefined {
    return this.plugins.get(id);
  }

  /**
   * Check if a plugin is registered
   * @param id - Plugin ID
   * @returns true if plugin is registered
   */
  has(id: string): boolean {
    return this.plugins.has(id);
  }

  /**
   * Get all registered plugins
   * @returns Array of plugin entries
   */
  getAll(): PluginRegistryEntry[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all registered routes from all plugins
   * @returns Array of route configurations
   */
  getRoutes(): RouteConfig[] {
    const routes: RouteConfig[] = [];
    
    for (const entry of this.plugins.values()) {
      if (entry.module.routes) {
        routes.push(...entry.module.routes);
      }
    }
    
    return routes;
  }

  /**
   * Get plugin count
   * @returns Number of registered plugins
   */
  get size(): number {
    return this.plugins.size;
  }

  /**
   * Clear all registered plugins
   */
  clear(): void {
    // Destroy all plugins first
    // 先销毁所有插件
    for (const entry of this.plugins.values()) {
      if (entry.module.destroy) {
        entry.module.destroy();
      }
    }
    this.plugins.clear();
  }
}
