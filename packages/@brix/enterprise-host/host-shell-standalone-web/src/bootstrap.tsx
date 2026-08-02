import {
  StrictMode,
  createRoot,
  isValidElement,
  useCallback,
  useMemo,
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
import { RuntimeContextProvider, useAuth } from '@brix-sdk/runtime-sdk-react';
import {
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
import { createStandaloneWebRuntimeCapabilityBindings } from '@brix-sdk/enterprise-standalone-web-runtime-profile';
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

function toHostedRouteElement(
  route: FrontendHostRouteSnapshotEntry,
  routeSnapshot: FrontendHostPublishedRouteSnapshot,
): ReactNode {
  const element = toRouteElement(route);
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
}: {
  readonly routeSnapshot: FrontendHostPublishedRouteSnapshot;
  readonly status: string;
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
              element={toHostedRouteElement(route, routeSnapshot)}
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

  const result = await bootstrapFrontendHost({
    composition: standaloneWebComposition,
    capabilityBindings: createStandaloneWebRuntimeCapabilityBindings({
      apiBaseUrl: import.meta.env.VITE_API_BASE,
      routeSources: standaloneWebComposition.routes.sources,
    }),
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
        />
      </RuntimeContextProvider>
    </StrictMode>
  );
}
