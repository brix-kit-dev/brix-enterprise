/**
 * Plugin initialization module
 * 
 * This module ensures that the plugin's translation resources are added to
 * the host's i18n instance before any exposed component is loaded.
 * 
 * @module booking-ui-web
 * @version 3.0.0
 * 
 * Usage: Import this module in each exposes wrapper file
 * 
 * @example
 * ```tsx
 * import './init'; // Ensure translation resources are loaded
 * export { default } from '../pages/BookingList';
 * ```
 */

import { addPluginTranslations } from '../i18n';

// Execute initialization immediately
addPluginTranslations();

// Export empty object to confirm module is loaded
export const initialized = true;
