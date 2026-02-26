/**
 * @file DynamicPluginRoutes - Dynamic Plugin Route Component
 * @description Dynamically renders routes based on plugin manifest
 * @module @shinwa/shinwa-platform-shell-web/components/DynamicPluginRoutes
 * @version 3.2.0
 *
 * [Architecture Position]
 * DynamicPluginRoutes is a pre-assembled component in the Shell layer,
 * providing the capability to transform AggregatedRoute[] to React Router routes.
 *
 * [Design Principles]
 * - Follows v3.0.4 Manifest-Driven architecture
 * - Route configuration comes from each plugin's ui-manifest.json
 * - Host does not hardcode any plugin routes
 * - Supports permission control and fallback display
 *
 * [Usage Example]
 * ```tsx
 * import { DynamicPluginRoutes, renderDynamicRoutes } from '@shinwa/shinwa-platform-shell-web';
 *
 * function App() {
 *   const { routes } = usePluginSystem();
 *
 *   return (
 *     <Routes>
 *       <Route path="/dashboard" element={<Dashboard />} />
 *       {renderDynamicRoutes(routes)}
 *       <Route path="*" element={<NotFound />} />
 *     </Routes>
 *   );
 * }
 * ```
 */

import type { ComponentType, ReactNode, ReactElement } from 'react';
import { Route, type RouteObject } from 'react-router-dom';
import { usePluginLoader, type RemoteComponentProps } from '@brix/runtime-sdk-react';

// ========== Type Definitions ==========

/**
 * Aggregated Route Information (Shell-specific variant)
 *
 * Produced after integration by usePluginSystem hook.
 * 
 * [Note: Type Variant]
 * This interface uses a nested `plugin` object structure, which differs from
 * the flattened AggregatedRoute in @brix/platform-navigation-web that uses
 * separate `pluginId` and `remoteEntry` fields.
 * 
 * This variant is optimized for usePluginSystem hook output where plugin
 * context is preserved as a nested object for easier access.
 * 
 * @see {@link @brix/platform-navigation-web/manifest/types.ts} AggregatedRoute (canonical flattened version)
 */
export interface AggregatedRoute {
  /** Route path */
  path: string;
  /** Route title */
  title: string;
  /** Component reference (format: pluginName/ComponentPath or ./ComponentPath) */
  component: string;
  /** Required permission (optional) */
  permission?: string;
  /** Source plugin information */
  plugin: {
    /** Plugin ID */
    id: string;
    /** Remote entry URL */
    remoteEntry: string;
  };
}

/**
 * Dynamic route rendering options
 */
export interface DynamicRoutesOptions {
  /** Permission check function (optional) */
  checkPermission?: (permission: string) => boolean;
  /** Component to display when unauthorized */
  unauthorizedFallback?: ReactNode;
  /** Loading component factory function */
  loadingFallback?: (title: string) => ReactNode;
  /**
   * RemoteComponent for rendering remote plugins
   * @description Required when using renderDynamicRoutes directly.
   * Obtain from usePluginLoader hook and pass here.
   * @since v3.2.0 D6 Fix
   */
  RemoteComponent?: ComponentType<RemoteComponentProps>;
}

/**
 * DynamicPluginRoutes Component Props
 */
export interface DynamicPluginRoutesProps extends DynamicRoutesOptions {
  /** Aggregated route configuration */
  routes: AggregatedRoute[];
}

// ========== Utility Functions ==========

/**
 * Parse component reference
 *
 * Extract Module Federation exposePath from "pluginName/ComponentName" format
 *
 * @param componentRef - Component reference string
 * @returns Parsed exposePath
 */
function parseComponentRef(componentRef: string): { exposePath: string } {
  // componentRef format:
  // - "identityPlugin/pages/UserList" -> "./pages/UserList"
  // - "./pages/UserList" -> "./pages/UserList"
  const exposePath = componentRef.startsWith('./')
    ? componentRef
    : `./${componentRef.split('/').slice(1).join('/')}`;

  return { exposePath };
}

/**
 * Default loading component
 */
function DefaultLoadingFallback({ title }: { title: string }): ReactNode {
  return (
    <div
      style={{
        padding: '48px',
        textAlign: 'center',
        color: '#666',
      }}
    >
      <p>Loading {title}...</p>
    </div>
  );
}

/**
 * Default unauthorized component
 */
function DefaultUnauthorizedFallback(): ReactNode {
  return (
    <div
      style={{
        padding: '48px',
        textAlign: 'center',
        color: '#999',
      }}
    >
      You do not have permission to access this page
    </div>
  );
}

// ========== Core Functions ==========

/**
 * Render dynamic plugin routes
 *
 * Convert AggregatedRoute[] to React Router Route elements.
 * Use RemoteComponent to load remote components.
 *
 * @example
 * ```tsx
 * function App() {
 *   const { routes } = usePluginSystem();
 *
 *   return (
 *     <Routes>
 *       <Route path="/dashboard" element={<Dashboard />} />
 *       {renderDynamicRoutes(routes)}
 *       <Route path="*" element={<NotFound />} />
 *     </Routes>
 *   );
 * }
 * ```
 *
 * @param routes - Aggregated route configuration
 * @param options - Rendering options
 * @returns React Route element array
 */
export function renderDynamicRoutes(
  routes: AggregatedRoute[],
  options: DynamicRoutesOptions = {}
): ReactElement[] {
  const {
    checkPermission,
    unauthorizedFallback = <DefaultUnauthorizedFallback />,
    loadingFallback = (title) => <DefaultLoadingFallback title={title} />,
    RemoteComponent,
  } = options;

  if (!RemoteComponent) {
    throw new Error(
      '[DynamicPluginRoutes] RemoteComponent is required. ' +
      'Use DynamicPluginRoutes component instead, or pass RemoteComponent from usePluginLoader().'
    );
  }

  return routes.map((route) => {
    // Permission check
    if (route.permission && checkPermission) {
      if (!checkPermission(route.permission)) {
        return <Route key={route.path} path={route.path} element={unauthorizedFallback} />;
      }
    }

    const { exposePath } = parseComponentRef(route.component);

    return (
      <Route
        key={route.path}
        path={route.path}
        element={
          <RemoteComponent
            remoteEntry={route.plugin.remoteEntry}
            exposePath={exposePath}
            fallback={loadingFallback(route.title)}
          />
        }
      />
    );
  });
}

/**
 * Convert AggregatedRoute to React Router RouteObject format
 *
 * Suitable for createBrowserRouter and Data Router API.
 *
 * @example
 * ```tsx
 * const { routes } = usePluginSystem();
 *
 * const router = createBrowserRouter([
 *   { path: '/dashboard', element: <Dashboard /> },
 *   ...convertToRouteObjects(routes),
 *   { path: '*', element: <NotFound /> },
 * ]);
 * ```
 *
 * @param routes - Aggregated route configuration
 * @param options - Rendering options
 * @returns RouteObject array
 */
export function convertToRouteObjects(
  routes: AggregatedRoute[],
  options: DynamicRoutesOptions = {}
): RouteObject[] {
  const {
    checkPermission,
    unauthorizedFallback = <DefaultUnauthorizedFallback />,
    loadingFallback = (title) => <DefaultLoadingFallback title={title} />,
    RemoteComponent,
  } = options;

  if (!RemoteComponent) {
    throw new Error(
      '[convertToRouteObjects] RemoteComponent is required. ' +
      'Obtain from usePluginLoader() and pass as options.RemoteComponent.'
    );
  }

  return routes.map((route) => {
    // Permission check
    if (route.permission && checkPermission && !checkPermission(route.permission)) {
      return {
        path: route.path,
        element: unauthorizedFallback,
      };
    }

    const { exposePath } = parseComponentRef(route.component);

    return {
      path: route.path,
      element: (
        <RemoteComponent
          remoteEntry={route.plugin.remoteEntry}
          exposePath={exposePath}
          fallback={loadingFallback(route.title)}
        />
      ),
    };
  });
}

/**
 * DynamicPluginRoutes Component
 *
 * Wrapper component for convenient direct use in JSX.
 * Uses usePluginLoader hook internally to get RemoteComponent.
 *
 * @example
 * ```tsx
 * <DynamicPluginRoutes
 *   routes={routes}
 *   checkPermission={hasPermission}
 *   unauthorizedFallback={<Unauthorized />}
 * />
 * ```
 */
export function DynamicPluginRoutes({
  routes,
  ...options
}: DynamicPluginRoutesProps): ReactElement {
  const { RemoteComponent } = usePluginLoader();
  return <>{renderDynamicRoutes(routes, { ...options, RemoteComponent })}</>;
}

export default DynamicPluginRoutes;
