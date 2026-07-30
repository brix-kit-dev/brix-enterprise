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
  type InternalAuthState,
  type RouterServiceLike,
  type Unsubscribe,
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

function createStandaloneAuthState(): {
  getAuthState: () => InternalAuthState;
  subscribeAuthChange: (handler: AuthChangeHandler) => Unsubscribe;
} {
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
  return {
    getAuthState: () => state,
    subscribeAuthChange: (handler) => {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
  };
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
