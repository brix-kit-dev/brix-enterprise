/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 */
/**
 * @file Route Definitions — Declarative Route Assembly
 * @description All route definitions extracted from App.tsx to meet
 *              Host Ultra-Thin target (R6.5: App.tsx < 100 lines).
 *              Pure rendering logic, no state management.
 * @module host-standalone-web/config/routes
 * @version 3.6.0
 */

import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import {
  renderDynamicRoutes,
  type AggregatedRoute,
} from '@brix-sdk/platform-frame-web';
import { AuthGuardRoute } from '@brix-sdk/platform-router-web';
import { OAuthCallbackPage } from '@brix-sdk/platform-auth-web';
import type { RemoteComponentProps } from '@brix-sdk/runtime-sdk-react';
// Platform admin module — only the module entry is imported; no pages/hooks/repos.
import {
  platformAdminProtectedRoutes,
  PLATFORM_ADMIN_PERMISSIONS,
  PLATFORM_ADMIN_ROUTES,
  PLATFORM_ROLE_CODE,
  type PlatformAdminRouteEntry,
} from '@brix-sdk/platform-admin-web';
// Phase 2 / C-4 — explicit view-mode route guard.
import { RequireViewMode } from '@brix-sdk/platform-tenant-web';
import { VIEW_MODE_PLATFORM_ADMIN } from '@brix-sdk/runtime-sdk-api-web';

import type { ProtectedLayoutWithLocationProps } from './routes.types';
import type { HostConfig } from '../types';

interface AuthUserShape {
  readonly role?: string;
  readonly roles?: readonly string[];
  readonly permissions?: readonly string[];
}

function isPlatformAdminUser(user: unknown): boolean {
  if (!user || typeof user !== 'object') return false;
  const authUser = user as AuthUserShape;
  const platformRoles = Object.values(PLATFORM_ROLE_CODE) as readonly string[];
  const platformPermissions = Object.values(PLATFORM_ADMIN_PERMISSIONS) as readonly string[];

  if (authUser.role && platformRoles.includes(authUser.role)) return true;
  if (authUser.roles?.some(role => platformRoles.includes(role))) return true;
  return authUser.permissions?.some(permission => platformPermissions.includes(permission)) ?? false;
}

/**
 * Props for the host route tree component.
 */
export interface AppRoutesProps {
  /** Authentication service instance. */
  readonly authService: {
    isAuthenticated: () => boolean;
    getUser: () => unknown;
    logout: () => void;
    handleOAuthCallback: (provider: string, code: string, state: string) => Promise<unknown>;
  };
  /** Navigation service for programmatic navigation. */
  readonly navigationService: { navigate: (path: string, options?: { replace?: boolean }) => void };
  /** Rendered pages created by page factory. */
  readonly pages: {
    LoginPage: React.ComponentType;
    RegisterPage: React.ComponentType;
    DashboardPage: React.ComponentType;
    NotFoundPage: React.ComponentType;
    UnauthorizedPage: React.ComponentType;
  };
  /** Whether plugin routes are still loading. */
  readonly pluginsLoading: boolean;
  /** Discovered plugin routes. */
  readonly pluginRoutes: AggregatedRoute[];
  /** Plugin menu items for sidebar. */
  readonly pluginMenus: Array<unknown>;
  /** Platform-admin public routes with Host-provided session installer. */
  readonly platformAdminPublicRoutes: ReadonlyArray<PlatformAdminRouteEntry>;
  /** Remote component renderer from plugin loader. */
  readonly RemoteComponent: React.ComponentType<RemoteComponentProps>;
  /** Layout wrapper component. */
  readonly LayoutWrapper: React.ComponentType<ProtectedLayoutWithLocationProps>;
  /** Host configuration for branding and layout. */
  readonly hostConfig: HostConfig;
  /** Sidebar menu items (already converted). */
  readonly sidebarMenuItems: ProtectedLayoutWithLocationProps['menuItems'];
  /**
   * View-mode checker (Phase 2 / C-4). Receives a route's allowed-mode
   * set and returns `true` if the active session may render the route.
   * Routes without {@code requiredViewMode} bypass this check entirely.
   * @since 3.3.0
   */
  readonly viewModeChecker?: (allowed: readonly string[]) => boolean;
  /** Logout handler. */
  readonly onLogout: () => void;
}

/**
 * Host application route tree — pure declarative route assembly.
 *
 * Contains all route definitions for the standalone web host.
 * No state management or side effects; receives everything via props.
 */
export function AppRoutes({
  authService,
  navigationService,
  pages,
  pluginsLoading,
  pluginRoutes,
  platformAdminPublicRoutes,
  RemoteComponent,
  LayoutWrapper,
  hostConfig,
  sidebarMenuItems,
  viewModeChecker,
  onLogout,
}: AppRoutesProps) {
  const { LoginPage, RegisterPage, DashboardPage, NotFoundPage, UnauthorizedPage } = pages;
  const defaultAuthenticatedPath = isPlatformAdminUser(authService.getUser())
    ? PLATFORM_ADMIN_ROUTES.DASHBOARD
    : '/dashboard';
  const layoutBranding = {
    appName: hostConfig.branding.appName,
    logo: typeof hostConfig.branding.logo === 'string' ? hostConfig.branding.logo : undefined,
    primaryColor: hostConfig.branding.primaryColor,
  };

  const renderProtectedLayout = (redirectTo: string) => (
    <AuthGuardRoute isAuthenticated={authService.isAuthenticated} redirectTo={redirectTo}>
      <LayoutWrapper
        branding={layoutBranding}
        dimensions={{
          sidebarWidth: hostConfig.layout?.sidebarWidth,
          sidebarCollapsedWidth: hostConfig.layout?.sidebarCollapsedWidth,
          headerHeight: hostConfig.layout?.headerHeight,
        }}
        onNavigate={navigationService.navigate}
        onLogout={onLogout}
        menuItems={sidebarMenuItems}
        menusLoading={pluginsLoading}
      >
        <Outlet />
      </LayoutWrapper>
    </AuthGuardRoute>
  );

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/auth/callback/:provider"
        element={
          <OAuthCallbackPage
            onHandleCallback={async (provider, code, state) => {
              try {
                const result = await authService.handleOAuthCallback(provider, code, state);
                if (
                  result &&
                  typeof result === 'object' &&
                  'success' in result &&
                  typeof (result as { success?: unknown }).success === 'boolean'
                ) {
                  return result as { success: boolean; error?: string };
                }
                return { success: true };
              } catch (error) {
                return {
                  success: false,
                  error: error instanceof Error ? error.message : 'OAuth callback failed',
                };
              }
            }}
            onSuccess={() => navigationService.navigate('/dashboard', { replace: true })}
          />
        }
      />
      {/* Platform admin standalone login — no tenant auth required */}
      {platformAdminPublicRoutes.map(r => (
        <Route key={r.path} path={r.path} element={r.element} />
      ))}
      <Route
        element={renderProtectedLayout('/login')}
      >
        <Route
          path="/dashboard"
          element={
            isPlatformAdminUser(authService.getUser()) ? (
              <Navigate to={PLATFORM_ADMIN_ROUTES.DASHBOARD} replace />
            ) : (
              <DashboardPage />
            )
          }
        />
        {!pluginsLoading && renderDynamicRoutes(pluginRoutes, { RemoteComponent, viewModeChecker })}
      </Route>
      <Route element={renderProtectedLayout(PLATFORM_ADMIN_ROUTES.LOGIN)}>
        {/* Platform admin pages inside the shell layout (sidebar visible).
            Phase 2 / C-4 — wrapped in <RequireViewMode> so only sessions whose
            view mode is PLATFORM_ADMIN may render the page tree. Tenant-actor
            / tenant-subject sessions (e.g. a super-admin who has impersonated
            a tenant) are redirected to the platform login, satisfying the
            stability-plan §4.4 acceptance criterion that switching view mode
            blocks direct URL access to /platform/* pages.
            Each page additionally verifies its own platform-JWT internally. */}
        {platformAdminProtectedRoutes.map(r => (
          <Route
            key={r.path}
            path={r.path}
            element={
              <RequireViewMode
                allowed={[VIEW_MODE_PLATFORM_ADMIN]}
                fallback={<Navigate to={PLATFORM_ADMIN_ROUTES.LOGIN} replace />}
              >
                {r.element}
              </RequireViewMode>
            }
          />
        ))}
      </Route>
      <Route path="/403" element={<UnauthorizedPage />} />
      <Route path="/404" element={<NotFoundPage />} />
        <Route path="/" element={authService.isAuthenticated() ? <Navigate to={defaultAuthenticatedPath} replace /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
