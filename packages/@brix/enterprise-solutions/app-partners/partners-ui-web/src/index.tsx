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
 * Partner Management Module - Web UI Entry Point
 * 
 * @description Exports all public components and APIs for the partners module
 * @version 3.2.0
 * 
 * Phase 5 Enhancement (Week 10):
 * - Added PartnerCreatePage export for partner creation
 * - Added PartnerEditPage export for partner editing
 * - Added CertificationUploader component export
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

// Type exports
export * from './types';

// API exports
export { partnerApi } from './api';

// Component exports
export {
  CertificationUploader,
  type CertificationUploaderProps,
  type CertificationFile,
  PartnerFormFields,
  type PartnerFormFieldsProps,
  type PartnerFormData,
  type PartnerFormErrors,
  // v3.0.6 Card-based UI Components
  PartnerCard,
  type PartnerCardProps,
  PartnerDetailDialog,
  type PartnerDetailDialogProps,
  AddPartnerDialog,
  type AddPartnerDialogProps,
} from './components';

// Hook exports
export {
  usePartnerList,
  usePartnerDetail,
  usePartnerCreate,
  usePartnerEdit,
} from './hooks';

// Repository exports
export {
  createPartnerRepository,
  type PartnerRepository,
} from './repositories';

// Page component exports
export { PartnerListPage } from './pages/PartnerListPage';
export { PartnerListPageV2 } from './pages/PartnerListPageV2';
export { PartnerDetailPage } from './pages/PartnerDetailPage';
export { PartnerCreatePage } from './pages/PartnerCreatePage';
export { PartnerEditPage } from './pages/PartnerEditPage';

// Theme exports
export * from './theme';

// Default export
export default {
  name: '@brix-sdk/enterprise-partners-ui-web',
  version: '3.2.0',
};
