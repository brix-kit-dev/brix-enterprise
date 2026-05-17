/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Commercial use requires a valid Brix Enterprise license.
 */
/**
 * @file I18n registration entry for app-contracts plugin.
 * Registers translation resource bundles under the 'contracts' namespace.
 * @module contracts-ui-web/i18n
 * @version 3.3.0
 */

import type { I18nCapability } from '@brix-sdk/runtime-sdk-api-web';
import zhCN from './zh-CN';
import enUS from './en-US';

/**
 * Registers contracts plugin translation bundles with the platform I18n capability.
 * Should be called during plugin bootstrap before any UI rendering.
 *
 * @param i18n - The platform I18n capability instance
 */
export function registerContractsI18n(i18n: I18nCapability): void {
  i18n.addResourceBundle({ locale: 'zh-CN', namespace: 'contracts', resources: zhCN });
  i18n.addResourceBundle({ locale: 'en-US', namespace: 'contracts', resources: enUS });
}
