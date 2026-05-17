/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 */

/**
 * Phase 3 / C-5 — Shared test utilities for identity-ui-web ViewModel hooks.
 *
 * <p>Mirror of {@code app-tenant/tenant-ui-web/src/__tests__/test-utils.ts}.
 * Each plugin keeps a local copy because there is no cross-plugin shared
 * test-utility package today; duplication is preferred over reaching across
 * plugin boundaries (R8 — module isolation).</p>
 */
import { vi, type MockInstance } from 'vitest';

// ============================================================================
// EventBus
// ============================================================================

export interface MockEventBus {
  emit: MockInstance;
  on: MockInstance;
  off: MockInstance;
  once: MockInstance;
  _dispatch: (eventType: string, payload?: unknown) => void;
  _subscriptions: Array<{ type: string; handler: (payload: unknown) => void }>;
}

export function createMockEventBus(): MockEventBus {
  const subs: Array<{ type: string; handler: (payload: unknown) => void }> = [];

  const on = vi.fn((type: string, handler: (payload: unknown) => void) => {
    subs.push({ type, handler });
    return () => {
      const idx = subs.findIndex(
        (s) => s.type === type && s.handler === handler,
      );
      if (idx >= 0) subs.splice(idx, 1);
    };
  });

  return {
    emit: vi.fn(),
    on: on as unknown as MockInstance,
    off: vi.fn(),
    once: vi.fn(),
    _subscriptions: subs,
    _dispatch: (eventType, payload) => {
      const targets = subs.filter((s) => s.type === eventType).slice();
      for (const sub of targets) sub.handler(payload);
    },
  };
}

// ============================================================================
// Navigation
// ============================================================================

export interface MockNavigation {
  navigate: MockInstance;
  requestNavigate: MockInstance;
  goBack: MockInstance;
}

export function createMockNavigation(): MockNavigation {
  return {
    navigate: vi.fn(),
    requestNavigate: vi.fn(),
    goBack: vi.fn(),
  };
}

// ============================================================================
// Http
// ============================================================================

export interface MockHttp {
  get: MockInstance;
  post: MockInstance;
  put: MockInstance;
  delete: MockInstance;
  patch: MockInstance;
  request: MockInstance;
}

export function createMockHttp(): MockHttp {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    request: vi.fn(),
  };
}

// ============================================================================
// Auth
// ============================================================================

export interface MockAuth {
  user: { id: string; name: string };
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: MockInstance;
  hasRole: MockInstance;
  login: MockInstance;
  logout: MockInstance;
}

export function createMockAuth(permissions: readonly string[] = []): MockAuth {
  return {
    user: { id: 'test-user', name: 'Test User' },
    isAuthenticated: true,
    isLoading: false,
    hasPermission: vi.fn(
      (code: string) => permissions.includes('*') || permissions.includes(code),
    ),
    hasRole: vi.fn(() => true),
    login: vi.fn(),
    logout: vi.fn(),
  };
}
