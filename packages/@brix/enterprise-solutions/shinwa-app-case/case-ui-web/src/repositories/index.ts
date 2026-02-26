/**
 * @file Repository Index
 * @description Re-exports all repository factories and types
 * @module @shinwa/case-ui-web/repositories
 * @version 3.0.0
 * 
 * Design Notes:
 * This barrel file provides a clean public API for all repositories.
 * Import repositories from this index rather than individual files.
 * 
 * @author Shinwa Team
 * @date 2026-02-23
 */

// ============================================================================
// Case Repository
// ============================================================================
export { createCaseRepository } from './caseRepository';
export type { CaseRepository } from './caseRepository';

// ============================================================================
// Case Node Repository
// ============================================================================
export { createCaseNodeRepository } from './caseNodeRepository';
export type { CaseNodeRepository } from './caseNodeRepository';

// ============================================================================
// Schedule Repository
// ============================================================================
export { createScheduleRepository } from './scheduleRepository';
export type { ScheduleRepository } from './scheduleRepository';

// ============================================================================
// Timeline Repository
// ============================================================================
export { createTimelineRepository } from './timelineRepository';
export type { TimelineRepository, TimelineQueryParams } from './timelineRepository';

// ============================================================================
// Parameter Repository
// ============================================================================
export { createParameterRepository } from './parameterRepository';
export type { ParameterRepository } from './parameterRepository';

// ============================================================================
// Template Repository
// ============================================================================
export { createTemplateRepository } from './templateRepository';
export type { TemplateRepository } from './templateRepository';

// ============================================================================
// Re-export query params from shared for convenience
// ============================================================================
export type { CaseQueryParams, TemplateQueryParams } from '@shinwa/case-shared';
