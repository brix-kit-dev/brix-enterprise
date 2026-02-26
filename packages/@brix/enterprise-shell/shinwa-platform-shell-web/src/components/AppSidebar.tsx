/**
 * @file AppSidebar Component
 * @description Application sidebar navigation component - Shell layer pre-assembled component
 * @module @shinwa/shinwa-platform-shell-web/components/AppSidebar
 * @version 3.2.0
 *
 * [Architectural Position]
 * AppSidebar is a pre-assembled component in the Shell layer, providing standard sidebar navigation implementation.
 * The Host layer imports and uses it directly, without implementing any sidebar logic.
 *
 * [Design Principles]
 * - Follows the v3.0.4 blueprint Host thin-layer principle
 * - All styles are inline, no external CSS dependencies
 * - Receives configuration via props, no hardcoded business logic
 * - Supports infinite-level menu recursive rendering
 *
 * [Usage Example]
 * ```tsx
 * import { AppSidebar } from '@shinwa/shinwa-platform-shell-web';
 *
 * <AppSidebar
 *   menuItems={aggregatedMenus}
 *   currentPath={location.pathname}
 *   collapsed={collapsed}
 *   onNavigate={navigate}
 *   branding={{ appName: 'My App', primaryColor: '#1890ff' }}
 * />
 * ```
 */

import {
  useState,
  useCallback,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from 'react';

/**
 * Menu item definition
 */
export interface SidebarMenuItem {
  /** Menu unique identifier */
  key: string;
  /** Menu display name */
  label: string;
  /** Menu icon (optional) */
  icon?: string;
  /** Route path (optional, for leaf nodes) */
  path?: string;
  /** Submenu items (optional) */
  children?: SidebarMenuItem[];
  /** Whether hidden (optional) */
  hidden?: boolean;
  /** Sort weight (optional) */
  order?: number;
}

/**
 * AppSidebar Props
 */
export interface AppSidebarProps {
  /** Menu items list */
  menuItems: SidebarMenuItem[];
  /** Current route path */
  currentPath: string;
  /** Whether collapsed */
  collapsed: boolean;
  /** Navigation callback */
  onNavigate: (path: string) => void;
  /** Branding configuration (optional) */
  branding?: {
    /** Application name */
    appName?: string;
    /** Logo URL (optional) */
    logo?: string;
    /** Theme color */
    primaryColor?: string;
  };
  /**
   * Whether menus are loading
   * @since 3.2.0
   */
  loading?: boolean;
}

/**
 * Application sidebar navigation component
 *
 * Provides standard sidebar navigation implementation, including:
 * - Logo/branding display area
 * - Multi-level menu recursive rendering
 * - Current route highlighting
 * - Collapse/expand state support
 * - Submenu expand/collapse
 *
 * @param props - Component props
 * @returns React node
 */
export function AppSidebar({
  menuItems,
  currentPath,
  collapsed,
  onNavigate,
  branding,
  loading = false,
}: AppSidebarProps): ReactNode {
  // ========== State Management ==========

  /** Expanded menu keys */
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
    // Initialize by expanding parent menus containing the current path
    const keys = new Set<string>();
    const findParentKeys = (items: SidebarMenuItem[], parentKeys: string[]): boolean => {
      for (const item of items) {
        if (item.path === currentPath) {
          parentKeys.forEach((k) => keys.add(k));
          return true;
        }
        if (item.children?.length) {
          if (findParentKeys(item.children, [...parentKeys, item.key])) {
            return true;
          }
        }
      }
      return false;
    };
    findParentKeys(menuItems, []);
    return keys;
  });

  // ========== Style Definitions ==========

  const primaryColor = branding?.primaryColor || '#1976d2';

  const sidebarStyle = useMemo<CSSProperties>(
    () => ({
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      backgroundColor: '#fff',
      color: '#333',
      transition: 'width 0.2s',
      overflow: 'hidden',
      borderRight: '1px solid #e0e0e0',
    }),
    []
  );

  const logoStyle = useMemo<CSSProperties>(
    () => ({
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
      padding: collapsed ? '0' : '0 24px',
      borderBottom: '1px solid #e0e0e0',
      flexShrink: 0,
    }),
    [collapsed]
  );

  const logoImgStyle = useMemo<CSSProperties>(
    () => ({
      width: '32px',
      height: '32px',
      borderRadius: '4px',
    }),
    []
  );

  const logoTextStyle = useMemo<CSSProperties>(
    () => ({
      marginLeft: '12px',
      fontSize: '18px',
      fontWeight: 600,
      color: primaryColor,
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: collapsed ? 'none' : 'block',
    }),
    [collapsed, primaryColor]
  );

  const menuContainerStyle = useMemo<CSSProperties>(
    () => ({
      flex: 1,
      overflowY: 'auto' as const,
      overflowX: 'hidden' as const,
      padding: '8px 0',
    }),
    []
  );

  // ========== Event Handlers ==========

  const toggleExpand = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleMenuClick = useCallback(
    (item: SidebarMenuItem) => {
      if (item.children?.length) {
        toggleExpand(item.key);
      } else if (item.path) {
        onNavigate(item.path);
      }
    },
    [toggleExpand, onNavigate]
  );

  // ========== Menu Item Rendering ==========

  /**
   * Render a single menu item
   */
  const renderMenuItem = useCallback(
    (item: SidebarMenuItem, level: number = 0): ReactNode => {
      if (item.hidden) return null;

      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedKeys.has(item.key);
      const isActive = item.path === currentPath;
      const paddingLeft = collapsed ? 16 : 24 + level * 16;

      const itemStyle: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        height: '40px',
        padding: `0 ${collapsed ? 0 : 16}px`,
        paddingLeft: collapsed ? 0 : `${paddingLeft}px`,
        cursor: 'pointer',
        backgroundColor: isActive ? `${primaryColor}15` : 'transparent',
        color: isActive ? primaryColor : '#666',
        borderRight: isActive ? `3px solid ${primaryColor}` : '3px solid transparent',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        fontWeight: isActive ? 500 : 400,
      };

      const iconStyle: CSSProperties = {
        fontSize: '16px',
        marginRight: collapsed ? 0 : '10px',
        flexShrink: 0,
      };

      const labelStyle: CSSProperties = {
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: collapsed ? 'none' : 'block',
      };

      const arrowStyle: CSSProperties = {
        fontSize: '12px',
        transition: 'transform 0.2s',
        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
        display: collapsed ? 'none' : 'block',
      };

      return (
        <div key={item.key}>
          <div
            style={itemStyle}
            onClick={() => handleMenuClick(item)}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
                e.currentTarget.style.color = primaryColor;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#666';
              }
            }}
            title={collapsed ? item.label : undefined}
          >
            <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
              {item.icon && <span style={iconStyle}>{item.icon}</span>}
              <span style={labelStyle}>{item.label}</span>
            </div>
            {hasChildren && <span style={arrowStyle}>▶</span>}
          </div>

          {/* Submenu */}
          {hasChildren && isExpanded && !collapsed && (
            <div>
              {item.children!
                .filter((child) => !child.hidden)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    },
    [collapsed, currentPath, expandedKeys, handleMenuClick, primaryColor]
  );

  // ========== Render ==========

  // Sorted menu items
  const sortedMenuItems = useMemo(
    () =>
      menuItems
        .filter((item) => !item.hidden)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [menuItems]
  );

  return (
    <div style={sidebarStyle}>
      {/* Logo area */}
      <div style={logoStyle}>
        {branding?.logo ? (
          <img src={branding.logo} alt={branding.appName || 'Logo'} style={logoImgStyle} />
        ) : (
          <div
            style={{
              ...logoImgStyle,
              backgroundColor: primaryColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            {branding?.appName?.charAt(0).toUpperCase() || 'S'}
          </div>
        )}
        <span style={logoTextStyle}>{branding?.appName || 'Shinwa Platform'}</span>
      </div>

      {/* Menu area */}
      <div style={menuContainerStyle}>
        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100px',
              color: 'rgba(255, 255, 255, 0.65)',
            }}
          >
            Loading...
          </div>
        ) : (
          sortedMenuItems.map((item) => renderMenuItem(item))
        )}
      </div>
    </div>
  );
}

export default AppSidebar;
