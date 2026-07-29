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
 * @file Governance Config
 * @description Host-level governance policy config (capability whitelist, event routing, UI budget)
 * @module host-standalone-web/config/governance.config
 * @version 3.0.0
 */

import type { GovernanceConfig } from '@brix-sdk/runtime-orchestrator-web';

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
