/**
 * Plugin Loader - Dynamic Plugin Loading for Mobile
 * 
 * This component handles the loading and registration of plugin modules
 * within the mobile shell. It supports dynamic loading and hot reloading.
 * 
 * @module @shinwa/shinwa-platform-shell-mobile/plugins
 * @since 3.1.0
 */

import React, { useEffect, useState, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ShellContext } from '../providers/ShellProvider';
import { PluginRegistry } from './PluginRegistry';
import type { PluginModule, PluginManifest, PluginLoadOptions } from './types';

/**
 * Plugin Loader Props
 */
export interface PluginLoaderProps {
  /** Child components to render */
  children: ReactNode;
  /** Plugin modules to load */
  plugins: PluginModule[];
  /** Loading options */
  options?: PluginLoadOptions;
  /** Callback when all plugins are loaded */
  onLoaded?: (registry: PluginRegistry) => void;
  /** Callback when a plugin fails to load */
  onError?: (plugin: PluginManifest, error: Error) => void;
}

/**
 * PluginLoader Component
 * 
 * Manages the lifecycle of plugin modules, including loading,
 * initialization, and error handling.
 * 
 * 管理插件模块的生命周期，包括加载、初始化和错误处理
 * 
 * @example
 * ```tsx
 * import { PluginLoader } from '@shinwa/shinwa-platform-shell-mobile';
 * import BookingPlugin from '@shinwa/booking-ui-mobile';
 * import IdentityPlugin from '@shinwa/identity-ui-mobile';
 * 
 * function App() {
 *   return (
 *     <ShellProvider>
 *       <PluginLoader
 *         plugins={[BookingPlugin, IdentityPlugin]}
 *         onLoaded={(registry) => console.log('Plugins loaded:', registry.getAll())}
 *       >
 *         <ShellNavigator />
 *       </PluginLoader>
 *     </ShellProvider>
 *   );
 * }
 * ```
 */
export function PluginLoader({
  children,
  plugins,
  options,
  onLoaded,
  onError
}: PluginLoaderProps): JSX.Element {
  const shellContext = useContext(ShellContext);
  const [registry] = useState(() => new PluginRegistry());
  const [loaded, setLoaded] = useState(false);

  // Load plugin
  // 加载插件
  const loadPlugin = useCallback(async (plugin: PluginModule): Promise<void> => {
    try {
      const manifest = plugin.manifest;
      
      // Check dependencies
      // 检查依赖
      if (manifest.dependencies) {
        for (const dep of manifest.dependencies) {
          if (!registry.has(dep)) {
            throw new Error(`Missing dependency: ${dep}`);
          }
        }
      }

      // Initialize plugin
      // 初始化插件
      if (plugin.initialize) {
        await plugin.initialize({
          registry,
          config: options?.pluginConfig ?? {}
        });
      }

      // Register plugin
      // 注册插件
      registry.register(manifest, plugin);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Plugin load failed');
      onError?.(plugin.manifest, err);
      
      if (options?.failOnError !== false) {
        throw err;
      }
    }
  }, [registry, options, onError]);

  // Load all plugins
  // 加载所有插件
  useEffect(() => {
    const loadAllPlugins = async () => {
      try {
        // Sort plugins by dependency order
        // 按依赖顺序排序插件
        const sorted = sortByDependencies(plugins);

        // Load plugins sequentially to respect dependencies
        // 按顺序加载插件以尊重依赖关系
        for (const plugin of sorted) {
          await loadPlugin(plugin);
        }

        setLoaded(true);
        shellContext?.setState({ pluginsLoaded: true });
        onLoaded?.(registry);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to load plugins');
        shellContext?.setState({ error: err.message });
      }
    };

    if (plugins.length > 0) {
      loadAllPlugins();
    } else {
      setLoaded(true);
      shellContext?.setState({ pluginsLoaded: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}

/**
 * Sort plugins by dependency order using topological sort
 * 使用拓扑排序按依赖顺序排序插件
 */
function sortByDependencies(plugins: PluginModule[]): PluginModule[] {
  const sorted: PluginModule[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const pluginMap = new Map(plugins.map(p => [p.manifest.id, p]));

  function visit(plugin: PluginModule): void {
    const id = plugin.manifest.id;

    if (visited.has(id)) return;
    if (visiting.has(id)) {
      throw new Error(`Circular dependency detected: ${id}`);
    }

    visiting.add(id);

    // Visit dependencies first
    // 先访问依赖
    for (const depId of plugin.manifest.dependencies ?? []) {
      const dep = pluginMap.get(depId);
      if (dep) {
        visit(dep);
      }
    }

    visiting.delete(id);
    visited.add(id);
    sorted.push(plugin);
  }

  for (const plugin of plugins) {
    visit(plugin);
  }

  return sorted;
}
