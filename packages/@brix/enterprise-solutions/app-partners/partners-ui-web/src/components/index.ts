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

// v3.0.6 Card-based UI Components
export { 
  PartnerCard, 
  type PartnerCardProps,
} from './PartnerCard';

export { 
  PartnerDetailDialog, 
  type PartnerDetailDialogProps,
} from './PartnerDetailDialog';

export { 
  AddPartnerDialog, 
  type AddPartnerDialogProps,
} from './AddPartnerDialog';
