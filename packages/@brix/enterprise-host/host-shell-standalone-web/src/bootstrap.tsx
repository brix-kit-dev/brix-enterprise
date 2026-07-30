import {
  StrictMode,
  createRoot,
  isValidElement,
  type ReactNode,
} from '@brix-sdk/shared-runtime-web/react';
import { publishFrontendRuntimeIdentityEvidence } from '@brix-sdk/shared-runtime-web/runtime-identity';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from '@brix-sdk/shared-runtime-web/router';
import { RuntimeContextProvider } from '@brix-sdk/runtime-sdk-react';
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
  type FrontendHostRouteSnapshotEntry,
} from '@brix-sdk/runtime-orchestrator-web';
import { createStandaloneWebRuntimeCapabilityBindings } from '@brix-sdk/enterprise-standalone-web-runtime-profile';
import { standaloneWebComposition } from './composition/standalone-web.composition';

function toRouteElement(route: FrontendHostRouteSnapshotEntry): ReactNode {
  if (isValidElement(route.element)) {
    return route.element;
  }
  throw new Error(`BRX_HOST_ROUTE_ELEMENT_MISSING:${route.routeId}`);
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
              element={toRouteElement(route)}
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
