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
export { PartnerDetailPage } from './pages/PartnerDetailPage';
export { PartnerCreatePage } from './pages/PartnerCreatePage';
export { PartnerEditPage } from './pages/PartnerEditPage';

// Default export
export default {
  name: '@shinwa/partners-ui-web',
  version: '3.2.0',
};
