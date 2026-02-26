/**
 * Partner Detail Hook
 *
 * [Three-Layer Separation Architecture]
 * - This Hook belongs to the business logic layer, encapsulates partner detail retrieval and state management
 * - Obtains HttpCapability through useHttp, then creates PartnerApiService to call backend
 * - UI layer only needs to call this Hook, no need to know data fetching details
 *
 * @author Shinwa Team
 * @since 3.0.0
 * @version 3.2.0
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useHttp } from '@brix/runtime-sdk-react';
import { createPartnerApiService, type PartnerApiService } from '../api';
import type { PartnerDTO } from '../types';

/**
 * usePartnerDetail return value
 */
export interface UsePartnerDetailReturn {
  /** Partner detail */
  partner: PartnerDTO | null;
  /** Whether loading */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Refresh detail */
  refresh: () => Promise<void>;
}

/**
 * Partner Detail Hook
 *
 * @param partnerId Partner ID
 * @returns Partner detail state and action methods
 *
 * @example
 * ```tsx
 * function PartnerDetailScreen({ partnerId }: { partnerId: number }) {
 *   const { partner, loading, error, refresh } = usePartnerDetail(partnerId);
 *
 *   if (loading) return <ActivityIndicator />;
 *   if (error) return <Text>{error}</Text>;
 *   if (!partner) return <Text>合作伙伴不存在</Text>;
 *
 *   return <PartnerDetailView partner={partner} />;
 * }
 * ```
 */
export function usePartnerDetail(partnerId: number): UsePartnerDetailReturn {
  // Get HttpCapability
  const http = useHttp();

  // Create API service
  const partnerApi: PartnerApiService | null = useMemo(() => {
    if (!http) return null;
    return createPartnerApiService(http);
  }, [http]);

  // State
  const [partner, setPartner] = useState<PartnerDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch partner detail
   */
  const fetchPartner = useCallback(async () => {
    if (!partnerApi) {
      setError('HTTP capability not ready');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await partnerApi.getById(partnerId);
      setPartner(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load partner detail');
      console.error('Failed to load partner detail:', err);
    } finally {
      setLoading(false);
    }
  }, [partnerApi, partnerId]);

  /**
   * Refresh detail
   */
  const refresh = useCallback(async () => {
    await fetchPartner();
  }, [fetchPartner]);

  // Initial load
  useEffect(() => {
    if (partnerApi && partnerId) {
      fetchPartner();
    }
  }, [partnerApi, partnerId]);

  return {
    partner,
    loading,
    error,
    refresh,
  };
}
