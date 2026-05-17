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
 * @file Main entry point
 * @description Host Standalone Web application entry
 * @module host-standalone-web/main
 * @version 3.0.0
 *
 * Architecture: Uses async bootstrap pattern for Module Federation initialization.
 */

async function initializeDefaultShareScope(): Promise<void> {
  if (typeof __webpack_init_sharing__ === 'function') {
    await __webpack_init_sharing__('default');
  }
}

// Initialize MF shared scope before loading bootstrap. The bootstrap chunk
// imports React and other shared modules; loading it before share-scope setup
// can fail with "factory is undefined" on a cold browser cache.
initializeDefaultShareScope().then(() => import('./bootstrap')).then(({ bootstrap }) => {
  bootstrap();
}).catch((error) => {

  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center;">
        <h1 style="color: #dc2626; margin-bottom: 16px;">Application startup failed</h1>
        <p style="color: #666; margin-bottom: 24px;">Please refresh the page. If the problem persists, contact technical support.</p>
        <button onclick="location.reload()" style="padding: 12px 24px; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
          Refresh
        </button>
        <pre style="margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px; text-align: left; max-width: 600px; overflow: auto; font-size: 12px;">
${error?.stack || error?.message || error}
        </pre>
      </div>
    `;
  }
});