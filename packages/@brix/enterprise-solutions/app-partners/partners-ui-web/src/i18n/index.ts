/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Commercial use requires a valid Brix Enterprise license.
 */
/**
 * Registration entry point for partners plugin i18n resources.
 *
 * @module partners-ui-web/i18n
 * @version 3.3.0
 */

import type { I18nCapability } from '@brix-sdk/runtime-sdk-api-web';
import zhCN from './zh-CN';
import enUS from './en-US';

/**
 * Register partners plugin i18n resource bundles.
 *
 * @param i18n - The platform I18nCapability instance injected by the runtime shell
 */
export function registerPartnersI18n(i18n: I18nCapability): void {
  i18n.addResourceBundle({ locale: 'zh-CN', namespace: 'partners', resources: zhCN });
  i18n.addResourceBundle({ locale: 'en-US', namespace: 'partners', resources: enUS });
}
