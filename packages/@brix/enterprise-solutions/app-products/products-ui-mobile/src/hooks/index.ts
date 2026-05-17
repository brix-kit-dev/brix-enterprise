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
 * Product Module - Mobile Hooks Export
 *
 * [Three-Layer Separation Architecture]
 * - UI layer (components/): Responsible for rendering and user interaction, does not call API directly
 * - Hook layer (hooks/): Encapsulates business logic and state management, calls Repository
 * - Data layer (api/): Communicates with backend through HttpCapability
 *
 * @author Brix Platform Team
 * @since 3.0.0
 * @version 3.2.0
 */

export { useProductList, type UseProductListOptions, type UseProductListReturn } from './useProductList';
export { useProductDetail, type UseProductDetailReturn } from './useProductDetail';
