/**
 * @file AppHeader Component
 * @description Application top navigation bar component - Shell layer pre-assembled component
 * @module @shinwa/shinwa-platform-shell-web/components/AppHeader
 * @version 3.2.0
 *
 * [Architectural Position]
 * AppHeader is a pre-assembled component in the Shell layer, providing standard top navigation bar implementation.
 * The Host layer imports and uses it directly, without implementing any top navigation logic.
 *
 * [Design Principles]
 * - Follows the v3.0.4 blueprint Host thin-layer principle
 * - All styles are inline, no external CSS dependencies
 * - Receives configuration via props, no hardcoded business logic
 *
 * [Usage Example]
 * ```tsx
 * import { AppHeader } from '@shinwa/shinwa-platform-shell-web';
 *
 * <AppHeader
 *   sidebarCollapsed={collapsed}
 *   onToggleSidebar={() => setCollapsed(!collapsed)}
 *   username={user.name}
 *   onLogout={handleLogout}
 *   onNavigate={navigate}
 *   branding={{ appName: 'My App', primaryColor: '#1890ff' }}
 * />
 * ```
 */

import { useState, useMemo, useRef, useEffect, type CSSProperties, type ReactNode } from 'react';

/**
 * AppHeader Props (Full-Featured Variant)
 * 
 * Props for the full-featured AppHeader component with user info,
 * logout, navigation, and branding capabilities.
 * 
 * [Note: Component Variant]
 * This is different from AppHeaderProps in ./layouts/components/AppHeader.tsx
 * which is a simpler layout-focused variant accepting ReactNode slots.
 * Both components serve different use cases within the Shell layer.
 */
export interface AppHeaderProps {
  /** Whether the sidebar is collapsed */
  sidebarCollapsed: boolean;
  /** Callback to toggle sidebar collapse state */
  onToggleSidebar: () => void;
  /** Username */
  username?: string;
  /** Avatar URL (optional) */
  avatar?: string;
  /** Logout callback */
  onLogout: () => void;
  /** Navigation callback */
  onNavigate: (path: string) => void;
  /** Branding configuration (optional) */
  branding?: {
    /** Application name */
    appName?: string;
    /** Theme color */
    primaryColor?: string;
  };
}

/**
 * Application top navigation bar component
 *
 * Provides standard top navigation bar implementation, including:
 * - Sidebar collapse toggle button
 * - Home navigation button
 * - Notifications entry
 * - User info display
 * - Settings entry
 * - Logout button
 *
 * @param props - Component props
 * @returns React node
 */
export function AppHeader({
  sidebarCollapsed,
  onToggleSidebar,
  username = 'User',
  avatar,
  onLogout,
  onNavigate,
  branding,
}: AppHeaderProps): ReactNode {
  // ========== Style Definitions ==========

  const headerStyle = useMemo<CSSProperties>(
    () => ({
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      backgroundColor: '#fff',
      boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
    }),
    []
  );

  const leftStyle = useMemo<CSSProperties>(
    () => ({
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    }),
    []
  );

  const rightStyle = useMemo<CSSProperties>(
    () => ({
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    }),
    []
  );

  const toggleButtonStyle = useMemo<CSSProperties>(
    () => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      fontSize: '18px',
      color: '#333',
      borderRadius: '4px',
      transition: 'background 0.2s',
    }),
    []
  );

  const userInfoStyle = useMemo<CSSProperties>(
    () => ({
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      padding: '4px 12px',
      borderRadius: '4px',
      transition: 'background 0.2s',
    }),
    []
  );

  const avatarStyle = useMemo<CSSProperties>(
    () => ({
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: branding?.primaryColor || '#1976d2',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: 500,
    }),
    [branding?.primaryColor]
  );

  const dropdownStyle = useMemo<CSSProperties>(
    () => ({
      position: 'relative' as const,
    }),
    []
  );

  const buttonStyle = useMemo<CSSProperties>(
    () => ({
      padding: '6px 12px',
      border: '1px solid #d9d9d9',
      borderRadius: '4px',
      background: '#fff',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#333',
      transition: 'all 0.2s',
    }),
    []
  );

  const logoutButtonStyle = useMemo<CSSProperties>(
    () => ({
      ...buttonStyle,
      color: '#f44336',
      borderColor: '#f44336',
    }),
    [buttonStyle]
  );

  // ========== Render ==========

  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dropdownMenuStyle = useMemo<CSSProperties>(
    () => ({
      position: 'absolute',
      top: '100%',
      right: 0,
      marginTop: '8px',
      minWidth: '200px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      border: '1px solid #e8e8e8',
      overflow: 'hidden',
      zIndex: 1000,
    }),
    []
  );

  const dropdownItemStyle = useMemo<CSSProperties>(
    () => ({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      border: 'none',
      background: 'transparent',
      width: '100%',
      textAlign: 'left',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#333',
      transition: 'background 0.2s',
    }),
    []
  );

  const dropdownDividerStyle = useMemo<CSSProperties>(
    () => ({
      height: '1px',
      backgroundColor: '#f0f0f0',
      margin: '4px 0',
    }),
    []
  );

  return (
    <div style={headerStyle}>
      {/* Left section */}
      <div style={leftStyle}>
        {/* Sidebar collapse button */}
        <button
          style={toggleButtonStyle}
          onClick={onToggleSidebar}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          title={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
        >
          {sidebarCollapsed ? '☰' : '✕'}
        </button>

      </div>

      {/* Right section - User dropdown */}
      <div style={rightStyle}>
        <div ref={dropdownRef} style={dropdownStyle}>
          {/* User avatar/name - clickable to open dropdown */}
          <div
            style={userInfoStyle}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = dropdownOpen ? '#f5f5f5' : 'transparent';
            }}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={username}
                style={{ ...avatarStyle, objectFit: 'cover' as const }}
              />
            ) : (
              <div style={avatarStyle}>{username.charAt(0).toUpperCase()}</div>
            )}
            <span style={{ fontSize: '14px', color: '#333' }}>{username}</span>
            <span style={{ fontSize: '12px', color: '#999', marginLeft: '4px' }}>
              {dropdownOpen ? '▲' : '▼'}
            </span>
          </div>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div style={dropdownMenuStyle}>
              {/* Notifications */}
              <button
                style={dropdownItemStyle}
                onClick={() => {
                  onNavigate('/messenger/notifications');
                  setDropdownOpen(false);
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span>Notifications</span>
              </button>

              {/* Settings */}
              <button
                style={dropdownItemStyle}
                onClick={() => {
                  onNavigate('/settings');
                  setDropdownOpen(false);
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span>Settings</span>
              </button>

              <div style={dropdownDividerStyle} />

              {/* Logout */}
              <button
                style={{ ...dropdownItemStyle, color: '#f44336' }}
                onClick={() => {
                  onLogout();
                  setDropdownOpen(false);
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#ffebee'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppHeader;
