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
 * Pages barrel export
 * Centralizes all page component exports for the compliance-ui-web module.
 * Following v3.0.4 Runtime Shell Architecture Blueprint - View Layer.
 * @module compliance-ui-web/pages
 */

export { default as ScriptTemplateListPage } from './ScriptTemplateListPage';
export { default as ScriptTemplateDetailPage } from './ScriptTemplateDetailPage';
export { default as ScriptTemplateCreatePage } from './ScriptTemplateCreatePage';
export { default as ForbiddenWordListPage } from './ForbiddenWordListPage';
export { default as ForbiddenWordCreatePage } from './ForbiddenWordCreatePage';
export { default as ComplianceCheckPage } from './ComplianceCheckPage';

export type { ScriptTemplateListPageProps } from './ScriptTemplateListPage';
export type { ScriptTemplateDetailPageProps } from './ScriptTemplateDetailPage';
export type { ScriptTemplateCreatePageProps } from './ScriptTemplateCreatePage';
export type { ForbiddenWordListPageProps } from './ForbiddenWordListPage';
export type { ForbiddenWordCreatePageProps } from './ForbiddenWordCreatePage';
export type { ComplianceCheckPageProps } from './ComplianceCheckPage';
