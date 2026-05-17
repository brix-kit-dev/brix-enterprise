/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Commercial use requires a valid Brix Enterprise license.
 */
/**
 * @file English translations for app-partners plugin
 * @module partners-ui-web/i18n/en-US
 * @version 3.3.0
 */

const enUS: Record<string, string> = {
  // Partner types (types/index.ts)
  'type.HOSPITAL': 'Hospital',
  'type.HOTEL': 'Hotel',
  'type.TRANSPORT': 'Transport',
  'type.TRANSLATION': 'Translation',
  'type.OTHER': 'Other',

  // Partner types (constants)
  'typeConst.HOSPITAL': 'Hospital',
  'typeConst.CLINIC': 'Clinic',
  'typeConst.AGENCY': 'Agency',
  'typeConst.TRANSLATOR': 'Translation Service',
  'typeConst.TRANSPORT': 'Transport Service',
  'typeConst.HOTEL': 'Hotel & Accommodation',

  // Partner types (theme display)
  'themeType.HOSPITAL': 'Medical Institution',
  'themeType.HOTEL': 'Hotel & Lodging',
  'themeType.TRANSPORT': 'Transport Service',
  'themeType.TRANSLATION': 'Translation Agency',
  'themeType.OTHER': 'Other',

  // Partner status (types/index.ts)
  'statusType.DRAFT': 'Draft',
  'statusType.ACTIVE': 'Active',
  'statusType.SUSPENDED': 'Suspended',
  'statusType.TERMINATED': 'Terminated',

  // Partner status (constants, with descriptions)
  'status.PENDING': 'Pending Review',
  'status.PENDING.desc': 'Application submitted, awaiting review',
  'status.ACTIVE': 'Active',
  'status.ACTIVE.desc': 'Partnership is active and valid',
  'status.SUSPENDED': 'Suspended',
  'status.SUSPENDED.desc': 'Partnership temporarily suspended',
  'status.TERMINATED': 'Terminated',
  'status.TERMINATED.desc': 'Partnership permanently terminated',

  // Partner status (theme display)
  'themeStatus.DRAFT': 'Draft',
  'themeStatus.ACTIVE': 'In Partnership',
  'themeStatus.SUSPENDED': 'Suspended',
  'themeStatus.TERMINATED': 'Terminated',

  // Cooperation levels
  'level.1': 'Standard',
  'level.2': 'Silver',
  'level.3': 'Gold',
  'level.4': 'Platinum',
  'level.5': 'Strategic',

  // Credit ratings
  'rating.excellent': 'Excellent',
  'rating.good': 'Good',
  'rating.normal': 'Average',
  'rating.poor': 'Poor',

  // Certification types
  'cert.BUSINESS_LICENSE': 'Business License',
  'cert.MEDICAL_LICENSE': 'Medical Practice License',
  'cert.HEALTH_CERTIFICATE': 'Health Certificate',
  'cert.PROFESSIONAL_CERT': 'Professional Qualification',
  'cert.ISO_CERT': 'ISO Certification',
  'cert.INSURANCE_CERT': 'Insurance Qualification',
  'cert.OTHER': 'Other Certificate',

  // Certification uploader
  'certUploader.uploadFailed': 'Upload Failed',
  'certUploader.expired': 'Expired',
  'certUploader.expiringSoon': 'Expiring Soon',
  'certUploader.issuedBy': 'Issued by: ',
  'certUploader.expiryDate': 'Valid until: ',
  'certUploader.noCerts': 'No certificates yet',
  'certUploader.uploadHint': 'Click the button below to upload partner certifications',
  'certUploader.addCert': 'Add Certificate',
  'certUploader.dialogTitle': 'Add Certificate',
  'certUploader.cancel': 'Cancel',
  'certUploader.confirmAdd': 'Confirm',
  'certUploader.typePlaceholder': 'Select certificate type *',
  'certUploader.namePlaceholder': 'Certificate name * (e.g., Business License Copy)',
  'certUploader.issuerPlaceholder': 'Issuing authority (e.g., Market Supervision Bureau)',
  'certUploader.issueDate': 'Issue Date',
  'certUploader.expiryDateLabel': 'Valid Until',
  'certUploader.deleteCertConfirm': 'Are you sure you want to delete this certificate?',
  'certUploader.unsupportedType': 'Unsupported file type. Supported types: {{types}}',
  'certUploader.fileSizeLimit': 'File size exceeds the limit (max {{max}} MB)',
  'certUploader.maxCountLimit': 'Maximum of {{max}} certificate files allowed',
  'certUploader.requiredFields': 'Please fill in required fields',

  // List page
  'list.title': 'Partner Management',
  'list.createBtn': 'New Partner',
  'list.searchPlaceholder': 'Search name or code...',
  'list.typeFilter': 'Type',
  'list.statusFilter': 'Status',
  'list.allFilter': 'All',
  'list.refresh': 'Refresh',
  'list.colCode': 'Code',
  'list.colName': 'Name',
  'list.colType': 'Type',
  'list.colStatus': 'Status',
  'list.colContact': 'Contact',
  'list.colServiceArea': 'Service Area',
  'list.colCreatedAt': 'Created',
  'list.colActions': 'Actions',
  'list.noData': 'No data',
  'list.viewDetail': 'View Detail',
  'list.edit': 'Edit',
  'list.activate': 'Activate',
  'list.suspend': 'Suspend',
  'list.resume': 'Resume',
  'list.terminate': 'Terminate',
  'list.delete': 'Delete',

  // List page - delete dialog
  'list.deleteTitle': 'Confirm Delete',
  'list.deleteContent': 'Are you sure you want to delete partner "{{name}}"? This action cannot be undone.',
  'list.deleteCancel': 'Cancel',
  'list.deleteConfirm': 'Delete',

  // List page - status action dialog
  'list.activateTitle': 'Activate Partner',
  'list.suspendTitle': 'Suspend Partner',
  'list.resumeTitle': 'Resume Partner',
  'list.terminateTitle': 'Terminate Partner',
  'list.actionConfirmPrefix': 'Are you sure you want to',
  'list.actionActivate': 'activate',
  'list.actionSuspend': 'suspend',
  'list.actionResume': 'resume',
  'list.actionTerminate': 'terminate',
  'list.actionConfirmSuffix': 'partner "{{name}}"?',
  'list.reasonLabel': 'Reason',
  'list.actionCancel': 'Cancel',
  'list.actionConfirm': 'Confirm',

  // List page V2
  'listV2.title': 'Partner Directory',
  'listV2.subtitle': 'Manage hospitals, hotels, transport, translation, and other partners',
  'listV2.refresh': 'Refresh',
  'listV2.createBtn': 'New Partner',
  'listV2.searchPlaceholder': 'Search partner name, region...',
  'listV2.allTab': 'All',
  'listV2.allTypes': 'All Types',
  'listV2.hospitalTab': 'Hospital',
  'listV2.hotelTab': 'Hotel',
  'listV2.transportTab': 'Transport',
  'listV2.translationTab': 'Translation',
  'listV2.otherTab': 'Other',
  'listV2.noData': 'No partner data',
  'listV2.noSearchResults': 'No matching partners found. Try a different search term.',
  'listV2.noDataHint': 'Click "Add Partner" to get started',

  // Detail page
  'detail.backToList': 'Back to List',
  'detail.notFound': 'Partner not found',
  'detail.editBtn': 'Edit',
  'detail.basicInfoTitle': 'Basic Info',
  'detail.partnerType': 'Partner Type',
  'detail.shortName': 'Short Name',
  'detail.serviceArea': 'Service Area',
  'detail.createdAt': 'Created',
  'detail.description': 'Description',
  'detail.contactTitle': 'Contact Info',
  'detail.noContact': 'No contact information',
  'detail.qualificationTitle': 'Qualifications',

  // Detail dialog
  'detailDialog.bindToPackage': 'Bind to Package',
  'detailDialog.editInfo': 'Edit Info',
  'detailDialog.basicInfoTitle': 'Basic Info',
  'detailDialog.address': 'Address',
  'detailDialog.certTitle': 'Certifications',
  'detailDialog.descTitle': 'Description',
  'detailDialog.codePrefix': 'Code: ',
  'detailDialog.createdPrefix': 'Created: ',

  // Create page
  'create.title': 'New Partner',
  'create.subtitle': 'Fill in partner basic info and certifications',
  'create.backToList': 'Back to List',
  'create.cancel': 'Cancel',
  'create.saving': 'Saving...',
  'create.save': 'Save',
  'create.basicInfoTitle': 'Basic Info',
  'create.certTitle': 'Certifications',
  'create.certSubtitle': 'Upload business licenses, medical permits, and other qualification documents',
  'create.success': 'Partner created successfully! Redirecting to detail page...',

  // Edit page
  'edit.title': 'Edit Partner',
  'edit.backToDetail': 'Back to Detail',
  'edit.backToList': 'Back to List',
  'edit.refresh': 'Refresh',
  'edit.cancel': 'Cancel',
  'edit.saving': 'Saving...',
  'edit.save': 'Save',
  'edit.basicInfoTitle': 'Basic Info',
  'edit.certTitle': 'Certifications',
  'edit.certSubtitle': 'Manage business licenses, medical permits, and other qualification documents',
  'edit.notFound': 'Partner not found or has been deleted',
  'edit.terminated': 'This partner has been terminated and cannot be edited',
  'edit.leaveConfirm': 'You have unsaved changes. Are you sure you want to leave?',
  'edit.success': 'Partner information updated successfully!',

  // Form fields
  'form.name': 'Partner Name *',
  'form.shortName': 'Short Name',
  'form.type': 'Partner Type *',
  'form.contactName': 'Contact Person',
  'form.contactPhone': 'Phone',
  'form.contactEmail': 'Email',
  'form.serviceArea': 'Service Area (e.g., East Region, Nationwide)',
  'form.address': 'Address',
  'form.description': 'Description',

  // Validation
  'validation.nameRequired': 'Please enter partner name',
  'validation.nameMinLength': 'Partner name must be at least 2 characters',
  'validation.typeRequired': 'Please select partner type',
  'validation.emailInvalid': 'Please enter a valid email address',
  'validation.phoneInvalid': 'Please enter a valid phone number',
  'validation.addressRequired': 'Please enter an address',

  // Add partner dialog
  'addDialog.title': 'Add Partner',
  'addDialog.typeSection': 'Partner Type',
  'addDialog.statusSection': 'Partner Status',
  'addDialog.name': 'Partner Name *',
  'addDialog.shortName': 'Short Name (optional)',
  'addDialog.address': 'Address *',
  'addDialog.serviceArea': 'Service Area (e.g., Tokyo, Osaka)',
  'addDialog.phone': 'Phone',
  'addDialog.email': 'Email',
  'addDialog.website': 'Website (https://)',
  'addDialog.certSection': 'Certifications',
  'addDialog.certPlaceholder': 'Enter certification name, press Enter to add',
  'addDialog.certCount': '{{count}} certification(s) added',
  'addDialog.descPlaceholder': 'Partner description',
  'addDialog.cancel': 'Cancel',
  'addDialog.submitting': 'Submitting...',
  'addDialog.confirm': 'Confirm',
};

export default enUS;
