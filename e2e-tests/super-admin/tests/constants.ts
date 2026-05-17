/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 */

/**
 * Centralised wire-format constants for the super-admin E2E suite.
 *
 * <p>Phase 3 architectural red-line: NO test file is allowed to embed
 * a magic URL, port number, route, or event name.  Every such value
 * lives here and is consumed by name.</p>
 */

/** TCP ports for the local backend stack. */
export const PORTS = {
  /** host-shell-standalone Spring Boot listener. */
  BACKEND: 8081,
  /** host-shell-standalone-web rspack dev-server. */
  FRONTEND: 3001,
  /** Containerised Postgres exposed by docker-compose.yml. */
  POSTGRES: 55432,
  /** Containerised Redis exposed by docker-compose.yml. */
  REDIS: 56379,
} as const;

/** Frontend base URL — derived from {@link PORTS.FRONTEND}. */
export const BASE_URL = `http://localhost:${PORTS.FRONTEND}`;

/** Backend base URL — derived from {@link PORTS.BACKEND}. */
export const BACKEND_URL = `http://localhost:${PORTS.BACKEND}`;

/**
 * Frontend routes covered by the suite.  Mirrors the route table owned by
 * host-shell-standalone-web.
 */
export const ROUTES = {
  PLATFORM_LOGIN: '/platform/login',
  PLATFORM_DASHBOARD: '/platform',
  TENANTS_LIST: '/admin/tenants',
  TENANT_CREATE: '/admin/tenants/create',
  TENANT_MEMBERS: (tenantId: string) => `/admin/tenants/${tenantId}/members`,
} as const;

/** Stable data-testid selectors covered by the Phase 3 suite. */
export const TEST_IDS = {
  LOGIN_USERNAME: 'login-username',
  LOGIN_PASSWORD: 'login-password',
  LOGIN_SUBMIT: 'login-submit',
  CURRENT_USER_NAME: 'current-user-name',
  TENANT_CREATE_CODE: 'tenant-create-code',
  TENANT_CREATE_NAME: 'tenant-create-name',
  TENANT_CREATE_ADMIN_EMAIL: 'tenant-create-admin-email',
  TENANT_CREATE_NEXT: 'tenant-create-next',
  TENANT_CREATE_SUBMIT: 'tenant-create-submit',
  TENANT_ROW_VIEW: 'tenant-row-view',
  TENANT_ROW_VIEW_AS: 'tenant-row-view-as',
  MEMBER_INVITE_OPEN: 'member-invite-open',
  MEMBER_INVITE_EMAIL: 'member-invite-email',
  MEMBER_INVITE_ROLE: 'member-invite-role',
  MEMBER_INVITE_ROLE_OPTION_OWNER: 'member-invite-role-option-owner',
  MEMBER_INVITE_SUBMIT: 'member-invite-submit',
  VIEW_MODE_BANNER: 'view-mode-banner',
  VIEW_MODE_EXIT: 'view-mode-exit',
} as const;

/**
 * Bootstrap super-admin credentials.
 *
 * <p>The username is fixed by the host-shell bootstrap routine; the password
 * is supplied via the {@code BRIX_BOOTSTRAP_PASSWORD} environment variable
 * (NEVER hard-coded — read by both the Spring Boot host and this file).</p>
 *
 * @throws Error when the env var is missing in CI mode.
 */
export const BOOTSTRAP_ADMIN = {
  username: 'ops-bootstrap',
  passwordEnvVar: 'BRIX_BOOTSTRAP_PASSWORD',
} as const;

/**
 * Resolves the bootstrap password from environment, with a developer-only
 * fallback so {@code pnpm test} works without any prior shell setup.
 *
 * <p>The fallback is intentionally NOT a real-looking secret — anyone running
 * the suite locally must align this value with their docker-compose env file.
 * The value MUST come from environment in CI.</p>
 */
export function resolveBootstrapPassword(): string {
  const envValue = process.env[BOOTSTRAP_ADMIN.passwordEnvVar];
  if (envValue && envValue.length > 0) {
    return envValue;
  }
  if (process.env.CI) {
    throw new Error(
      `Environment variable ${BOOTSTRAP_ADMIN.passwordEnvVar} is required in CI`,
    );
  }
  // Local-dev default; matches scripts/start-stack.ps1.
  return 'LocalDevOnly!ChangeMe';
}

/** Event-bus channel names asserted by the suite. */
export const EVENT_NAMES = {
  TENANT_CREATED: 'tenant:created',
  MEMBER_INVITED: 'tenant:member:invited',
} as const;

/** Storage state file written by the auth fixture. */
export const STORAGE_STATE_FILE = '.auth/super-admin.json';
