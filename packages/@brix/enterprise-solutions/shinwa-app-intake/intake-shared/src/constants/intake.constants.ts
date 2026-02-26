/**
 * @file Intake Module Constants
 * @description Constant values for the intake module, shared by Web and Mobile
 * @module @shinwa/intake-shared/constants
 * @version 3.0.0
 *
 * @author Shinwa Team
 * @date 2026-06-10
 */

import type { 
  IntakeTaskStatus, 
  IntakeTaskPriority, 
  IntakeItemStatus, 
  IntakeDocumentCategory,
  IntakeReviewStatus 
} from '../types';

// ============================================================================
// Status Constants
// ============================================================================

/**
 * All available intake task statuses.
 */
export const INTAKE_TASK_STATUSES: IntakeTaskStatus[] = [
  'DRAFT',
  'ACTIVE',
  'IN_REVIEW',
  'COMPLETED',
  'CANCELLED',
];

/**
 * Display labels for intake task statuses.
 */
export const INTAKE_TASK_STATUS_LABELS: Record<IntakeTaskStatus, string> = {
  DRAFT: '草稿',
  ACTIVE: '进行中',
  IN_REVIEW: '审核中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

/**
 * English display labels for intake task statuses.
 */
export const INTAKE_TASK_STATUS_LABELS_EN: Record<IntakeTaskStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  IN_REVIEW: 'In Review',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

/**
 * Color mappings for intake task statuses.
 */
export const INTAKE_TASK_STATUS_COLORS: Record<IntakeTaskStatus, string> = {
  DRAFT: 'default',
  ACTIVE: 'primary',
  IN_REVIEW: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

// ============================================================================
// Priority Constants
// ============================================================================

/**
 * All available intake task priorities.
 */
export const INTAKE_TASK_PRIORITIES: IntakeTaskPriority[] = [
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT',
];

/**
 * Display labels for intake task priorities.
 */
export const INTAKE_TASK_PRIORITY_LABELS: Record<IntakeTaskPriority, string> = {
  LOW: '低',
  NORMAL: '普通',
  HIGH: '高',
  URGENT: '紧急',
};

/**
 * English display labels for intake task priorities.
 */
export const INTAKE_TASK_PRIORITY_LABELS_EN: Record<IntakeTaskPriority, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
};

/**
 * Color mappings for intake task priorities.
 */
export const INTAKE_TASK_PRIORITY_COLORS: Record<IntakeTaskPriority, string> = {
  LOW: 'info',
  NORMAL: 'default',
  HIGH: 'warning',
  URGENT: 'error',
};

// ============================================================================
// Checklist Item Status Constants
// ============================================================================

/**
 * All available checklist item statuses.
 */
export const INTAKE_ITEM_STATUSES: IntakeItemStatus[] = [
  'PENDING',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'WAIVED',
];

/**
 * Display labels for checklist item statuses.
 */
export const INTAKE_ITEM_STATUS_LABELS: Record<IntakeItemStatus, string> = {
  PENDING: '待提交',
  SUBMITTED: '已提交',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
  WAIVED: '已豁免',
};

/**
 * English display labels for checklist item statuses.
 */
export const INTAKE_ITEM_STATUS_LABELS_EN: Record<IntakeItemStatus, string> = {
  PENDING: 'Pending',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  WAIVED: 'Waived',
};

/**
 * Color mappings for checklist item statuses.
 */
export const INTAKE_ITEM_STATUS_COLORS: Record<IntakeItemStatus, string> = {
  PENDING: 'default',
  SUBMITTED: 'info',
  APPROVED: 'success',
  REJECTED: 'error',
  WAIVED: 'secondary',
};

// ============================================================================
// Document Category Constants
// ============================================================================

/**
 * All available document categories.
 */
export const INTAKE_DOCUMENT_CATEGORIES: IntakeDocumentCategory[] = [
  'IDENTITY',
  'MEDICAL_RECORD',
  'LAB_REPORT',
  'IMAGING',
  'PRESCRIPTION',
  'INSURANCE',
  'CONSENT_FORM',
  'REFERRAL',
  'TRAVEL_DOCUMENT',
  'FINANCIAL',
  'OTHER',
];

/**
 * Display labels for document categories.
 */
export const INTAKE_DOCUMENT_CATEGORY_LABELS: Record<IntakeDocumentCategory, string> = {
  IDENTITY: '身份证明',
  MEDICAL_RECORD: '病历资料',
  LAB_REPORT: '检验报告',
  IMAGING: '影像资料',
  PRESCRIPTION: '处方单',
  INSURANCE: '保险文件',
  CONSENT_FORM: '同意书',
  REFERRAL: '转诊函',
  TRAVEL_DOCUMENT: '出行文件',
  FINANCIAL: '财务文件',
  OTHER: '其他',
};

/**
 * English display labels for document categories.
 */
export const INTAKE_DOCUMENT_CATEGORY_LABELS_EN: Record<IntakeDocumentCategory, string> = {
  IDENTITY: 'Identity Document',
  MEDICAL_RECORD: 'Medical Record',
  LAB_REPORT: 'Lab Report',
  IMAGING: 'Medical Imaging',
  PRESCRIPTION: 'Prescription',
  INSURANCE: 'Insurance Document',
  CONSENT_FORM: 'Consent Form',
  REFERRAL: 'Referral Letter',
  TRAVEL_DOCUMENT: 'Travel Document',
  FINANCIAL: 'Financial Document',
  OTHER: 'Other',
};

/**
 * Icon mappings for document categories (Material Icons).
 */
export const INTAKE_DOCUMENT_CATEGORY_ICONS: Record<IntakeDocumentCategory, string> = {
  IDENTITY: 'badge',
  MEDICAL_RECORD: 'medical_information',
  LAB_REPORT: 'biotech',
  IMAGING: 'image_search',
  PRESCRIPTION: 'medication',
  INSURANCE: 'health_and_safety',
  CONSENT_FORM: 'description',
  REFERRAL: 'forward_to_inbox',
  TRAVEL_DOCUMENT: 'flight',
  FINANCIAL: 'payments',
  OTHER: 'insert_drive_file',
};

// ============================================================================
// Review Status Constants
// ============================================================================

/**
 * All available review statuses.
 */
export const INTAKE_REVIEW_STATUSES: IntakeReviewStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
];

/**
 * Display labels for review statuses.
 */
export const INTAKE_REVIEW_STATUS_LABELS: Record<IntakeReviewStatus, string> = {
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
};

/**
 * English display labels for review statuses.
 */
export const INTAKE_REVIEW_STATUS_LABELS_EN: Record<IntakeReviewStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

// ============================================================================
// API Constants
// ============================================================================

/**
 * API base path for intake endpoints.
 */
export const INTAKE_API_BASE_PATH = '/api/v1/intake';

/**
 * API endpoints for intake operations.
 */
export const INTAKE_API_ENDPOINTS = {
  /** Tasks CRUD endpoints */
  TASKS: `${INTAKE_API_BASE_PATH}/tasks`,
  /** Task detail endpoint (append /{id}) */
  TASK_DETAIL: (id: number) => `${INTAKE_API_BASE_PATH}/tasks/${id}`,
  /** Task activation endpoint */
  TASK_ACTIVATE: (id: number) => `${INTAKE_API_BASE_PATH}/tasks/${id}/activate`,
  /** Task cancellation endpoint */
  TASK_CANCEL: (id: number) => `${INTAKE_API_BASE_PATH}/tasks/${id}/cancel`,
  /** Document submission endpoint */
  SUBMIT_DOCUMENT: (taskId: number) => `${INTAKE_API_BASE_PATH}/tasks/${taskId}/documents`,
  /** Document review endpoint */
  REVIEW_DOCUMENT: (taskId: number) => `${INTAKE_API_BASE_PATH}/tasks/${taskId}/review`,
  /** Tasks by case endpoint */
  TASKS_BY_CASE: (caseId: number) => `${INTAKE_API_BASE_PATH}/tasks/by-case/${caseId}`,
  /** Task search endpoint */
  SEARCH: `${INTAKE_API_BASE_PATH}/tasks/search`,
} as const;

// ============================================================================
// Validation Constants
// ============================================================================

/**
 * Maximum length for task title.
 */
export const INTAKE_TASK_TITLE_MAX_LENGTH = 200;

/**
 * Maximum length for task description.
 */
export const INTAKE_TASK_DESCRIPTION_MAX_LENGTH = 2000;

/**
 * Maximum length for document name.
 */
export const INTAKE_DOCUMENT_NAME_MAX_LENGTH = 200;

/**
 * Maximum length for review comment.
 */
export const INTAKE_REVIEW_COMMENT_MAX_LENGTH = 1000;

/**
 * Maximum file size for document upload (50MB).
 */
export const INTAKE_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/**
 * Allowed MIME types for document upload.
 */
export const INTAKE_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/**
 * Default page size for list queries.
 */
export const INTAKE_DEFAULT_PAGE_SIZE = 20;

/**
 * Maximum page size for list queries.
 */
export const INTAKE_MAX_PAGE_SIZE = 100;
