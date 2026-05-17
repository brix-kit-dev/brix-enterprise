/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 */

/**
 * Phase 3 / C-5 — Unit tests for {@code useTenantMembers} ViewModel hook.
 *
 * <p>Coverage targets:
 * <ul>
 *   <li>fetch on mount, scoped by tenantId</li>
 *   <li>refresh only when an event payload's tenantId matches</li>
 *   <li>inviteMember opens / closes dialog and emits MEMBER_INVITED</li>
 *   <li>removeMember emits MEMBER_REMOVED</li>
 *   <li>goBack navigates to the tenant detail page</li>
 * </ul>
 * </p>
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  TenantEvents,
  TenantMemberType,
  MemberStatus,
} from '@brix-sdk/tenant-shared';

import {
  createMockEventBus,
  createMockHttp,
  createMockNavigation,
  type MockEventBus,
  type MockNavigation,
} from '../../__tests__/test-utils';

vi.mock('@brix-sdk/runtime-sdk-react', () => ({
  useHttp: vi.fn(),
  useEventBus: vi.fn(),
  useNavigation: vi.fn(),
}));

vi.mock('../../repositories', () => ({
  createTenantAdminRepository: vi.fn(),
}));

import { useHttp, useEventBus, useNavigation } from '@brix-sdk/runtime-sdk-react';
import { createTenantAdminRepository } from '../../repositories';
import { useTenantMembers } from '../useTenantMembers';

const TENANT_ID = 't-77';

interface MockRepo {
  getMembers: ReturnType<typeof vi.fn>;
  inviteMember: ReturnType<typeof vi.fn>;
  removeMember: ReturnType<typeof vi.fn>;
  resendInvitation: ReturnType<typeof vi.fn>;
  updateMember: ReturnType<typeof vi.fn>;
}

let repo: MockRepo;
let bus: MockEventBus;
let nav: MockNavigation;

beforeEach(() => {
  vi.clearAllMocks();
  repo = {
    getMembers: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'm-1',
          tenantId: TENANT_ID,
          identityId: 'u-1',
          memberType: TenantMemberType.INDIVIDUAL,
          status: MemberStatus.ACTIVE,
          displayName: 'Bob',
          email: 'bob@acme.test',
          roles: ['ADMIN'],
          joinedAt: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
      totalPages: 1,
      page: 1,
      pageSize: 10,
    }),
    inviteMember: vi.fn().mockResolvedValue(undefined),
    removeMember: vi.fn().mockResolvedValue(undefined),
    resendInvitation: vi.fn().mockResolvedValue(undefined),
    updateMember: vi.fn().mockResolvedValue(undefined),
  };
  bus = createMockEventBus();
  nav = createMockNavigation();
  vi.mocked(useHttp).mockReturnValue(createMockHttp() as never);
  vi.mocked(useEventBus).mockReturnValue(bus as never);
  vi.mocked(useNavigation).mockReturnValue(nav as never);
  vi.mocked(createTenantAdminRepository).mockReturnValue(repo as never);
});

describe('useTenantMembers', () => {
  it('fetches the member list scoped to the supplied tenantId', async () => {
    const { result } = renderHook(() => useTenantMembers(TENANT_ID));
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    expect(repo.getMembers).toHaveBeenCalledWith(TENANT_ID, expect.any(Object));
    expect(result.current.state.members).toHaveLength(1);
  });

  it('refreshes when MEMBER_INVITED matches this tenantId', async () => {
    const { result } = renderHook(() => useTenantMembers(TENANT_ID));
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));
    expect(repo.getMembers).toHaveBeenCalledTimes(1);

    await act(async () => {
      bus._dispatch(TenantEvents.MEMBER_INVITED, {
        payload: { tenantId: TENANT_ID, email: 'new@acme.test' },
      });
    });

    await waitFor(() => expect(repo.getMembers).toHaveBeenCalledTimes(2));
  });

  it('ignores events targeting a different tenantId', async () => {
    const { result } = renderHook(() => useTenantMembers(TENANT_ID));
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    await act(async () => {
      bus._dispatch(TenantEvents.MEMBER_INVITED, {
        payload: { tenantId: 'other-tenant', email: 'x@y.test' },
      });
    });

    // No additional call beyond the initial mount fetch.
    expect(repo.getMembers).toHaveBeenCalledTimes(1);
  });

  it('toggles the invite dialog state', async () => {
    const { result } = renderHook(() => useTenantMembers(TENANT_ID));
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    act(() => result.current.actions.openInviteDialog());
    expect(result.current.state.isInviteDialogOpen).toBe(true);

    act(() => result.current.actions.closeInviteDialog());
    expect(result.current.state.isInviteDialogOpen).toBe(false);
  });

  it('inviteMember calls the repository, emits the event, and closes the dialog', async () => {
    const { result } = renderHook(() => useTenantMembers(TENANT_ID));
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    act(() => result.current.actions.openInviteDialog());

    await act(async () => {
      await result.current.actions.inviteMember({
        email: 'new@acme.test',
        memberType: TenantMemberType.INDIVIDUAL,
        roles: ['MEMBER'],
      });
    });

    expect(repo.inviteMember).toHaveBeenCalledWith(
      TENANT_ID,
      expect.objectContaining({ email: 'new@acme.test' }),
    );
    expect(result.current.state.isInviteDialogOpen).toBe(false);
    const eventArgs = bus.emit.mock.calls.map((c) => JSON.stringify(c[0]));
    expect(eventArgs.some((s) => s.includes(TenantEvents.MEMBER_INVITED))).toBe(true);
  });

  it('removeMember emits MEMBER_REMOVED', async () => {
    const { result } = renderHook(() => useTenantMembers(TENANT_ID));
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    await act(async () => {
      await result.current.actions.removeMember('m-1');
    });

    expect(repo.removeMember).toHaveBeenCalledWith(TENANT_ID, 'm-1');
    const eventArgs = bus.emit.mock.calls.map((c) => JSON.stringify(c[0]));
    expect(eventArgs.some((s) => s.includes(TenantEvents.MEMBER_REMOVED))).toBe(true);
  });

  it('goBack navigates to the parent tenant detail', async () => {
    const { result } = renderHook(() => useTenantMembers(TENANT_ID));
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    act(() => result.current.actions.goBack());
    expect(nav.requestNavigate).toHaveBeenCalledWith(`/admin/tenants/${TENANT_ID}`);
  });
});
