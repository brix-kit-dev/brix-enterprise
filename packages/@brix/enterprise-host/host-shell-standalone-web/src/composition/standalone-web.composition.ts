import type { FrontendHostComposition } from '@brix-sdk/runtime-orchestrator-web';
import { createPlatformAdminRouteSnapshotSource } from './platform-admin-route-snapshot';

export const standaloneWebComposition: FrontendHostComposition = {
  id: 'host-shell-standalone-web',
  version: '3.2.0',
  profileName: 'standalone-web',
  hostKind: 'standalone-web',
  runtime: {
    appName: 'Brix Platform',
    appVersion: '3.2.0',
    strictMode: true,
  },
  runtimeContext: {
    moduleId: 'host-shell-standalone-web',
    tenantId: 'host',
  },
  capabilities: {
    required: ['auth', 'http', 'i18n', 'router', 'theme', 'ui'],
    optional: [],
  },
  routes: {
    mode: 'snapshot',
    snapshotId: 'standalone-web.routes.v1',
    defaultRouteId: 'platform-admin.dashboard',
    hostCapabilities: ['auth', 'http', 'i18n', 'router', 'theme', 'ui'],
    sources: [createPlatformAdminRouteSnapshotSource()],
  },
} as const;
