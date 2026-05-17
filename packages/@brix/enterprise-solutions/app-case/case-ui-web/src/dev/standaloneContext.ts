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
 * @file Runtime Context Injection Boundary
 * @description Resolves the RuntimeContext provided by Host Shell or DevTools.
 * @module @brix-sdk/enterprise-case-ui-web/dev/standaloneContext
 * @version 3.2.0
 *
 * [Architectural Note - v3.0.8 Blueprint]
 * In Module Federation architecture:
 * - Production: Host Shell creates RuntimeContext and provides via RuntimeContextProvider
 * - Development: DevTools must inject the same contract into the window runtime slot
 *
 * [Design Constraints]
 * - No local UI adapter registration inside plugin code
 * - No local HTTP or navigation mocks inside plugin code
 * - Missing injection fails fast so architecture drift is visible immediately
 *
 * @author Brix Platform Team
 * @date 2026-03-18
 */

import type { RuntimeContext } from '@brix-sdk/runtime-sdk-api-web';

// ============================================================================
// Runtime Injection Contract
// ============================================================================

export const BRIX_RUNTIME_CONTEXT_GLOBAL = '__BRIX_RUNTIME_CONTEXT__';

declare global {
  interface Window {
    [BRIX_RUNTIME_CONTEXT_GLOBAL]?: RuntimeContext;
  }
}

// ============================================================================
// Runtime Resolution
// ============================================================================

/**
 * Resolves the RuntimeContext injected by Host Shell or DevTools.
 *
 * @returns injected RuntimeContext
 * @throws Error when no RuntimeContext has been injected
 */
export function resolveInjectedRuntimeContext(): RuntimeContext {
  if (typeof window === 'undefined') {
    throw new Error('[case-ui] RuntimeContext injection requires a browser Host environment.');
  }

  const runtimeContext = window[BRIX_RUNTIME_CONTEXT_GLOBAL];
  if (!runtimeContext) {
    throw new Error(
      '[case-ui] RuntimeContext was not injected. Start Case UI through Host Shell or DevTools.'
    );
  }

  return runtimeContext;
}

/**
 * Injects a RuntimeContext for devtools-controlled standalone sessions.
 *
 * @param runtimeContext the Host-compatible RuntimeContext
 */
export function injectRuntimeContext(runtimeContext: RuntimeContext): void {
  if (typeof window === 'undefined') {
    throw new Error('[case-ui] RuntimeContext injection requires a browser Host environment.');
  }

  window[BRIX_RUNTIME_CONTEXT_GLOBAL] = runtimeContext;
}
