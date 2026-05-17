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
 * Component layer barrel exports for the Compliance UI Web module.
 * Provides centralized access to all reusable UI components.
 * @module compliance-ui-web/components
 */

export { ScriptStatusChip } from './ScriptStatusChip';
export type { ScriptStatusChipProps } from './ScriptStatusChip';

export { SeverityChip } from './SeverityChip';
export type { SeverityChipProps } from './SeverityChip';

export { ScriptCard } from './ScriptCard';
export type { ScriptCardProps } from './ScriptCard';

export { ForbiddenWordChecker } from './ForbiddenWordChecker';
export type { ForbiddenWordCheckerProps, ForbiddenWordMatch } from './ForbiddenWordChecker';

export { ScriptEditor } from './ScriptEditor';
export type { ScriptEditorProps } from './ScriptEditor';

export { ForbiddenWordTable } from './ForbiddenWordTable';
export type { ForbiddenWordTableProps } from './ForbiddenWordTable';

export { ComplianceStatsDashboard } from './ComplianceStatsDashboard';
export type { ComplianceStatsDashboardProps } from './ComplianceStatsDashboard';
