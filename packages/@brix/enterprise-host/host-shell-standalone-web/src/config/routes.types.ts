/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 */
/**
 * @file Route Configuration Types
 * @module host-standalone-web/config/routes.types
 * @version 3.6.0
 */

import type { SidebarMenuItem } from '@brix-sdk/platform-frame-web';

/**
 * Props for the ProtectedLayoutWithLocation wrapper.
 *
 * [v3.6.1] Removed `user` — ProtectedLayoutWithLocation now reads auth user
 * reactively from getAuthService() on every location change, eliminating the
 * stale-prop race condition that caused "User" to appear before "Super admin".
 */
export interface ProtectedLayoutWithLocationProps {
  readonly branding: Record<string, unknown>;
  readonly dimensions?: {
    sidebarWidth?: number;
    sidebarCollapsedWidth?: number;
    headerHeight?: number;
  };
  readonly onNavigate: (path: string, options?: { replace?: boolean }) => void;
  readonly onLogout: () => void;
  readonly menuItems: SidebarMenuItem[];
  readonly menusLoading: boolean;
  readonly children: React.ReactNode;
}
