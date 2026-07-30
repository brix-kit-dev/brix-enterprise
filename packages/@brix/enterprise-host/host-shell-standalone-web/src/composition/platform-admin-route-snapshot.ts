import {
  createPlatformAdminMenuSnapshot,
  createPlatformAdminRouteSnapshot,
} from '@brix-sdk/platform-admin-web';
import type { FrontendHostRouteSnapshotSource } from '@brix-sdk/runtime-orchestrator-web';

export function createPlatformAdminRouteSnapshotSource(): FrontendHostRouteSnapshotSource {
  return {
    sourceId: 'platform-admin',
    defaultRouteId: 'platform-admin.dashboard',
    routes: createPlatformAdminRouteSnapshot(),
    menus: createPlatformAdminMenuSnapshot(),
  };
}
