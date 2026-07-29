/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 */
/**
 * @file Module Federation Initialization
 * @description Global injection and MF shared scope setup.
 *              Must be called BEFORE any render or remote loading.
 * @module host-standalone-web/mf-init
 * @version 3.3.0
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { injectGlobals } from '@brix-sdk/shared-runtime-web';

declare const __webpack_init_sharing__: ((scope: string) => Promise<void>) | undefined;
declare const __webpack_share_scopes__: Record<string, Record<string, unknown>> | undefined;

/**
 * Inject React globals for legacy code compatibility and Module Federation.
 */
export function initGlobals(): void {
  injectGlobals();
  (window as unknown as { React: typeof React; ReactDOM: typeof ReactDOM }).React = React;
  (window as unknown as { React: typeof React; ReactDOM: typeof ReactDOM }).ReactDOM = ReactDOM;
}

/**
 * Initialize Module Federation shared scope.
 */
export async function initializeSharedScope(): Promise<void> {
  if (typeof __webpack_init_sharing__ === 'function') {
    await __webpack_init_sharing__('default');
  }
}
