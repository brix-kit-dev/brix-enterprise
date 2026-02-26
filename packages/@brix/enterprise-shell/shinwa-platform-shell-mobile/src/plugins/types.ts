/**
 * Plugin Types
 * 
 * @module @shinwa/shinwa-platform-shell-mobile/plugins
 * @since 3.1.0
 */

import type { RouteConfig } from '../navigation/types';
import type { PluginRegistry } from './PluginRegistry';

/**
 * Plugin Manifest
 * 
 * Describes the plugin's metadata, capabilities, and requirements.
 * 
 * 描述插件的元数据、能力和需求
 */
export interface PluginManifest {
  /** Unique plugin identifier */
  id: string;
  /** Plugin display name */
  name: string;
  /** Plugin version */
  version: string;
  /** Plugin description */
  description?: string;
  /** Plugin author */
  author?: string;
  /** Plugin dependencies (other plugin IDs) */
  dependencies?: string[];
  /** Required capabilities */
  capabilities?: {
    required?: string[];
    optional?: string[];
  };
  /** Plugin icon name */
  icon?: string;
  /** Priority for loading order */
  priority?: number;
}

/**
 * Plugin Module
 * 
 * The main plugin module interface that all plugins must implement.
 * 
 * 所有插件必须实现的主插件模块接口
 */
export interface PluginModule {
  /** Plugin manifest */
  manifest: PluginManifest;
  /** Routes provided by this plugin */
  routes?: RouteConfig[];
  /** Initialize the plugin */
  initialize?: (context: PluginInitContext) => Promise<void> | void;
  /** Destroy the plugin (cleanup) */
  destroy?: () => void;
}

/**
 * Plugin Initialization Context
 * 
 * 插件初始化上下文
 */
export interface PluginInitContext {
  /** Plugin registry for inter-plugin communication */
  registry: PluginRegistry;
  /** Plugin-specific configuration */
  config: Record<string, unknown>;
}

/**
 * Plugin Load Options
 * 
 * 插件加载选项
 */
export interface PluginLoadOptions {
  /** Whether to fail on plugin load error */
  failOnError?: boolean;
  /** Plugin-specific configuration */
  pluginConfig?: Record<string, unknown>;
  /** Timeout for plugin loading (ms) */
  timeout?: number;
}

/**
 * Plugin Registry Entry
 * 
 * 插件注册表条目
 */
export interface PluginRegistryEntry {
  /** Plugin manifest */
  manifest: PluginManifest;
  /** Plugin module */
  module: PluginModule;
  /** When the plugin was loaded */
  loadedAt: Date;
}
