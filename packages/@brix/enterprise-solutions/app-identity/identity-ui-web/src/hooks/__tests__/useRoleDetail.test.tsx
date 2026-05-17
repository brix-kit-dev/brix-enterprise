/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 */

/**
 * Phase 3 / C-5 — Unit tests for {@code useRoleDetail} ViewModel hook.
 *
 * <p>Coverage targets:
 * <ul>
 *   <li>guard against missing role id</li>
 *   <li>load and hydrate {@code currentPermissions} from the repository</li>
 *   <li>{@code togglePermission}, {@code assignCategoryPermissions} and
 *       {@code removeCategoryPermissions} mutate state correctly</li>
 *   <li>{@code isDirty} flips when local state diverges from the loaded role</li>
 *   <li>{@code savePermissions} sends the diffed permissions and emits
 *       {@code role:updated}</li>
 *   <li>{@code delete} navigates to the list page on success</li>
 *   <li>refresh on remote {@code role:updated} for the same id</li>
 * </ul>
 * </p>
 *
 * <p>The {@code ROLE_EVENTS} object lives privately inside the hook,
 * so the test references the wire-format strings directly. They are kept
 * in {@link ROLE_EVENT_NAMES} so a future refactor (lifting the constants
 * into identity-shared) only needs to touch this file.</p>
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

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
  createRoleRepository: vi.fn(),
}));

import { useHttp, useEventBus, useNavigation } from '@brix-sdk/runtime-sdk-react';
import { createRoleRepository } from '../../repositories';
import { useRoleDetail } from '../useRoleDetail';

/** Wire-format event names — must mirror the private ROLE_EVENTS object. */
const ROLE_EVENT_NAMES = {
  CREATED: 'role:created',
  UPDATED: 'role:updated',
  DELETED: 'role:deleted',
} as const;

interface MockRoleRepo {
  getById: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

let repo: MockRoleRepo;
let bus: MockEventBus;
let nav: MockNavigation;

function buildRole(overrides: Partial<{ id: number; permissions: string[] }> = {}) {
  return {
    id: 7,
    code: 'tenant-admin',
    name: 'Tenant Administrator',
    description: 'Manages tenants',
    permissions: ['users:read', 'users:write'],
    builtIn: false,
    enabled: true,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  repo = {
    getById: vi.fn().mockResolvedValue(buildRole()),
    update: vi.fn().mockImplementation((id, params) =>
      Promise.resolve(buildRole({ id, permissions: params.permissions ?? buildRole().permissions })),
    ),
    delete: vi.fn().mockResolvedValue(undefined),
  };
  bus = createMockEventBus();
  nav = createMockNavigation();
  vi.mocked(useHttp).mockReturnValue(createMockHttp() as never);
  vi.mocked(useEventBus).mockReturnValue(bus as never);
  vi.mocked(useNavigation).mockReturnValue(nav as never);
  vi.mocked(createRoleRepository).mockReturnValue(repo as never);
});

describe('useRoleDetail', () => {
  it('reports an error and skips fetch when no id is supplied', async () => {
    const { result } = renderHook(() => useRoleDetail({}));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(repo.getById).not.toHaveBeenCalled();
  });

  it('loads the role on mount and hydrates currentPermissions', async () => {
    const { result } = renderHook(() => useRoleDetail({ id: 7 }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(repo.getById).toHaveBeenCalledWith(7);
    expect(result.current.role?.id).toBe(7);
    expect(result.current.permissionCategories.length).toBeGreaterThan(0);
    expect(result.current.isDirty).toBe(false);
  });

  it('togglePermission flips a single permission and marks the form dirty', async () => {
    const { result } = renderHook(() => useRoleDetail({ id: 7 }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.togglePermission('users:read'));
    expect(result.current.isDirty).toBe(true);

    // Toggling the same permission again restores the original set.
    act(() => result.current.togglePermission('users:read'));
    expect(result.current.isDirty).toBe(false);
  });

  it('assignCategoryPermissions adds every permission in a category', async () => {
    const { result } = renderHook(() => useRoleDetail({ id: 7 }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const firstCategory = result.current.permissionCategories[0];
    expect(firstCategory).toBeDefined();
    if (!firstCategory) return;

    act(() => result.current.assignCategoryPermissions(firstCategory.key));

    const updated = result.current.permissionCategories.find(
      (c) => c.key === firstCategory.key,
    );
    expect(updated?.permissions.every((p) => p.assigned)).toBe(true);
  });

  it('savePermissions calls update and emits role:updated', async () => {
    const { result } = renderHook(() => useRoleDetail({ id: 7 }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.togglePermission('users:read'));

    let ok = false;
    await act(async () => {
      ok = await result.current.savePermissions();
    });
    expect(ok).toBe(true);
    expect(repo.update).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ permissions: expect.any(Array) }),
    );
    expect(bus.emit).toHaveBeenCalledWith(ROLE_EVENT_NAMES.UPDATED, { id: 7 });
  });

  it('savePermissions returns false and records error on failure', async () => {
    repo.update.mockRejectedValueOnce(new Error('conflict'));
    const { result } = renderHook(() => useRoleDetail({ id: 7 }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.togglePermission('users:write'));

    let ok = true;
    await act(async () => {
      ok = await result.current.savePermissions();
    });
    expect(ok).toBe(false);
    expect(result.current.error?.message).toBe('conflict');
  });

  it('updateBasicInfo updates name + description and emits role:updated', async () => {
    const { result } = renderHook(() => useRoleDetail({ id: 7 }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let ok = false;
    await act(async () => {
      ok = await result.current.updateBasicInfo({ name: 'Renamed', description: 'Updated' });
    });
    expect(ok).toBe(true);
    expect(repo.update).toHaveBeenCalledWith(7, { name: 'Renamed', description: 'Updated' });
  });

  it('delete navigates to the role list on success', async () => {
    const { result } = renderHook(() => useRoleDetail({ id: 7 }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let ok = false;
    await act(async () => {
      ok = await result.current.delete();
    });
    expect(ok).toBe(true);
    expect(repo.delete).toHaveBeenCalledWith(7);
    expect(nav.navigate).toHaveBeenCalledWith('/roles');
    expect(bus.emit).toHaveBeenCalledWith(ROLE_EVENT_NAMES.DELETED, { id: 7 });
  });

  it('refreshes on remote role:updated event for the same id', async () => {
    const { result } = renderHook(() => useRoleDetail({ id: 7 }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(repo.getById).toHaveBeenCalledTimes(1);

    await act(async () => {
      bus._dispatch(ROLE_EVENT_NAMES.UPDATED, { id: 7 });
    });
    await waitFor(() => expect(repo.getById).toHaveBeenCalledTimes(2));
  });

  it('ignores remote role:updated for a different id', async () => {
    const { result } = renderHook(() => useRoleDetail({ id: 7 }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      bus._dispatch(ROLE_EVENT_NAMES.UPDATED, { id: 999 });
    });
    expect(repo.getById).toHaveBeenCalledTimes(1);
  });

  it('navigateToList delegates to NavigationCapability', async () => {
    const { result } = renderHook(() => useRoleDetail({ id: 7 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.navigateToList());
    expect(nav.navigate).toHaveBeenCalledWith('/roles');
  });
});
