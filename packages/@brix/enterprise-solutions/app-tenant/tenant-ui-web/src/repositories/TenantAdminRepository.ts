/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 * 
 * @fileoverview TenantAdminRepository - Data access layer for tenant management
 * 
 * Follows the Repository pattern defined in the v3.0.10 Runtime Shell
 * UI boundary: Page -> Hook -> Repository -> HttpCapability.
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type {
  TenantDTO,
  TenantMemberDTO,
  TenantFeatureDTO,
  TenantStatistics,
  TenantAuditLogDTO,
  CreateTenantRequest,
  UpdateTenantRequest,
  InviteMemberRequest,
  UpdateMemberRequest,
  TenantListQuery,
  MemberListQuery,
  PagedResponse,
} from '@brix-sdk/tenant-shared';

/**
 * Tenant Admin Repository Interface
 */
export interface TenantAdminRepository {
  // =========================================
  // Tenant CRUD
  // =========================================
  
  /** Get tenant list with pagination */
  getTenants(query?: TenantListQuery): Promise<PagedResponse<TenantDTO>>;
  
  /** Get tenant by ID */
  getTenant(tenantId: string): Promise<TenantDTO>;
  
  /** Create a new tenant */
  createTenant(request: CreateTenantRequest): Promise<TenantDTO>;
  
  /** Update tenant */
  updateTenant(tenantId: string, request: UpdateTenantRequest): Promise<TenantDTO>;
  
  /** Activate tenant */
  activateTenant(tenantId: string): Promise<void>;
  
  /** Suspend tenant */
  suspendTenant(tenantId: string, reason?: string): Promise<void>;
  
  /** Terminate tenant (soft delete) */
  terminateTenant(tenantId: string, reason: string): Promise<void>;

  // =========================================
  // Member Management
  // =========================================
  
  /** Get tenant members */
  getMembers(tenantId: string, query?: MemberListQuery): Promise<PagedResponse<TenantMemberDTO>>;
  
  /** Invite a member to tenant */
  inviteMember(tenantId: string, request: InviteMemberRequest): Promise<TenantMemberDTO>;
  
  /** Update member */
  updateMember(tenantId: string, memberId: string, request: UpdateMemberRequest): Promise<TenantMemberDTO>;
  
  /** Remove member from tenant */
  removeMember(tenantId: string, memberId: string): Promise<void>;
  
  /** Resend invitation */
  resendInvitation(tenantId: string, memberId: string): Promise<void>;

  // =========================================
  // Features
  // =========================================
  
  /** Get tenant features */
  getFeatures(tenantId: string): Promise<TenantFeatureDTO[]>;
  
  /** Update feature flag */
  updateFeature(tenantId: string, featureKey: string, enabled: boolean): Promise<TenantFeatureDTO>;

  // =========================================
  // Statistics & Audit
  // =========================================
  
  /** Get platform-wide statistics */
  getStatistics(): Promise<TenantStatistics>;
  
  /** Get audit logs for a tenant */
  getAuditLogs(tenantId: string, query?: { page?: number; pageSize?: number }): Promise<PagedResponse<TenantAuditLogDTO>>;
}

/**
 * API endpoints configuration
 */
/**
 * API endpoint paths.
 * Note: '/api' prefix is provided by HttpCapability baseURL (VITE_API_BASE).
 */
const API_ENDPOINTS = {
  TENANTS: '/v1/tenants',
  TENANT: (id: string) => `/v1/tenants/${id}`,
  TENANT_ACTIVATE: (id: string) => `/v1/tenants/${id}/activate`,
  TENANT_SUSPEND: (id: string) => `/v1/tenants/${id}/suspend`,
  TENANT_TERMINATE: (id: string) => `/v1/tenants/${id}/terminate`,
  MEMBERS: (tenantId: string) => `/v1/tenants/${tenantId}/members`,
  MEMBER: (tenantId: string, memberId: string) => `/v1/tenants/${tenantId}/members/${memberId}`,
  MEMBER_RESEND: (tenantId: string, memberId: string) => `/v1/tenants/${tenantId}/members/${memberId}/resend`,
  FEATURES: (tenantId: string) => `/v1/tenants/${tenantId}/features`,
  FEATURE: (tenantId: string, key: string) => `/v1/tenants/${tenantId}/features/${key}`,
  STATISTICS: '/v1/tenants/statistics',
  AUDIT_LOGS: (tenantId: string) => `/v1/tenants/${tenantId}/audit-logs`,
} as const;

function toQueryParams<T extends object>(query: T | undefined): Record<string, unknown> | undefined {
  if (!query) {
    return undefined;
  }
  return Object.fromEntries(Object.entries(query));
}

/**
 * Create TenantAdminRepository with HttpCapability injection
 * 
 * @example
 * ```typescript
 * const http = useHttp();
 * const repository = createTenantAdminRepository(http);
 * const tenants = await repository.getTenants({ page: 1, pageSize: 10 });
 * ```
 */
export function createTenantAdminRepository(http: HttpCapability): TenantAdminRepository {
  return {
    // =========================================
    // Tenant CRUD
    // =========================================

    async getTenants(query?: TenantListQuery): Promise<PagedResponse<TenantDTO>> {
      return http.get<PagedResponse<TenantDTO>>(API_ENDPOINTS.TENANTS, toQueryParams(query));
    },

    async getTenant(tenantId: string): Promise<TenantDTO> {
      return http.get<TenantDTO>(API_ENDPOINTS.TENANT(tenantId));
    },

    async createTenant(request: CreateTenantRequest): Promise<TenantDTO> {
      return http.post<TenantDTO>(API_ENDPOINTS.TENANTS, request);
    },

    async updateTenant(tenantId: string, request: UpdateTenantRequest): Promise<TenantDTO> {
      return http.put<TenantDTO>(API_ENDPOINTS.TENANT(tenantId), request);
    },

    async activateTenant(tenantId: string): Promise<void> {
      await http.post<void>(API_ENDPOINTS.TENANT_ACTIVATE(tenantId));
    },

    async suspendTenant(tenantId: string, reason?: string): Promise<void> {
      await http.post<void>(API_ENDPOINTS.TENANT_SUSPEND(tenantId), { reason });
    },

    async terminateTenant(tenantId: string, reason: string): Promise<void> {
      await http.post<void>(API_ENDPOINTS.TENANT_TERMINATE(tenantId), { reason });
    },

    // =========================================
    // Member Management
    // =========================================

    async getMembers(tenantId: string, query?: MemberListQuery): Promise<PagedResponse<TenantMemberDTO>> {
      return http.get<PagedResponse<TenantMemberDTO>>(API_ENDPOINTS.MEMBERS(tenantId), toQueryParams(query));
    },

    async inviteMember(tenantId: string, request: InviteMemberRequest): Promise<TenantMemberDTO> {
      return http.post<TenantMemberDTO>(API_ENDPOINTS.MEMBERS(tenantId), request);
    },

    async updateMember(tenantId: string, memberId: string, request: UpdateMemberRequest): Promise<TenantMemberDTO> {
      return http.put<TenantMemberDTO>(API_ENDPOINTS.MEMBER(tenantId, memberId), request);
    },

    async removeMember(tenantId: string, memberId: string): Promise<void> {
      await http.delete<void>(API_ENDPOINTS.MEMBER(tenantId, memberId));
    },

    async resendInvitation(tenantId: string, memberId: string): Promise<void> {
      await http.post<void>(API_ENDPOINTS.MEMBER_RESEND(tenantId, memberId));
    },

    // =========================================
    // Features
    // =========================================

    async getFeatures(tenantId: string): Promise<TenantFeatureDTO[]> {
      return http.get<TenantFeatureDTO[]>(API_ENDPOINTS.FEATURES(tenantId));
    },

    async updateFeature(tenantId: string, featureKey: string, enabled: boolean): Promise<TenantFeatureDTO> {
      return http.put<TenantFeatureDTO>(API_ENDPOINTS.FEATURE(tenantId, featureKey), { enabled });
    },

    // =========================================
    // Statistics & Audit
    // =========================================

    async getStatistics(): Promise<TenantStatistics> {
      return http.get<TenantStatistics>(API_ENDPOINTS.STATISTICS);
    },

    async getAuditLogs(tenantId: string, query?: { page?: number; pageSize?: number }): Promise<PagedResponse<TenantAuditLogDTO>> {
      return http.get<PagedResponse<TenantAuditLogDTO>>(API_ENDPOINTS.AUDIT_LOGS(tenantId), query);
    },
  };
}

export default createTenantAdminRepository;
