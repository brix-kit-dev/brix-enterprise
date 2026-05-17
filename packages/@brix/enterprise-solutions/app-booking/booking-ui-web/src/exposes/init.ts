/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Commercial use requires a valid Brix Enterprise license.
 */
/**
 * Plugin initialization module
 *
 * Translation resources are now registered by the Host Shell via
 * registerBookingI18n() during bootstrap (Phase 3.4 i18n chain).
 * This module remains as an MF entry point guard.
 *
 * @module booking-ui-web
 * @version 3.3.0
 */

// Export flag to confirm module is loaded
export const initialized = true;
