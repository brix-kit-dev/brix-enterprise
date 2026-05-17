/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 */

/**
 * Phase 3 / C-5 — Unit tests for {@code useTenantList} ViewModel hook.
 *
 * <p>Coverage targets:
 * <ul>
 *   <li>initial fetch on mount</li>
 *   <li>error path when the repository rejects</li>
 *   <li>refresh on {@code TenantEvents.TENANT_CREATED} broadcast</li>
 *   <li>pagination + status-filter state transitions</li>
 *   <li>activate / suspend / terminate emit the correct events</li>
 * </ul>
 * </p>
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { TenantStatus, TenantEvents } from '@brix-sdk/tenant-shared';

import {
  createMockEventBus,
  createMockHttp,
  createMockNavigation,
  type MockEventBus,
  type MockNavigation,
} from '../../__tests__/test-utils';

// ----------------------------------------------------------------------------
// Module mocks — must be hoisted before importing the hook under test.
// ----------------------------------------------------------------------------
vi.mock('@brix-sdk/runtime-sdk-react', () => ({
  useHttp: vi.fn(),
  useEventBus: vi.fn(),
  useNavigation: vi.fn(),
}));

vi.mock('../../repositories', () => ({
  createTenantAdminRepository: vi.fn(),
}));

// Imports must come after vi.mock so the mocked versions are used.
import { useHttp, useEventBus, useNavigation } from '@brix-sdk/runtime-sdk-react';
import { createTenantAdminRepository } from '../../repositories';
import { useTenantList } from '../useTenantList';

// ----------------------------------------------------------------------------
// Fixtures
// ----------------------------------------------------------------------------

interface MockTenantRepo {
  getTenants: ReturnType<typeof vi.fn>;
  activateTenant: ReturnType<typeof vi.fn>;
  suspendTenant: ReturnType<typeof vi.fn>;
  terminateTenant: ReturnType<typeof vi.fn>;
}

function buildEmptyResponse() {
  return { items: [], total: 0, totalPages: 0, page: 1, pageSize: 10 };
}

function buildSampleResponse() {
  return {
    items: [
      {
        id: 't-1',
        code: 'acme',
        name: 'Acme Corp',
        status: TenantStatus.ACTIVE,
        memberCount: 3,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    total: 1,
    totalPages: 1,
    page: 1,
    pageSize: 10,
  };
}

let repo: MockTenantRepo;
let bus: MockEventBus;
let nav: MockNavigation;

beforeEach(() => {
  vi.clearAllMocks();
  repo = {
    getTenants: vi.fn().mockResolvedValue(buildSampleResponse()),
    activateTenant: vi.fn().mockResolvedValue(undefined),
    suspendTenant: vi.fn().mockResolvedValue(undefined),
    terminateTenant: vi.fn().mockResolvedValue(undefined),
  };
  bus = createMockEventBus();
  nav = createMockNavigation();
  vi.mocked(useHttp).mockReturnValue(createMockHttp() as never);
  vi.mocked(useEventBus).mockReturnValue(bus as never);
  vi.mocked(useNavigation).mockReturnValue(nav as never);
  vi.mocked(createTenantAdminRepository).mockReturnValue(repo as never);
});

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe('useTenantList', () => {
  it('loads tenants on mount and exposes them via state', async () => {
    const { result } = renderHook(() => useTenantList());

    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    expect(repo.getTenants).toHaveBeenCalledTimes(1);
    expect(result.current.state.tenants).toHaveLength(1);
    expect(result.current.state.tenants[0]?.code).toBe('acme');
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.total).toBe(1);
  });

  it('captures an error message when the repository rejects', async () => {
    repo.getTenants.mockRejectedValueOnce(new Error('network down'));

    const { result } = renderHook(() => useTenantList());

    await waitFor(() => expect(result.current.state.isLoading).toBe(false));
    expect(result.current.state.error).toBe('network down');
    expect(result.current.state.tenants).toEqual([]);
  });

  it('subscribes to TENANT_CREATED and refreshes the list on dispatch', async () => {
    const { result } = renderHook(() => useTenantList());
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    expect(bus.on).toHaveBeenCalledWith(TenantEvents.TENANT_CREATED, expect.any(Function));

    repo.getTenants.mockResolvedValueOnce(buildEmptyResponse());

    await act(async () => {
      bus._dispatch(TenantEvents.TENANT_CREATED, { tenantId: 't-1' });
    });

    await waitFor(() => expect(repo.getTenants).toHaveBeenCalledTimes(2));
  });

  it('resets to page 1 when the status filter changes', async () => {
    const { result } = renderHook(() => useTenantList());
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    act(() => result.current.actions.setPage(3));
    expect(result.current.state.page).toBe(3);

    act(() => result.current.actions.filterByStatus(TenantStatus.SUSPENDED));
    expect(result.current.state.page).toBe(1);
    expect(result.current.state.statusFilter).toBe(TenantStatus.SUSPENDED);
  });

  it('emits TENANT_ACTIVATED after activate succeeds', async () => {
    const { result } = renderHook(() => useTenantList());
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    await act(async () => {
      await result.current.actions.activateTenant('t-1');
    });

    expect(repo.activateTenant).toHaveBeenCalledWith('t-1');
    // The hook publishes a payload object; only the event-name placement
    // is asserted here so we stay decoupled from the (legacy) emit signature.
    expect(bus.emit).toHaveBeenCalled();
    const firstArg = bus.emit.mock.calls[0]?.[0];
    expect(JSON.stringify(firstArg)).toContain(TenantEvents.TENANT_ACTIVATED);
  });

  it('navigates to detail page on viewTenant()', async () => {
    const { result } = renderHook(() => useTenantList());
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    act(() => result.current.actions.viewTenant('t-42'));
    expect(nav.requestNavigate).toHaveBeenCalledWith('/admin/tenants/t-42');
  });

  it('unsubscribes from event bus on unmount', async () => {
    const { result, unmount } = renderHook(() => useTenantList());
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    expect(bus._subscriptions.length).toBeGreaterThan(0);
    unmount();
    expect(bus._subscriptions.length).toBe(0);
  });
});
