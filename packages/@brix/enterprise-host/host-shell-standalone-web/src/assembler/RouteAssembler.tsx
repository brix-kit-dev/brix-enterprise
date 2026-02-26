/**
 * @file Route Assembler
 * @description Route-related helper components (re-exports from platform layer)
 * @module host-standalone-web/assembler/RouteAssembler
 * @version 3.0.0
 *
 * Route guard components have been moved to platform-router-web.
 * This file is a backward-compatible re-export.
 */

// Re-export platform layer components (backward compatibility)
export {
  AuthGuardRoute,
  PermissionGuardRoute,
  CombinedGuardRoute,
  type AuthGuardRouteProps,
  type PermissionGuardRouteProps,
  type CombinedGuardRouteProps,
} from '@brix/platform-router-web';