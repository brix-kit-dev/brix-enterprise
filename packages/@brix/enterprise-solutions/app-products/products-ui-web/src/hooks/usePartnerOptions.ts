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
 * @file usePartnerOptions Hook
 * @description ViewModel hook that encapsulates partner-option loading logic
 *   for product form pages.  Replaces the previous pattern where each page
 *   directly imported createPartnerRepository from partners-ui-web (R7.2
 *   cross-plugin violation).
 *
 * Architecture (v3.2 Frontend-Backend Separation):
 *   View → **ViewModel (this hook)** → Repository → HttpCapability
 *
 *   - This hook is the ONLY place in products-ui-web that loads partner data.
 *   - Pages consume the hook return value; they never touch Repository directly.
 *   - The underlying PartnerOptionRepository calls the partners REST API through
 *     HttpCapability, maintaining zero compile-time coupling to the partners plugin.
 *
 * @module products-ui-web/hooks/usePartnerOptions
 * @version 3.2.0
 * @since 3.2.0
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5  (Frontend layered architecture)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useHttp } from '@brix-sdk/runtime-sdk-react';
import {
  createPartnerOptionRepository,
  type PartnerOptionRepository,
  type PartnerOptionDTO,
} from '../repositories/PartnerOptionRepository';
import type { PartnerOption } from '../components/PartnerSelector';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Return type of {@link usePartnerOptions}.
 */
export interface UsePartnerOptionsResult {
  /** Available partner options for dropdown rendering */
  partners: PartnerOption[];
  /** Whether the partner list is currently loading */
  loading: boolean;
  /** Error message if the load failed, or null */
  error: string | null;
  /** Manually trigger a reload of partner options */
  reload: () => Promise<void>;
}

/**
 * Configuration options for {@link usePartnerOptions}.
 */
export interface UsePartnerOptionsConfig {
  /**
   * Optional partner type filter.
   * When set, only partners of this type are returned.
   */
  type?: string;
  /**
   * Whether to automatically load on mount (default: true).
   */
  autoLoad?: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * ViewModel hook for loading partner options used in product forms.
 *
 * This hook replaces the anti-pattern of importing `createPartnerRepository`
 * from `@brix-sdk/enterprise-partners-ui-web` directly inside page components.
 * Instead, it:
 *
 *   1. Creates a local {@link PartnerOptionRepository} via HttpCapability
 *   2. Fetches the available partner list from the REST API
 *   3. Maps the response to the {@link PartnerOption} shape expected by
 *      the PartnerSelector component
 *   4. Exposes loading / error state for the View layer to render
 *
 * Cross-plugin communication happens exclusively at the HTTP boundary,
 * respecting the Runtime Shell isolation constraint (R7, §约束2 & §约束4).
 *
 * @param config - Optional configuration (type filter, autoLoad)
 * @returns Partner options state and a reload action
 *
 * @example
 * ```tsx
 * const { partners, loading, error } = usePartnerOptions();
 *
 * return (
 *   <PartnerSelector
 *     partners={partners}
 *     loading={loading}
 *     error={error ?? undefined}
 *     value={selectedPartnerId}
 *     onChange={handlePartnerChange}
 *   />
 * );
 * ```
 */
export function usePartnerOptions(
  config?: UsePartnerOptionsConfig,
): UsePartnerOptionsResult {
  const { type, autoLoad = true } = config ?? {};

  // ── Capability injection ──────────────────────────────────
  const httpCapability = useHttp();

  // ── Repository (stable ref across renders) ────────────────
  const repositoryRef = useRef<PartnerOptionRepository | null>(null);
  if (!repositoryRef.current && httpCapability) {
    repositoryRef.current = createPartnerOptionRepository(httpCapability);
  }

  // ── State ─────────────────────────────────────────────────
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load logic ────────────────────────────────────────────
  const loadPartners = useCallback(async () => {
    if (!repositoryRef.current) {
      setError('HttpCapability not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dtos: PartnerOptionDTO[] = await repositoryRef.current.listAvailable(
        type ? { type } : undefined,
      );

      // Map API DTO → PartnerOption shape expected by PartnerSelector component
      const options: PartnerOption[] = dtos.map((dto) => ({
        id: dto.id,
        name: dto.name,
        type: dto.type as PartnerOption['type'],
        code: '',
      }));

      setPartners(options);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load partner options';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [type]);

  // ── Auto-load on mount ────────────────────────────────────
  useEffect(() => {
    if (autoLoad) {
      loadPartners();
    }
  }, [autoLoad, loadPartners]);

  // ── Public API ────────────────────────────────────────────
  return {
    partners,
    loading,
    error,
    reload: loadPartners,
  };
}
