/**
 * @file Intake Review Hook
 * @description ViewModel layer for document review workflow
 * @module @shinwa/intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Manages the document review workflow for reviewers.
 * Handles reviewing, approving, and rejecting submitted documents.
 *
 * @author Shinwa Team
 * @date 2026-06-10
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useHttp } from '@brix/runtime-sdk-react';
import type {
  IntakeTask,
  IntakeChecklistItem,
  ReviewDocumentRequest,
  IntakeReviewStatus,
} from '@shinwa/intake-shared';
import { createIntakeRepository } from '../repositories';

// ============================================================================
// Review Hook Types
// ============================================================================

/**
 * Review state for a single document
 */
export interface DocumentReviewState {
  /** Checklist item ID */
  itemId: number;
  /** Review decision */
  decision: IntakeReviewStatus | null;
  /** Review comment */
  comment: string;
  /** Rejection reason (when rejecting) */
  rejectionReason: string;
  /** Whether resubmission is allowed (when rejecting) */
  allowResubmission: boolean;
  /** Whether the review is being submitted */
  isSubmitting: boolean;
  /** Error message if submission failed */
  errorMessage?: string;
}

/**
 * Intake Review Hook Return Type
 */
export interface UseIntakeReviewResult {
  /** Current task data */
  task: IntakeTask | null;
  /** Loading state */
  isLoading: boolean;
  /** Error object */
  error: Error | null;
  /** Items pending review */
  pendingItems: IntakeChecklistItem[];
  /** Items already reviewed */
  reviewedItems: IntakeChecklistItem[];
  /** Current review state for the selected item */
  currentReview: DocumentReviewState | null;
  /** Currently selected item for review */
  selectedItem: IntakeChecklistItem | null;
  /** Select an item for review */
  selectItem: (itemId: number) => void;
  /** Update review decision */
  setDecision: (decision: IntakeReviewStatus) => void;
  /** Update review comment */
  setComment: (comment: string) => void;
  /** Update rejection reason */
  setRejectionReason: (reason: string) => void;
  /** Toggle allow resubmission */
  setAllowResubmission: (allow: boolean) => void;
  /** Submit the review */
  submitReview: () => Promise<void>;
  /** Approve document (shorthand) */
  approveDocument: (itemId: number, comment?: string) => Promise<void>;
  /** Reject document (shorthand) */
  rejectDocument: (
    itemId: number,
    reason: string,
    allowResubmission?: boolean
  ) => Promise<void>;
  /** Refresh task data */
  refresh: () => Promise<void>;
}

// ============================================================================
// Review Hook Implementation
// ============================================================================

/**
 * Intake Review Hook
 *
 * Manages document review workflow for reviewers.
 *
 * @param taskId - The ID of the intake task to review
 * @returns Review state and operation methods
 *
 * @example
 * ```tsx
 * const {
 *   task,
 *   pendingItems,
 *   selectItem,
 *   approveDocument,
 *   rejectDocument
 * } = useIntakeReview(123);
 *
 * // Quick approve
 * await approveDocument(itemId, 'Looks good');
 *
 * // Detailed review
 * selectItem(itemId);
 * setDecision('REJECTED');
 * setRejectionReason('Document is blurry');
 * setAllowResubmission(true);
 * await submitReview();
 * ```
 */
export function useIntakeReview(taskId: number | undefined): UseIntakeReviewResult {
  const http = useHttp();

  // State
  const [task, setTask] = useState<IntakeTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [currentReview, setCurrentReview] = useState<DocumentReviewState | null>(null);

  // Create repository
  const repository = useMemo(() => createIntakeRepository(http), [http]);

  /**
   * Fetch task data
   */
  const fetchTask = useCallback(async () => {
    if (!taskId) {
      setTask(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await repository.getTaskById(taskId);
      setTask(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch task');
      setError(error);
      console.error('Failed to fetch intake task:', err);
    } finally {
      setIsLoading(false);
    }
  }, [repository, taskId]);

  // Fetch on mount and when taskId changes
  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  /**
   * Refresh task data
   */
  const refresh = useCallback(async () => {
    await fetchTask();
  }, [fetchTask]);

  /**
   * Items pending review (submitted but not yet reviewed)
   */
  const pendingItems = useMemo(() => {
    if (!task) return [];
    return task.checklistItems.filter((item) => item.status === 'SUBMITTED');
  }, [task]);

  /**
   * Items already reviewed
   */
  const reviewedItems = useMemo(() => {
    if (!task) return [];
    return task.checklistItems.filter(
      (item) => item.status === 'APPROVED' || item.status === 'REJECTED'
    );
  }, [task]);

  /**
   * Currently selected item
   */
  const selectedItem = useMemo(() => {
    if (!task || !selectedItemId) return null;
    return task.checklistItems.find((item) => item.id === selectedItemId) || null;
  }, [task, selectedItemId]);

  /**
   * Select an item for review
   */
  const selectItem = useCallback((itemId: number) => {
    setSelectedItemId(itemId);
    setCurrentReview({
      itemId,
      decision: null,
      comment: '',
      rejectionReason: '',
      allowResubmission: true,
      isSubmitting: false,
    });
  }, []);

  /**
   * Update review decision
   */
  const setDecision = useCallback((decision: IntakeReviewStatus) => {
    setCurrentReview((prev) => (prev ? { ...prev, decision } : null));
  }, []);

  /**
   * Update review comment
   */
  const setComment = useCallback((comment: string) => {
    setCurrentReview((prev) => (prev ? { ...prev, comment } : null));
  }, []);

  /**
   * Update rejection reason
   */
  const setRejectionReason = useCallback((rejectionReason: string) => {
    setCurrentReview((prev) => (prev ? { ...prev, rejectionReason } : null));
  }, []);

  /**
   * Toggle allow resubmission
   */
  const setAllowResubmission = useCallback((allowResubmission: boolean) => {
    setCurrentReview((prev) => (prev ? { ...prev, allowResubmission } : null));
  }, []);

  /**
   * Submit the current review
   */
  const submitReview = useCallback(async () => {
    if (!taskId || !currentReview || !currentReview.decision) {
      throw new Error('No review to submit');
    }

    setCurrentReview((prev) => (prev ? { ...prev, isSubmitting: true } : null));

    try {
      const request: ReviewDocumentRequest = {
        itemId: currentReview.itemId,
        decision: currentReview.decision,
        comment: currentReview.comment || undefined,
        rejectionReason:
          currentReview.decision === 'REJECTED' ? currentReview.rejectionReason : undefined,
        allowResubmission:
          currentReview.decision === 'REJECTED' ? currentReview.allowResubmission : undefined,
      };

      const updatedItem = await repository.reviewDocument(taskId, request);

      // Update task with reviewed item
      setTask((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          checklistItems: prev.checklistItems.map((item) =>
            item.id === currentReview.itemId ? updatedItem : item
          ),
        };
      });

      // Clear current review
      setCurrentReview(null);
      setSelectedItemId(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to submit review';

      setCurrentReview((prev) =>
        prev ? { ...prev, isSubmitting: false, errorMessage } : null
      );

      console.error('Failed to submit review:', err);
      throw err;
    }
  }, [taskId, currentReview, repository]);

  /**
   * Approve document (shorthand)
   */
  const approveDocument = useCallback(
    async (itemId: number, comment?: string) => {
      if (!taskId) return;

      const request: ReviewDocumentRequest = {
        itemId,
        decision: 'APPROVED',
        comment,
      };

      try {
        const updatedItem = await repository.reviewDocument(taskId, request);

        setTask((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            checklistItems: prev.checklistItems.map((item) =>
              item.id === itemId ? updatedItem : item
            ),
          };
        });
      } catch (err) {
        console.error('Failed to approve document:', err);
        throw err;
      }
    },
    [taskId, repository]
  );

  /**
   * Reject document (shorthand)
   */
  const rejectDocument = useCallback(
    async (itemId: number, reason: string, allowResubmission: boolean = true) => {
      if (!taskId) return;

      const request: ReviewDocumentRequest = {
        itemId,
        decision: 'REJECTED',
        rejectionReason: reason,
        allowResubmission,
      };

      try {
        const updatedItem = await repository.reviewDocument(taskId, request);

        setTask((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            checklistItems: prev.checklistItems.map((item) =>
              item.id === itemId ? updatedItem : item
            ),
          };
        });
      } catch (err) {
        console.error('Failed to reject document:', err);
        throw err;
      }
    },
    [taskId, repository]
  );

  return {
    task,
    isLoading,
    error,
    pendingItems,
    reviewedItems,
    currentReview,
    selectedItem,
    selectItem,
    setDecision,
    setComment,
    setRejectionReason,
    setAllowResubmission,
    submitReview,
    approveDocument,
    rejectDocument,
    refresh,
  };
}
