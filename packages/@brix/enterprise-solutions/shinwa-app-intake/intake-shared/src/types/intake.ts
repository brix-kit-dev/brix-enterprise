/**
 * @file Intake Module Core Type Definitions
 * @description Core business types for medical document intake, shared by Web and Mobile
 * @module @shinwa/intake-shared/types
 * @version 3.0.0
 *
 * Design Notes:
 * This file defines core business types for the intake module following principles:
 * 1. Consistent with backend DTOs (IntakeTaskDTO, IntakeChecklistItemDTO)
 * 2. No platform-specific types
 * 3. Use interfaces instead of classes for serialization
 *
 * Type Categories:
 * - Intake Task: IntakeTask, IntakeTaskStatus, IntakeTaskPriority
 * - Checklist Item: IntakeChecklistItem, IntakeItemStatus
 * - Document: IntakeDocumentCategory, IntakeReviewStatus
 * - Requests: CreateIntakeTaskRequest, SubmitDocumentRequest, ReviewDocumentRequest
 *
 * @author Shinwa Team
 * @date 2026-06-10
 */

// ============================================================================
// Intake Task Status Enums
// ============================================================================

/**
 * Intake Task Status
 *
 * The lifecycle status of a document intake task.
 * Follows the state machine defined in backend IntakeTaskStatusEnum.
 */
export type IntakeTaskStatus =
  | 'DRAFT'       // Draft - not yet sent to customer
  | 'ACTIVE'      // Active - customer can submit documents
  | 'IN_REVIEW'   // In Review - documents being reviewed
  | 'COMPLETED'   // Completed - all documents collected and approved
  | 'CANCELLED';  // Cancelled - task terminated

/**
 * Intake Task Priority
 *
 * The urgency level of an intake task.
 */
export type IntakeTaskPriority =
  | 'LOW'     // Low priority - standard processing
  | 'NORMAL'  // Normal priority - default level
  | 'HIGH'    // High priority - expedited processing
  | 'URGENT'; // Urgent - immediate attention required

// ============================================================================
// Checklist Item Status Enums
// ============================================================================

/**
 * Intake Item Status
 *
 * The status of a checklist item within an intake task.
 */
export type IntakeItemStatus =
  | 'PENDING'    // Pending - document not yet submitted
  | 'SUBMITTED'  // Submitted - document uploaded, awaiting review
  | 'APPROVED'   // Approved - document reviewed and accepted
  | 'REJECTED'   // Rejected - document rejected, resubmission needed
  | 'WAIVED';    // Waived - document requirement waived

/**
 * Intake Document Category
 *
 * Standard categories for medical documents.
 */
export type IntakeDocumentCategory =
  | 'IDENTITY'           // Identity documents (passport, ID card)
  | 'MEDICAL_RECORD'     // Medical records and history
  | 'LAB_REPORT'         // Laboratory test reports
  | 'IMAGING'            // Imaging studies (X-ray, MRI, CT)
  | 'PRESCRIPTION'       // Prescriptions and medication lists
  | 'INSURANCE'          // Insurance documents
  | 'CONSENT_FORM'       // Consent forms
  | 'REFERRAL'           // Referral letters
  | 'TRAVEL_DOCUMENT'    // Travel documents (visa, tickets)
  | 'FINANCIAL'          // Financial documents (payment proof)
  | 'OTHER';             // Other documents

/**
 * Intake Review Status
 *
 * The review decision for a submitted document.
 */
export type IntakeReviewStatus =
  | 'PENDING'   // Pending review
  | 'APPROVED'  // Approved by reviewer
  | 'REJECTED'; // Rejected by reviewer

// ============================================================================
// Intake Task Interface
// ============================================================================

/**
 * Intake Task
 *
 * Represents a document collection task for a medical case.
 * An intake task contains multiple checklist items, each representing
 * a document that needs to be collected from the customer.
 */
export interface IntakeTask {
  /** Unique identifier for the task */
  id: number;

  /** Reference to the parent case (nullable) */
  caseId?: number;

  /** Reference to the customer */
  customerId: number;

  /** Title of the intake task */
  title: string;

  /** Detailed description of the task */
  description?: string;

  /** Current status of the task */
  status: IntakeTaskStatus;

  /** Priority level of the task */
  priority: IntakeTaskPriority;

  /** Due date for document submission (ISO date string) */
  dueDate?: string;

  /** ID of the assigned reviewer */
  assignedReviewerId?: string;

  /** Name of the assigned reviewer */
  assignedReviewerName?: string;

  /** Checklist items for this task */
  checklistItems: IntakeChecklistItem[];

  /** Total number of checklist items */
  totalItems: number;

  /** Number of completed (approved) items */
  completedItems: number;

  /** Completion percentage (0-100) */
  completionPercentage: number;

  /** Additional notes for the task */
  notes?: string;

  /** ID of the user who created the task */
  createdBy: string;

  /** Creation timestamp (ISO datetime string) */
  createdAt: string;

  /** ID of the user who last updated the task */
  updatedBy?: string;

  /** Last update timestamp (ISO datetime string) */
  updatedAt?: string;
}

// ============================================================================
// Checklist Item Interface
// ============================================================================

/**
 * Intake Checklist Item
 *
 * Represents a single document requirement within an intake task.
 * Each item tracks the submission and review status of a specific document.
 */
export interface IntakeChecklistItem {
  /** Unique identifier for the item */
  id: number;

  /** Reference to the parent task */
  taskId: number;

  /** Name of the required document */
  documentName: string;

  /** Description of the document requirements */
  description?: string;

  /** Category of the document */
  category: IntakeDocumentCategory;

  /** Whether this document is required or optional */
  isRequired: boolean;

  /** Current status of the item */
  status: IntakeItemStatus;

  /** Display order within the task */
  displayOrder: number;

  /** ID of the submitted document (when submitted) */
  submittedDocumentId?: string;

  /** Original filename of the submitted document */
  submittedFileName?: string;

  /** File size in bytes */
  submittedFileSize?: number;

  /** MIME type of the submitted file */
  submittedFileMimeType?: string;

  /** Timestamp when the document was submitted (ISO datetime string) */
  submittedAt?: string;

  /** ID of the user who submitted the document */
  submittedBy?: string;

  /** Current review status */
  reviewStatus?: IntakeReviewStatus;

  /** ID of the reviewer */
  reviewedBy?: string;

  /** Timestamp when the document was reviewed (ISO datetime string) */
  reviewedAt?: string;

  /** Reviewer's comments */
  reviewComment?: string;

  /** Reason for rejection (when rejected) */
  rejectionReason?: string;

  /** Whether a resubmission is allowed */
  allowResubmission: boolean;
}

// ============================================================================
// Request Interfaces
// ============================================================================

/**
 * Create Intake Task Request
 *
 * Request payload for creating a new intake task.
 */
export interface CreateIntakeTaskRequest {
  /** ID of the associated case (optional) */
  caseId?: number;

  /** ID of the customer */
  customerId: number;

  /** Title of the task */
  title: string;

  /** Description of the task */
  description?: string;

  /** Priority level */
  priority?: IntakeTaskPriority;

  /** Due date (ISO date string) */
  dueDate?: string;

  /** ID of the assigned reviewer */
  assignedReviewerId?: string;

  /** Initial checklist items */
  checklistItems?: CreateChecklistItemRequest[];

  /** Additional notes */
  notes?: string;
}

/**
 * Create Checklist Item Request
 *
 * Request payload for creating a checklist item.
 */
export interface CreateChecklistItemRequest {
  /** Name of the required document */
  documentName: string;

  /** Description of requirements */
  description?: string;

  /** Document category */
  category: IntakeDocumentCategory;

  /** Whether the document is required */
  isRequired?: boolean;

  /** Display order */
  displayOrder?: number;
}

/**
 * Update Intake Task Request
 *
 * Request payload for updating an existing intake task.
 */
export interface UpdateIntakeTaskRequest {
  /** Updated title */
  title?: string;

  /** Updated description */
  description?: string;

  /** Updated priority */
  priority?: IntakeTaskPriority;

  /** Updated due date */
  dueDate?: string;

  /** Updated reviewer assignment */
  assignedReviewerId?: string;

  /** Updated notes */
  notes?: string;
}

/**
 * Submit Document Request
 *
 * Request payload for submitting a document to a checklist item.
 */
export interface SubmitDocumentRequest {
  /** ID of the checklist item */
  itemId: number;

  /** ID of the uploaded document */
  documentId: string;

  /** Original filename */
  fileName: string;

  /** File size in bytes */
  fileSize: number;

  /** MIME type */
  mimeType: string;
}

/**
 * Review Document Request
 *
 * Request payload for reviewing a submitted document.
 */
export interface ReviewDocumentRequest {
  /** ID of the checklist item */
  itemId: number;

  /** Review decision */
  decision: IntakeReviewStatus;

  /** Reviewer's comment */
  comment?: string;

  /** Reason for rejection (required when decision is REJECTED) */
  rejectionReason?: string;

  /** Whether resubmission is allowed (when rejected) */
  allowResubmission?: boolean;
}

// ============================================================================
// List/Page Response Types
// ============================================================================

/**
 * Paginated Response
 *
 * Generic wrapper for paginated API responses.
 */
export interface PageResponse<T> {
  /** Content items for the current page */
  content: T[];

  /** Current page number (0-based) */
  page: number;

  /** Page size */
  size: number;

  /** Total number of elements */
  totalElements: number;

  /** Total number of pages */
  totalPages: number;

  /** Whether this is the first page */
  first: boolean;

  /** Whether this is the last page */
  last: boolean;
}

/**
 * Intake Task List Filter
 *
 * Filter parameters for listing intake tasks.
 */
export interface IntakeTaskFilter {
  /** Filter by customer ID */
  customerId?: number;

  /** Filter by status */
  status?: IntakeTaskStatus;

  /** Filter by reviewer ID */
  reviewerId?: string;

  /** Filter by due date from */
  dueDateFrom?: string;

  /** Filter by due date to */
  dueDateTo?: string;

  /** Search keyword */
  keyword?: string;

  /** Page number */
  page?: number;

  /** Page size */
  size?: number;

  /** Sort field */
  sort?: string;

  /** Sort direction */
  direction?: 'asc' | 'desc';
}

// ============================================================================
// Summary/Statistics Types
// ============================================================================

/**
 * Intake Task Summary
 *
 * Summary statistics for intake tasks.
 */
export interface IntakeTaskSummary {
  /** Total number of tasks */
  totalTasks: number;

  /** Number of draft tasks */
  draftTasks: number;

  /** Number of active tasks */
  activeTasks: number;

  /** Number of tasks in review */
  inReviewTasks: number;

  /** Number of completed tasks */
  completedTasks: number;

  /** Number of cancelled tasks */
  cancelledTasks: number;

  /** Number of overdue tasks */
  overdueTasks: number;

  /** Average completion percentage */
  averageCompletion: number;
}
