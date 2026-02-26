/**
 * @file Main entry point
 * @description Host Standalone Web application entry
 * @module host-standalone-web/main
 * @version 3.0.0
 *
 * Architecture: Uses async bootstrap pattern for Module Federation initialization.
 */

// Async load bootstrap module
import('./bootstrap').then(({ bootstrap }) => {
  bootstrap();
}).catch((error) => {
  console.error('[Host] Startup failed:', error);

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