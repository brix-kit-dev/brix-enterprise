/**
 * @file Contract Module Constants
 * @description Constant definitions and display configurations for contracts module
 * @module @shinwa/contracts-shared/constants
 * @version 3.0.0
 * 
 * @author Shinwa Team
 * @date 2026-02-23
 */

import type { ContractStatusConfig, TemplateStatusConfig } from '../types';

// ============================================================================
// Status Constants
// ============================================================================

/**
 * Contract Status Enum Values
 */
export const CONTRACT_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  PENDING_SIGNATURE: 'PENDING_SIGNATURE',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  TERMINATED: 'TERMINATED',
} as const;

/**
 * Template Status Enum Values
 */
export const TEMPLATE_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;

/**
 * Signature Status Enum Values
 */
export const SIGNATURE_STATUS = {
  PENDING: 'PENDING',
  SIGNED: 'SIGNED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
} as const;

// ============================================================================
// Display Configuration
// ============================================================================

/**
 * Contract Status Display Configuration
 * Maps status values to display properties (label, color, icon)
 */
export const CONTRACT_STATUS_CONFIG: Record<string, ContractStatusConfig> = {
  DRAFT: {
    label: '草稿',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: '📝',
  },
  PENDING_APPROVAL: {
    label: '待审批',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: '⏳',
  },
  APPROVED: {
    label: '已审批',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    icon: '✅',
  },
  PENDING_SIGNATURE: {
    label: '待签署',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    icon: '✍️',
  },
  ACTIVE: {
    label: '生效中',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: '📋',
  },
  EXPIRED: {
    label: '已过期',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: '⌛',
  },
  TERMINATED: {
    label: '已终止',
    color: '#6B7280',
    bgColor: '#E5E7EB',
    icon: '🚫',
  },
};

/**
 * Template Status Display Configuration
 */
export const TEMPLATE_STATUS_CONFIG: Record<string, TemplateStatusConfig> = {
  DRAFT: {
    label: '草稿',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: '📝',
  },
  ACTIVE: {
    label: '已启用',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: '✅',
  },
  ARCHIVED: {
    label: '已归档',
    color: '#6B7280',
    bgColor: '#E5E7EB',
    icon: '📦',
  },
};

/**
 * Signature Status Display Configuration
 */
export const SIGNATURE_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  PENDING: {
    label: '待签署',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: '⏳',
  },
  SIGNED: {
    label: '已签署',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: '✅',
  },
  DECLINED: {
    label: '已拒绝',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: '❌',
  },
  EXPIRED: {
    label: '已过期',
    color: '#6B7280',
    bgColor: '#E5E7EB',
    icon: '⌛',
  },
};

// ============================================================================
// Page IDs
// ============================================================================

/**
 * Contract Page IDs for navigation and analytics
 */
export const CONTRACT_PAGE_IDS = {
  // Contract Template Pages
  TEMPLATE_LIST: 'contracts-template-list',
  TEMPLATE_DETAIL: 'contracts-template-detail',
  TEMPLATE_CREATE: 'contracts-template-create',
  TEMPLATE_EDIT: 'contracts-template-edit',
  // Contract Instance Pages
  LIST: 'contracts-list',
  DETAIL: 'contracts-detail',
  CREATE: 'contracts-create',
  EDIT: 'contracts-edit',
} as const;

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * Contract API Endpoints
 * 
 * Centralized API endpoint definitions for consistency between
 * frontend repositories and backend controllers.
 */
export const CONTRACTS_API = {
  // Template endpoints
  TEMPLATES: '/api/contracts/templates',
  TEMPLATE_BY_ID: (id: number) => `/api/contracts/templates/${id}`,
  TEMPLATE_ACTIVATE: (id: number) => `/api/contracts/templates/${id}/activate`,
  TEMPLATE_ARCHIVE: (id: number) => `/api/contracts/templates/${id}/archive`,
  
  // Contract instance endpoints
  CONTRACTS: '/api/contracts',
  CONTRACT_BY_ID: (id: number) => `/api/contracts/${id}`,
  CONTRACT_STATUS: (id: number) => `/api/contracts/${id}/status`,
  CONTRACT_APPROVE: (id: number) => `/api/contracts/${id}/approve`,
  CONTRACT_PARTIES: (id: number) => `/api/contracts/${id}/parties`,
  CONTRACT_SIGN: (id: number, partyId: number) => `/api/contracts/${id}/parties/${partyId}/sign`,
} as const;

// ============================================================================
// Variable Types
// ============================================================================

/**
 * Template Variable Type Labels
 */
export const VARIABLE_TYPE_LABELS: Record<string, string> = {
  TEXT: '文本',
  NUMBER: '数字',
  DATE: '日期',
  SELECT: '单选',
  MULTI_SELECT: '多选',
  CURRENCY: '金额',
};

/**
 * Party Type Labels
 */
export const PARTY_TYPE_LABELS: Record<string, string> = {
  PARTY_A: '甲方',
  PARTY_B: '乙方',
  PARTY_C: '丙方',
  WITNESS: '见证方',
  GUARANTOR: '担保方',
};
