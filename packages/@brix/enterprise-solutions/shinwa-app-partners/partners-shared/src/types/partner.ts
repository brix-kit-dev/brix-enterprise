/**
 * @file Partners Module Shared Type Definitions
 * @description Core type definitions for partner business, shared by Web and Mobile
 * @module @shinwa/partners-shared/types
 * @version 3.0.0
 * 
 * Design Notes:
 * This file defines core business types for the partners module, following these principles:
 * 1. Consistent with backend DTOs
 * 2. No platform-specific types
 * 3. Use interfaces instead of classes for serialization
 * 
 * Type Categories:
 * - Partner related: Partner, PartnerType, PartnerStatus
 * - Operation parameters: CreatePartnerParams, UpdatePartnerParams, PartnerQueryParams
 * - Common types: PagedResponse, PageParams
 */

// ============================================================================
// Partner Type Enums
// ============================================================================

/**
 * Partner Type
 * 
 * Consistent with backend PartnerType enum
 */
export type PartnerType = 
  | 'HOSPITAL'     // Hospital
  | 'CLINIC'       // Clinic
  | 'AGENCY'       // Agency
  | 'TRANSLATOR'   // Translation service
  | 'TRANSPORT'    // Transportation service
  | 'HOTEL';       // Hotel accommodation

/**
 * Partner Status
 * 
 * Partnership lifecycle status
 */
export type PartnerStatus = 
  | 'PENDING'      // Pending approval
  | 'ACTIVE'       // Active
  | 'SUSPENDED'    // Suspended
  | 'TERMINATED';  // Terminated

// ============================================================================
// Partner Core Types
// ============================================================================

/**
 * Partner Data Transfer Object
 * 
 * Consistent with backend PartnerDTO
 */
export interface PartnerDTO {
  /** Partner ID */
  id: number;
  /** Partner number (business number) */
  partnerNo: string;
  /** Partner name (display name) */
  name: string;
  /** Partner type */
  type: PartnerType;
  /** Partnership status */
  status: PartnerStatus;
  /** Legal entity name */
  legalName: string;
  /** Business license number */
  businessLicense: string;
  /** Unified social credit code */
  unifiedCreditCode?: string;
  /** Contact person name */
  contactName: string;
  /** Contact phone */
  contactPhone: string;
  /** Contact email */
  contactEmail?: string;
  /** Detailed address */
  address: string;
  /** Province */
  province?: string;
  /** City */
  city?: string;
  /** District */
  district?: string;
  /** Postal code */
  postalCode?: string;
  /** Bank account name */
  bankAccountName?: string;
  /** Bank account number */
  bankAccountNo?: string;
  /** Bank name */
  bankName?: string;
  /** Cooperation start date (ISO 8601 format: YYYY-MM-DD) */
  cooperationStartDate?: string;
  /** Cooperation end date (ISO 8601 format: YYYY-MM-DD) */
  cooperationEndDate?: string;
  /** Cooperation level (1-5, 5 being highest) */
  cooperationLevel?: number;
  /** Credit score (0-100) */
  creditScore?: number;
  /** Remarks */
  remarks?: string;
  /** Created time (ISO 8601 format) */
  createdAt: string;
  /** Updated time (ISO 8601 format) */
  updatedAt?: string;
  /** Created by user ID */
  createdBy?: string;
  /** Updated by user ID */
  updatedBy?: string;
}

/**
 * Partner Summary
 * 
 * Used for list display, dropdown selections, etc.
 */
export interface PartnerSummary {
  /** Partner ID */
  id: number;
  /** Partner number */
  partnerNo: string;
  /** Partner name */
  name: string;
  /** Partner type */
  type: PartnerType;
  /** Partnership status */
  status: PartnerStatus;
  /** Contact person name */
  contactName: string;
  /** Contact phone */
  contactPhone: string;
}

// ============================================================================
// Operation Parameter Types
// ============================================================================

/**
 * Create Partner Parameters
 */
export interface CreatePartnerParams {
  /** Partner name */
  name: string;
  /** Partner type */
  type: PartnerType;
  /** Legal entity name */
  legalName: string;
  /** Business license number */
  businessLicense: string;
  /** Unified social credit code */
  unifiedCreditCode?: string;
  /** Contact person name */
  contactName: string;
  /** Contact phone */
  contactPhone: string;
  /** Contact email */
  contactEmail?: string;
  /** Detailed address */
  address: string;
  /** Province */
  province?: string;
  /** City */
  city?: string;
  /** District */
  district?: string;
  /** Postal code */
  postalCode?: string;
  /** Bank account name */
  bankAccountName?: string;
  /** Bank account number */
  bankAccountNo?: string;
  /** Bank name */
  bankName?: string;
  /** Cooperation start date */
  cooperationStartDate?: string;
  /** Cooperation end date */
  cooperationEndDate?: string;
  /** Remarks */
  remarks?: string;
}

/**
 * Update Partner Parameters
 */
export interface UpdatePartnerParams {
  /** Partner name */
  name?: string;
  /** Legal entity name */
  legalName?: string;
  /** Business license number */
  businessLicense?: string;
  /** Unified social credit code */
  unifiedCreditCode?: string;
  /** Contact person name */
  contactName?: string;
  /** Contact phone */
  contactPhone?: string;
  /** 联系邮箱 */
  contactEmail?: string;
  /** 详细地址 */
  address?: string;
  /** 省份 */
  province?: string;
  /** 城市 */
  city?: string;
  /** 区县 */
  district?: string;
  /** 邮政编码 */
  postalCode?: string;
  /** 银行账户名 */
  bankAccountName?: string;
  /** 银行账号 */
  bankAccountNo?: string;
  /** 开户行 */
  bankName?: string;
  /** 合作开始日期 */
  cooperationStartDate?: string;
  /** 合作结束日期 */
  cooperationEndDate?: string;
  /** 合作等级 */
  cooperationLevel?: number;
  /** 备注 */
  remarks?: string;
}

/**
 * 合作伙伴查询参数
 */
export interface PartnerQueryParams {
  /** 搜索关键字（匹配名称、编号、联系人） */
  keyword?: string;
  /** 合作伙伴类型 */
  type?: PartnerType;
  /** 合作状态 */
  status?: PartnerStatus;
  /** 省份 */
  province?: string;
  /** 城市 */
  city?: string;
  /** 合作等级（最小值） */
  minCooperationLevel?: number;
  /** 合作等级（最大值） */
  maxCooperationLevel?: number;
  /** 信用评分（最小值） */
  minCreditScore?: number;
  /** 信用评分（最大值） */
  maxCreditScore?: number;
  /** 合作开始日期（起始） */
  cooperationStartDateFrom?: string;
  /** 合作开始日期（截止） */
  cooperationStartDateTo?: string;
}

/**
 * 变更合作伙伴状态参数
 */
export interface ChangePartnerStatusParams {
  /** 目标状态 */
  status: PartnerStatus;
  /** 变更原因 */
  reason: string;
}

// ============================================================================
// 通用分页类型
// ============================================================================

/**
 * 分页参数
 */
export interface PageParams {
  /** 当前页码（从 1 开始） */
  page: number;
  /** 每页大小 */
  size: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页响应
 * 
 * 通用分页数据结构
 */
export interface PagedResponse<T> {
  /** 数据列表 */
  content: T[];
  /** 当前页码（从 1 开始） */
  page: number;
  /** 每页大小 */
  size: number;
  /** 总记录数 */
  totalElements: number;
  /** 总页数 */
  totalPages: number;
  /** 是否第一页 */
  first: boolean;
  /** 是否最后一页 */
  last: boolean;
}

// ============================================================================
// 类型别名（向后兼容）
// ============================================================================

/**
 * Partner 类型别名
 * 
 * @deprecated 推荐使用 PartnerDTO
 */
export type Partner = PartnerDTO;
