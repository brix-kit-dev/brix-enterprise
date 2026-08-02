import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AuthCapabilityType,
  AuthSessionInstallProvider,
  HttpCapabilityType,
  type AuthCapability,
  type HttpCapability,
} from '@brix-sdk/runtime-sdk-api-web';

import { createStandaloneWebRuntimeCapabilityBindings } from './index';

describe('standalone web runtime auth session storage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    vi.stubGlobal('fetch', vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }));
  });

  it('restores an installed platform session so HttpCapability keeps sending Authorization after runtime recreation', async () => {
    const firstRuntime = capabilities();
    await firstRuntime.auth.login({
      provider: AuthSessionInstallProvider,
      token: 'platform-token',
      refreshToken: 'refresh-token',
      contextKind: 'platform',
      subjectId: '1001',
      username: 'root',
      primaryRole: 'PLATFORM_SUPER_ADMIN',
      roles: ['PLATFORM_SUPER_ADMIN'],
      permissions: ['platform:admin:read'],
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const secondRuntime = capabilities();
    expect(secondRuntime.auth.isAuthenticated()).toBe(true);
    expect(secondRuntime.auth.getVerifiedPlatformContext()?.subjectId).toBe('1001');

    await secondRuntime.http.get('/platform/admins', { page: 0 });

    const request = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(request.headers).get('Authorization')).toBe('Bearer platform-token');
  });

  it('clears the restored session on logout', async () => {
    const runtime = capabilities();
    await runtime.auth.login({
      provider: AuthSessionInstallProvider,
      token: 'platform-token',
      contextKind: 'platform',
      subjectId: '1001',
      roles: [],
      permissions: [],
    });

    await runtime.auth.logout();

    expect(capabilities().auth.isAuthenticated()).toBe(false);
  });
});

function capabilities(): {
  readonly auth: AuthCapability;
  readonly http: HttpCapability;
} {
  const bindings = createStandaloneWebRuntimeCapabilityBindings({ apiBaseUrl: '/api' });
  const auth = bindings
    .find(binding => binding.capabilityType === AuthCapabilityType)
    ?.provider.provide() as AuthCapability | undefined;
  const http = bindings
    .find(binding => binding.capabilityType === HttpCapabilityType)
    ?.provider.provide() as HttpCapability | undefined;

  if (!auth || !http) {
    throw new Error('runtime capabilities are not registered');
  }

  return { auth, http };
}
