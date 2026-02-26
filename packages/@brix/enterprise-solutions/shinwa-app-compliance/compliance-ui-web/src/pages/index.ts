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
