/**
 * Shinwa Platform Shell Mobile - Main Entry Point
 * 
 * This module provides the core mobile shell infrastructure for the
 * Shinwa Platform. It includes navigation, plugin loading, and
 * capability context providers.
 * 
 * @module @shinwa/shinwa-platform-shell-mobile
 * @since 3.1.0
 */

// Core Shell Components
export { ShellProvider } from './providers/ShellProvider';
export { ShellNavigator } from './navigation/ShellNavigator';

// Plugin Management
export { PluginLoader } from './plugins/PluginLoader';
export { PluginRegistry } from './plugins/PluginRegistry';
export type { PluginModule, PluginManifest, PluginLoadOptions } from './plugins/types';

// Navigation
export { NavigationProvider } from './navigation/NavigationProvider';
export { useNavigation, useRoute } from './navigation/hooks';
export type { NavigationState, RouteConfig, NavigationOptions } from './navigation/types';

// Layout Components
export { AppLayout } from './layouts/AppLayout';
export { TabNavigator } from './layouts/TabNavigator';
export { DrawerNavigator } from './layouts/DrawerNavigator';

// Screen Components
export * from './screens';

// Hooks
export { useShell } from './hooks/useShell';
export { usePlugins } from './hooks/usePlugins';
export { useDeepLinking } from './hooks/useDeepLinking';

// Types
export type { ShellConfig, ShellState } from './types';
