/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * This software is proprietary to Brix Platform and is protected by
 * copyright laws and international treaty provisions. Unauthorized
 * reproduction or distribution of this software, or any portion of it,
 * may result in severe civil and criminal penalties.
 *
 * Commercial use requires a valid Brix Enterprise license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */
/**
 * @file Router Service and Navigation Utilities
 * @description Singleton ReactRouterAdapter and navigation helper functions
 *              extracted from App.tsx during Host Slimming (Phase 3.2).
 * @module host-standalone-web/services/router
 * @version 3.5.0
 *
 * [v3.5.0 — Phase 3.2 Host Slimming]
 * - createNavigationService() extracted from App.tsx
 * - convertToSidebarMenuItems() extracted from App.tsx
 * - ProtectedLayoutWithLocation extracted from App.tsx
 *
 * [Phase 2.8 — D12 Fix]
 * Previously bootstrap.tsx used SimpleNavigationCapability (window.history).
 * Now a single ReactRouterAdapter is shared across the Host so that the
 * NavigationCapability registered in the runtime delegates to React Router.
 */

import { useLocation } from 'react-router-dom';
import { ReactRouterAdapter, type ReactRouterAdapter as ReactRouterAdapterType } from '@brix-sdk/platform-router-web';
import { ProtectedLayout, type ProtectedLayoutProps, type SidebarMenuItem, type PageNavigationService } from '@brix-sdk/platform-frame-web';
import type { AggregatedMenuItem } from '@brix-sdk/runtime-orchestrator-web';
import { getAuthService } from './auth.service';

/**
 * Singleton router adapter instance.
 *
 * Created at module load time, before render.
 * RouterInjector (rendered inside BrowserRouter) will call setNavigator()
 * to inject the real react-router navigate function.
 */
export const routerAdapter = new ReactRouterAdapter();

/**
 * Create navigation service from router adapter.
 *
 * Bridges ReactRouterAdapter to the PageNavigationService interface
 * expected by page factory functions in platform-frame-web.
 */
export function createNavigationService(adapter: ReactRouterAdapterType): PageNavigationService {
  return {
    navigate: (path: string, options?: { replace?: boolean }) => {
      adapter.navigate(path, options);
    },
  };
}

/**
 * Convert AggregatedMenuItem array to SidebarMenuItem array.
 *
 * Maps the plugin system's menu format to the shell layout's expected format.
 * Translates menu titles via i18n — host keys use namespace:key format,
 * plugin manifest titles pass through unchanged (t() returns key if not found).
 */
export function convertToSidebarMenuItems(
  menus: AggregatedMenuItem[],
  t: (key: string) => string,
): SidebarMenuItem[] {
  return menus.map((item) => ({
    key: item.key,
    label: t(item.title),
    icon: item.icon,
    path: item.path,
    order: item.order,
    children: item.children ? convertToSidebarMenuItems(item.children, t) : undefined,
  }));
}

/**
 * Wrapper for ProtectedLayout that automatically injects currentPath from useLocation
 * and reads the current auth user reactively.
 *
 * [v3.6.1 — User Display Race-Condition Fix]
 * Previously, `user` was evaluated in AppRoutes render context (stale at login time).
 * Now read directly from getAuthService() inside this component, which re-renders on
 * every location change via useLocation() — guaranteeing the header always shows the
 * correct user immediately after login navigation, without waiting for an unrelated
 * App-level re-render (e.g., plugin discovery completing).
 *
 * Must be rendered inside a BrowserRouter context.
 */
export function ProtectedLayoutWithLocation(props: Omit<ProtectedLayoutProps, 'currentPath' | 'user'>) {
  const location = useLocation();
  // Re-read auth user on every location change; getAuthService() is a host singleton.
  const authUser = getAuthService().getUser();
  const user: ProtectedLayoutProps['user'] = authUser
    ? {
        name: authUser.name ?? authUser.username,
        avatar: authUser.avatar,
        email: authUser.email,
      }
    : undefined;
  return <ProtectedLayout {...props} user={user} currentPath={location.pathname} />;
}
