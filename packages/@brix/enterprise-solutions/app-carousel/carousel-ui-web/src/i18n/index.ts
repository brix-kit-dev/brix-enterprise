/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Commercial use requires a valid Brix Enterprise license.
 */
/**
 * @file I18n registration entry for app-carousel plugin.
 * Registers translation resource bundles under the 'carousel' namespace.
 * @module carousel-ui-web/i18n
 * @version 3.3.0
 */

import type { I18nCapability } from '@brix-sdk/runtime-sdk-api-web';
import zhCN from './zh-CN';
import enUS from './en-US';

/**
 * Registers carousel plugin translation bundles with the platform I18n capability.
 * Should be called during plugin bootstrap before any UI rendering.
 *
 * @param i18n - The platform I18n capability instance
 */
export function registerCarouselI18n(i18n: I18nCapability): void {
  i18n.addResourceBundle({ locale: 'zh-CN', namespace: 'carousel', resources: zhCN });
  i18n.addResourceBundle({ locale: 'en-US', namespace: 'carousel', resources: enUS });
}
