/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * This software is proprietary to Brix Platform and is protected by
 * copyright laws and international treaty provisions. Unauthorized
 * reproduction or distribution of this software, or any portion of it,
 * may result in severe civil and criminal penalties.
 *
 * Commercial use requires a valid Brix Enterprise license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */
/**
 * @file Hooks Module Index
 * @description Re-exports all hooks from the intake module
 * @module @brix-sdk/enterprise-intake-ui-web/hooks
 */

export { useIntakeTasks } from './useIntakeTasks';
export type { UseIntakeTasksResult } from './useIntakeTasks';

export { useIntakeTaskDetail, useCreateIntakeTask } from './useIntakeTaskDetail';
export type { UseIntakeTaskDetailResult, UseCreateIntakeTaskResult } from './useIntakeTaskDetail';

export { useIntakeSubmission } from './useIntakeSubmission';
export type { UseIntakeSubmissionResult, FileUploadState } from './useIntakeSubmission';

export { useIntakeReview } from './useIntakeReview';
export type { UseIntakeReviewResult, DocumentReviewState } from './useIntakeReview';
