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
import type { BffSessionAuthState } from '@brix-sdk/platform-auth-web/BffSessionAuthState';
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
  /**
   * Session of a console that runs behind the BFF (root BRX-RS-SECURITY-012). When set, the
   * Auth capability reads that session and API requests carry its CSRF token instead of a
   * bearer token; the browser holds no token (frontend BRX-FE-AUTH-002/003).
   */
  readonly bffSession?: BffSessionAuthState;
}

interface BrowserAuthStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface StoredAuthSession {
  readonly version: 1;
  readonly token: string;
  readonly refreshToken?: string;
  readonly contextKind: AuthSessionInstallCredentials['contextKind'];
  readonly subjectId: string;
  readonly actorId?: string;
  readonly tenantId?: string;
  readonly memberId?: string;
  readonly principalId?: string;
  readonly username?: string;
  readonly email?: string;
  readonly displayName?: string;
  readonly primaryRole?: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly expiresAt?: string;
}

const AUTH_SESSION_STORAGE_KEY = 'brix:standalone-web-runtime:auth-session:v1';

export function createStandaloneWebRuntimeCapabilityBindings(
  options: StandaloneWebRuntimeProfileOptions = {},
): readonly FrontendHostCapabilityBinding[] {
  const bffSession = options.bffSession;
  // Installed tokens remain only for the exempted legacy consoles (EX-2026-001/002).
  const auth = new AuthCapabilityImpl(bffSession ?? createStandaloneAuthState());
  const http = createHttpCapability({
    baseURL: normalizeApiBaseUrl(options.apiBaseUrl),
    ...(bffSession
      ? { csrfTokenProvider: () => bffSession.csrfToken() }
      : { authTokenProvider: () => auth.getToken() }),
    cache: {
      defaultTTL: 0,
    },
  });
  if (bffSession) {
    // Frontend BRX-FE-AUTH-003: an ended BFF session sends the browser through the identity
    // protocol surface and back to this page; pages and hooks never handle authentication.
    http.addResponseInterceptor({
      onResponse: response => response,
      onResponseError: error => {
        if ((error as { status?: number } | null)?.status === 401) {
          bffSession.redirectToLogin(window.location.pathname + window.location.search);
        }
        throw error;
      },
    });
  }
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
  const storage = getBrowserAuthStorage();
  const restoredSession = readStoredAuthSession(storage);
  let refreshToken: string | null = restoredSession?.refreshToken ?? null;
  let state: InternalAuthState = restoredSession
    ? internalStateFromSession(restoredSession)
    : {
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
      const storedSession = toStoredAuthSession(session, activeContext);
      persistStoredAuthSession(storage, storedSession);
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
      clearStoredAuthSession(storage);
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

function getBrowserAuthStorage(): BrowserAuthStorage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function readStoredAuthSession(storage: BrowserAuthStorage | null): StoredAuthSession | null {
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  const parsed = parseStoredAuthSession(raw);
  if (!parsed || isExpired(parsed.expiresAt)) {
    storage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return null;
  }
  return parsed;
}

function parseStoredAuthSession(raw: string): StoredAuthSession | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Partial<StoredAuthSession>;
  const contextKind = record.contextKind;
  const token = readText(record.token);
  const subjectId = readText(record.subjectId);
  if (
    record.version !== 1
    || !token
    || !subjectId
    || (contextKind !== 'platform' && contextKind !== 'actor' && contextKind !== 'subject')
  ) {
    return null;
  }
  if ((contextKind === 'actor' || contextKind === 'subject') && !readText(record.tenantId)) {
    return null;
  }
  return {
    version: 1,
    token,
    refreshToken: readText(record.refreshToken),
    contextKind,
    subjectId,
    actorId: readText(record.actorId),
    tenantId: readText(record.tenantId),
    memberId: readText(record.memberId),
    principalId: readText(record.principalId),
    username: readText(record.username),
    email: readText(record.email),
    displayName: readText(record.displayName),
    primaryRole: readText(record.primaryRole),
    roles: readStringArray(record.roles),
    permissions: readStringArray(record.permissions),
    expiresAt: readText(record.expiresAt),
  };
}

function persistStoredAuthSession(
  storage: BrowserAuthStorage | null,
  session: StoredAuthSession,
): void {
  if (!storage) {
    return;
  }
  storage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearStoredAuthSession(storage: BrowserAuthStorage | null): void {
  if (!storage) {
    return;
  }
  storage.removeItem(AUTH_SESSION_STORAGE_KEY);
}

function internalStateFromSession(session: StoredAuthSession): InternalAuthState {
  const credentials = storedSessionToCredentials(session);
  const activeContext = toVerifiedContext(credentials);
  return {
    user: toUser(credentials),
    token: session.token,
    tenant: null,
    featureFlags: {},
    dataScopes: [],
    loading: false,
    activeContext,
    sessionState: 'authenticated',
  };
}

function storedSessionToCredentials(session: StoredAuthSession): AuthSessionInstallCredentials {
  return {
    provider: AuthSessionInstallProvider,
    token: session.token,
    refreshToken: session.refreshToken,
    contextKind: session.contextKind,
    subjectId: session.subjectId,
    actorId: session.actorId,
    tenantId: session.tenantId,
    memberId: session.memberId,
    principalId: session.principalId,
    username: session.username,
    email: session.email,
    displayName: session.displayName,
    primaryRole: session.primaryRole,
    roles: [...session.roles],
    permissions: [...session.permissions],
    expiresAt: session.expiresAt,
  };
}

function toStoredAuthSession(
  session: AuthSessionInstallCredentials,
  activeContext: VerifiedAuthContext,
): StoredAuthSession {
  return {
    version: 1,
    token: session.token,
    refreshToken: session.refreshToken,
    contextKind: session.contextKind,
    subjectId: session.subjectId,
    actorId: session.actorId,
    tenantId: session.tenantId,
    memberId: session.memberId,
    principalId: session.principalId,
    username: session.username,
    email: session.email,
    displayName: session.displayName,
    primaryRole: session.primaryRole,
    roles: [...(session.roles ?? [])],
    permissions: [...(session.permissions ?? [])],
    expiresAt: activeContext.expiresAt,
  };
}

function isExpired(expiresAt: string | undefined): boolean {
  if (!expiresAt) {
    return false;
  }
  const timestamp = Date.parse(expiresAt);
  return Number.isFinite(timestamp) && timestamp <= Date.now();
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
