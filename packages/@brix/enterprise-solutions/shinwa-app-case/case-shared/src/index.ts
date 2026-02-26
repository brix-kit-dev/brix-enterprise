/**
 * @file Case Module Shared Package Entry
 * @description Main entry point for @shinwa/case-shared package
 * @module @shinwa/case-shared
 * @version 3.0.0
 * 
 * This package contains shared type definitions, constants, and events
 * used by both Web and Mobile frontends of the case module.
 * 
 * Architecture Notes:
 * - Types: Business entity interfaces (DTOs, requests, responses)
 * - Constants: Enum mappings, API endpoints, permissions
 * - Events: Event type constants and payload interfaces
 * 
 * @author Shinwa Team
 * @date 2026-02-23
 */

// ============================================================================
// Type Exports
// ============================================================================
export * from './types';

// ============================================================================
// Constant Exports
// ============================================================================
export * from './constants';

// ============================================================================
// Event Exports
// ============================================================================
export * from './events';
