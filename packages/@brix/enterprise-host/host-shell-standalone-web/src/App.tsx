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
 * @file Root Component — Pure Provider + Router Assembly
 * @description Ultra-Thin Host root component. Route definitions extracted to
 *              config/routes.config.tsx; helpers and layout wrappers live in
 *              services/router.service.ts. (Blueprint v3.0.9 Constraint 6, R6.5)
 * @module host-standalone-web/App
 * @version 3.6.0
 *
 * [v3.6.0 Host Slimming — Phase 2 R6.5]
 * - Route tree extracted to config/routes.config.tsx (AppRoutes component)
 * - App.tsx reduced to < 80 lines (target: < 100)
 *
 * [v3.5.0 Host Slimming — Phase 3.2]
 * - Extracted createNavigationService, convertToSidebarMenuItems,
 *   ProtectedLayoutWithLocation to services/router.service.ts
 */

import { useMemo, useCallback, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { prefetchPluginRoutes, createAllPages } from '@brix-sdk/platform-frame-web';
import { usePluginSystem } from '@brix-sdk/runtime-orchestrator-web';
import { RouterInjector } from '@brix-sdk/platform-router-web';
import { usePluginLoader, useI18n, useViewMode } from '@brix-sdk/runtime-sdk-react';
import { PlatformAdminBanner } from '@brix-sdk/platform-tenant-web';

import { getAuthService } from './services/auth.service';
import { routerAdapter, createNavigationService, convertToSidebarMenuItems, ProtectedLayoutWithLocation } from './services/router.service';
import { hostConfig, regionalSocialProviders, hostCoreMenus, localPlugins } from './config/host.config';
import { AppRoutes } from './config/routes.config';
// Platform admin module — only the module entry; no pages/hooks/repos imported here.
import {
  createPlatformAdminPublicRoutes,
  platformAdminMenus,
} from '@brix-sdk/platform-admin-web';

/**
 * Host application root component — pure provider and router assembly.
 */
export function App() {
  const authService = useMemo(() => getAuthService(), []);
  const navigationService = useMemo(() => createNavigationService(routerAdapter), []);
  const { t } = useI18n();

  const memoizedHostCoreMenus = useMemo(
    () => hostCoreMenus.map((m) => ({
      id: m.id || m.key, title: m.title, icon: m.icon, path: m.path || '', order: m.order ?? 100,
    })),
    []
  );

  const { loading: pluginsLoading, menus: pluginMenus, routes: pluginRoutes } =
    usePluginSystem({ skipDiscovery: false, hostCoreMenus: memoizedHostCoreMenus, localPlugins });

  const { RemoteComponent } = usePluginLoader();

  // Phase 2 / C-4 — ViewMode-aware route gating. Plugins declare
  // `requiredViewMode` on their AggregatedRoute; the host filters them out
  // when the active view mode is not in that set.
  const { mode: viewMode } = useViewMode();
  const viewModeChecker = useCallback(
    (allowed: readonly string[]) => allowed.includes(viewMode),
    [viewMode],
  );

  useEffect(() => {
    if (!pluginsLoading && pluginRoutes.length > 0) prefetchPluginRoutes(pluginRoutes);
  }, [pluginsLoading, pluginRoutes]);

  const handleLogout = useCallback(() => {
    authService.logout();
    navigationService.navigate('/login', { replace: true });
  }, [authService, navigationService]);

  const pages = useMemo(() => createAllPages({
    authService, navigationService, branding: hostConfig.branding,
    socialProviders: regionalSocialProviders.international,
  }), [authService, navigationService]);

  const platformAdminPublicRoutes = useMemo(() => createPlatformAdminPublicRoutes({
    onLoginSuccess: (res, loginId) => {
      const displayName = res.displayName ?? res.username ?? res.email ?? loginId;
      const email = res.email ?? (loginId.includes('@') ? loginId : res.username ?? loginId);
      authService.installSession({
        id: String(res.identityId ?? email),
        username: res.username ?? email,
        email,
        name: displayName,
        role: res.platformRole,
        roles: [res.platformRole],
        permissions: [...res.permissions],
      }, res.accessToken, res.refreshToken);
    },
  }), [authService]);

  const sidebarMenuItems = useMemo(() => {
    const pluginItems = convertToSidebarMenuItems(pluginMenus, t);
    // Merge platform-admin module menus (系统配置 group with children).
    // Children are mapped here so the host never touches internal components.
    const adminItems = platformAdminMenus.map(m => ({
      key: m.key,
      label: t(m.title),
      icon: m.icon,
      path: m.path,
      order: m.order,
      children: m.children?.map(c => ({
        key: c.key,
        label: t(c.title),
        icon: c.icon,
        path: c.path,
        order: c.order,
      })),
    }));
    return [...pluginItems, ...adminItems].sort(
      (a, b) => (a.order ?? 999) - (b.order ?? 999),
    );
  }, [pluginMenus, platformAdminMenus, t]);

  return (
    <BrowserRouter>
      <RouterInjector adapter={routerAdapter} />
      <PlatformAdminBanner />
      <AppRoutes
        authService={authService}
        navigationService={navigationService}
        pages={pages}
        pluginsLoading={pluginsLoading}
        pluginRoutes={pluginRoutes}
        pluginMenus={pluginMenus}
        platformAdminPublicRoutes={platformAdminPublicRoutes}
        RemoteComponent={RemoteComponent}
        LayoutWrapper={ProtectedLayoutWithLocation}
        hostConfig={hostConfig}
        sidebarMenuItems={sidebarMenuItems}
        viewModeChecker={viewModeChecker}
        onLogout={handleLogout}
      />
    </BrowserRouter>
  );
}