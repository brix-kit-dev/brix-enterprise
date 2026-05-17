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
 * Partner Management Module - Mobile UI Entry
 * 
 * @description Exports all public components and API
 * @version 3.0.0
 */

// Type exports
export * from './types';

// API exports
export { partnerApi, setApiBase } from './api';

// Component exports
export { PartnerList } from './components/PartnerList';

// Default export
export default {
  name: '@brix-sdk/enterprise-partners-ui-mobile',
  version: '3.0.0',
};
