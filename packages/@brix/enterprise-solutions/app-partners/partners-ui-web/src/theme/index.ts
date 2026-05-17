/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 */
/**
 * @file Theme Module Entry Point
 * @description Exports business-domain color utilities for partner management.
 *
 * Architecture Note (v3.0.9 Blueprint — Design Token Plan Phase 6):
 * Only Layer 3 business-semantic colors are exported from this module.
 * Platform-level tokens (palette, typography, shape) have been removed.
 * Plugins access platform tokens via `useTheme().tokens` from runtime-sdk-react.
 *
 * @module @brix-sdk/enterprise-partners-ui-web/theme
 * @version 3.2.1
 */

export {
  PARTNER_TYPE_COLORS,
  PARTNER_STATUS_COLORS,
  getPartnerTypeConfig,
  getPartnerStatusConfig,
} from './partnerTheme';
