/**
 * @file Intake Shared Module Entry Point
 * @description Re-exports all types, constants, and events from the intake module
 * @module @shinwa/intake-shared
 * @version 3.0.0
 *
 * @example
 * ```typescript
 * // Import types
 * import { IntakeTask, IntakeChecklistItem } from '@shinwa/intake-shared';
 *
 * // Import from submodules
 * import { INTAKE_TASK_STATUSES } from '@shinwa/intake-shared/constants';
 * import { IntakeTaskCreatedEvent } from '@shinwa/intake-shared/events';
 * ```
 *
 * @author Shinwa Team
 * @date 2026-06-10
 */

// Types
export * from './types';

// Constants
export * from './constants';

// Events
export * from './events';
