/**
 * @file Async bootstrap module
 * @description Module Federation compatible async startup with UI Adapter integration
 * @module host-standalone-web/bootstrap
 * @version 3.2.0
 *
 * [v3.2.0 Changes]
 * - Added WebUIRuntime initialization
 * - Registered UIAdapter capability for UI library abstraction
 * - Wrapped App with RuntimeContextProvider for useUI() hook support
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RuntimeContextProvider } from '@brix/runtime-sdk-react';
import { createWebUIRuntime } from '@brix/runtime-orchestrator-web';
import { UICapabilityType } from '@brix/runtime-sdk-api-web';
import { App } from './App';
import { uiAdapter } from './config/ui.config';

/**
 * Bootstrap the application with Runtime Context
 */
export function bootstrap(): void {
  const container = document.getElementById('root');

  if (!container) {
    throw new Error('[Host] Cannot find #root element');
  }

  // Create WebUIRuntime
  const runtime = createWebUIRuntime({
    appName: 'Shinwa Platform',
    appVersion: '3.2.0',
    debug: import.meta.env.DEV,
  });

  // Register UI Adapter capability
  runtime.registerCapability(UICapabilityType, { provide: () => uiAdapter });

  const root = createRoot(container);

  root.render(
    <StrictMode>
      <RuntimeContextProvider value={runtime}>
        <App />
      </RuntimeContextProvider>
    </StrictMode>
  );
}