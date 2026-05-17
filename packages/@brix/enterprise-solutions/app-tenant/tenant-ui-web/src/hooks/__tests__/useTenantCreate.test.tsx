/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 */

/**
 * Phase 3 / C-5 — Unit tests for {@code useTenantCreate} ViewModel hook.
 *
 * <p>Coverage targets:
 * <ul>
 *   <li>per-step validation errors (code regex, name length, email format)</li>
 *   <li>updateForm clears errors for touched fields</li>
 *   <li>nextStep / prevStep stay within {@code [0, TOTAL_STEPS-1]}</li>
 *   <li>submit happy path emits {@code TENANT_CREATED} and stores the
 *       created tenant</li>
 *   <li>submit propagates repository errors</li>
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
import { useTenantCreate } from '../useTenantCreate';

interface MockRepo {
  createTenant: ReturnType<typeof vi.fn>;
}

let repo: MockRepo;
let bus: MockEventBus;
let nav: MockNavigation;

function fillValidForm(actions: ReturnType<typeof useTenantCreate>['actions']): void {
  actions.updateForm({
    code: 'acme-co',
    name: 'Acme Co',
    description: 'Demo tenant',
    contactEmail: 'ops@acme.test',
    adminEmail: 'admin@acme.test',
    adminName: 'Alice',
    sendInvitation: true,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  repo = {
    createTenant: vi.fn().mockResolvedValue({
      id: 't-100',
      code: 'acme-co',
      name: 'Acme Co',
      status: TenantStatus.PENDING_ACTIVATION,
      memberCount: 0,
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    }),
  };
  bus = createMockEventBus();
  nav = createMockNavigation();
  vi.mocked(useHttp).mockReturnValue(createMockHttp() as never);
  vi.mocked(useEventBus).mockReturnValue(bus as never);
  vi.mocked(useNavigation).mockReturnValue(nav as never);
  vi.mocked(createTenantAdminRepository).mockReturnValue(repo as never);
});

describe('useTenantCreate — validation', () => {
  it('rejects an empty code on step 0', async () => {
    const { result } = renderHook(() => useTenantCreate());

    let ok = true;
    await act(async () => {
      ok = await result.current.actions.validateStep();
    });
    expect(ok).toBe(false);
    expect(result.current.state.errors.code).toBeTruthy();
    expect(result.current.state.errors.name).toBeTruthy();
  });

  it('rejects an invalid code that contains uppercase letters', async () => {
    const { result } = renderHook(() => useTenantCreate());
    act(() => result.current.actions.updateForm({ code: 'AcmeCo', name: 'Acme' }));
    await act(async () => {
      await result.current.actions.validateStep();
    });
    expect(result.current.state.errors.code).toBeTruthy();
  });

  it('rejects an invalid contact email', async () => {
    const { result } = renderHook(() => useTenantCreate());
    act(() =>
      result.current.actions.updateForm({
        code: 'acme',
        name: 'Acme',
        contactEmail: 'not-an-email',
      }),
    );
    await act(async () => {
      await result.current.actions.validateStep();
    });
    expect(result.current.state.errors.contactEmail).toBeTruthy();
  });

  it('clears a field error when updateForm() touches that field', async () => {
    const { result } = renderHook(() => useTenantCreate());
    await act(async () => {
      await result.current.actions.validateStep();
    });
    expect(result.current.state.errors.code).toBeTruthy();

    act(() => result.current.actions.updateForm({ code: 'acme' }));
    expect(result.current.state.errors.code).toBeUndefined();
  });
});

describe('useTenantCreate — wizard navigation', () => {
  it('caps nextStep at the last step', () => {
    const { result } = renderHook(() => useTenantCreate());
    for (let i = 0; i < 10; i++) act(() => result.current.actions.nextStep());
    // TOTAL_STEPS = 4, so the final index is 3.
    expect(result.current.state.currentStep).toBe(3);
  });

  it('floors prevStep at 0', () => {
    const { result } = renderHook(() => useTenantCreate());
    act(() => result.current.actions.prevStep());
    expect(result.current.state.currentStep).toBe(0);
  });
});

describe('useTenantCreate — submission', () => {
  it('creates the tenant and emits TENANT_CREATED on success', async () => {
    const { result } = renderHook(() => useTenantCreate());
    act(() => fillValidForm(result.current.actions));

    await act(async () => {
      await result.current.actions.submit();
    });

    expect(repo.createTenant).toHaveBeenCalledTimes(1);
    expect(repo.createTenant.mock.calls[0]?.[0]).toMatchObject({
      code: 'acme-co',
      name: 'Acme Co',
      initialAdmin: 'admin@acme.test',
      sendActivationEmail: true,
    });
    await waitFor(() => expect(result.current.state.createdTenant?.id).toBe('t-100'));
    expect(bus.emit).toHaveBeenCalled();
    const arg = bus.emit.mock.calls[0]?.[0];
    expect(JSON.stringify(arg)).toContain(TenantEvents.TENANT_CREATED);
  });

  it('does not call the repository when the form is invalid', async () => {
    const { result } = renderHook(() => useTenantCreate());
    await act(async () => {
      await result.current.actions.submit();
    });
    expect(repo.createTenant).not.toHaveBeenCalled();
    expect(result.current.state.errors.code).toBeTruthy();
  });

  it('records submitError and rethrows when the repository rejects', async () => {
    repo.createTenant.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useTenantCreate());
    act(() => fillValidForm(result.current.actions));

    let caught: unknown;
    await act(async () => {
      try {
        await result.current.actions.submit();
      } catch (err) {
        caught = err;
      }
    });
    expect(caught).toBeInstanceOf(Error);
    expect(result.current.state.submitError).toBe('boom');
  });

  it('cancel() navigates back to the list', () => {
    const { result } = renderHook(() => useTenantCreate());
    act(() => result.current.actions.cancel());
    expect(nav.requestNavigate).toHaveBeenCalledWith('/admin/tenants');
  });
});
