/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 */
/**
 * @file Theme Module Entry Point
 * @description Exports business-domain color utilities for case management.
 *
 * Architecture Note (v3.0.9 Blueprint — Design Token Plan Phase 6):
 * Only Layer 3 business-semantic colors are exported from this module.
 * Platform-level tokens (palette, typography, shape) have been removed.
 * Plugins access platform tokens via `useTheme().tokens` from runtime-sdk-react.
 *
 * @module @brix-sdk/enterprise-case-ui-web/theme
 * @version 3.2.1
 */

export {
  CASE_STATUS_COLORS,
  NODE_STATUS_COLORS,
  TEMPLATE_TYPE_COLORS,
} from './caseTheme';
