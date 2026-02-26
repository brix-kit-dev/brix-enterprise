/**
 * Shell Types
 * 
 * @module @shinwa/shinwa-platform-shell-mobile
 * @since 3.1.0
 */

import type { PluginModule } from './plugins/types';

/**
 * Shell Configuration
 * 
 * Shell 配置
 */
export interface ShellConfig {
  /** Application name */
  appName: string;
  /** Application version */
  version: string;
  /** Theme mode */
  theme: 'light' | 'dark' | 'system';
  /** Plugins to load */
  plugins: PluginModule[];
  /** Navigation configuration */
  navigation: {
    /** Navigation type */
    type: 'tab' | 'drawer' | 'stack';
    /** Initial route name */
    initialRoute: string;
  };
  /** API configuration */
  api?: {
    /** Base URL for API requests */
    baseUrl: string;
    /** Request timeout in ms */
    timeout?: number;
  };
  /** Feature flags */
  features?: Record<string, boolean>;
}

/**
 * Shell State
 * 
 * Shell 状态
 */
export interface ShellState {
  /** Whether shell has initialized */
  initialized: boolean;
  /** Whether all plugins have loaded */
  pluginsLoaded: boolean;
  /** Current route name */
  currentRoute: string | null;
  /** Error message if any */
  error: string | null;
}
