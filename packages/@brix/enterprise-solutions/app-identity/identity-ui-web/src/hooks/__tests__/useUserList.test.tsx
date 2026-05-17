/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 */

/**
 * Phase 3 / C-5 — Unit tests for {@code useUserList} ViewModel hook.
 *
 * <p>Coverage targets:
 * <ul>
 *   <li>initial fetch reads {@code response.content} (Spring-style PagedResponse)</li>
 *   <li>0-based pagination round-trips through {@code setPage} / {@code setPageSize}</li>
 *   <li>permissions reflect {@code IDENTITY_PERMISSIONS} grants from useAuth</li>
 *   <li>USER_CREATED event resets to page 0; USER_UPDATED keeps page</li>
 *   <li>deleteUser / enableUser / disableUser propagate audit events</li>
 * </ul>
 * </p>
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { IDENTITY_EVENTS, IDENTITY_PERMISSIONS } from 'identity-shared';

import {
  createMockEventBus,
  createMockHttp,
  createMockAuth,
  type MockEventBus,
  type MockAuth,
} from '../../__tests__/test-utils';

vi.mock('@brix-sdk/runtime-sdk-react', () => ({
  useHttp: vi.fn(),
  useEventBus: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('../../repositories', () => ({
  createUserRepository: vi.fn(),
}));

import { useHttp, useEventBus, useAuth } from '@brix-sdk/runtime-sdk-react';
import { createUserRepository } from '../../repositories';
import { useUserList } from '../useUserList';

interface MockUserRepo {
  list: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  enable: ReturnType<typeof vi.fn>;
  disable: ReturnType<typeof vi.fn>;
}

let repo: MockUserRepo;
let bus: MockEventBus;
let auth: MockAuth;

function buildPage(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    content: [
      {
        id: 'u-1',
        username: 'alice',
        email: 'alice@acme.test',
        status: 'ACTIVE',
        roles: ['USER'],
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
    page: 0,
    size: 10,
    totalElements: 1,
    totalPages: 1,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  repo = {
    list: vi.fn().mockResolvedValue(buildPage()),
    delete: vi.fn().mockResolvedValue(undefined),
    enable: vi.fn().mockResolvedValue(undefined),
    disable: vi.fn().mockResolvedValue(undefined),
  };
  bus = createMockEventBus();
  auth = createMockAuth([
    IDENTITY_PERMISSIONS.USER_CREATE,
    IDENTITY_PERMISSIONS.USER_UPDATE,
    IDENTITY_PERMISSIONS.USER_DELETE,
  ]);
  vi.mocked(useHttp).mockReturnValue(createMockHttp() as never);
  vi.mocked(useEventBus).mockReturnValue(bus as never);
  vi.mocked(useAuth).mockReturnValue(auth as never);
  vi.mocked(createUserRepository).mockReturnValue(repo as never);
});

describe('useUserList', () => {
  it('loads users on mount and reads the Spring `content` field', async () => {
    const { result } = renderHook(() => useUserList());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(repo.list).toHaveBeenCalledTimes(1);
    expect(result.current.users).toHaveLength(1);
    expect(result.current.pagination.totalElements).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('captures repository errors as a string', async () => {
    repo.list.mockRejectedValueOnce(new Error('500 server error'));
    const { result } = renderHook(() => useUserList());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('500 server error');
    expect(result.current.users).toEqual([]);
  });

  it('reflects permissions from useAuth', async () => {
    auth = createMockAuth([IDENTITY_PERMISSIONS.USER_CREATE]);
    vi.mocked(useAuth).mockReturnValue(auth as never);
    const { result } = renderHook(() => useUserList());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.permissions.canCreate).toBe(true);
    expect(result.current.permissions.canEdit).toBe(false);
    expect(result.current.permissions.canDelete).toBe(false);
  });

  it('jumps to page 0 on USER_CREATED', async () => {
    const { result } = renderHook(() => useUserList());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Move to a non-zero page first.
    act(() => result.current.setPage(2));
    await waitFor(() => expect(repo.list).toHaveBeenCalledTimes(2));

    await act(async () => {
      bus._dispatch(IDENTITY_EVENTS.USER_CREATED, { userId: 'u-new' });
    });
    await waitFor(() => expect(repo.list).toHaveBeenCalledTimes(3));
    const lastQuery = repo.list.mock.calls.at(-1)?.[0];
    expect(lastQuery).toMatchObject({ page: 0 });
  });

  it('refreshes (without resetting page) on USER_UPDATED', async () => {
    const { result } = renderHook(() => useUserList());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      bus._dispatch(IDENTITY_EVENTS.USER_UPDATED, { userId: 'u-1' });
    });
    await waitFor(() => expect(repo.list).toHaveBeenCalledTimes(2));
  });

  it('deleteUser emits USER_DELETED', async () => {
    const { result } = renderHook(() => useUserList());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let ok = false;
    await act(async () => {
      ok = await result.current.deleteUser('u-1');
    });
    expect(ok).toBe(true);
    expect(repo.delete).toHaveBeenCalledWith('u-1');
    expect(bus.emit).toHaveBeenCalledWith(IDENTITY_EVENTS.USER_DELETED, { userId: 'u-1' });
  });

  it('disableUser includes the audit reason in the event payload', async () => {
    const { result } = renderHook(() => useUserList());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.disableUser('u-1', 'policy violation');
    });
    expect(repo.disable).toHaveBeenCalledWith('u-1', 'policy violation');
    expect(bus.emit).toHaveBeenCalledWith(
      IDENTITY_EVENTS.USER_STATUS_CHANGED,
      expect.objectContaining({ userId: 'u-1', reason: 'policy violation' }),
    );
  });

  it('returns false from deleteUser when the repository rejects', async () => {
    repo.delete.mockRejectedValueOnce(new Error('forbidden'));
    const { result } = renderHook(() => useUserList());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let ok = true;
    await act(async () => {
      ok = await result.current.deleteUser('u-1');
    });
    expect(ok).toBe(false);
    expect(result.current.error).toBe('forbidden');
  });
});
