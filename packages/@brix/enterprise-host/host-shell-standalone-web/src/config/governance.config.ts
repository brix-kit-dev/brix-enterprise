/**
 * @file Governance Config
 * @description Host-level governance policy config (capability whitelist, event routing, UI budget)
 * @module host-standalone-web/config/governance.config
 * @version 3.0.0
 */

import type { GovernanceConfig } from '../types';

/**
 * Governance configuration
 */
export const governanceConfig: GovernanceConfig = {
  capabilityWhitelist: {
    '*': [
      'navigation',
      'auth',
      'menu',
      'plugin-state',
      'layout',
    ],
    'booking': [
      'navigation',
      'auth',
      'menu',
      'plugin-state',
      'layout',
      'event-bus',
    ],
    'identity': [
      'navigation',
      'auth',
      'menu',
      'plugin-state',
      'layout',
      'event-bus',
    ],
  },

  eventRouting: {
    'user:*': { scope: 'global' },
    'system:*': { scope: 'global' },
    'booking:*': { scope: 'plugin', target: 'booking' },
    'identity:*': { scope: 'plugin', target: 'identity' },
  },

  budget: {
    maxBundleSize: 300 * 1024,
    maxMemory: 50 * 1024 * 1024,
    maxApiCallsPerMinute: 100,
  },

  featureFlags: {
    'new-dashboard': false,
    'experimental-features': false,
  },
};