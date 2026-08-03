import { createPlatformTenantRouteSnapshot } from '@brix-sdk/platform-tenant-web';
import type { FrontendHostRouteSnapshotSource } from '@brix-sdk/runtime-orchestrator-web';

export function createPlatformTenantRouteSnapshotSource(): FrontendHostRouteSnapshotSource {
  return {
    sourceId: 'platform-tenant',
    routes: createPlatformTenantRouteSnapshot(),
    menus: [],
  };
}

