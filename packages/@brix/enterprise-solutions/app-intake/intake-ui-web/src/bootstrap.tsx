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
 * @file Bootstrap Entry Point
 * @description Application bootstrap for standalone and module federation scenarios
 * @module @brix-sdk/enterprise-intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This is the entry point for the intake UI module.
 * Supports both standalone execution and Module Federation remote.
 *
 * @author Brix Team
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
