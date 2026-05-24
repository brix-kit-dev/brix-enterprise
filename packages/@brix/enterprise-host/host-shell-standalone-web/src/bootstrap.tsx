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
 * @file Async bootstrap module — lean orchestrator
 * @description Creates WebUIRuntime, registers all capabilities via modular
 *              registration functions, and renders the React tree.
 * @module host-standalone-web/bootstrap
 * @version 3.4.0
 *
 * [v3.4.0 Changes - Bootstrap Modularisation (Phase 2.9)]
 * - Capability implementations extracted to capabilities/* modules
 * - MF initialisation extracted to mf-init.ts
 * - bootstrap() is now a thin orchestrator (~70 LOC)
 *
 * [v3.3.0 Changes - Shared Runtime Integration]
 * - Added injectGlobals() for legacy code compatibility
 * - All React runtime obtained via @brix-sdk/shared-runtime-web
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RuntimeContextProvider } from '@brix-sdk/runtime-sdk-react';
import { createWebUIRuntime } from '@brix-sdk/runtime-orchestrator-web';
import { UICapabilityType } from '@brix-sdk/runtime-sdk-api-web';
import { PLATFORM_ADMIN_ROUTES } from '@brix-sdk/platform-admin-web';
import type { RuntimeContext } from '@brix-sdk/runtime-sdk-api-web';
import { App } from './App';
import { uiAdapter } from './config/host.config';
import { governanceConfig } from './config/governance.config';
import { initGlobals, initializeSharedScope } from './mf-init';
import { HttpErrorToaster } from '@brix-sdk/platform-frame-web';
import {
  registerAuth,
  registerTenant,
  registerViewMode,
  registerHttp,
  registerEventBus,
  registerNavigation,
  registerPluginLoader,
  registerConfigStore,
  registerI18n,
  registerTheme,
} from './capabilities';

const BRIX_RUNTIME_CONTEXT_GLOBAL = '__BRIX_RUNTIME_CONTEXT__';

declare global {
  interface Window {
    [BRIX_RUNTIME_CONTEXT_GLOBAL]?: RuntimeContext;
  }
}

// Inject React globals before any render (v3.0.7 Layer 2B)
initGlobals();

/**
 * Bootstrap the application with Runtime Context.
 */
export async function bootstrap(): Promise<void> {
  await initializeSharedScope();

  const container = document.getElementById('root');
  if (!container) {
    throw new Error('[Host] Cannot find #root element');
  }

  // Create WebUIRuntime
  const runtime = createWebUIRuntime({
    appName: 'Brix Platform',
    appVersion: '3.4.0',
    debug: import.meta.env.DEV,
  });

  // Register capabilities in dependency order
  runtime.registerCapability(UICapabilityType, { provide: () => uiAdapter });

  const { authService } = registerAuth(runtime);

  const tenantCapability = registerTenant(runtime, () => authService.getToken());

  // EventBus must be registered before HTTP so the latter can publish
  // `system.http.error` events for the centralised toaster (Stability v1.0 C-2).
  const eventBusCapability = registerEventBus(runtime, governanceConfig);

  const httpCapability = registerHttp(runtime, {
    authTokenProvider: () => authService.getToken(),
    tenantCapability,
    refreshToken: () => authService.refreshToken(),
    onAuthExpired: () => {
      authService.logout();
      window.location.href = window.location.pathname.startsWith('/platform')
        ? PLATFORM_ADMIN_ROUTES.LOGIN
        : '/login';
    },
    eventBus: eventBusCapability,
  });

  // Phase 2 / C-4 — ViewMode capability depends on auth storage and uses the
  // canonical HttpCapability for switch requests, keeping Host inside the
  // governed runtime capability boundary.
  registerViewMode(runtime, () => authService.getToken(), httpCapability);

  registerNavigation(runtime);
  registerPluginLoader(runtime);
  registerConfigStore(runtime, httpCapability);
  registerI18n(runtime);
  registerTheme(runtime);

  const runtimeContext: RuntimeContext = {
    moduleId: 'host',
    tenantId: tenantCapability.getCurrentTenantId() ?? 'host',
    getCapability: <T,>(capabilityType: symbol) => runtime.getCapability<T>(capabilityType),
  };

  window[BRIX_RUNTIME_CONTEXT_GLOBAL] = runtimeContext;

  // Render — ThemeProvider from UIAdapter wraps the tree so all
  // MUI (or other adapter) components receive proper CSS-in-JS context.
  const { ThemeProvider } = uiAdapter;
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <RuntimeContextProvider value={runtimeContext}>
        <ThemeProvider theme="light">
          <HttpErrorToaster />
          <App />
        </ThemeProvider>
      </RuntimeContextProvider>
    </StrictMode>
  );
}