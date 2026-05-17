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
 * @file Intake Shared Module Entry Point
 * @description Re-exports all types, constants, and events from the intake module
 * @module @brix-sdk/enterprise-intake-shared
 * @version 3.0.0
 *
 * @example
 * ```typescript
 * // Import types
 * import { IntakeTask, IntakeChecklistItem } from '@brix-sdk/enterprise-intake-shared';
 *
 * // Import from submodules
 * import { INTAKE_TASK_STATUSES } from '@brix-sdk/enterprise-intake-shared/constants';
 * import { IntakeTaskCreatedEvent } from '@brix-sdk/enterprise-intake-shared/events';
 * ```
 *
 * @author Brix Team
 * @date 2026-06-10
 */

// Types
export * from './types';

// Constants
export * from './constants';

// Events
export * from './events';
