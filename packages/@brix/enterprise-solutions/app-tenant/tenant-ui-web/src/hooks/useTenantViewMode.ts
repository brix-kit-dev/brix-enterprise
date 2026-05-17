/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 *
 * @fileoverview useTenantViewMode - ViewModel hook for switching into tenant view-mode.
 */

import { useCallback, useState } from 'react';
import { useViewMode } from '@brix-sdk/runtime-sdk-react';
import { VIEW_MODE_TENANT_ACTOR } from '@brix-sdk/runtime-sdk-api-web';

export interface TenantViewModeActions {
  /** Tenant currently being switched into, or null when idle. */
  switchingTenantId: string | null;
  /** Switch the current platform-admin session into tenant-actor view mode. */
  viewAsTenant: (tenantId: string) => Promise<void>;
}

export function useTenantViewMode(): TenantViewModeActions {
  const { switchTo } = useViewMode();
  const [switchingTenantId, setSwitchingTenantId] = useState<string | null>(null);

  const viewAsTenant = useCallback(
    async (tenantId: string) => {
      setSwitchingTenantId(tenantId);
      try {
        await switchTo({ mode: VIEW_MODE_TENANT_ACTOR, tenantId });
      } finally {
        setSwitchingTenantId(null);
      }
    },
    [switchTo],
  );

  return { switchingTenantId, viewAsTenant };
}

export default useTenantViewMode;