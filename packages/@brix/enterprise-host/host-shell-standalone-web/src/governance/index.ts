/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 */
/**
 * @file Governance module barrel export
 * @module host-standalone-web/governance
 * @version 3.3.0
 *
 * GovernanceEnforcer and types are now provided by @brix-sdk/runtime-orchestrator-web
 * (Phase 2.8 down-sinking). GovernedEventRouter remains here because it
 * extends EventRouter from platform-eventbus-web (Host-layer integration glue).
 */
export { GovernanceEnforcer, type GovernanceViolation, type GovernanceConfig } from '@brix-sdk/runtime-orchestrator-web';
export { GovernedEventRouter } from './GovernedEventRouter';
