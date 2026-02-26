/**
 * @file Intake Module Event Definitions
 * @description Event types for intake module integration via EventBusCapability
 * @module @shinwa/intake-shared/events
 * @version 3.0.0
 *
 * Design Notes:
 * Events follow the v3.0.4 Runtime Shell Architecture event-driven integration pattern.
 * All events are published through EventBusCapability for loose coupling between modules.
 *
 * Event Categories:
 * - Task Events: Task creation, activation, completion, cancellation
 * - Document Events: Document submission, review
 * - Integration Events: Events for cross-module communication
 *
 * @author Shinwa Team
 * @date 2026-06-10
 */

import type { 
  IntakeTaskStatus, 
  IntakeReviewStatus, 
  IntakeDocumentCategory 
} from '../types';

// ============================================================================
// Event Topic Constants
// ============================================================================

/**
 * Event topic namespace for intake module.
 */
export const INTAKE_EVENT_NAMESPACE = 'intake';

/**
 * Event topics for intake module.
 */
export const INTAKE_EVENT_TOPICS = {
  /** Task created event topic */
  TASK_CREATED: `${INTAKE_EVENT_NAMESPACE}.task.created`,
  /** Task activated event topic */
  TASK_ACTIVATED: `${INTAKE_EVENT_NAMESPACE}.task.activated`,
  /** Task completed event topic */
  TASK_COMPLETED: `${INTAKE_EVENT_NAMESPACE}.task.completed`,
  /** Task cancelled event topic */
  TASK_CANCELLED: `${INTAKE_EVENT_NAMESPACE}.task.cancelled`,
  /** Document submitted event topic */
  DOCUMENT_SUBMITTED: `${INTAKE_EVENT_NAMESPACE}.document.submitted`,
  /** Document reviewed event topic */
  DOCUMENT_REVIEWED: `${INTAKE_EVENT_NAMESPACE}.document.reviewed`,
  /** Progress updated event topic */
  PROGRESS_UPDATED: `${INTAKE_EVENT_NAMESPACE}.progress.updated`,
} as const;

// ============================================================================
// Base Event Interface
// ============================================================================

/**
 * Base Event Interface
 *
 * Common properties for all intake events.
 */
export interface IntakeBaseEvent {
  /** Event type identifier */
  type: string;
  /** Timestamp when the event occurred (ISO datetime string) */
  timestamp: string;
  /** ID of the user who triggered the event */
  userId: string;
  /** Correlation ID for tracing related events */
  correlationId?: string;
}

// ============================================================================
// Task Events
// ============================================================================

/**
 * Intake Task Created Event
 *
 * Published when a new intake task is created.
 */
export interface IntakeTaskCreatedEvent extends IntakeBaseEvent {
  type: typeof INTAKE_EVENT_TOPICS.TASK_CREATED;
  payload: {
    /** ID of the created task */
    taskId: number;
    /** ID of the associated case (if any) */
    caseId?: number;
    /** ID of the customer */
    customerId: number;
    /** Title of the task */
    title: string;
    /** Number of checklist items */
    itemCount: number;
    /** Due date (ISO date string) */
    dueDate?: string;
  };
}

/**
 * Intake Task Activated Event
 *
 * Published when an intake task is activated for customer submission.
 */
export interface IntakeTaskActivatedEvent extends IntakeBaseEvent {
  type: typeof INTAKE_EVENT_TOPICS.TASK_ACTIVATED;
  payload: {
    /** ID of the activated task */
    taskId: number;
    /** ID of the associated case (if any) */
    caseId?: number;
    /** ID of the customer */
    customerId: number;
  };
}

/**
 * Intake Task Completed Event
 *
 * Published when all documents in an intake task are approved.
 */
export interface IntakeTaskCompletedEvent extends IntakeBaseEvent {
  type: typeof INTAKE_EVENT_TOPICS.TASK_COMPLETED;
  payload: {
    /** ID of the completed task */
    taskId: number;
    /** ID of the associated case (if any) */
    caseId?: number;
    /** ID of the customer */
    customerId: number;
    /** Total number of documents collected */
    documentCount: number;
    /** Completion timestamp */
    completedAt: string;
  };
}

/**
 * Intake Task Cancelled Event
 *
 * Published when an intake task is cancelled.
 */
export interface IntakeTaskCancelledEvent extends IntakeBaseEvent {
  type: typeof INTAKE_EVENT_TOPICS.TASK_CANCELLED;
  payload: {
    /** ID of the cancelled task */
    taskId: number;
    /** ID of the associated case (if any) */
    caseId?: number;
    /** Reason for cancellation */
    reason?: string;
  };
}

// ============================================================================
// Document Events
// ============================================================================

/**
 * Intake Document Submitted Event
 *
 * Published when a customer submits a document.
 */
export interface IntakeDocumentSubmittedEvent extends IntakeBaseEvent {
  type: typeof INTAKE_EVENT_TOPICS.DOCUMENT_SUBMITTED;
  payload: {
    /** ID of the task */
    taskId: number;
    /** ID of the checklist item */
    itemId: number;
    /** ID of the uploaded document */
    documentId: string;
    /** Name of the document requirement */
    documentName: string;
    /** Category of the document */
    category: IntakeDocumentCategory;
    /** Original filename */
    fileName: string;
    /** File size in bytes */
    fileSize: number;
  };
}

/**
 * Intake Document Reviewed Event
 *
 * Published when a reviewer approves or rejects a document.
 */
export interface IntakeDocumentReviewedEvent extends IntakeBaseEvent {
  type: typeof INTAKE_EVENT_TOPICS.DOCUMENT_REVIEWED;
  payload: {
    /** ID of the task */
    taskId: number;
    /** ID of the checklist item */
    itemId: number;
    /** Review decision */
    decision: IntakeReviewStatus;
    /** Reviewer's comment */
    comment?: string;
    /** Rejection reason (if rejected) */
    rejectionReason?: string;
  };
}

// ============================================================================
// Progress Events
// ============================================================================

/**
 * Intake Progress Updated Event
 *
 * Published when the overall progress of an intake task changes.
 */
export interface IntakeProgressUpdatedEvent extends IntakeBaseEvent {
  type: typeof INTAKE_EVENT_TOPICS.PROGRESS_UPDATED;
  payload: {
    /** ID of the task */
    taskId: number;
    /** ID of the associated case (if any) */
    caseId?: number;
    /** Previous status */
    previousStatus: IntakeTaskStatus;
    /** New status */
    newStatus: IntakeTaskStatus;
    /** Total number of items */
    totalItems: number;
    /** Number of completed items */
    completedItems: number;
    /** Completion percentage (0-100) */
    completionPercentage: number;
  };
}

// ============================================================================
// Event Union Type
// ============================================================================

/**
 * Union type of all intake events.
 */
export type IntakeEvent =
  | IntakeTaskCreatedEvent
  | IntakeTaskActivatedEvent
  | IntakeTaskCompletedEvent
  | IntakeTaskCancelledEvent
  | IntakeDocumentSubmittedEvent
  | IntakeDocumentReviewedEvent
  | IntakeProgressUpdatedEvent;

// ============================================================================
// Event Factory Functions
// ============================================================================

/**
 * Creates a base event with common properties.
 *
 * @param type - Event type
 * @param userId - User ID
 * @param correlationId - Optional correlation ID
 * @returns Base event properties
 */
export function createBaseEvent(
  type: string,
  userId: string,
  correlationId?: string
): IntakeBaseEvent {
  return {
    type,
    timestamp: new Date().toISOString(),
    userId,
    correlationId,
  };
}

/**
 * Creates an IntakeTaskCreatedEvent.
 *
 * @param userId - User who created the task
 * @param payload - Event payload
 * @param correlationId - Optional correlation ID
 * @returns The event object
 */
export function createTaskCreatedEvent(
  userId: string,
  payload: IntakeTaskCreatedEvent['payload'],
  correlationId?: string
): IntakeTaskCreatedEvent {
  return {
    ...createBaseEvent(INTAKE_EVENT_TOPICS.TASK_CREATED, userId, correlationId),
    type: INTAKE_EVENT_TOPICS.TASK_CREATED,
    payload,
  };
}

/**
 * Creates an IntakeDocumentSubmittedEvent.
 *
 * @param userId - User who submitted the document
 * @param payload - Event payload
 * @param correlationId - Optional correlation ID
 * @returns The event object
 */
export function createDocumentSubmittedEvent(
  userId: string,
  payload: IntakeDocumentSubmittedEvent['payload'],
  correlationId?: string
): IntakeDocumentSubmittedEvent {
  return {
    ...createBaseEvent(INTAKE_EVENT_TOPICS.DOCUMENT_SUBMITTED, userId, correlationId),
    type: INTAKE_EVENT_TOPICS.DOCUMENT_SUBMITTED,
    payload,
  };
}

/**
 * Creates an IntakeTaskCompletedEvent.
 *
 * @param userId - User who triggered the completion
 * @param payload - Event payload
 * @param correlationId - Optional correlation ID
 * @returns The event object
 */
export function createTaskCompletedEvent(
  userId: string,
  payload: IntakeTaskCompletedEvent['payload'],
  correlationId?: string
): IntakeTaskCompletedEvent {
  return {
    ...createBaseEvent(INTAKE_EVENT_TOPICS.TASK_COMPLETED, userId, correlationId),
    type: INTAKE_EVENT_TOPICS.TASK_COMPLETED,
    payload,
  };
}
