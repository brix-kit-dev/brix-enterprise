/**
 * usePlugins Hook - Access Plugin Registry
 * 
 * @module @shinwa/shinwa-platform-shell-mobile/hooks
 * @since 3.1.0
 */

import { useMemo } from 'react';
import { useShell } from './useShell';
import type { PluginRegistryEntry } from '../plugins/types';

/**
 * usePlugins Return Type
 */
export interface UsePluginsReturn {
  /** All registered plugins */
  plugins: PluginRegistryEntry[];
  /** Whether all plugins are loaded */
  isLoaded: boolean;
  /** Get a plugin by ID */
  getPlugin: (id: string) => PluginRegistryEntry | undefined;
  /** Check if a plugin is registered */
  hasPlugin: (id: string) => boolean;
}

/**
 * usePlugins Hook
 * 
 * Provides access to the plugin registry and loaded plugin information.
 * 
 * 提供对插件注册表和已加载插件信息的访问
 * 
 * @returns Plugin information and utilities
 * 
 * @example
 * ```tsx
 * const { plugins, isLoaded, hasPlugin } = usePlugins();
 * 
 * if (hasPlugin('booking')) {
 *   // Booking plugin is available
 * }
 * 
 * return (
 *   <View>
 *     <Text>Loaded {plugins.length} plugins</Text>
 *   </View>
 * );
 * ```
 */
export function usePlugins(): UsePluginsReturn {
  const { state } = useShell();

  // Note: In a full implementation, this would access the actual PluginRegistry
  // 注意：在完整实现中，这将访问实际的 PluginRegistry
  const plugins: PluginRegistryEntry[] = useMemo(() => [], []);

  const getPlugin = useMemo(
    () => (id: string) => plugins.find(p => p.manifest.id === id),
    [plugins]
  );

  const hasPlugin = useMemo(
    () => (id: string) => plugins.some(p => p.manifest.id === id),
    [plugins]
  );

  return {
    plugins,
    isLoaded: state.pluginsLoaded,
    getPlugin,
    hasPlugin
  };
}
