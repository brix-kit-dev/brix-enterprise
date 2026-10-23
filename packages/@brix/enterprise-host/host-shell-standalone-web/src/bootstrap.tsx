import {
  StrictMode,
  createRoot,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from '@brix-sdk/shared-runtime-web/react';
import { publishFrontendRuntimeIdentityEvidence } from '@brix-sdk/shared-runtime-web/runtime-identity';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from '@brix-sdk/shared-runtime-web/router';
import { RuntimeContextProvider, useAuth, useRuntimeContext } from '@brix-sdk/runtime-sdk-react';
import {
  type AuthCapability,
  AuthCapabilityType,
  I18nCapabilityType,
  NavigationCapabilityType,
  ThemeCapabilityType,
  UICapabilityType,
} from '@brix-sdk/runtime-sdk-api-web';
import {
  bootstrapFrontendHost,
  type FrontendHostPublishedRouteSnapshot,
  type FrontendHostMenuSnapshotEntry,
  type FrontendHostRouteSnapshotEntry,
} from '@brix-sdk/runtime-orchestrator-web';
import { ProtectedLayout } from '@brix-sdk/platform-frame-web/layouts/ProtectedLayout';
import {
  createStandaloneWebBffRuntimeCapabilityBindings,
  createStandaloneWebRuntimeCapabilityBindings,
} from '@brix-sdk/enterprise-standalone-web-runtime-profile';
import { standaloneWebComposition } from './composition/standalone-web.composition';

interface HostSidebarMenuItem {
  key: string;
  label: string;
  icon?: string;
  path?: string;
  children?: HostSidebarMenuItem[];
  order?: number;
}

function toRouteElement(route: FrontendHostRouteSnapshotEntry): ReactNode {
  if (isValidElement(route.element)) {
    return route.element;
  }
  throw new Error(`BRX_HOST_ROUTE_ELEMENT_MISSING:${route.routeId}`);
}

function isProtectedRoute(route: FrontendHostRouteSnapshotEntry): boolean {
  return route.guardPolicy === 'platform-authenticated';
}

/** Staff console (identity-auth `tenant-console`): runs behind the BFF, never with tokens. */
const TENANT_CONSOLE_BASE = '/tenant';

function isTenantConsolePath(pathname: string): boolean {
  return pathname === TENANT_CONSOLE_BASE || pathname.startsWith(`${TENANT_CONSOLE_BASE}/`);
}

function toSidebarMenuItem(menu: FrontendHostMenuSnapshotEntry): HostSidebarMenuItem {
  return {
    key: menu.key,
    label: menu.title,
    icon: menu.icon,
    order: menu.order,
    ...(menu.path ? { path: menu.path } : {}),
    ...(menu.children ? { children: menu.children.map(toSidebarMenuItem) } : {}),
  };
}

function filterMenuByPermissions(
  menu: FrontendHostMenuSnapshotEntry,
  hasPermission: (permission: string) => boolean,
): FrontendHostMenuSnapshotEntry | null {
  if (menu.permission && !hasPermission(menu.permission)) {
    return null;
  }

  const children = menu.children
    ?.map(child => filterMenuByPermissions(child, hasPermission))
    .filter((child): child is FrontendHostMenuSnapshotEntry => child !== null);

  if (!menu.path && (!children || children.length === 0)) {
    return null;
  }

  return {
    ...menu,
    ...(children ? { children } : {}),
  };
}

function resolveAnonymousEntryPath(
  routeSnapshot: FrontendHostPublishedRouteSnapshot,
): string {
  return routeSnapshot.routes.find(route =>
    route.guardPolicy === 'public' &&
    route.authContext === 'anonymous' &&
    route.permissions.length === 0
  )?.path ?? routeSnapshot.defaultPath ?? '/';
}

function ProtectedRouteFrame({
  routeSnapshot,
  children,
}: {
  readonly routeSnapshot: FrontendHostPublishedRouteSnapshot;
  readonly children: ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const anonymousEntryPath = resolveAnonymousEntryPath(routeSnapshot);

  const menuItems = useMemo(
    () => routeSnapshot.menus
      .map(menu => filterMenuByPermissions(menu, auth.hasPermission))
      .filter((menu): menu is FrontendHostMenuSnapshotEntry => menu !== null)
      .map(toSidebarMenuItem)
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0)),
    [auth.hasPermission, routeSnapshot.menus],
  );

  const handleNavigate = useCallback(
    (path: string, options?: { replace?: boolean }) => {
      navigate(path, { replace: options?.replace });
    },
    [navigate],
  );

  const handleLogout = useCallback(async () => {
    await auth.logout();
    navigate(anonymousEntryPath, { replace: true });
  }, [anonymousEntryPath, auth, navigate]);

  if (!auth.isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <ProtectedLayout
      branding={{ appName: standaloneWebComposition.runtime.appName }}
      user={{
        name: auth.user?.displayName ?? auth.user?.username ?? 'Platform User',
      }}
      menuItems={menuItems}
      currentPath={location.pathname}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {children}
    </ProtectedLayout>
  );
}

/**
 * Admits staff console routes from the BFF session (frontend BRX-FE-AUTH-002/003): without a
 * session the Runtime sends the browser to the BFF login and back to this page; pages never
 * handle authentication themselves.
 */
function TenantConsoleFrame({
  route,
  startedBehindBff,
  children,
}: {
  readonly route: FrontendHostRouteSnapshotEntry;
  readonly startedBehindBff: boolean;
  readonly children: ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const runtime = useRuntimeContext();
  const authCapability = runtime.getCapability<AuthCapability>(AuthCapabilityType);
  const decision = authCapability?.canAccessRoute({
    allowedContexts: ['actor'],
    tenantContext: 'required',
    permissions: route.permissions,
  }) ?? { allowed: false, reason: 'anonymous' as const };
  const returnTo = location.pathname + location.search;
  // Signing out also ends the session; the guard must not send the browser back to login then.
  const signingOut = useRef(false);

  useEffect(() => {
    if (decision.reason === 'anonymous' && !signingOut.current) {
      if (startedBehindBff && authCapability) {
        // The BFF-backed Auth capability sends the browser to log in and back to this page.
        void authCapability.login({});
      } else {
        // The console was entered from another console's page: start it with its own session.
        window.location.assign(returnTo);
      }
    }
  }, [authCapability, decision.reason, returnTo, startedBehindBff]);

  const handleLogout = useCallback(async () => {
    signingOut.current = true;
    await auth.logout();
    window.location.assign('/auth/signed-out');
  }, [auth]);

  const handleNavigate = useCallback(
    (path: string, options?: { replace?: boolean }) => {
      navigate(path, { replace: options?.replace });
    },
    [navigate],
  );

  if (decision.reason === 'anonymous') {
    return <div style={{ padding: 24 }}>正在前往登录…</div>;
  }
  return (
    <ProtectedLayout
      branding={{ appName: standaloneWebComposition.runtime.appName }}
      user={{ name: auth.user?.displayName ?? auth.user?.username ?? 'Staff' }}
      menuItems={[]}
      currentPath={location.pathname}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {decision.allowed ? children : (
        <div role="alert" style={{ padding: 24 }}>你当前的角色不能访问此页面。</div>
      )}
    </ProtectedLayout>
  );
}

function toHostedRouteElement(
  route: FrontendHostRouteSnapshotEntry,
  routeSnapshot: FrontendHostPublishedRouteSnapshot,
  startedBehindBff: boolean,
): ReactNode {
  const element = toRouteElement(route);
  if (isTenantConsolePath(route.path)) {
    return (
      <TenantConsoleFrame route={route} startedBehindBff={startedBehindBff}>
        {element}
      </TenantConsoleFrame>
    );
  }
  if (!isProtectedRoute(route)) {
    return element;
  }
  return (
    <ProtectedRouteFrame routeSnapshot={routeSnapshot}>
      {element}
    </ProtectedRouteFrame>
  );
}

function RuntimeEntry({
  routeSnapshot,
  status,
  startedBehindBff,
}: {
  readonly routeSnapshot: FrontendHostPublishedRouteSnapshot;
  readonly status: string;
  readonly startedBehindBff: boolean;
}) {
  const defaultPath = routeSnapshot.defaultPath ?? routeSnapshot.routes[0]?.path ?? '/';
  return (
    <main
      id="brix-runtime-entry"
      style={{ minHeight: '100%' }}
      data-runtime-status={status}
      aria-label="Brix runtime entry"
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to={defaultPath} replace />} />
          <Route path="/dashboard" element={<Navigate to={defaultPath} replace />} />
          {routeSnapshot.routes.map(route => (
            <Route
              key={route.routeId}
              path={route.path}
              element={toHostedRouteElement(route, routeSnapshot, startedBehindBff)}
            />
          ))}
        </Routes>
      </BrowserRouter>
    </main>
  );
}

export async function bootstrap(): Promise<void> {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('BRX_HOST_ROOT_MISSING');
  }

  document.title = standaloneWebComposition.runtime.appName;

  // The staff console and the legacy consoles are separate entries (identity-auth
  // BRX-IA-FLOW-005); the console a page load starts in decides how it authenticates.
  const startedBehindBff = isTenantConsolePath(window.location.pathname);
  const profileOptions = {
    apiBaseUrl: import.meta.env.VITE_API_BASE,
    routeSources: standaloneWebComposition.routes.sources,
  };

  const result = await bootstrapFrontendHost({
    composition: standaloneWebComposition,
    capabilityBindings: startedBehindBff
      ? await createStandaloneWebBffRuntimeCapabilityBindings(profileOptions)
      : createStandaloneWebRuntimeCapabilityBindings(profileOptions),
    debug: import.meta.env.DEV === true,
  });
  publishFrontendRuntimeIdentityEvidence({
    hostId: standaloneWebComposition.id,
    hostVersion: standaloneWebComposition.version,
    runtimeStatus: result.runtime.status,
    routeSnapshotId: result.routeSnapshot.snapshotId,
    capabilities: {
      router: result.runtimeContext.getCapability(NavigationCapabilityType),
      auth: result.runtimeContext.getCapability(AuthCapabilityType),
      theme: result.runtimeContext.getCapability(ThemeCapabilityType),
      i18n: result.runtimeContext.getCapability(I18nCapabilityType),
      ui: result.runtimeContext.getCapability(UICapabilityType),
    },
  });

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <RuntimeContextProvider value={result.runtimeContext}>
        <RuntimeEntry
          routeSnapshot={result.routeSnapshot}
          status={result.runtime.status}
          startedBehindBff={startedBehindBff}
        />
      </RuntimeContextProvider>
    </StrictMode>
  );
}
