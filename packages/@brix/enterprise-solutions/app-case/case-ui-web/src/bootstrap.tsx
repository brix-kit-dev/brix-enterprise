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
 * @file Case Module UI Entry Point
 * @description Application bootstrap with Host-injected RuntimeContext.
 *              Module Federation requires async loading to handle shared dependencies.
 * @module @brix-sdk/enterprise-case-ui-web/bootstrap
 * @version 3.2.0
 *
 * [Architectural Note - v3.0.8 Blueprint]
 * This entry point supports two modes:
 * 1. Host Shell: RuntimeContext is injected before plugin bootstrap
 * 2. DevTools: RuntimeContext is injected through the same contract
 *
 * [BrixUI Migration - Phase 4]
 * - Uses RuntimeContextProvider to supply context for useUI() hooks
 * - Host Shell provides all capabilities
 *
 * @author Brix Platform Team
 * @date 2026-03-18
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { RuntimeContextProvider } from '@brix-sdk/runtime-sdk-react';
import { resolveInjectedRuntimeContext } from './dev/standaloneContext';
import App from './App';

/**
 * Bootstrap the Case UI application.
 *
 * Creates React root and renders App wrapped in RuntimeContextProvider.
 * Host Shell or DevTools must inject RuntimeContext before this function runs.
 */
function bootstrap(): void {
  const container = document.getElementById('root');
  if (!container) {
    return;
  }

  const root = createRoot(container);
  const runtimeContext = resolveInjectedRuntimeContext();

  root.render(
    <React.StrictMode>
      <RuntimeContextProvider value={runtimeContext}>
        <App />
      </RuntimeContextProvider>
    </React.StrictMode>
  );
}

// Execute bootstrap
bootstrap();
