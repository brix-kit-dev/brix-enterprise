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
 * @file Hooks Layer Entry Point
 * @description Exports all ViewModel Hooks
 * @module partners-ui-web/hooks
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * Hooks layer serves as ViewModel layer, responsible for:
 * 1. Managing page state
 * 2. Encapsulating business logic
 * 3. Calling Repository layer to get data
 * 4. Subscribing and publishing events
 */

// Partner list Hook
export { usePartnerList } from './usePartnerList';
export type { UsePartnerListResult, PartnerListState, PartnerListActions } from './usePartnerList';

// Partner detail Hook
export { usePartnerDetail } from './usePartnerDetail';
export type { UsePartnerDetailResult, PartnerDetailState, PartnerDetailActions } from './usePartnerDetail';

// Partner create Hook
export { usePartnerCreate } from './usePartnerCreate';
export type { UsePartnerCreateResult, PartnerCreateState, PartnerCreateActions } from './usePartnerCreate';

// Partner edit Hook
export { usePartnerEdit } from './usePartnerEdit';
export type { UsePartnerEditResult, PartnerEditState, PartnerEditActions } from './usePartnerEdit';
