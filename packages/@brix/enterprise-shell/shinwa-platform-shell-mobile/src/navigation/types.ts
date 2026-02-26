/**
 * Navigation Types
 * 
 * @module @shinwa/shinwa-platform-shell-mobile/navigation
 * @since 3.1.0
 */

import type { ComponentType } from 'react';

/**
 * Route Configuration
 * 
 * 路由配置
 */
export interface RouteConfig {
  /** Route name/identifier */
  name: string;
  /** Screen component */
  component: ComponentType<unknown>;
  /** Route options */
  options?: NavigationOptions;
  /** Initial params for the route */
  initialParams?: Record<string, unknown>;
}

/**
 * Navigation Options
 * 
 * 导航选项
 */
export interface NavigationOptions {
  /** Screen title */
  title?: string;
  /** Header visibility */
  headerShown?: boolean;
  /** Tab bar icon name */
  tabBarIcon?: string;
  /** Tab bar label */
  tabBarLabel?: string;
  /** Tab bar badge */
  tabBarBadge?: string | number;
  /** Tab bar visibility */
  tabBarVisible?: boolean;
  /** Gesture enabled (for stack navigation) */
  gestureEnabled?: boolean;
  /** Animation type */
  animation?: 'default' | 'fade' | 'slide_from_right' | 'slide_from_left' | 'none';
}

/**
 * Navigation State
 * 
 * 导航状态
 */
export interface NavigationState {
  /** Current screen name */
  currentScreen: string;
  /** Current screen params */
  params: Record<string, unknown>;
  /** Navigation history stack */
  history: string[];
  /** Registered routes */
  routes: RouteConfig[];
}

/**
 * Deep Link Configuration
 * 
 * 深层链接配置
 */
export interface DeepLinkConfig {
  /** URL prefix (e.g., 'shinwa://') */
  prefix: string;
  /** Route mapping */
  routes: Record<string, string>;
}
