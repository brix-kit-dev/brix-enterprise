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

// Hooks (ViewModel layer)
export { useCase, useCaseDetail } from './hooks/useCase';
export type { UseCaseResult, UseCaseDetailResult } from './hooks/useCase';

// Screens (View layer)
export { default as CaseList } from './pages/CaseList';
export { default as CaseDetail } from './pages/CaseDetail';

// Repositories (Data access layer)
export { createCaseRepository } from './repositories/CaseRepository';
export type { CaseRepository } from './repositories/CaseRepository';
