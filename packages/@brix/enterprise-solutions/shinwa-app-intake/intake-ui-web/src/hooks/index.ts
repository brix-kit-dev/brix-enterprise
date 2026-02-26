/**
 * @file Hooks Module Index
 * @description Re-exports all hooks from the intake module
 * @module @shinwa/intake-ui-web/hooks
 */

export { useIntakeTasks } from './useIntakeTasks';
export type { UseIntakeTasksResult } from './useIntakeTasks';

export { useIntakeTaskDetail, useCreateIntakeTask } from './useIntakeTaskDetail';
export type { UseIntakeTaskDetailResult, UseCreateIntakeTaskResult } from './useIntakeTaskDetail';

export { useIntakeSubmission } from './useIntakeSubmission';
export type { UseIntakeSubmissionResult, FileUploadState } from './useIntakeSubmission';

export { useIntakeReview } from './useIntakeReview';
export type { UseIntakeReviewResult, DocumentReviewState } from './useIntakeReview';
