/**
 * Repository layer barrel exports for the Compliance UI Web module.
 * Provides centralized access to all repository factory functions.
 * @module compliance-ui-web/repositories
 */

export { createScriptTemplateRepository } from './scriptTemplateRepository';
export type { ScriptTemplateRepository, ScriptTemplateListResponse } from './scriptTemplateRepository';

export { createForbiddenWordRepository } from './forbiddenWordRepository';
export type {
  ForbiddenWordRepository,
  ForbiddenWordListResponse,
  BulkImportRequest,
  BulkImportResponse,
} from './forbiddenWordRepository';

export { createComplianceCheckRepository } from './complianceCheckRepository';
export type {
  ComplianceCheckRepository,
  AuditRecordQueryParams,
  AuditRecordListResponse,
  ComplianceStatistics,
} from './complianceCheckRepository';
