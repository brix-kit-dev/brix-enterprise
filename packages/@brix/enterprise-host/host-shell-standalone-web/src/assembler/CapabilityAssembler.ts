/**
 * @file Capability Assembler
 * @description Assembles platform-commons capability implementations
 * @module host-standalone-web/assembler/CapabilityAssembler
 * @version 3.0.4
 *
 * [v3.0.4 Architecture Redline Fix]
 * - validateCapabilityAccess has been migrated to @brix/runtime-orchestrator-web
 * - Host layer only handles assembly, no longer contains validation logic
 *
 * Architecture: Host only assembles, never implements capabilities.
 * All capability implementations come from platform-commons.
 */

import type { GovernanceConfig } from '../types';
// Import validation function from Orchestrator layer (v3.0.4 architecture refactoring)
export { validateCapabilityAccess, type CapabilityAccessWhitelist } from '@brix/runtime-orchestrator-web';

/**
 * Assembled capabilities collection
 */
export interface AssembledCapabilities {
  // navigation: NavigationCapability;
  // eventBus: EventBusCapability;
  // auth: AuthCapability;
}

/**
 * Assemble capabilities based on governance config
 */
export function assembleCapabilities(_config: GovernanceConfig): AssembledCapabilities {
  return {
    // navigation: navigationCapability,
    // eventBus: eventBusCapability,
    // auth: authCapability,
  };
}