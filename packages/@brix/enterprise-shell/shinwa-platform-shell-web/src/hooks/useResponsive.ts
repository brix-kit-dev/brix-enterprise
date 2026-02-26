/**
 * @file Responsive Hook
 * @description Provides responsive breakpoint detection
 * @module @shinwa/shinwa-platform-shell-web/hooks/useResponsive
 * @version 3.0.0
 */

import { useState, useEffect, useMemo } from 'react';
import type { LayoutCapability, LayoutState } from '@brix/runtime-sdk-api-web';

/**
 * Responsive Hook Return Type
 */
export interface UseResponsiveResult {
  /**
   * Current breakpoint
   */
  breakpoint: LayoutState['breakpoint'];
  
  /**
   * Viewport width
   */
  viewportWidth: number;
  
  /**
   * Viewport height
   */
  viewportHeight: number;
  
  /**
   * Whether at xs breakpoint
   */
  isXs: boolean;
  
  /**
   * Whether at sm breakpoint
   */
  isSm: boolean;
  
  /**
   * Whether at md breakpoint
   */
  isMd: boolean;
  
  /**
   * Whether at lg breakpoint
   */
  isLg: boolean;
  
  /**
   * Whether at xl breakpoint
   */
  isXl: boolean;
  
  /**
   * Whether at xxl breakpoint
   */
  isXxl: boolean;
  
  /**
   * Whether on mobile (xs or sm)
   */
  isMobile: boolean;
  
  /**
   * Whether on tablet (md or lg)
   */
  isTablet: boolean;
  
  /**
   * Whether on desktop (xl or xxl)
   */
  isDesktop: boolean;
}

/**
 * Responsive Hook
 * 
 * React Hook that provides responsive breakpoint detection.
 * 
 * [Usage Example]
 * ```tsx
 * function MyComponent() {
 *   const { isMobile, isTablet, isDesktop } = useResponsive(layoutCapability);
 *   
 *   if (isMobile) {
 *     return <MobileView />;
 *   }
 *   
 *   if (isTablet) {
 *     return <TabletView />;
 *   }
 *   
 *   return <DesktopView />;
 * }
 * ```
 * 
 * @param layout - Layout capability instance
 * @returns Responsive state
 */
export function useResponsive(layout: LayoutCapability): UseResponsiveResult {
  const [state, setState] = useState(() => {
    const layoutState = layout.getLayoutState();
    return {
      breakpoint: layoutState.breakpoint,
      viewportWidth: layoutState.viewportWidth,
      viewportHeight: layoutState.viewportHeight,
    };
  });
  
  // Subscribe to layout state changes
  useEffect(() => {
    const unsubscribe = layout.onLayoutChange((event) => {
      if (
        event.changedProperties.includes('breakpoint') ||
        event.changedProperties.includes('viewportWidth') ||
        event.changedProperties.includes('viewportHeight')
      ) {
        setState({
          breakpoint: event.state.breakpoint,
          viewportWidth: event.state.viewportWidth,
          viewportHeight: event.state.viewportHeight,
        });
      }
    });
    
    return () => unsubscribe();
  }, [layout]);
  
  // Compute breakpoint flags
  const breakpointFlags = useMemo(() => ({
    isXs: state.breakpoint === 'xs',
    isSm: state.breakpoint === 'sm',
    isMd: state.breakpoint === 'md',
    isLg: state.breakpoint === 'lg',
    isXl: state.breakpoint === 'xl',
    isXxl: state.breakpoint === 'xxl',
  }), [state.breakpoint]);
  
  // Compute device type
  const deviceFlags = useMemo(() => ({
    isMobile: state.breakpoint === 'xs' || state.breakpoint === 'sm',
    isTablet: state.breakpoint === 'md' || state.breakpoint === 'lg',
    isDesktop: state.breakpoint === 'xl' || state.breakpoint === 'xxl',
  }), [state.breakpoint]);
  
  return {
    breakpoint: state.breakpoint,
    viewportWidth: state.viewportWidth,
    viewportHeight: state.viewportHeight,
    ...breakpointFlags,
    ...deviceFlags,
  };
}
