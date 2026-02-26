/**
 * @file Layout State Type Definitions
 * @description Defines layout state and configuration
 * @module @brix/platform-layout-web/types
 * @version 3.0.0
 */

import type { LayoutState, LayoutChangeEvent, LayoutRequestResult } from '@brix/runtime-sdk-api-web';

/**
 * Layout Configuration
 */
export interface LayoutConfig {
  /**
   * Default sidebar visibility
   * @default true
   */
  defaultSidebarVisible?: boolean;
  
  /**
   * Default sidebar collapsed state
   * @default false
   */
  defaultSidebarCollapsed?: boolean;
  
  /**
   * Default header visibility
   * @default true
   */
  defaultHeaderVisible?: boolean;
  
  /**
   * Default footer visibility
   * @default true
   */
  defaultFooterVisible?: boolean;
  
  /**
   * Layout mode
   * @default 'console'
   */
  layoutMode?: 'console' | 'portal' | 'minimal';
  
  /**
   * Breakpoint configuration
   */
  breakpoints?: {
    xs?: number;  // < 576px
    sm?: number;  // >= 576px
    md?: number;  // >= 768px
    lg?: number;  // >= 992px
    xl?: number;  // >= 1200px
    xxl?: number; // >= 1600px
  };
  
  /**
   * Sidebar width (expanded state)
   * @default 256
   */
  sidebarWidth?: number;
  
  /**
   * Sidebar width (collapsed state)
   * @default 80
   */
  sidebarCollapsedWidth?: number;
  
  /**
   * Header height
   * @default 64
   */
  headerHeight?: number;
  
  /**
   * Footer height
   * @default 0
   */
  footerHeight?: number;
  
  /**
   * Governance policy
   */
  governancePolicy?: LayoutGovernancePolicy;
}

/**
 * Layout Governance Policy
 * 
 * Determines what layout changes plugins can request from Host
 */
export interface LayoutGovernancePolicy {
  /**
   * Allow plugins to request fullscreen
   * @default true
   */
  allowFullscreen?: boolean;
  
  /**
   * Allow plugins to request hide sidebar
   * @default true
   */
  allowHideSidebar?: boolean;
  
  /**
   * Allow plugins to request hide header
   * @default false
   */
  allowHideHeader?: boolean;
  
  /**
   * Allowed plugin ID list (whitelist)
   * If empty, all plugins are allowed
   */
  allowedPlugins?: string[];
  
  /**
   * Blocked plugin ID list (blacklist)
   */
  blockedPlugins?: string[];
}

/**
 * Layout Change Request
 */
export interface LayoutChangeRequest {
  /**
   * Request type
   */
  type: 'fullscreen' | 'sidebar' | 'header' | 'batch';
  
  /**
   * Requesting plugin ID
   */
  pluginId: string;
  
  /**
   * Requested changes
   */
  changes: Partial<Pick<LayoutState, 
    'isFullscreen' | 
    'isSidebarVisible' | 
    'isSidebarCollapsed' | 
    'isHeaderVisible'
  >>;
  
  /**
   * Request timestamp
   */
  timestamp: number;
}

// Re-export types from SDK
export type { LayoutState, LayoutChangeEvent, LayoutRequestResult };
