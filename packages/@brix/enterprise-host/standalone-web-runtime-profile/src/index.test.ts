import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AuthCapabilityType,
  AuthSessionInstallProvider,
  HttpCapabilityType,
  TenantCapabilityType,
  type AuthCapability,
  type HttpCapability,
} from '@brix-sdk/runtime-sdk-api-web';

import { createBffSessionAuthState } from '@brix-sdk/platform-auth-web/BffSessionAuthState';
import {
  createStandaloneWebBffRuntimeCapabilityBindings,
  createStandaloneWebRuntimeCapabilityBindings,
  type StandaloneWebRuntimeProfileOptions,
} from './index';

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

  it('runs a BFF console on its session: no bearer token, CSRF token on writes', async () => {
    window.sessionStorage.setItem('brix:standalone-web-runtime:auth-session:v1', JSON.stringify({
      version: 1, token: 'legacy-token', contextKind: 'platform', subjectId: '1001', roles: [], permissions: [],
    }));
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => new Response(JSON.stringify(
      String(input) === '/bff/session'
        ? {
            authenticated: true,
            csrfToken: 'csrf-1',
            identity: { id: '21', email: 'staff@example.test' },
            context: { kind: 'actor', tenantId: '42', tenantName: 'Clinic', memberType: 'MEMBER' },
            permissions: ['tenant:profile:read'],
          }
        : { ok: true },
    ), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    const bffSession = createBffSessionAuthState({ navigate: vi.fn() });
    await bffSession.load();

    const runtime = capabilities({ bffSession });
    await runtime.http.get('/tenant/session');
    await runtime.http.post('/tenant/members', {});

    expect(runtime.auth.isAuthenticated()).toBe(true);
    expect(runtime.auth.getToken()).toBeNull();
    expect(runtime.auth.getVerifiedActorContext()?.tenantId).toBe('42');
    const [read, write] = vi.mocked(fetch).mock.calls.slice(-2).map(call => new Headers((call[1] as RequestInit).headers));
    expect(read.get('Authorization')).toBeNull();
    expect(read.get('X-Brix-CSRF')).toBeNull();
    expect(write.get('Authorization')).toBeNull();
    expect(write.get('X-Brix-CSRF')).toBe('csrf-1');
  });

  it('sends the browser back through the BFF login when the session has ended', async () => {
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => String(input) === '/bff/session'
      ? new Response(JSON.stringify({
          authenticated: true,
          csrfToken: 'csrf-1',
          identity: { id: '21' },
          context: { kind: 'actor', tenantId: '42' },
          permissions: [],
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      : new Response(JSON.stringify({ errorCode: 'ENDPOINT_AUTHENTICATION_REQUIRED' }), {
          status: 401, headers: { 'Content-Type': 'application/json' },
        }));
    const navigate = vi.fn();
    const bffSession = createBffSessionAuthState({ navigate });
    await bffSession.load();
    window.history.replaceState(null, '', '/tenant?tab=members');

    await expect(capabilities({ bffSession }).http.get('/tenant/session')).rejects.toBeTruthy();

    expect(navigate).toHaveBeenCalledWith('/bff/login?returnTo=%2Ftenant%3Ftab%3Dmembers');
  });

  it('reads the BFF session before the Runtime starts, so the Host never holds it', async () => {
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => new Response(JSON.stringify(
      String(input) === '/bff/session'
        ? {
            authenticated: true,
            csrfToken: 'csrf-1',
            identity: { id: '21' },
            context: { kind: 'actor', tenantId: '42' },
            permissions: ['tenant:profile:read'],
          }
        : { ok: true },
    ), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const bindings = await createStandaloneWebBffRuntimeCapabilityBindings({ apiBaseUrl: '/api' });
    const auth = bindings
      .find(binding => binding.capabilityType === AuthCapabilityType)
      ?.provider.provide() as AuthCapability;

    expect(vi.mocked(fetch).mock.calls.map(call => String(call[0]))).toEqual(['/bff/session']);
    expect(auth.getVerifiedActorContext()?.tenantId).toBe('42');
    expect(auth.getToken()).toBeNull();
    expect(bindings.some(binding => binding.capabilityType === TenantCapabilityType)).toBe(true);
  });
});

function capabilities(options: Partial<StandaloneWebRuntimeProfileOptions> = {}): {
  readonly auth: AuthCapability;
  readonly http: HttpCapability;
} {
  const bindings = createStandaloneWebRuntimeCapabilityBindings({ apiBaseUrl: '/api', ...options });
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
