import type {
  FrontendHostCapabilityBinding,
  FrontendHostRouteSnapshotSource,
} from '@brix-sdk/runtime-orchestrator-web';
import {
  AuthCapabilityType,
  HttpCapabilityType,
  I18nCapabilityType,
  NavigationCapabilityType,
  ThemeCapabilityType,
  UICapabilityType,
  type AuthChangeHandler,
  type AuthSessionInstallCredentials,
  AuthSessionInstallProvider,
  type AuthCapabilityConfig,
  type AuthState,
  type InternalAuthState,
  type LoginCredentials,
  type LoginResult,
  type RouterServiceLike,
  type User,
  type VerifiedAuthContext,
} from '@brix-sdk/runtime-sdk-api-web';
import { AuthCapabilityImpl } from '@brix-sdk/platform-auth-web/AuthCapabilityImpl';
import { I18nCapabilityImpl } from '@brix-sdk/platform-i18n-web';
import { ThemeCapabilityImpl } from '@brix-sdk/platform-frame-web/theme/ThemeCapabilityImpl';
import { defaultPreset } from '@brix-sdk/platform-frame-web/theme/presets/defaultPreset';
import { createHttpCapability } from '@brix-sdk/infra-adapter-http-web';
import {
  NativeDesignTokenResolver,
  nativeUIAdapter,
} from '@brix-sdk/infra-adapter-ui-native';
import {
  GovernancePolicyImpl,
  NavigationCapabilityImpl,
  PageRegistry,
} from '@brix-sdk/platform-navigation-web';

export interface StandaloneWebRuntimeProfileOptions {
  readonly apiBaseUrl?: string;
  readonly routeSources?: readonly FrontendHostRouteSnapshotSource[];
}

export function createStandaloneWebRuntimeCapabilityBindings(
  options: StandaloneWebRuntimeProfileOptions = {},
): readonly FrontendHostCapabilityBinding[] {
  const authState = createStandaloneAuthState();
  const auth = new AuthCapabilityImpl(authState);
  const http = createHttpCapability({
    baseURL: normalizeApiBaseUrl(options.apiBaseUrl),
    authTokenProvider: () => auth.getToken(),
    cache: {
      defaultTTL: 0,
    },
  });
  const pageRegistry = createPageRegistry(options.routeSources ?? []);
  const routerService = createBrowserRouterService();
  const navigation = new NavigationCapabilityImpl({
    routerService: routerService.service,
    pageRegistry,
    governancePolicy: new GovernancePolicyImpl(pageRegistry, {
      allowCrossPluginNavigation: true,
    }),
    pluginId: 'host-shell-standalone-web',
  });
  const i18n = new I18nCapabilityImpl({
    defaultLocale: 'zh-CN',
    fallbackLocale: 'en-US',
    persist: false,
  });
  const theme = new ThemeCapabilityImpl({
    defaultMode: 'light',
    persist: false,
    presets: [defaultPreset],
    designTokenResolver: new NativeDesignTokenResolver(),
  });

  return [
    {
      capabilityId: 'auth',
      capabilityType: AuthCapabilityType,
      provider: { provide: () => auth },
    },
    {
      capabilityId: 'http',
      capabilityType: HttpCapabilityType,
      provider: { provide: () => http },
    },
    {
      capabilityId: 'i18n',
      capabilityType: I18nCapabilityType,
      provider: { provide: () => i18n },
    },
    {
      capabilityId: 'router',
      capabilityType: NavigationCapabilityType,
      provider: {
        provide: () => navigation,
        dispose: () => {
          routerService.dispose();
        },
      },
    },
    {
      capabilityId: 'theme',
      capabilityType: ThemeCapabilityType,
      provider: { provide: () => theme },
    },
    {
      capabilityId: 'ui',
      capabilityType: UICapabilityType,
      provider: { provide: () => nativeUIAdapter },
    },
  ];
}

function createStandaloneAuthState(): AuthCapabilityConfig {
  let state: InternalAuthState = {
    user: null,
    token: null,
    tenant: null,
    featureFlags: {},
    dataScopes: [],
    loading: false,
    activeContext: null,
    sessionState: 'anonymous',
  };
  const handlers = new Set<AuthChangeHandler>();
  let refreshToken: string | null = null;

  function publish(next: InternalAuthState, type: 'login' | 'logout'): void {
    const previousState = toAuthState(state);
    state = next;
    const event = {
      type,
      user: state.user,
      state: toAuthState(state),
      previousState,
      timestamp: Date.now(),
    };
    for (const handler of handlers) {
      handler(event);
    }
  }

  return {
    getAuthState: () => state,
    subscribeAuthChange: (handler) => {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
    login: async (credentials: LoginCredentials): Promise<LoginResult> => {
      const session = readSessionInstallCredentials(credentials);
      const user = toUser(session);
      const activeContext = toVerifiedContext(session);
      refreshToken = session.refreshToken ?? null;
      publish({
        ...state,
        user,
        token: session.token,
        tenant: null,
        dataScopes: [],
        loading: false,
        activeContext,
        sessionState: 'authenticated',
      }, 'login');
      return {
        success: true,
        status: 'COMPLETE',
        user,
        token: session.token,
        refreshToken: refreshToken ?? undefined,
        expiresIn: session.expiresIn,
        identityId: session.subjectId,
        displayName: user.displayName ?? user.username,
        primaryRole: session.primaryRole,
        roles: session.roles,
        permissions: session.permissions,
      };
    },
    logout: async (): Promise<void> => {
      refreshToken = null;
      publish({
        ...state,
        user: null,
        token: null,
        tenant: null,
        dataScopes: [],
        loading: false,
        activeContext: null,
        sessionState: 'anonymous',
      }, 'logout');
    },
  };
}

function readSessionInstallCredentials(
  credentials: LoginCredentials,
): AuthSessionInstallCredentials {
  if (credentials.provider !== AuthSessionInstallProvider) {
    throw new Error('Unsupported auth login provider for standalone runtime profile');
  }
  const token = readText(credentials.token);
  const subjectId = readText(credentials.subjectId);
  if (!token || !subjectId) {
    throw new Error('Auth session install credentials require token and subjectId');
  }
  const contextKind = credentials.contextKind;
  if (contextKind !== 'platform' && contextKind !== 'actor' && contextKind !== 'subject') {
    throw new Error('Auth session install credentials require a supported contextKind');
  }
  if ((contextKind === 'actor' || contextKind === 'subject') && !readText(credentials.tenantId)) {
    throw new Error('Tenant auth session install credentials require tenantId');
  }
  return {
    provider: AuthSessionInstallProvider,
    token,
    refreshToken: readText(credentials.refreshToken),
    contextKind,
    subjectId,
    actorId: readText(credentials.actorId),
    tenantId: readText(credentials.tenantId),
    memberId: readText(credentials.memberId),
    principalId: readText(credentials.principalId),
    username: readText(credentials.username),
    email: readText(credentials.email),
    displayName: readText(credentials.displayName),
    primaryRole: readText(credentials.primaryRole),
    roles: readStringArray(credentials.roles),
    permissions: readStringArray(credentials.permissions),
    expiresIn: readPositiveNumber(credentials.expiresIn),
    expiresAt: readText(credentials.expiresAt),
  };
}

function toUser(session: AuthSessionInstallCredentials): User {
  const username = session.username
    ?? session.email
    ?? session.displayName
    ?? session.subjectId;
  return {
    id: session.subjectId,
    username,
    email: session.email,
    displayName: session.displayName ?? username,
    roles: [...(session.roles ?? [])],
    permissions: [...(session.permissions ?? [])],
  };
}

function toVerifiedContext(session: AuthSessionInstallCredentials): VerifiedAuthContext {
  const base = {
    subjectId: session.subjectId,
    actorId: session.actorId,
    sessionId: createSessionId(session.contextKind, session.subjectId),
    permissions: [...(session.permissions ?? [])],
    expiresAt: session.expiresAt ?? expiresAtFromTtl(session.expiresIn),
  };
  if (session.contextKind === 'actor') {
    return {
      ...base,
      kind: 'actor',
      tenantId: session.tenantId ?? '',
      memberId: session.memberId,
    };
  }
  if (session.contextKind === 'subject') {
    return {
      ...base,
      kind: 'subject',
      tenantId: session.tenantId ?? '',
      principalId: session.principalId,
    };
  }
  return {
    ...base,
    kind: 'platform',
  };
}

function toAuthState(internal: InternalAuthState): AuthState {
  return {
    isAuthenticated: internal.user !== null && internal.token !== null,
    user: internal.user,
    tenant: internal.tenant,
    loading: internal.loading,
    dataScopes: internal.dataScopes,
  };
}

function createSessionId(kind: string, subjectId: string): string {
  const randomId = globalThis.crypto?.randomUUID?.();
  return randomId ?? `${kind}:${subjectId}:${Date.now()}`;
}

function expiresAtFromTtl(expiresIn: number | undefined): string | undefined {
  if (expiresIn === undefined) {
    return undefined;
  }
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

function readText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map(item => item.trim());
}

function readPositiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function createPageRegistry(
  routeSources: readonly FrontendHostRouteSnapshotSource[],
): PageRegistry {
  const registry = new PageRegistry();
  const pages = routeSources.flatMap(source =>
    source.routes.map(route => ({
      pageId: route.pageId,
      urlPattern: route.path,
      pluginId: source.sourceId,
      title: route.title,
      metadata: {
        permissions: [...route.permissions],
      },
    })),
  );
  registry.registerMany(pages);
  return registry;
}

function createBrowserRouterService(): {
  readonly service: RouterServiceLike;
  readonly dispose: () => void;
} {
  const listeners = new Set<(url: string) => void>();
  const emit = () => {
    const url = window.location.pathname + window.location.search + window.location.hash;
    for (const listener of listeners) {
      listener(url);
    }
  };
  window.addEventListener('popstate', emit);

  return {
    service: {
      navigate(url, options) {
        if (options?.replace) {
          window.history.replaceState(options.state ?? null, '', url);
        } else {
          window.history.pushState(options?.state ?? null, '', url);
        }
        emit();
      },
      replace(url, state) {
        window.history.replaceState(state ?? null, '', url);
        emit();
      },
      goBack() {
        window.history.back();
      },
      goForward() {
        window.history.forward();
      },
      go(delta) {
        window.history.go(delta);
      },
      getCurrentUrl() {
        return window.location.href;
      },
      getCurrentPath() {
        return window.location.pathname;
      },
      getQueryParams() {
        return Object.fromEntries(new URLSearchParams(window.location.search).entries());
      },
      getHash() {
        return window.location.hash;
      },
      onUrlChange(listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      isActive(url, exact = false) {
        return exact ? window.location.pathname === url : window.location.pathname.startsWith(url);
      },
    },
    dispose() {
      window.removeEventListener('popstate', emit);
      listeners.clear();
    },
  };
}

function normalizeApiBaseUrl(apiBaseUrl: string | undefined): string {
  const configured = apiBaseUrl?.trim();
  if (!configured) {
    return '/api';
  }
  return configured.endsWith('/') ? configured.slice(0, -1) : configured;
}
