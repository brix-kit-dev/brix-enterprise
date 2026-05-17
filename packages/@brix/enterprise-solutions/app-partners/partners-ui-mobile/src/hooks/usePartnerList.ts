/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * This software is proprietary to Brix Platform and is protected by
 * copyright laws and international treaty provisions. Unauthorized
 * reproduction or distribution of this software, or any portion of it,
 * may result in severe civil and criminal penalties.
 *
 * Commercial use requires a valid Brix Enterprise license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */
/**
 * Partner List Hook
 *
 * [Three-Layer Separation Architecture]
 * - This Hook belongs to the business logic layer, encapsulates partner list retrieval and state management
 * - Obtains HttpCapability through useHttp, then creates PartnerApiService to call backend
 * - UI layer (components/PartnerList) only needs to call this Hook, no need to know data fetching details
 *
 * @author Brix Team
 * @since 3.0.0
 * @version 3.2.0
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useHttp } from '@brix-sdk/runtime-sdk-react';
import { createPartnerApiService, type PartnerApiService } from '../api';
import type { PartnerDTO, PartnerType } from '../types';

/**
 * usePartnerList parameter options
 */
export interface UsePartnerListOptions {
  /** Partner type filter */
  filterType?: PartnerType;
  /** Show only available partners */
  availableOnly?: boolean;
  /** Auto fetch on mount */
  autoFetch?: boolean;
}

/**
 * usePartnerList return value
 */
export interface UsePartnerListReturn {
  /** Partner list */
  partners: PartnerDTO[];
  /** Whether loading */
  loading: boolean;
  /** Whether refreshing */
  refreshing: boolean;
  /** Error message */
  error: string | null;
  /** Search keyword */
  searchQuery: string;
  /** Set search keyword */
  setSearchQuery: (query: string) => void;
  /** Filter type */
  selectedType: PartnerType | undefined;
  /** Set filter type */
  setSelectedType: (type: PartnerType | undefined) => void;
  /** Filtered list */
  filteredPartners: PartnerDTO[];
  /** Refresh list */
  refresh: () => Promise<void>;
}

/**
 * Partner List Hook
 *
 * @param options Configuration options
 * @returns Partner list state and action methods
 *
 * @example
 * ```tsx
 * function PartnerListScreen() {
 *   const {
 *     partners,
 *     loading,
 *     refreshing,
 *     refresh,
 *     searchQuery,
 *     setSearchQuery,
 *   } = usePartnerList({ availableOnly: true });
 *
 *   return (
 *     <FlatList
 *       data={partners}
 *       refreshing={refreshing}
 *       onRefresh={refresh}
 *     />
 *   );
 * }
 * ```
 */
export function usePartnerList(options: UsePartnerListOptions = {}): UsePartnerListReturn {
  const {
    filterType,
    availableOnly = false,
    autoFetch = true,
  } = options;

  // Get HttpCapability
  const http = useHttp();

  // Create API service
  const partnerApi: PartnerApiService | null = useMemo(() => {
    if (!http) return null;
    return createPartnerApiService(http);
  }, [http]);

  // State
  const [partners, setPartners] = useState<PartnerDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<PartnerType | undefined>(filterType);

  /**
   * Fetch partner list
   */
  const fetchPartners = useCallback(
    async (isRefresh = false) => {
      if (!partnerApi) {
        setError('HTTP capability not ready');
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        let data: PartnerDTO[];
        if (availableOnly) {
          data = await partnerApi.listAvailable(selectedType);
        } else {
          data = await partnerApi.list({ type: selectedType });
        }
        setPartners(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load partner list');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [partnerApi, selectedType, availableOnly]
  );

  /**
   * Refresh list
   */
  const refresh = useCallback(async () => {
    await fetchPartners(true);
  }, [fetchPartners]);

  /**
   * Filtered list
   */
  const filteredPartners = useMemo(() => {
    if (!searchQuery) return partners;
    const query = searchQuery.toLowerCase();
    return partners.filter((partner) =>
      partner.name.toLowerCase().includes(query) ||
      partner.partnerCode.toLowerCase().includes(query) ||
      partner.shortName?.toLowerCase().includes(query)
    );
  }, [partners, searchQuery]);

  // Auto load
  useEffect(() => {
    if (autoFetch && partnerApi) {
      fetchPartners();
    }
  }, [autoFetch, partnerApi, selectedType]);

  return {
    partners,
    loading,
    refreshing,
    error,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    filteredPartners,
    refresh,
  };
}
