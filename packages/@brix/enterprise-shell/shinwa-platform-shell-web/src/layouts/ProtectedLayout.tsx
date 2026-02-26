/**
 * @file Protected Layout Component
 * @description Pre-assembled protected route layout with Header, Sidebar and Content
 * @module @shinwa/shinwa-platform-shell-web/layouts/ProtectedLayout
 * @version 3.2.0
 *
 * [Architecture Position]
 * This component belongs to Shell layer (Layer 2.5), providing a complete
 * pre-assembled admin layout. Host layer imports and configures directly.
 *
 * [Design Principles]
 * - Composition pattern: combines AppHeader, AppSidebar, and content area
 * - Configuration driven: all behavior controlled via props
 * - Zero business logic: pure presentation and layout orchestration
 * - Responsive design: adapts to different screen sizes
 *
 * [Layout Structure]
 * ```
 * +------------------------------------------+
 * |  AppHeader (fixed top)                   |
 * +----------+-------------------------------+
 * |          |                               |
 * |  App     |      Content Area             |
 * |  Sidebar |      (children / Outlet)      |
 * |  (fixed) |                               |
 * |          |                               |
 * +----------+-------------------------------+
 * ```
 *
 * @since 3.2.0
 */

import {
  useState,
  useMemo,
  useCallback,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { AppHeader, type AppHeaderProps } from '../components/AppHeader';
import { AppSidebar, type SidebarMenuItem } from '../components/AppSidebar';

// ============================================================================
// Types
// ============================================================================

/**
 * Layout dimension configuration
 *
 * @since 3.2.0
 */
export interface LayoutDimensions {
  /**
   * Sidebar width in expanded state (pixels)
   * @default 256
   */
  sidebarWidth?: number;

  /**
   * Sidebar width in collapsed state (pixels)
   * @default 80
   */
  sidebarCollapsedWidth?: number;

  /**
   * Header height (pixels)
   * @default 64
   */
  headerHeight?: number;

  /**
   * Content padding (pixels)
   * @default 24
   */
  contentPadding?: number;

  /**
   * Content margin (pixels)
   * @default 16
   */
  contentMargin?: number;
}

/**
 * Branding configuration for layout
 *
 * @since 3.2.0
 */
export interface LayoutBranding {
  /**
   * Application name displayed in sidebar
   */
  appName?: string;

  /**
   * Logo URL
   */
  logo?: string;

  /**
   * Primary brand color
   */
  primaryColor?: string;
}

/**
 * User information for header display
 *
 * @since 3.2.0
 */
export interface LayoutUser {
  /**
   * User display name
   */
  name?: string;

  /**
   * User avatar URL
   */
  avatar?: string;

  /**
   * User email (optional, for dropdown)
   */
  email?: string;
}

/**
 * Protected Layout Props
 *
 * Complete configuration for the protected route layout.
 *
 * @since 3.2.0
 */
export interface ProtectedLayoutProps {
  /**
   * Layout dimensions configuration
   */
  dimensions?: LayoutDimensions;

  /**
   * Branding configuration
   */
  branding?: LayoutBranding;

  /**
   * Current user information
   */
  user?: LayoutUser;

  /**
   * Menu items for sidebar navigation
   */
  menuItems?: SidebarMenuItem[];

  /**
   * Whether menus are loading
   */
  menusLoading?: boolean;

  /**
   * Current route pathname for menu highlighting
   */
  currentPath?: string;

  /**
   * Navigation callback
   *
   * @param path - Target navigation path
   * @param options - Navigation options
   */
  onNavigate: (path: string, options?: { replace?: boolean }) => void;

  /**
   * Logout callback
   */
  onLogout: () => void;

  /**
   * Initial sidebar collapsed state
   * @default false
   */
  defaultCollapsed?: boolean;

  /**
   * Children content (typically Outlet from react-router)
   */
  children?: ReactNode;

  /**
   * Additional custom class name
   */
  className?: string;

  /**
   * Additional custom styles
   */
  style?: CSSProperties;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_DIMENSIONS: Required<LayoutDimensions> = {
  sidebarWidth: 256,
  sidebarCollapsedWidth: 80,
  headerHeight: 64,
  contentPadding: 8,
  contentMargin: 8,
};

// ============================================================================
// Styles Hook
// ============================================================================

/**
 * 【样式工厂 Hook】
 * 根据布局状态计算所有样式对象，使用 useMemo 缓存优化性能。
 *
 * [Style Factory Hook]
 * Calculates all style objects based on layout state, using useMemo for optimization.
 */
function useLayoutStyles(
  dimensions: Required<LayoutDimensions>,
  sidebarCollapsed: boolean
) {
  const actualSidebarWidth = sidebarCollapsed
    ? dimensions.sidebarCollapsedWidth
    : dimensions.sidebarWidth;

  const containerStyle = useMemo<CSSProperties>(
    () => ({
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#fafafa',
    }),
    []
  );

  const headerStyle = useMemo<CSSProperties>(
    () => ({
      position: 'fixed',
      top: 0,
      left: actualSidebarWidth,
      right: 0,
      height: `${dimensions.headerHeight}px`,
      zIndex: 100,
      transition: 'left 0.2s ease-in-out',
    }),
    [actualSidebarWidth, dimensions.headerHeight]
  );

  const sidebarStyle = useMemo<CSSProperties>(
    () => ({
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      width: `${actualSidebarWidth}px`,
      zIndex: 101,
      transition: 'width 0.2s ease-in-out',
    }),
    [actualSidebarWidth]
  );

  const bodyStyle = useMemo<CSSProperties>(
    () => ({
      display: 'flex',
      flex: 1,
      marginTop: `${dimensions.headerHeight}px`,
      marginLeft: `${actualSidebarWidth}px`,
      transition: 'margin-left 0.2s ease-in-out',
    }),
    [dimensions.headerHeight, actualSidebarWidth]
  );

  const contentStyle = useMemo<CSSProperties>(
    () => ({
      flex: 1,
      height: `calc(100vh - ${dimensions.headerHeight}px)`,
      overflow: 'hidden',
    }),
    [dimensions.headerHeight]
  );

  return {
    containerStyle,
    headerStyle,
    sidebarStyle,
    bodyStyle,
    contentStyle,
  };
}

// ============================================================================
// Component
// ============================================================================

/**
 * Protected Layout Component
 *
 * <p>A pre-assembled layout container for protected routes in admin dashboards.
 * Combines Header, Sidebar, and Content area with consistent styling.</p>
 *
 * <h3>Features</h3>
 * <ul>
 *   <li>Collapsible sidebar with smooth transitions</li>
 *   <li>Responsive header adapting to sidebar state</li>
 *   <li>Configurable dimensions and branding</li>
 *   <li>Loading state support for menus</li>
 * </ul>
 *
 * <h3>Usage Example</h3>
 * <pre>{@code
 * function App() {
 *   return (
 *     <ProtectedLayout
 *       branding={{ appName: 'Admin', primaryColor: '#1890ff' }}
 *       user={{ name: 'John Doe' }}
 *       menuItems={menuConfig}
 *       onNavigate={navigate}
 *       onLogout={handleLogout}
 *     >
 *       <Outlet />
 *     </ProtectedLayout>
 *   );
 * }
 * }</pre>
 *
 * @param props - Component props
 * @returns React node
 *
 * @since 3.2.0
 */
export function ProtectedLayout({
  dimensions,
  branding,
  user,
  menuItems = [],
  menusLoading = false,
  currentPath,
  onNavigate,
  onLogout,
  defaultCollapsed = false,
  children,
  className,
  style,
}: ProtectedLayoutProps): ReactNode {
  // Merge dimensions with defaults
  const mergedDimensions: Required<LayoutDimensions> = {
    ...DEFAULT_DIMENSIONS,
    ...dimensions,
  };

  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultCollapsed);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  // Get layout styles
  const styles = useLayoutStyles(mergedDimensions, sidebarCollapsed);

  return (
    <div className={className} style={{ ...styles.containerStyle, ...style }}>
      {/* Sidebar */}
      <aside style={styles.sidebarStyle}>
        <AppSidebar
          menuItems={menuItems}
          currentPath={currentPath || ''}
          collapsed={sidebarCollapsed}
          onNavigate={onNavigate}
          branding={branding}
          loading={menusLoading}
        />
      </aside>

      {/* Header */}
      <header style={styles.headerStyle}>
        <AppHeader
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          username={user?.name || 'User'}
          avatar={user?.avatar}
          onLogout={onLogout}
          onNavigate={onNavigate}
          branding={branding}
        />
      </header>

      {/* Body area */}
      <main style={styles.bodyStyle}>
        <div style={styles.contentStyle}>{children}</div>
      </main>
    </div>
  );
}

export default ProtectedLayout;
