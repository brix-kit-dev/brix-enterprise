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
 * @file Partner Option Repository
 * @description Local repository for querying available partner options within
 *   the products module. This eliminates the cross-plugin dependency on
 *   partners-ui-web/repositories (R7.2 fix).
 *
 * Architecture:
 *   - Part of the Repository layer in the View → ViewModel → Repository separation
 *   - Calls the partners REST API via HttpCapability (Runtime Shell contract)
 *   - Returns lightweight PartnerOption DTOs for use in product forms
 *   - Does NOT import from any other plugin module
 *
 * API contract:
 *   GET /api/v1/partners/available  →  PartnerOptionDTO[]
 *
 * @module products-ui-web/repositories/PartnerOptionRepository
 * @version 3.2.0
 * @since 3.2.0
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5  (Frontend layered architecture)
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §4     (Plugin isolation — no cross-plugin deps)
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';

// ============================================================================
// API Constants
// ============================================================================

/**
 * Partners REST API base path.
 *
 * This product-internal repository calls the partners API endpoint directly
 * through HttpCapability — there is NO compile-time dependency on the partners
 * plugin.  The contract is purely the HTTP interface, which is a legitimate
 * cross-plugin integration boundary per the Runtime Shell architecture.
 */
/** '/api' prefix provided by HttpCapability baseURL */
const PARTNERS_API_BASE = '/v1/partners';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Lightweight partner option returned by the partners API.
 *
 * Only the fields required for the partner-selector dropdown are included;
 * this is intentionally a subset of the full PartnerDTO to keep coupling
 * minimal and avoid importing partner-shared types.
 */
export interface PartnerOptionDTO {
  /** Unique partner identifier */
  id: number;
  /** Display name */
  name: string;
  /** Partner type classification (e.g. HOSPITAL, HOTEL, TRANSPORT) */
  type: string;
  /** Current operational status (e.g. ACTIVE, SUSPENDED) */
  status: string;
}

/**
 * Query parameters for listing partner options.
 */
export interface PartnerOptionQueryParams {
  /** Optional filter by partner type */
  type?: string;
}

/**
 * Repository interface for partner option queries within the products module.
 *
 * Deliberately minimal — exposes only what product pages need (list available
 * partners for a dropdown selector).
 */
export interface PartnerOptionRepository {
  /**
   * Retrieve a list of available (active) partners for selection.
   *
   * Calls GET /api/v1/partners/available which returns only ACTIVE partners
   * in a lightweight format suitable for dropdown rendering.
   *
   * @param params - Optional query params (e.g. filter by type)
   * @returns Array of partner option DTOs
   */
  listAvailable(params?: PartnerOptionQueryParams): Promise<PartnerOptionDTO[]>;
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a PartnerOptionRepository instance backed by HttpCapability.
 *
 * This factory follows the same pattern as {@link createProductRepository},
 * injecting the Runtime Shell HTTP capability as the sole infrastructure
 * dependency.  No partner-plugin code is imported.
 *
 * @param http - HttpCapability provided by the Runtime Shell
 * @returns A ready-to-use PartnerOptionRepository
 *
 * @example
 * ```ts
 * const repo = createPartnerOptionRepository(httpCapability);
 * const partners = await repo.listAvailable();
 * ```
 */
export function createPartnerOptionRepository(http: HttpCapability): PartnerOptionRepository {
  return {
    async listAvailable(params?: PartnerOptionQueryParams): Promise<PartnerOptionDTO[]> {
      const queryParams: Record<string, unknown> = {};
      if (params?.type) {
        queryParams.type = params.type;
      }
      return http.get<PartnerOptionDTO[]>(`${PARTNERS_API_BASE}/available`, queryParams);
    },
  };
}
