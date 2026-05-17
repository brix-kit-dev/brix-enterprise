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
 * @file Hooks Index
 * @description Re-exports all hooks from the case module
 * @module @brix-sdk/enterprise-case-ui-web/hooks
 * @version 3.0.0
 *
 * Design Notes:
 * This barrel file provides a clean public API for all hooks.
 * Import hooks from this index rather than individual files.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

// ============================================================================
// Case Hooks
// ============================================================================
export {
  useCaseList,
  useCaseDetail,
  useCaseCreate,
  type UseCaseListResult,
  type UseCaseDetailResult,
  type UseCaseCreateResult,
} from './useCase';

// ============================================================================
// Case Node Hooks
// ============================================================================
export {
  useCaseNodes,
  type UseCaseNodesResult,
} from './useCaseNodes';

// ============================================================================
// Schedule Hooks
// ============================================================================
export {
  useSchedule,
  type UseScheduleResult,
} from './useSchedule';

// ============================================================================
// Timeline Hooks
// ============================================================================
export {
  useTimeline,
  type UseTimelineResult,
} from './useTimeline';

// ============================================================================
// Parameter Hooks
// ============================================================================
export {
  useParameters,
  type UseParametersResult,
} from './useParameters';

// ============================================================================
// Template Hooks
// ============================================================================
export {
  useTemplateList,
  useTemplateDetail,
  useTemplateCreate,
  type UseTemplateListResult,
  type UseTemplateDetailResult,
  type UseTemplateCreateResult,
} from './useTemplate';
