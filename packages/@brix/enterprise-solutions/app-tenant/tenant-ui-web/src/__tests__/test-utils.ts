/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 */

/**
 * Phase 3 / C-5 — Shared test utilities for tenant-ui-web ViewModel hooks.
 *
 * <p>These factories produce vitest-friendly stand-ins for the four
 * runtime capabilities that tenant hooks consume:
 * <ul>
 *   <li><b>HttpCapability</b> — never invoked directly in tests because
 *       the {@code TenantAdminRepository} is mocked at the module level.
 *       A no-op stub is provided to satisfy {@code useMemo} dependencies.</li>
 *   <li><b>EventBusCapability</b> — emits and subscriptions are spied;
 *       {@code on()} returns a real unsubscribe function so the cleanup
 *       effect in production code can run without TypeError.</li>
 *   <li><b>NavigationCapability</b> — both {@code requestNavigate} (used
 *       by tenant hooks) and {@code navigate} (used by identity hooks)
 *       are stubbed to keep the helper reusable across plugins.</li>
 *   <li><b>AuthCapability</b> — only required by hooks that perform
 *       permission-gated actions. Tests opt in via {@link createMockAuth}.</li>
 * </ul>
 * </p>
 *
 * <p>Architecture red-line compliance:
 * <ul>
 *   <li>R1 — never imports any concrete UI library (no MUI / antd).</li>
 *   <li>R3 — no real HTTP traffic, never touches {@code window.fetch} or
 *       {@code localStorage}.</li>
 *   <li>R8 — every event name and capability symbol is sourced from a
 *       constant; nothing is hard-coded inside production source paths.</li>
 * </ul>
 * </p>
 */
import { vi, type MockInstance } from 'vitest';

// ============================================================================
// EventBus
// ============================================================================

/**
 * Test double for {@code EventBusCapability}.
 *
 * <p>{@link MockEventBus#_dispatch} synchronously invokes every handler
 * subscribed via {@link MockEventBus#on} for the supplied event type.
 * Use it to simulate cross-plugin events such as
 * {@code TenantEvents.TENANT_CREATED}.</p>
 */
export interface MockEventBus {
  emit: MockInstance;
  on: MockInstance;
  off: MockInstance;
  once: MockInstance;
  /** Test-only helper: synchronously fire a registered handler. */
  _dispatch: (eventType: string, payload?: unknown) => void;
  /** Live subscription registry (handler may be inspected by assertions). */
  _subscriptions: Array<{ type: string; handler: (payload: unknown) => void }>;
}

/**
 * Build a fresh EventBus mock. Each invocation returns an isolated
 * subscription registry so tests stay independent.
 */
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
      // Snapshot to a separate array so a handler that unsubscribes
      // mid-dispatch does not affect this iteration.
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

/**
 * Build an AuthCapability mock.
 *
 * @param permissions list of permission codes the test user holds.
 *                    Pass {@code ['*']} to grant every permission.
 */
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

// ============================================================================
// Async helpers
// ============================================================================

/**
 * Resolve on the next microtask. Useful for flushing chained promises
 * inside React effects without depending on
 * {@code @testing-library/react#waitFor} timeouts.
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
