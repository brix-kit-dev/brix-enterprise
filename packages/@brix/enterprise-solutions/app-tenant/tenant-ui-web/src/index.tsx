/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 * 
 * @fileoverview Tenant Management UI Plugin Entry Point
 * 
 * This module provides the multi-tenant management interface
 * for the Brix Enterprise platform. It follows the three-layer
 * architecture pattern: View → ViewModel → Repository.
 */

// Re-export i18n registration for host-level capability wiring
export { registerTenantI18n } from './i18n';

// ===========================================================
// Re-export Pages for Module Federation
// ===========================================================
export {
  TenantListPage,
  TenantDetailPage,
  TenantCreatePage,
  TenantMembersPage,
} from './pages';

// ===========================================================
// Re-export Hooks (ViewModel Layer)
// ===========================================================
export {
  useTenantList,
  useTenantDetail,
  useTenantCreate,
  useTenantMembers,
} from './hooks';

// ===========================================================
// Re-export Repository
// ===========================================================
export { createTenantAdminRepository, type TenantAdminRepository } from './repositories';

// ===========================================================
// Re-export Shared Types
// ===========================================================
export * from '@brix-sdk/tenant-shared';
