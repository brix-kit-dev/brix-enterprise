/**
 * @file Root Component
 * @description Host application root component - pure assembly, no capability implementation
 * @module host-standalone-web/App
 * @version 3.1.0
 *
 * App.tsx only does assembly and configuration, no business logic.
 * 
 * v3.1.0: Code split refactoring
 * - Page factory logic extracted to factories/pages.factory.ts
 * - App.tsx reduced to ~120 lines (from 192 lines)
 * - Improved maintainability and separation of concerns
 * 
 * v3.0.5: Manifest-Driven Architecture
 * - Plugins are dynamically discovered from backend /api/plugins
 * - Menus/routes are loaded from plugin ui-manifest.json
 * - Host no longer hardcodes any plugin configuration
 * 
 * 【架构说明】
 * v3.1.0 重构将页面工厂逻辑提取到 factories/pages.factory.ts，
 * 使 App.tsx 专注于组件组装和路由配置。
 */

import { useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import type { SidebarMenuItem, ProtectedLayoutProps } from '@shinwa/shinwa-platform-shell-web';
import type { AggregatedMenuItem } from '@brix/runtime-orchestrator-web';

// Platform capability packages (from platform-commons)
import { ReactRouterAdapter, RouterInjector, AuthGuardRoute } from '@brix/platform-router-web';
import { OAuthCallbackPage } from '@brix/platform-auth-web';

// Local services, config, and factories
import { createAuthService } from './services/auth.service';
import { hostConfig, regionalSocialProviders } from './config/host.config';
import { ProtectedLayout } from './components/ProtectedLayout';
import { PlaceholderPage } from './components/PlaceholderPage';
import { usePluginSystem } from './hooks/usePluginSystem';
import { renderDynamicRoutes } from './components/DynamicPluginRoutes';
import { createAllPages, type NavigationService } from './factories';

/**
 * Create navigation service
 */
function createNavigationService(routerAdapter: ReactRouterAdapter): NavigationService {
  return {
    navigate: (path: string, options?: { replace?: boolean }) => {
      routerAdapter.navigate(path, options);
    },
  };
}

/**
 * Convert AggregatedMenuItem to SidebarMenuItem
 * Maps the plugin system's menu format to the shell layout's expected format
 */
function convertToSidebarMenuItems(menus: AggregatedMenuItem[]): SidebarMenuItem[] {
  return menus.map((item) => ({
    key: item.key,
    label: item.title,
    icon: item.icon,
    path: item.path,
    order: item.order,
    children: item.children ? convertToSidebarMenuItems(item.children) : undefined,
  }));
}

/**
 * Wrapper for ProtectedLayout that automatically injects currentPath from useLocation
 * Must be used inside BrowserRouter
 */
function ProtectedLayoutWithLocation(props: Omit<ProtectedLayoutProps, 'currentPath'>) {
  const location = useLocation();
  return <ProtectedLayout {...props} currentPath={location.pathname} />;
}

/**
 * Host application root component.
 * 
 * This component assembles all routes and provides the application shell.
 * Business logic is delegated to services and hooks.
 */
export function App() {
  // Core services
  const routerAdapter = useMemo(() => new ReactRouterAdapter(), []);
  const authService = useMemo(() => createAuthService(), []);
  const navigationService = useMemo(
    () => createNavigationService(routerAdapter), 
    [routerAdapter]
  );
  
  // Manifest-Driven dynamic plugin system
  const { 
    loading: pluginsLoading, 
    menus: pluginMenus, 
    routes: pluginRoutes,
  } = usePluginSystem();

  // Logout handling
  const handleLogout = useCallback(() => {
    authService.logout();
    navigationService.navigate('/login', { replace: true });
  }, [authService, navigationService]);

  // Create all page components using factories (extracted from App.tsx)
  const pages = useMemo(() => createAllPages({
    authService,
    navigationService,
    branding: hostConfig.branding,
    socialProviders: regionalSocialProviders.international,
  }), [authService, navigationService]);

  const { LoginPage, RegisterPage, DashboardPage, NotFoundPage, UnauthorizedPage } = pages;

  return (
    <BrowserRouter>
      <RouterInjector adapter={routerAdapter} />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* OAuth callback */}
        <Route 
          path="/auth/callback/:provider" 
          element={
            <OAuthCallbackPage 
              onHandleCallback={(provider, code, state) =>
                authService.handleOAuthCallback(provider, code, state)
              }
              onSuccess={() => navigationService.navigate('/dashboard', { replace: true })}
            />
          } 
        />

        {/* Protected routes with layout */}
        <Route
          element={
            <AuthGuardRoute isAuthenticated={authService.isAuthenticated}>
              <ProtectedLayoutWithLocation
                branding={hostConfig.branding}
                dimensions={{
                  sidebarWidth: hostConfig.layout?.sidebarWidth,
                  sidebarCollapsedWidth: hostConfig.layout?.sidebarCollapsedWidth,
                  headerHeight: hostConfig.layout?.headerHeight,
                }}
                user={authService.getUser() || undefined}
                onNavigate={navigationService.navigate}
                onLogout={handleLogout}
                menuItems={convertToSidebarMenuItems(pluginMenus)}
                menusLoading={pluginsLoading}
              >
                <Outlet />
              </ProtectedLayoutWithLocation>
            </AuthGuardRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Dynamic plugin routes - loaded from manifest */}
          {!pluginsLoading && renderDynamicRoutes(pluginRoutes)}
          
          {/* Host core routes */}
          <Route path="/settings" element={<PlaceholderPage title="系统设置" />} />
        </Route>

        {/* Error pages */}
        <Route path="/403" element={<UnauthorizedPage />} />
        <Route path="/404" element={<NotFoundPage />} />

        {/* Default route */}
        <Route 
          path="/" 
          element={
            authService.isAuthenticated() 
              ? <Navigate to="/dashboard" replace /> 
              : <Navigate to="/login" replace />
          } 
        />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}