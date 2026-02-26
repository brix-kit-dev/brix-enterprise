/**
 * @file Minimal Layout Component
 * @description Borderless minimal layout
 * @module @shinwa/shinwa-platform-shell-web/layouts/MinimalLayout
 * @version 3.0.0
 * 
 * [Design Notes]
 * MinimalLayout provides the simplest layout:
 * - No Header
 * - No Sidebar
 * - Only content area
 * 
 * Suitable for login pages, error pages, and other standalone pages.
 */

import { 
  type ReactNode, 
  type CSSProperties,
  useMemo,
} from 'react';
import type { LayoutState } from '@brix/runtime-sdk-api-web';

/**
 * Minimal Layout Props
 */
export interface MinimalLayoutProps {
  /**
   * Layout state
   */
  layoutState: LayoutState;
  
  /**
   * Main content area
   */
  children: ReactNode;
  
  /**
   * Whether to center content
   * @default true
   */
  centerContent?: boolean;
  
  /**
   * Background color
   */
  backgroundColor?: string;
  
  /**
   * Custom style
   */
  style?: CSSProperties;
  
  /**
   * Custom class name
   */
  className?: string;
}

/**
 * Minimal Layout Component
 * 
 * Provides the simplest layout structure, suitable for standalone pages.
 * 
 * [Layout Structure]
 * ```
 * +----------------------------------------+
 * |                                        |
 * |                                        |
 * |            Content                     |
 * |          (centering optional)          |
 * |                                        |
 * |                                        |
 * +----------------------------------------+
 * ```
 * 
 * [Usage Example]
 * ```tsx
 * function LoginPage() {
 *   const layoutState = layoutCapability.getLayoutState();
 *   
 *   return (
 *     <MinimalLayout
 *       layoutState={layoutState}
 *       centerContent={true}
 *       backgroundColor="#f5f5f5"
 *     >
 *       <LoginForm />
 *     </MinimalLayout>
 *   );
 * }
 * ```
 */
export function MinimalLayout({
  layoutState: _layoutState,
  children,
  centerContent = true,
  backgroundColor,
  style,
  className,
}: MinimalLayoutProps): ReactNode {
  // Container style
  const containerStyle = useMemo<CSSProperties>(() => ({
    minHeight: '100vh',
    display: centerContent ? 'flex' : 'block',
    flexDirection: 'column',
    alignItems: centerContent ? 'center' : undefined,
    justifyContent: centerContent ? 'center' : undefined,
    backgroundColor: backgroundColor ?? 'var(--brix-bg-layout, #f0f2f5)',
    ...style,
  }), [centerContent, backgroundColor, style]);
  
  // Content area style
  const contentStyle = useMemo<CSSProperties>(() => ({
    width: '100%',
    maxWidth: centerContent ? '100%' : undefined,
    padding: centerContent ? '24px' : 0,
  }), [centerContent]);
  
  return (
    <div className={className} style={containerStyle}>
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
}
