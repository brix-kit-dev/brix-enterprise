/**
 * @file Partners UI Components Export
 * @description Exports all reusable UI components for the partners module
 * @module partners-ui-web/components
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * Components are pure presentation layer, responsible only for UI rendering.
 * Business logic should be handled by ViewModel hooks.
 * 
 * Phase 5 Enhancement (Week 10):
 * - Added CertificationFile type export for certification management
 * - Added PartnerFormData and PartnerFormErrors type exports
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

export { 
  CertificationUploader, 
  type CertificationUploaderProps,
  type CertificationFile,
} from './CertificationUploader';

export { 
  PartnerFormFields, 
  type PartnerFormFieldsProps,
  type PartnerFormData,
  type PartnerFormErrors,
} from './PartnerFormFields';
