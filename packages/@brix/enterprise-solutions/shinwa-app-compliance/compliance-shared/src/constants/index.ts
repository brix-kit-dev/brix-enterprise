/**
 * @file Compliance Module Constants
 * @description Constants and configuration for compliance management module
 * @module @shinwa/compliance-shared
 * @version 3.0.0
 *
 * This file contains all shared constants including:
 * - Status display configurations
 * - API endpoint paths
 * - Label mappings
 * - Default values
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import type {
  ScriptTemplateStatus,
  ScriptCategory,
  ScriptScenario,
  ForbiddenWordSeverity,
  ForbiddenWordCategory,
  ComplianceCheckStatus,
} from '../types';

// ============================================================================
// Status Display Configuration
// ============================================================================

/**
 * Script template status display configuration
 */
export const SCRIPT_STATUS_CONFIG: Record<ScriptTemplateStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  DRAFT: {
    label: '草稿',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: '📝',
  },
  PENDING_REVIEW: {
    label: '待审核',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: '⏳',
  },
  PUBLISHED: {
    label: '已发布',
    color: '#059669',
    bgColor: '#D1FAE5',
    icon: '✅',
  },
  DEPRECATED: {
    label: '已停用',
    color: '#9CA3AF',
    bgColor: '#F3F4F6',
    icon: '⛔',
  },
  ARCHIVED: {
    label: '已归档',
    color: '#6B7280',
    bgColor: '#E5E7EB',
    icon: '📦',
  },
};

/**
 * Script category display configuration
 */
export const SCRIPT_CATEGORY_CONFIG: Record<ScriptCategory, {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  OPENING: {
    label: '开场白',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    description: '电话或沟通开始时的问候和开场',
  },
  INTRODUCTION: {
    label: '产品介绍',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    description: '产品或服务的详细介绍',
  },
  OBJECTION_HANDLING: {
    label: '异议处理',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    description: '应对客户质疑和反对意见',
  },
  CLOSING: {
    label: '促成成交',
    color: '#059669',
    bgColor: '#D1FAE5',
    description: '推动客户做出购买决策',
  },
  FOLLOW_UP: {
    label: '跟进回访',
    color: '#06B6D4',
    bgColor: '#CFFAFE',
    description: '后续跟进和回访话术',
  },
  COMPLAINT_HANDLING: {
    label: '投诉处理',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    description: '处理客户投诉和不满',
  },
  GENERIC: {
    label: '通用',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    description: '通用场景话术',
  },
};

/**
 * Script scenario display configuration
 */
export const SCRIPT_SCENARIO_CONFIG: Record<ScriptScenario, {
  label: string;
  icon: string;
}> = {
  PHONE_SALES: { label: '电话销售', icon: '📞' },
  PHONE_SERVICE: { label: '电话服务', icon: '☎️' },
  ONLINE_CHAT: { label: '在线客服', icon: '💬' },
  IN_PERSON: { label: '面对面', icon: '🤝' },
  EMAIL: { label: '邮件沟通', icon: '📧' },
  ALL: { label: '全渠道', icon: '🌐' },
};

/**
 * Forbidden word severity display configuration
 */
export const SEVERITY_CONFIG: Record<ForbiddenWordSeverity, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  priority: number;
}> = {
  LOW: {
    label: '低',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: 'ℹ️',
    priority: 1,
  },
  MEDIUM: {
    label: '中',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: '⚠️',
    priority: 2,
  },
  HIGH: {
    label: '高',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: '⛔',
    priority: 3,
  },
  CRITICAL: {
    label: '严重',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    icon: '🚨',
    priority: 4,
  },
};

/**
 * Forbidden word category display configuration
 */
export const FORBIDDEN_CATEGORY_CONFIG: Record<ForbiddenWordCategory, {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  LEGAL_RISK: {
    label: '法律风险',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    description: '可能导致法律纠纷的用语',
  },
  MISLEADING: {
    label: '误导性用语',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    description: '可能误导客户的表述',
  },
  PROMISE: {
    label: '虚假承诺',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    description: '无法兑现的承诺或保证',
  },
  DISCRIMINATION: {
    label: '歧视性用语',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    description: '带有歧视含义的表述',
  },
  COMPETITOR: {
    label: '竞品贬低',
    color: '#6366F1',
    bgColor: '#E0E7FF',
    description: '贬低竞争对手的用语',
  },
  SENSITIVE: {
    label: '敏感信息',
    color: '#0891B2',
    bgColor: '#CFFAFE',
    description: '涉及敏感信息的表述',
  },
  PROFANITY: {
    label: '不文明用语',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    description: '不符合文明规范的用语',
  },
};

/**
 * Compliance check status display configuration
 */
export const CHECK_STATUS_CONFIG: Record<ComplianceCheckStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  PASS: {
    label: '合规',
    color: '#059669',
    bgColor: '#D1FAE5',
    icon: '✅',
  },
  WARNING: {
    label: '警告',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: '⚠️',
  },
  FAIL: {
    label: '不合规',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: '❌',
  },
};

// ============================================================================
// Label Mappings
// ============================================================================

/**
 * Script category labels
 */
export const SCRIPT_CATEGORY_LABELS: Record<ScriptCategory, string> = {
  OPENING: '开场白',
  INTRODUCTION: '产品介绍',
  OBJECTION_HANDLING: '异议处理',
  CLOSING: '促成成交',
  FOLLOW_UP: '跟进回访',
  COMPLAINT_HANDLING: '投诉处理',
  GENERIC: '通用',
};

/**
 * Script scenario labels
 */
export const SCRIPT_SCENARIO_LABELS: Record<ScriptScenario, string> = {
  PHONE_SALES: '电话销售',
  PHONE_SERVICE: '电话服务',
  ONLINE_CHAT: '在线客服',
  IN_PERSON: '面对面',
  EMAIL: '邮件沟通',
  ALL: '全渠道',
};

/**
 * Forbidden word severity labels
 */
export const SEVERITY_LABELS: Record<ForbiddenWordSeverity, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  CRITICAL: '严重',
};

/**
 * Forbidden word category labels
 */
export const FORBIDDEN_CATEGORY_LABELS: Record<ForbiddenWordCategory, string> = {
  LEGAL_RISK: '法律风险',
  MISLEADING: '误导性用语',
  PROMISE: '虚假承诺',
  DISCRIMINATION: '歧视性用语',
  COMPETITOR: '竞品贬低',
  SENSITIVE: '敏感信息',
  PROFANITY: '不文明用语',
};

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * Compliance module API endpoints
 */
export const COMPLIANCE_API = {
  // Script Templates
  SCRIPTS: '/api/compliance/scripts',
  SCRIPT_BY_ID: (id: string) => `/api/compliance/scripts/${id}`,
  SCRIPT_PUBLISH: (id: string) => `/api/compliance/scripts/${id}/publish`,
  SCRIPT_DEPRECATE: (id: string) => `/api/compliance/scripts/${id}/deprecate`,
  SCRIPT_SUBMIT_REVIEW: (id: string) => `/api/compliance/scripts/${id}/submit-review`,

  // Forbidden Words
  FORBIDDEN_WORDS: '/api/compliance/forbidden-words',
  FORBIDDEN_WORD_BY_ID: (id: string) => `/api/compliance/forbidden-words/${id}`,
  FORBIDDEN_WORD_TOGGLE: (id: string) => `/api/compliance/forbidden-words/${id}/toggle`,

  // Compliance Checking
  CHECK: '/api/compliance/check',
  CHECK_BATCH: '/api/compliance/check/batch',

  // Audit Records
  AUDIT_RECORDS: '/api/compliance/audit-records',
  AUDIT_RECORD_BY_ID: (id: string) => `/api/compliance/audit-records/${id}`,
} as const;

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default page size for lists
 */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Maximum tags per script template
 */
export const MAX_SCRIPT_TAGS = 10;

/**
 * Maximum alternatives per forbidden word
 */
export const MAX_FORBIDDEN_ALTERNATIVES = 5;

/**
 * Maximum content length for compliance check
 */
export const MAX_CHECK_CONTENT_LENGTH = 50000;
