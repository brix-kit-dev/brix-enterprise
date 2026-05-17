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
 * @file Repository Index
 * @description Re-exports all repository factories and types
 * @module @brix-sdk/enterprise-case-ui-web/repositories
 * @version 3.0.0
 * 
 * Design Notes:
 * This barrel file provides a clean public API for all repositories.
 * Import repositories from this index rather than individual files.
 * 
 * @author Brix Team
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
export type { CaseQueryParams, TemplateQueryParams } from '@brix-sdk/enterprise-case-shared';
