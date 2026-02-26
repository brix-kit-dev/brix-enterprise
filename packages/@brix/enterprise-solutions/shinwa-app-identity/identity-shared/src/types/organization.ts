/**
 * @file Organization related type definitions
 * @description Core type definitions for organization business, shared by Web and Mobile
 * @module @shinwa/identity-shared/types
 * @version 3.2.0
 * 
 * Design Notes:
 * This file defines core business types for organization management, following:
 * 1. Keep consistent with backend DTOs
 * 2. Do not include any platform-specific types
 * 3. Use interfaces instead of classes for easy serialization
 */

// ============================================================================
// Organization Type Enums
// ============================================================================

/**
 * Organization Type
 * 
 * Classifies organizations by their role in the system.
 */
export type OrganizationType =
  | 'ENTERPRISE'    // Enterprise/Company
  | 'DEPARTMENT'    // Department within an organization
  | 'BRANCH'        // Branch office
  | 'PARTNER'       // External partner organization
  | 'TENANT';       // Tenant organization

/**
 * Organization Status
 */
export type OrganizationStatus =
  | 'ACTIVE'        // Active
  | 'INACTIVE'      // Inactive
  | 'SUSPENDED'     // Suspended
  | 'PENDING';      // Pending approval

// ============================================================================
// Organization Type Definitions
// ============================================================================

/**
 * Organization Data Transfer Object
 * 
 * Represents an organizational unit in the system.
 */
export interface Organization {
  /** Organization ID */
  id: number;
  /** Organization code (unique) */
  code: string;
  /** Organization name */
  name: string;
  /** Organization type */
  type: OrganizationType;
  /** Organization status */
  status: OrganizationStatus;
  /** Description */
  description?: string;
  /** Parent organization ID (for hierarchical structure) */
  parentId?: number;
  /** Parent organization name */
  parentName?: string;
  /** Contact person */
  contactPerson?: string;
  /** Contact phone */
  contactPhone?: string;
  /** Contact email */
  contactEmail?: string;
  /** Address */
  address?: string;
  /** Logo URL */
  logoUrl?: string;
  /** Sort order */
  sortOrder: number;
  /** Child count */
  childCount: number;
  /** User count */
  userCount: number;
  /** Tenant ID */
  tenantId: string;
  /** Created at (ISO 8601 format) */
  createdAt: string;
  /** Updated at (ISO 8601 format) */
  updatedAt?: string;
  /** Created by */
  createdBy?: string;
}

/**
 * Organization Tree Node
 * 
 * Extends Organization with children for tree structure.
 */
export interface OrganizationTreeNode extends Organization {
  /** Child organizations */
  children?: OrganizationTreeNode[];
}

/**
 * Create Organization Parameters
 */
export interface CreateOrganizationParams {
  /** Organization code */
  code: string;
  /** Organization name */
  name: string;
  /** Organization type */
  type: OrganizationType;
  /** Description */
  description?: string;
  /** Parent organization ID */
  parentId?: number;
  /** Contact person */
  contactPerson?: string;
  /** Contact phone */
  contactPhone?: string;
  /** Contact email */
  contactEmail?: string;
  /** Address */
  address?: string;
  /** Logo URL */
  logoUrl?: string;
  /** Sort order */
  sortOrder?: number;
}

/**
 * Update Organization Parameters
 */
export interface UpdateOrganizationParams {
  /** Organization name */
  name?: string;
  /** Description */
  description?: string;
  /** Organization status */
  status?: OrganizationStatus;
  /** Contact person */
  contactPerson?: string;
  /** Contact phone */
  contactPhone?: string;
  /** Contact email */
  contactEmail?: string;
  /** Address */
  address?: string;
  /** Logo URL */
  logoUrl?: string;
  /** Sort order */
  sortOrder?: number;
}

/**
 * Organization List Query Parameters
 */
export interface OrganizationListQuery {
  /** Page number (0-based) */
  page?: number;
  /** Page size */
  size?: number;
  /** Search keyword */
  keyword?: string;
  /** Organization type filter */
  type?: OrganizationType;
  /** Status filter */
  status?: OrganizationStatus;
  /** Parent ID filter */
  parentId?: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortDir?: 'asc' | 'desc';
}

/**
 * Paginated Organization Response
 */
export interface PaginatedOrganizations {
  /** Organization list */
  content: Organization[];
  /** Total elements */
  totalElements: number;
  /** Total pages */
  totalPages: number;
  /** Current page number (0-based) */
  number: number;
  /** Page size */
  size: number;
  /** Whether first page */
  first: boolean;
  /** Whether last page */
  last: boolean;
}
