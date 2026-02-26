/**
 * @file Bootstrap Entry Point
 * @description Application bootstrap for standalone and module federation scenarios
 * @module @shinwa/intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This is the entry point for the intake UI module.
 * Supports both standalone execution and Module Federation remote.
 *
 * @author Shinwa Team
 * @date 2026-06-10
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/**
 * Mount the application to the DOM
 *
 * @param containerId - The ID of the container element
 */
const mount = (containerId: string = 'root'): void => {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`[intake-ui-web] Container element '${containerId}' not found`);
    return;
  }

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Auto-mount in standalone mode
if (process.env.NODE_ENV !== 'production' || document.getElementById('root')) {
  mount('root');
}

export { mount };
export default mount;
