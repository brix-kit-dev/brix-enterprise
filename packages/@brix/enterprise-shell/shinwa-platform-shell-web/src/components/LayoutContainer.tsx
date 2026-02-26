/**
 * @file Layout Container Component
 * @description Container that automatically selects layout mode
 * @module @shinwa/shinwa-platform-shell-web/components/LayoutContainer
 * @version 3.0.0
 */

import { type ReactNode } from 'react';
import type { LayoutState } from '@brix/runtime-sdk-api-web';
import { ConsoleLayout } from '../layouts/ConsoleLayout';
import { PortalLayout } from '../layouts/PortalLayout';
import { MinimalLayout } from '../layouts/MinimalLayout';

/**
 * Layout Container Props
 */
export interface LayoutContainerProps {
  /**
   * Layout state
   */
  layoutState: LayoutState;
  
  /**
   * Child content
   */
  children: ReactNode;
  
  /**
   * Console layout header
   */
  consoleHeader?: ReactNode;
  
  /**
   * Console layout sidebar
   */
  consoleSidebar?: ReactNode;
  
  /**
   * Portal layout header
   */
  portalHeader?: ReactNode;
  
  /**
   * Portal layout footer
   */
  portalFooter?: ReactNode;
  
  /**
   * Custom class name
   */
  className?: string;
}

/**
 * Layout Container Component
 * 
 * Automatically selects the corresponding layout component based on layoutMode.
 * 
 * [Usage Example]
 * ```tsx
 * function App() {
 *   const layoutState = layoutCapability.getLayoutState();
 *   
 *   return (
 *     <LayoutContainer
 *       layoutState={layoutState}
 *       consoleHeader={<ConsoleHeader />}
 *       consoleSidebar={<ConsoleSidebar />}
 *       portalHeader={<PortalHeader />}
 *       portalFooter={<PortalFooter />}
 *     >
 *       <Outlet />
 *     </LayoutContainer>
 *   );
 * }
 * ```
 */
export function LayoutContainer({
  layoutState,
  children,
  consoleHeader,
  consoleSidebar,
  portalHeader,
  portalFooter,
  className,
}: LayoutContainerProps): ReactNode {
  const { layoutMode } = layoutState;
  
  switch (layoutMode) {
    case 'console':
      return (
        <ConsoleLayout
          layoutState={layoutState}
          header={consoleHeader}
          sidebar={consoleSidebar}
          className={className}
        >
          {children}
        </ConsoleLayout>
      );
      
    case 'portal':
      return (
        <PortalLayout
          layoutState={layoutState}
          header={portalHeader}
          footer={portalFooter}
          className={className}
        >
          {children}
        </PortalLayout>
      );
      
    case 'minimal':
      return (
        <MinimalLayout
          layoutState={layoutState}
          className={className}
        >
          {children}
        </MinimalLayout>
      );
      
    default:
      // Default to console layout
      return (
        <ConsoleLayout
          layoutState={layoutState}
          header={consoleHeader}
          sidebar={consoleSidebar}
          className={className}
        >
          {children}
        </ConsoleLayout>
      );
  }
}
