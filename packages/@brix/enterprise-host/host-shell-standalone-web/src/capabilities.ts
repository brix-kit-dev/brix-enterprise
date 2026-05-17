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
 * @file Capability Registration Module
 * @description Consolidated capability registration for Host runtime assembly.
 *              Each exported function registers one capability on the WebUIRuntime.
 *              Following Blueprint v3.0.9 Constraint 6 (Ultra-Thin Host):
 *              Host only assembles capabilities — all implementations come from
 *              Layer 2C (platform-commons / infra-adapters).
 *
 * @module host-standalone-web/capabilities
 * @version 3.5.0
 *
 * [v3.5.0 Host Slimming — Phase 3.2]
 * Consolidated from 9 individual capability files into a single module
 * to meet R6.4 Host-Web file count target (≤ 15 files).
 * No logic changes — only file consolidation.
 */

// ============================================================================
// SDK layer imports
// ============================================================================
import {
  AuthCapabilityType,
  ConfigStoreCapabilityType,
  EventBusCapabilityType,
  type EventBusCapability,
  HttpCapabilityType,
  I18nCapabilityType,
  NavigationCapabilityType,
  PluginLoaderCapabilityType,
  TenantCapabilityType,
  ThemeCapabilityType,
  ViewModeCapabilityType,
  type HttpCapability,
  type HttpRequestConfig,
  type HttpResponse,
  type NavigationCapability,
  type NavigateOptions,
  type TenantCapability,
  type TenantInfo,
  type ViewMode,
  type ViewModeSwitchRequest,
  type ViewModeSwitchResult,
} from '@brix-sdk/runtime-sdk-api-web';

import {
  GovernanceEnforcer,
  type GovernanceConfig,
  type WebUIRuntime,
} from '@brix-sdk/runtime-orchestrator-web';

// ============================================================================
// Layer 2C implementation imports (platform-commons + infra-adapters)
// ============================================================================
import { AuthCapabilityImpl, type AuthChangeHandler } from '@brix-sdk/platform-auth-web';
import { ConfigCapabilityImpl } from '@brix-sdk/platform-config-web';
import { EventBusCapabilityImpl, EventLogger } from '@brix-sdk/platform-eventbus-web';
import { createErrorEventInterceptor, createHttpCapability } from '@brix-sdk/infra-adapter-http-web';
import { I18nCapabilityImpl } from '@brix-sdk/platform-i18n-web';
import { RemoteComponent, preloadContainer } from '@brix-sdk/infra-adapter-mf-web';
import { ThemeCapabilityImpl } from '@brix-sdk/platform-frame-web';
import { MuiDesignTokenResolver } from '@brix-sdk/infra-adapter-ui-mui';
import {
  TenantCapabilityImpl,
  type TenantCapabilityConfig,
  TenantRepository,
  DefaultTenantHttpClient,
  ViewModeCapabilityImpl,
  type ViewModeCapabilityConfig,
} from '@brix-sdk/platform-tenant-web';
import { registerFrameI18n } from '@brix-sdk/platform-frame-web/i18n';

// Enterprise-solutions plugin i18n registrations (Phase 3.4 i18n chain activation)
import { registerCarouselI18n } from '../../../enterprise-solutions/app-carousel/carousel-ui-web/src/i18n';
import { registerCaseI18n } from '../../../enterprise-solutions/app-case/case-ui-web/src/i18n';
import { registerComplianceI18n } from '../../../enterprise-solutions/app-compliance/compliance-ui-web/src/i18n';
import { registerContractsI18n } from '../../../enterprise-solutions/app-contracts/contracts-ui-web/src/i18n';
import { registerIdentityI18n } from '../../../enterprise-solutions/app-identity/identity-ui-web/src/i18n';
import { registerIntakeI18n } from '../../../enterprise-solutions/app-intake/intake-ui-web/src/i18n';
import { registerMessengerI18n } from '../../../enterprise-solutions/app-messenger/messenger-ui-web/src/i18n';
import { registerStorageI18n } from '../../../enterprise-solutions/app-storage/storage-ui-web/src/i18n';
import { registerBookingI18n } from '../../../enterprise-solutions/app-booking/booking-ui-web/src/i18n';
import { registerProductsI18n } from '../../../enterprise-solutions/app-products/products-ui-web/src/i18n';
import { registerPartnersI18n } from '../../../enterprise-solutions/app-partners/partners-ui-web/src/i18n';
import { registerTenantI18n } from '../../../enterprise-solutions/app-tenant/tenant-ui-web/src/i18n';

// Host-level services
import { getAuthService } from './services/auth.service';
import { routerAdapter } from './services/router.service';
import { GovernedEventRouter } from './governance';

// ============================================================================
// Auth Capability
// ============================================================================

/**
 * Register Auth capability on the runtime.
 *
 * Delegates to {@link AuthCapabilityImpl} from platform-auth-web.
 * Returns the auth service and subscribers for downstream wiring
 * (e.g., HTTP token injection, logout handling).
 */
export function registerAuth(runtime: WebUIRuntime) {
  const authService = getAuthService();

  const authSubscribers = new Set<AuthChangeHandler>();
  const authCapability = new AuthCapabilityImpl({
    getAuthState: () => {
      const serviceUser = authService.getUser();
      const user = serviceUser
        ? {
            id: serviceUser.id,
            username: serviceUser.username,
            email: serviceUser.email,
            displayName: serviceUser.name,
            avatar: serviceUser.avatar,
            roles: serviceUser.roles ?? (serviceUser.role ? [serviceUser.role] : []),
            permissions: serviceUser.permissions ?? [],
          }
        : null;
      return {
        user,
        token: authService.getToken(),
        tenant: null,
        featureFlags: {},
        dataScopes: [],
        loading: false,
      };
    },
    subscribeAuthChange: (handler: AuthChangeHandler) => {
      authSubscribers.add(handler);
      return () => authSubscribers.delete(handler);
    },
  });
  runtime.registerCapability(AuthCapabilityType, { provide: () => authCapability });

  return { authService, authSubscribers };
}

// ============================================================================
// ConfigStore Capability
// ============================================================================

/**
 * Register ConfigStore capability on the runtime.
 *
 * Backed by HTTP endpoint. Requires HttpCapability to be registered first.
 */
export function registerConfigStore(runtime: WebUIRuntime, httpCapability: HttpCapability): void {
  const configCapability = new ConfigCapabilityImpl({
    httpCapability,
    configEndpoint: '/api/v1/config',
    refreshInterval: 0,
  });
  runtime.registerCapability(ConfigStoreCapabilityType, { provide: () => configCapability });
}

// ============================================================================
// EventBus Capability (with Governance enforcement)
// ============================================================================

/**
 * Register EventBus capability with governance enforcement on the runtime.
 *
 * Creates a {@link GovernedEventRouter} that applies event routing rules
 * from the governance configuration, plus an {@link EventLogger} for
 * development-time diagnostics.
 */
export function registerEventBus(
  runtime: WebUIRuntime,
  governanceConfig: GovernanceConfig,
): EventBusCapability {
  const governanceEnforcer = new GovernanceEnforcer(governanceConfig);
  governanceEnforcer.logPolicySummary();

  const eventRouter = new GovernedEventRouter(governanceEnforcer);
  const eventLogger = new EventLogger({
    enabled: import.meta.env.DEV,
    maxEntries: 1000,
  });
  const eventBusCapability = new EventBusCapabilityImpl({
    eventRouter,
    eventLogger,
    pluginId: 'host',
  });
  runtime.registerCapability(EventBusCapabilityType, { provide: () => eventBusCapability });
  return eventBusCapability;
}

// ============================================================================
// HTTP Capability
// ============================================================================

/** Dependencies for HTTP capability registration. */
interface HttpDeps {
  authTokenProvider: () => string | null;
  tenantCapability: TenantCapability;
  onAuthExpired: () => void;
  refreshToken: () => Promise<boolean>;
  /**
   * Optional EventBus capability — when provided, HTTP failures are
   * automatically published as `system.http.error` events for centralised
   * UI handling (Frontend Stability Reform Plan v1.0 — C-2).
   */
  eventBus?: EventBusCapability;
}

type RetriableHttpRequestConfig = HttpRequestConfig & {
  readonly __brixAuthRetry?: boolean;
};

function getHttpErrorStatus(error: unknown): number | undefined {
  const httpError = error as { status?: number; context?: { status?: number } };
  return httpError.status ?? httpError.context?.status;
}

function getHttpErrorConfig(error: unknown): RetriableHttpRequestConfig | undefined {
  return (error as { config?: RetriableHttpRequestConfig }).config;
}

function shouldSkipAuthRefresh(config: RetriableHttpRequestConfig | undefined): boolean {
  const url = config?.url ?? '';
  return url.includes('/auth/login') || url.includes('/auth/refresh');
}

/**
 * Register HTTP capability on the runtime.
 *
 * Includes auth token injection, tenant header, and 401 auto-refresh interceptor.
 * Returns the created HttpCapability for downstream wiring (e.g., ConfigStore).
 */
export function registerHttp(runtime: WebUIRuntime, deps: HttpDeps) {
  const httpCapability = createHttpCapability({
    baseURL: import.meta.env.VITE_API_BASE || '/api',
    defaultTimeout: 30000,
    enableLogging: import.meta.env.DEV,
    authTokenProvider: deps.authTokenProvider,
    tenantIdProvider: () => deps.tenantCapability.getCurrentTenantId(),
  });
  runtime.registerCapability(HttpCapabilityType, { provide: () => httpCapability });

  // Token auto-refresh interceptor (Phase 1.5)
  let refreshPromise: Promise<boolean> | null = null;
  httpCapability.addResponseInterceptor({
    onResponse<T>(response: HttpResponse<T>) {
      return response;
    },
    async onResponseError(error: unknown) {
      const status = getHttpErrorStatus(error);
      const originalConfig = getHttpErrorConfig(error);
      if (status === 401 && !shouldSkipAuthRefresh(originalConfig)) {
        if (originalConfig?.__brixAuthRetry) {
          deps.onAuthExpired();
          throw error;
        }
        if (!refreshPromise) {
          refreshPromise = deps.refreshToken().finally(() => {
            refreshPromise = null;
          });
        }
        const refreshed = await refreshPromise;
        if (!refreshed) {
          deps.onAuthExpired();
          throw error;
        }
        if (originalConfig) {
          return httpCapability.request({
            ...originalConfig,
            __brixAuthRetry: true,
          } as RetriableHttpRequestConfig);
        }
      }
      throw error;
    },
  });

  if (deps.eventBus) {
    httpCapability.addResponseInterceptor(createErrorEventInterceptor(deps.eventBus));
  }

  return httpCapability;
}

// ============================================================================
// I18n Capability
// ============================================================================

/**
 * Register I18n capability with all plugin resource bundles.
 *
 * Registers host-level translations (dashboard, settings labels),
 * shell frame translations, and all enterprise-solutions plugin bundles.
 */
export function registerI18n(runtime: WebUIRuntime): void {
  const i18nCapability = new I18nCapabilityImpl({
    defaultLocale: 'zh-CN',
    supportedLocales: [
      { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
      { code: 'en-US', name: 'English', nativeName: 'English' },
    ],
  });
  runtime.registerCapability(I18nCapabilityType, { provide: () => i18nCapability });

  // Host-level translation resources for core menus and UI labels
  i18nCapability.addResourceBundle({
    locale: 'zh-CN',
    namespace: 'host',
    resources: {
      'menu.dashboard': '工作台',
      'menu.settings': '系统设置',
    },
  });
  i18nCapability.addResourceBundle({
    locale: 'en-US',
    namespace: 'host',
    resources: {
      'menu.dashboard': 'Dashboard',
      'menu.settings': 'Settings',
    },
  });

  // Shell frame-level i18n resources (error pages, dashboard, OAuth)
  registerFrameI18n(i18nCapability);

  // Enterprise-solutions plugin i18n resource bundles (Phase 3.4)
  registerCarouselI18n(i18nCapability);
  registerCaseI18n(i18nCapability);
  registerComplianceI18n(i18nCapability);
  registerContractsI18n(i18nCapability);
  registerIdentityI18n(i18nCapability);
  registerIntakeI18n(i18nCapability);
  registerMessengerI18n(i18nCapability);
  registerStorageI18n(i18nCapability);
  registerBookingI18n(i18nCapability);
  registerProductsI18n(i18nCapability);
  registerPartnersI18n(i18nCapability);
  registerTenantI18n(i18nCapability);
}

// ============================================================================
// Navigation Capability
// ============================================================================

/**
 * NavigationCapability backed by ReactRouterAdapter.
 *
 * Before RouterInjector injects the React Router navigate function,
 * ReactRouterAdapter falls back to window.history, so bootstrap-time
 * navigation still works.
 */
class RouterNavigationCapability implements NavigationCapability {
  navigate(path: string, options?: NavigateOptions): void {
    routerAdapter.navigate(path, {
      replace: options?.replace,
      state: options?.state,
    });
  }

  goBack(): void {
    routerAdapter.goBack();
  }

  getCurrentPath(): string {
    return routerAdapter.getCurrentPath();
  }
}

/**
 * Register Navigation capability on the runtime.
 */
export function registerNavigation(runtime: WebUIRuntime): void {
  const navigationCapability = new RouterNavigationCapability();
  runtime.registerCapability(NavigationCapabilityType, { provide: () => navigationCapability });
}

// ============================================================================
// PluginLoader Capability
// ============================================================================

/**
 * Register PluginLoader capability on the runtime.
 *
 * Provides Module Federation based remote component loading and
 * container preloading via {@link RemoteComponent} and {@link preloadContainer}.
 */
export function registerPluginLoader(runtime: WebUIRuntime): void {
  runtime.registerCapability(PluginLoaderCapabilityType, {
    provide: () => ({
      RemoteComponent,
      preload: async (remoteEntries: string[]) => {
        await Promise.all(remoteEntries.map((entry) => preloadContainer(entry)));
      },
    }),
  });
}

// ============================================================================
// Tenant Capability
// ============================================================================

/**
 * Extract a claim from a JWT token payload (no signature verification).
 * @internal Used only for synchronous tenant ID reads before API calls.
 */
function getJwtClaim(token: string | null, claim: string): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload[claim] ?? null;
  } catch {
    return null;
  }
}

/**
 * Register Tenant capability on the runtime.
 *
 * Creates a TenantCapabilityImpl backed by:
 * - JWT claims for synchronous reads (getCurrentTenantId / getCurrentTenant)
 * - TenantRepository (HTTP) for switchTenant
 * - Local cache for getAvailableTenants (seeded from JWT, refreshed async)
 *
 * @param runtime - WebUIRuntime to register onto
 * @param tokenProvider - Returns the current JWT token
 * @returns the registered tenant capability for downstream use (e.g., HTTP header injection)
 */
export function registerTenant(runtime: WebUIRuntime, tokenProvider: () => string | null) {
  const httpClient = new DefaultTenantHttpClient(tokenProvider);
  const tenantRepo = new TenantRepository(httpClient);

  // Mutable cache for available tenants, seeded from JWT and refreshed asynchronously
  let availableTenantsCache: readonly TenantInfo[] = [];

  const seedFromJwt = (): void => {
    const tenantId = getJwtClaim(tokenProvider(), 'tenant_id');
    if (tenantId) {
      availableTenantsCache = [{ id: tenantId, code: tenantId, name: tenantId, status: 'ACTIVE' }];
    }
  };
  seedFromJwt();

  // Asynchronously refresh available tenants from the server
  const refreshAvailableTenants = (): void => {
    tenantRepo.getAvailableTenants()
      .then(tenants => {
        availableTenantsCache = tenants.map(t => ({
          id: t.id,
          code: t.code,
          name: t.name,
          status: t.status,
        }));
      })
      .catch(() => {
        // Silent catch — tenant list refresh is non-critical
      });
  };

  const config: TenantCapabilityConfig = {
    getCurrentTenantId: () => getJwtClaim(tokenProvider(), 'tenant_id'),

    getCurrentTenant: () => {
      const tenantId = getJwtClaim(tokenProvider(), 'tenant_id');
      if (!tenantId) return null;
      // Return enriched data from cache if available, otherwise construct from JWT
      const cached = availableTenantsCache.find(t => t.id === tenantId);
      return cached ?? { id: tenantId, code: tenantId, name: tenantId, status: 'ACTIVE' as const };
    },

    getAvailableTenants: () => availableTenantsCache,

    isFeatureEnabled: (_featureKey: string) => false,

    switchTenant: async (tenantId: string) => {
      await tenantRepo.switchTenant(tenantId);
      // After backend confirms switch, refresh the available tenants cache
      refreshAvailableTenants();
    },
  };

  const tenantCapability = new TenantCapabilityImpl(config);

  // Kick off background refresh to populate cache with real server data
  refreshAvailableTenants();

  runtime.registerCapability(TenantCapabilityType, { provide: () => tenantCapability });
  return tenantCapability;
}

// ============================================================================
// Theme Capability
// ============================================================================

/**
 * Register Theme capability on the runtime.
 *
 * Constructs a ThemeCapabilityImpl with MuiDesignTokenResolver injected,
 * enabling plugins to obtain UI-library-agnostic Brix semantic DesignTokens
 * via {@code themeCapability.getDesignTokens()}.
 *
 * @param runtime - The WebUIRuntime to register the capability on.
 * @returns The created ThemeCapabilityImpl instance for downstream use.
 */
export function registerTheme(runtime: WebUIRuntime) {
  const themeCapability = new ThemeCapabilityImpl({
    designTokenResolver: new MuiDesignTokenResolver(),
  });

  runtime.registerCapability(ThemeCapabilityType, { provide: () => themeCapability });

  return themeCapability;
}

// ============================================================================
// View Mode Capability (Phase 2 / C-4)
// ============================================================================

/**
 * Backend response shape for {@code POST /api/auth/view-mode/switch}.
 *
 * Mirrors {@code ViewModeSwitchResponseDto} from
 * {@code platform-auth-web}. Defined locally so the Host need not depend on
 * the backend DTO classpath (R-1: contract-first).
 *
 * @internal
 */
interface ViewModeSwitchResponseShape {
  readonly accessToken: string;
  readonly expiresInSeconds: number;
  readonly mode: string;
  readonly tenantId?: number | string | null;
  readonly originalSub?: string | null;
}

/**
 * Maps a wire-mode string from the backend onto a typed {@link ViewMode}.
 * Throws an `Error` for unknown values so the caller can surface the
 * problem rather than silently fall through to a default.
 *
 * @internal
 */
function parseViewMode(raw: string): ViewMode {
  if (raw === 'PLATFORM_ADMIN' || raw === 'TENANT_ACTOR' || raw === 'TENANT_SUBJECT') {
    return raw;
  }
  throw new Error(`[host] Unknown ViewMode received from backend: ${raw}`);
}

/**
 * Register {@link ViewModeCapability} on the runtime.
 *
 * Architecture:
 * - {@code getCurrent} / {@code getOriginalSub} / {@code getViewingTenantId}
 *   derive synchronously from the active JWT via {@link getJwtClaim} —
 *   the Host owns claim parsing and plugins consume only the typed result.
 * - {@code switchTo} POSTs to {@code /api/auth/view-mode/switch}, installs
 *   the freshly minted access token via
 *   {@code PlatformAuthService.setToken}, then triggers a full reload so
 *   the runtime re-bootstraps with the new perspective.
 *
 * The current view mode is encoded in the JWT as follows
 * (see Phase 2 design):
 * - {@code role === 'platform-admin'} && no {@code tenant_id} → PLATFORM_ADMIN
 * - {@code role === 'platform-admin'} && {@code tenant_id} present → viewing
 *   a tenant; the tenant's perspective (TENANT_ACTOR vs TENANT_SUBJECT)
 *   is currently collapsed to TENANT_ACTOR on the wire (forward-compat).
 * - {@code role === 'subject'} → TENANT_SUBJECT
 * - otherwise → TENANT_ACTOR
 *
 * @param runtime       runtime to register the capability on
 * @param tokenProvider returns the current JWT (or {@code null})
 * @returns the registered capability instance for downstream use
 * @since 3.3.0
 */
export function registerViewMode(
  runtime: WebUIRuntime,
  tokenProvider: () => string | null,
) {
  const authService = getAuthService();
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

  const resolveCurrent = (): ViewMode => {
    const token = tokenProvider();
    const role = getJwtClaim(token, 'role');
    if (role === 'platform-admin') {
      return 'PLATFORM_ADMIN';
    }
    if (role === 'subject') {
      return 'TENANT_SUBJECT';
    }
    return 'TENANT_ACTOR';
  };

  const resolveOriginalSub = (): string | null =>
    getJwtClaim(tokenProvider(), 'original_sub');

  const resolveViewingTenantId = (): string | null => {
    // Only meaningful while the active token is a platform-admin "viewing"
    // token (role retained but tenant_id + original_sub claims present).
    if (resolveOriginalSub() === null) return null;
    return getJwtClaim(tokenProvider(), 'tenant_id');
  };

  const config: ViewModeCapabilityConfig = {
    getCurrent: resolveCurrent,
    getOriginalSub: resolveOriginalSub,
    getViewingTenantId: resolveViewingTenantId,

    switchTo: async (request: ViewModeSwitchRequest): Promise<ViewModeSwitchResult> => {
      const token = tokenProvider();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${apiBaseUrl}/auth/view-mode/switch`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mode: request.mode,
          tenantId: request.tenantId !== undefined ? Number(request.tenantId) : null,
        }),
      });

      if (!response.ok) {
        let detail: string;
        try {
          const err = await response.json();
          detail = err.message ?? err.code ?? `${response.status} ${response.statusText}`;
        } catch {
          detail = `${response.status} ${response.statusText}`;
        }
        throw new Error(`[host] ViewMode switch failed: ${detail}`);
      }

      const payload = (await response.json()) as ViewModeSwitchResponseShape;
      const result: ViewModeSwitchResult = {
        accessToken: payload.accessToken,
        expiresInSeconds: payload.expiresInSeconds,
        mode: parseViewMode(payload.mode),
        tenantId:
          payload.tenantId === null || payload.tenantId === undefined
            ? undefined
            : String(payload.tenantId),
        originalSub: payload.originalSub ?? undefined,
      };

      // Persist new token and reload — the next bootstrap will re-derive
      // the active view mode from the JWT claims.
      authService.setToken(result.accessToken);
      window.location.reload();
      return result;
    },
  };

  const viewModeCapability = new ViewModeCapabilityImpl(config);
  runtime.registerCapability(ViewModeCapabilityType, { provide: () => viewModeCapability });
  return viewModeCapability;
}
