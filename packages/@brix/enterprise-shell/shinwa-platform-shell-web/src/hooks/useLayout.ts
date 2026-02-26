/**
 * @file Layout Hook
 * @description Provides layout-related React Hooks
 * @module @shinwa/shinwa-platform-shell-web/hooks/useLayout
 * @version 3.0.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { LayoutCapability, LayoutState, LayoutChangeEvent } from '@brix/runtime-sdk-api-web';

/**
 * Layout Hook Return Type
 */
export interface UseLayoutResult {
  /**
   * Current layout state
   */
  layoutState: LayoutState;
  
  /**
   * Whether fullscreen
   */
  isFullscreen: boolean;
  
  /**
   * Whether sidebar is visible
   */
  isSidebarVisible: boolean;
  
  /**
   * Whether sidebar is collapsed
   */
  isSidebarCollapsed: boolean;
  
  /**
   * Current breakpoint
   */
  breakpoint: LayoutState['breakpoint'];
  
  /**
   * Whether on mobile
   */
  isMobile: boolean;
  
  /**
   * Request fullscreen
   */
  requestFullscreen: () => Promise<boolean>;
  
  /**
   * Exit fullscreen
   */
  requestExitFullscreen: () => Promise<boolean>;
  
  /**
   * Toggle fullscreen
   */
  toggleFullscreen: () => Promise<boolean>;
  
  /**
   * Toggle sidebar visibility
   */
  toggleSidebar: () => Promise<boolean>;
  
  /**
   * Toggle sidebar collapsed state
   */
  toggleSidebarCollapsed: () => Promise<boolean>;
}

/**
 * Layout Hook
 * 
 * React Hook that provides layout state and control methods.
 * 
 * [Usage Example]
 * ```tsx
 * function MyComponent() {
 *   const {
 *     isMobile,
 *     isSidebarCollapsed,
 *     toggleSidebarCollapsed,
 *     toggleFullscreen,
 *   } = useLayout(layoutCapability);
 *   
 *   return (
 *     <div>
 *       <button onClick={toggleSidebarCollapsed}>
 *         {isSidebarCollapsed ? 'Expand' : 'Collapse'}
 *       </button>
 *       <button onClick={toggleFullscreen}>Fullscreen</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @param layout - Layout capability instance
 * @returns Layout state and control methods
 */
export function useLayout(layout: LayoutCapability): UseLayoutResult {
  const [layoutState, setLayoutState] = useState<LayoutState>(() => layout.getLayoutState());
  
  // Subscribe to layout state changes
  useEffect(() => {
    const unsubscribe = layout.onLayoutChange((event: LayoutChangeEvent) => {
      setLayoutState(event.state);
    });
    
    return () => unsubscribe();
  }, [layout]);
  
  // Request fullscreen
  const requestFullscreen = useCallback(
    () => layout.requestFullscreen(),
    [layout]
  );
  
  // Exit fullscreen
  const requestExitFullscreen = useCallback(
    () => layout.requestExitFullscreen(),
    [layout]
  );
  
  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (layoutState.isFullscreen) {
      return layout.requestExitFullscreen();
    } else {
      return layout.requestFullscreen();
    }
  }, [layout, layoutState.isFullscreen]);
  
  // Toggle sidebar visibility
  const toggleSidebar = useCallback(async () => {
    if (layoutState.isSidebarVisible) {
      return layout.requestHideSidebar();
    } else {
      return layout.requestShowSidebar();
    }
  }, [layout, layoutState.isSidebarVisible]);
  
  // Toggle sidebar collapsed state
  const toggleSidebarCollapsed = useCallback(async () => {
    if (layoutState.isSidebarCollapsed) {
      return layout.requestExpandSidebar();
    } else {
      return layout.requestCollapseSidebar();
    }
  }, [layout, layoutState.isSidebarCollapsed]);
  
  // Compute whether on mobile
  const isMobile = useMemo(() => {
    return layoutState.breakpoint === 'xs' || layoutState.breakpoint === 'sm';
  }, [layoutState.breakpoint]);
  
  return {
    layoutState,
    isFullscreen: layoutState.isFullscreen,
    isSidebarVisible: layoutState.isSidebarVisible,
    isSidebarCollapsed: layoutState.isSidebarCollapsed,
    breakpoint: layoutState.breakpoint,
    isMobile,
    requestFullscreen,
    requestExitFullscreen,
    toggleFullscreen,
    toggleSidebar,
    toggleSidebarCollapsed,
  };
}
