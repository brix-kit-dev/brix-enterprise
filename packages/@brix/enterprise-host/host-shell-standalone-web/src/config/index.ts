/**
 * @file Config module entry
 * @description Unified config exports
 * @module host-standalone-web/config
 * @version 3.2.0
 *
 * [Architecture Notes]
 * Host layer config module exports, containing only necessary Host layer configurations.
 * Following v3.0.4 blueprint ultra-thin Host principle.
 */

// ========== Host Core Configuration ==========
export { hostConfig } from './host.config';
export { governanceConfig } from './governance.config';
export { routesConfig } from './routes.config';

// ========== Menu Configuration ==========
export { menuConfig, hostCoreMenus, type MenuItem } from './menu.config';

// ========== UI Adapter Configuration ==========
export { uiAdapter, getUIAdapter, getUIAdapterType, type UIAdapterType } from './ui.config';

// ========== Plugin Declaration Types ==========
export { type PluginDeclaration, type HostMenuConfig } from './plugins.config';