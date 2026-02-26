/**
 * @file Hooks Index
 * @description Re-exports all hooks from the case module
 * @module @shinwa/case-ui-web/hooks
 * @version 3.0.0
 *
 * Design Notes:
 * This barrel file provides a clean public API for all hooks.
 * Import hooks from this index rather than individual files.
 *
 * @author Shinwa Team
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
