/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 */

// =========================================
// Tenant Status
// =========================================

/**
 * Tenant lifecycle status
 */
export enum TenantStatus {
  /** Initial state after creation, awaiting activation */
  PENDING_ACTIVATION = 'PENDING_ACTIVATION',
  /** Normal operational state */
  ACTIVE = 'ACTIVE',
  /** Temporarily disabled (can be reactivated) */
  SUSPENDED = 'SUSPENDED',
  /** Permanently deleted (soft delete) */
  TERMINATED = 'TERMINATED',
}

/**
 * Tenant member type
 */
export enum TenantMemberType {
  /** Organization (company/team) */
  ORGANIZATION = 'ORGANIZATION',
  /** Individual user */
  INDIVIDUAL = 'INDIVIDUAL',
}

/**
 * Member status within a tenant
 */
export enum MemberStatus {
  /** Invitation sent, awaiting acceptance */
  INVITED = 'INVITED',
  /** Active member */
  ACTIVE = 'ACTIVE',
  /** Temporarily suspended */
  SUSPENDED = 'SUSPENDED',
  /** Left the tenant */
  LEFT = 'LEFT',
}

/**
 * Member role within a tenant
 *
 * Defines the permission level of a member in the tenant.
 * Follows RBAC best practices with three standard roles.
 */
export enum MemberRole {
  /** Tenant owner — full control, cannot be removed */
  OWNER = 'OWNER',
  /** Administrator — can manage members and settings */
  ADMIN = 'ADMIN',
  /** Regular member — read/write access to tenant resources */
  MEMBER = 'MEMBER',
}

// =========================================
// Core DTOs
// =========================================

/**
 * Tenant Data Transfer Object
 */
export interface TenantDTO {
  /** Unique identifier (Snowflake ID) */
  id: string;
  /** Unique business code (URL-friendly) */
  code: string;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** Current status */
  status: TenantStatus;
  /** Logo URL */
  logoUrl?: string;
  /** Contact email */
  contactEmail?: string;
  /** Member count */
  memberCount: number;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Activation timestamp */
  activatedAt?: string;
}

/**
 * Tenant member DTO
 */
export interface TenantMemberDTO {
  /** Member ID */
  id: string;
  /** Tenant ID */
  tenantId: string;
  /** Identity ID (user) */
  identityId: string;
  /** Member type */
  memberType: TenantMemberType;
  /** Member status */
  status: MemberStatus;
  /** Display name */
  displayName: string;
  /** Email */
  email: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** Roles within this tenant */
  roles: string[];
  /** Join timestamp */
  joinedAt: string;
  /** Last activity */
  lastActiveAt?: string;
}

/**
 * Tenant feature flag
 */
export interface TenantFeatureDTO {
  /** Feature key */
  key: string;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** Whether enabled for this tenant */
  enabled: boolean;
  /** Feature category */
  category: string;
}

// =========================================
// Request DTOs
// =========================================

/**
 * Create tenant request
 */
export interface CreateTenantRequest {
  /** Unique code (URL-friendly, 3-50 chars) */
  code: string;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** Initial admin user ID or email */
  initialAdmin: string;
  /** Whether to send activation email */
  sendActivationEmail?: boolean;
}

/**
 * Update tenant request
 */
export interface UpdateTenantRequest {
  /** Display name */
  name?: string;
  /** Description */
  description?: string;
  /** Logo URL */
  logoUrl?: string;
  /** Contact email */
  contactEmail?: string;
}

/**
 * Invite member request
 */
export interface InviteMemberRequest {
  /** User email to invite */
  email: string;
  /** Member type */
  memberType: TenantMemberType;
  /** Roles to assign */
  roles: string[];
  /** Custom invitation message */
  message?: string;
}

/**
 * Update member request
 */
export interface UpdateMemberRequest {
  /** Roles to assign */
  roles?: string[];
  /** New status */
  status?: MemberStatus;
}

/**
 * Tenant list query parameters
 */
export interface TenantListQuery {
  /** Page number (1-based) */
  page?: number;
  /** Page size */
  pageSize?: number;
  /** Search keyword (name or code) */
  keyword?: string;
  /** Filter by status */
  status?: TenantStatus;
  /** Sort field */
  sortBy?: 'name' | 'createdAt' | 'memberCount';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Member list query parameters
 */
export interface MemberListQuery {
  /** Page number (1-based) */
  page?: number;
  /** Page size */
  pageSize?: number;
  /** Search keyword (name or email) */
  keyword?: string;
  /** Filter by status */
  status?: MemberStatus;
  /** Filter by role */
  role?: string;
}

// =========================================
// Response Types
// =========================================

/**
 * Paginated response
 */
export interface PagedResponse<T> {
  /** Data items */
  items: T[];
  /** Total count */
  total: number;
  /** Current page */
  page: number;
  /** Page size */
  pageSize: number;
  /** Total pages */
  totalPages: number;
}

/**
 * Tenant statistics
 */
export interface TenantStatistics {
  /** Total tenant count */
  totalTenants: number;
  /** Active tenants */
  activeTenants: number;
  /** Suspended tenants */
  suspendedTenants: number;
  /** Pending activation */
  pendingTenants: number;
  /** Total members across all tenants */
  totalMembers: number;
  /** Tenants created this month */
  newTenantsThisMonth: number;
}

// =========================================
// Events
// =========================================

/**
 * Event types for tenant management
 */
export const TenantEvents = {
  /** Tenant created */
  TENANT_CREATED: 'tenant.created',
  /** Tenant activated */
  TENANT_ACTIVATED: 'tenant.activated',
  /** Tenant suspended */
  TENANT_SUSPENDED: 'tenant.suspended',
  /** Tenant terminated */
  TENANT_TERMINATED: 'tenant.terminated',
  /** Tenant updated */
  TENANT_UPDATED: 'tenant.updated',
  /** Member invited */
  MEMBER_INVITED: 'tenant.member.invited',
  /** Member joined */
  MEMBER_JOINED: 'tenant.member.joined',
  /** Member removed */
  MEMBER_REMOVED: 'tenant.member.removed',
  /** Member role changed */
  MEMBER_ROLE_CHANGED: 'tenant.member.roleChanged',
} as const;

// =========================================
// Permissions
// =========================================

/**
 * Tenant management permissions
 */
export const TenantPermissions = {
  /** Read tenant list */
  ADMIN_READ: 'tenant:admin:read',
  /** Create tenant */
  ADMIN_CREATE: 'tenant:admin:create',
  /** Update tenant */
  ADMIN_UPDATE: 'tenant:admin:update',
  /** Suspend tenant */
  ADMIN_SUSPEND: 'tenant:admin:suspend',
  /** Terminate tenant */
  ADMIN_TERMINATE: 'tenant:admin:terminate',
  /** Manage tenant members */
  MEMBER_MANAGE: 'tenant:member:manage',
  /** View tenant features */
  FEATURE_READ: 'tenant:feature:read',
  /** Configure tenant features */
  FEATURE_CONFIGURE: 'tenant:feature:configure',
} as const;

// =========================================
// Audit Log
// =========================================

/**
 * Audit log entry for tenant operations
 */
export interface TenantAuditLogDTO {
  /** Log ID */
  id: string;
  /** Tenant ID */
  tenantId: string;
  /** Action performed */
  action: string;
  /** Actor (user who performed the action) */
  actorId: string;
  /** Actor name */
  actorName: string;
  /** Target entity type */
  targetType: 'TENANT' | 'MEMBER' | 'FEATURE';
  /** Target entity ID */
  targetId: string;
  /** Old value (JSON) */
  oldValue?: string;
  /** New value (JSON) */
  newValue?: string;
  /** IP address */
  ipAddress?: string;
  /** User agent */
  userAgent?: string;
  /** Timestamp */
  timestamp: string;
}
