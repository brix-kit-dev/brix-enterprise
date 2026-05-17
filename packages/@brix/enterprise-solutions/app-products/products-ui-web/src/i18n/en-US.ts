/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Commercial use requires a valid Brix Enterprise license.
 */
/**
 * @file English translations for app-products plugin
 * @module products-ui-web/i18n/en-US
 * @version 3.3.0
 */

const enUS: Record<string, string> = {
  // Product types
  'productType.CHECKUP': 'Checkup Package',
  'productType.TREATMENT': 'Treatment Package',
  'productType.TRANSLATION': 'Translation Package',
  'productType.TRANSPORT': 'Transport Package',
  'productType.ACCOMMODATION': 'Accommodation Package',
  'productType.COMPOSITE': 'Composite Package',
  'productType.fallback': 'Other',

  // Theme product types (alternate labels)
  'themeType.CHECKUP': 'Precision Checkup',
  'themeType.TREATMENT': 'Medical Treatment',
  'themeType.TRANSLATION': 'Translation Service',
  'themeType.TRANSPORT': 'Transport Service',
  'themeType.ACCOMMODATION': 'Accommodation Service',
  'themeType.COMPOSITE': 'Composite Package',

  // Product status
  'status.DRAFT': 'Draft',
  'status.PENDING_REVIEW': 'Pending Review',
  'status.ACTIVE': 'Active',
  'status.INACTIVE': 'Inactive',
  'status.ARCHIVED': 'Archived',
  'status.fallback': 'Unknown',

  // Theme status labels (variant)
  'themeStatus.ACTIVE': 'Active',
  'themeStatus.INACTIVE': 'Inactive',
  'themeStatus.ARCHIVED': 'Archived',

  // Edit page status labels
  'editStatus.DRAFT': 'Draft',
  'editStatus.PENDING_REVIEW': 'Pending Review',
  'editStatus.ACTIVE': 'Active',
  'editStatus.INACTIVE': 'Inactive',
  'editStatus.ARCHIVED': 'Archived',

  // Medical categories
  'medicalCategory.ONCOLOGY': 'Oncology',
  'medicalCategory.COSMETIC': 'Cosmetic Surgery',
  'medicalCategory.FERTILITY': 'Reproductive Medicine',
  'medicalCategory.REHAB': 'Rehabilitation',
  'medicalCategory.GENERAL': 'General',
  'medicalCategory.fallback': 'General',

  // Service item categories
  'itemCategory.EXAMINATION': 'Examination',
  'itemCategory.TREATMENT': 'Treatment',
  'itemCategory.MEDICATION': 'Medication',
  'itemCategory.SERVICE': 'Service',
  'itemCategory.ACCOMMODATION': 'Accommodation',
  'itemCategory.TRANSPORT': 'Transport',
  'itemCategory.OTHER': 'Other',

  // Partner types
  'partnerType.hospital': 'Hospital',
  'partnerType.clinic': 'Clinic',
  'partnerType.lab': 'Laboratory',
  'partnerType.pharmacy': 'Pharmacy',
  'partnerType.insurance': 'Insurance',
  'partnerType.other': 'Other',

  // Currency labels
  'currency.CNY': 'CNY (¥)',
  'currency.JPY': 'JPY (¥)',
  'currency.USD': 'USD ($)',
  'currency.EUR': 'EUR (€)',

  // Price
  'price.negotiable': 'Price on Request',
  'price.tenThousandUnit': '0K',
  'price.from': 'from',
  'price.max': 'up to',
  'price.fixedMode': 'Fixed Price',
  'price.rangeMode': 'Price Range',
  'price.placeholder': 'Enter price',
  'price.minPlaceholder': 'Min price',
  'price.maxPlaceholder': 'Max price',
  'price.preview': 'Preview:',
  'price.label': 'Price',

  // List page
  'list.title': 'Product Management',
  'list.createBtn': 'New Product',
  'list.searchPlaceholder': 'Search product name...',
  'list.typeFilter': 'Product Type',
  'list.statusFilter': 'Status',
  'list.allFilter': 'All',
  'list.noImage': 'No Image',
  'list.noDescription': 'No description',
  'list.durationPrefix': 'Duration:',
  'list.viewDetail': 'View Detail',
  'list.edit': 'Edit',
  'list.submitReview': 'Submit for Review',
  'list.approve': 'Approve',
  'list.reject': 'Reject',
  'list.deactivate': 'Deactivate',
  'list.reactivate': 'Reactivate',
  'list.archive': 'Archive',
  'list.delete': 'Delete',
  'list.confirmDeleteTitle': 'Confirm Delete',
  'list.confirmDeleteContent': 'Are you sure you want to delete product "{{name}}"? This action cannot be undone.',
  'list.cancel': 'Cancel',
  'list.rejectTitle': 'Reject Product',
  'list.rejectReasonLabel': 'Rejection Reason',
  'list.confirmReject': 'Confirm Reject',

  // List page V2
  'listV2.allTab': 'All',
  'listV2.noMatch': 'No matching packages',
  'listV2.searchPlaceholder': 'Search package name, hospital...',
  'listV2.createBtn': 'New Package',

  // Detail page
  'detail.notFound': 'Product not found',
  'detail.back': 'Back',
  'detail.backToList': 'Back to List',
  'detail.editProduct': 'Edit Product',
  'detail.codePrefix': 'Product Code:',
  'detail.descriptionTitle': 'Product Description',
  'detail.noDescription': 'No description',
  'detail.serviceItemsTitle': 'Service Items',
  'detail.remarkTitle': 'Remarks',
  'detail.priceTitle': 'Pricing',
  'detail.durationPrefix': 'Duration:',
  'detail.associationTitle': 'Associations',
  'detail.partnerLabel': 'Partner',
  'detail.categoryLabel': 'Category',
  'detail.statsTitle': 'Statistics',
  'detail.viewCount': 'Views',
  'detail.salesCount': 'Sales',
  'detail.tagsTitle': 'Tags',
  'detail.timeTitle': 'Timeline',
  'detail.createdAtPrefix': 'Created:',
  'detail.updatedAtPrefix': 'Updated:',
  'detail.createdByPrefix': 'Created by:',

  // Detail dialog
  'detailDialog.startPrice': 'Starting Price',
  'detailDialog.maxPrice': 'Max Price',
  'detailDialog.durationDays': 'Estimated Days',
  'detailDialog.partnerLabel': 'Partner Hospital/Agency',
  'detailDialog.descriptionTitle': 'Description',
  'detailDialog.noDescription': 'No description',
  'detailDialog.includedItems': 'Included Items',
  'detailDialog.bindToCase': 'Bind to Case',
  'detailDialog.editProduct': 'Edit Package',

  // Create page
  'create.title': 'Create Product Package',
  'create.subtitle': 'Configure a new product or service package',
  'create.stepBasicInfo': 'Basic Info',
  'create.stepBasicInfoDesc': 'Fill in basic product information',
  'create.stepServiceItems': 'Service Items',
  'create.stepServiceItemsDesc': 'Configure included service items',
  'create.stepConfirm': 'Confirm',
  'create.stepConfirmDesc': 'Review and submit',
  'create.serviceItemsConfig': 'Service Items Configuration',
  'create.confirmInfo': 'Confirm Product Info',
  'create.nameLabel': 'Product Name',
  'create.typeLabel': 'Product Type',
  'create.partnerLabel': 'Partner',
  'create.priceLabel': 'Price',
  'create.descriptionLabel': 'Description',
  'create.noDescription': 'No description',
  'create.itemCountLabel': 'Service Items',
  'create.itemCountUnit': 'items',
  'create.prevStep': 'Previous',
  'create.nextStep': 'Next',
  'create.confirmCreate': 'Confirm Create',
  'create.cancel': 'Cancel',

  // Edit page
  'edit.title': 'Edit Product:',
  'edit.unsavedChanges': 'Unsaved Changes',
  'edit.codePrefix': 'Product Code:',
  'edit.codeNotSet': 'Not set',
  'edit.createdAtPrefix': 'Created:',
  'edit.tabBasicInfo': 'Basic Info',
  'edit.tabServiceItems': 'Service Items',
  'edit.tabAdvanced': 'Advanced',
  'edit.serviceItemsHelp': 'Configure the service items included in this product. You can add, edit, delete, and reorder items.',
  'edit.statsTitle': 'Product Statistics',
  'edit.salesCount': 'Sales',
  'edit.viewCount': 'Views',
  'edit.sortWeight': 'Sort Weight',
  'edit.dangerZone': 'Danger Zone',
  'edit.deleteWarning': 'Deleting a product is irreversible. Please proceed with caution.',
  'edit.deleteBtn': 'Delete Product',
  'edit.cancel': 'Cancel',
  'edit.saveChanges': 'Save Changes',
  'edit.confirmDeleteTitle': 'Confirm Delete',
  'edit.confirmDeleteCancel': 'Cancel',
  'edit.confirmDeleteOk': 'Confirm Delete',
  'edit.confirmDeleteContent': 'Are you sure you want to delete product "{{name}}"? This action cannot be undone.',
  'edit.updated': 'Product updated successfully',
  'edit.deleted': 'Product deleted',
  'edit.leaveConfirm': 'You have unsaved changes. Are you sure you want to leave?',
  'edit.invalidId': 'Invalid product ID. Please check the URL.',
  'edit.notFound': 'Product not found. It may have been deleted.',
  'edit.backToList': 'Back to Products',

  // Form fields
  'form.productName': 'Product Name',
  'form.productNamePlaceholder': 'Enter product name',
  'form.productCode': 'Product Code',
  'form.productCodePlaceholder': 'Auto-generated or enter manually',
  'form.productType': 'Product Type',
  'form.productTypePlaceholder': 'Select product type',
  'form.partner': 'Partner',
  'form.description': 'Description',
  'form.descriptionPlaceholder': 'Enter product description',
  'form.priceRange': 'Price Range',
  'form.duration': 'Duration',
  'form.durationPlaceholder': 'e.g., 3 days 2 nights',
  'form.coverImage': 'Cover Image',
  'form.coverImagePlaceholder': 'Enter image URL',
  'form.tags': 'Tags',
  'form.tagsPlaceholder': 'Separate tags with commas',
  'form.sortWeight': 'Sort Weight',
  'form.remark': 'Remarks',
  'form.remarkPlaceholder': 'Enter remarks',

  // Service item editor
  'itemEditor.count': '{{count}} service item(s)',
  'itemEditor.addItem': 'Add Item',
  'itemEditor.maxReached': 'Maximum item limit reached ({{max}})',
  'itemEditor.empty': 'No service items yet. Click "Add Item" to start.',
  'itemEditor.optional': 'Optional',
  'itemEditor.quantity': 'Qty:',
  'itemEditor.unitPrice': 'Price:',
  'itemEditor.editTitle': 'Edit Service Item',
  'itemEditor.addTitle': 'Add Service Item',
  'itemEditor.cancel': 'Cancel',
  'itemEditor.save': 'Save',
  'itemEditor.itemName': 'Item Name',
  'itemEditor.itemNamePlaceholder': 'Enter item name',
  'itemEditor.itemCategory': 'Category',
  'itemEditor.itemDescription': 'Description',
  'itemEditor.itemDescPlaceholder': 'Enter item description',
  'itemEditor.itemQuantity': 'Quantity',
  'itemEditor.itemUnit': 'Unit',
  'itemEditor.itemUnitPlaceholder': 'e.g., times, days, persons',
  'itemEditor.itemPrice': 'Unit Price (optional)',
  'itemEditor.itemPricePlaceholder': 'Enter unit price',

  // Product card
  'card.noDescription': 'No description',
  'card.negotiable': 'Price on Request',

  // Partner selector
  'partnerSelector.placeholder': 'Search partners...',
  'partnerSelector.noMatchKeyword': 'No matching partners found',
  'partnerSelector.noMatchEmpty': 'Type to search for partners',

  // Add product dialog
  'addDialog.title': 'Add Product Package',
  'addDialog.nameCn': 'Package Name (Chinese)',
  'addDialog.namePlaceholder': 'Enter package name',
  'addDialog.productType': 'Package Type',
  'addDialog.priceMin': 'Min Price',
  'addDialog.priceMax': 'Max Price',
  'addDialog.durationDays': 'Days',
  'addDialog.durationPlaceholder': 'days',
  'addDialog.cancel': 'Cancel',
  'addDialog.save': 'Save Package',

  // Validation
  'validation.nameRequired': 'Product name is required',
  'validation.typeRequired': 'Please select a product type',
  'validation.partnerRequired': 'Please select a partner',
  'validation.itemNameRequired': 'Please enter item name',
  'validation.nameRequired2': 'Please enter package name',
  'validation.typeRequired2': 'Please select package type',
  'validation.invalidNumber': 'Please enter a valid number',
  'validation.priceMaxGreater': 'Max price must be greater than min price',
  'validation.invalidDays': 'Please enter valid number of days',
};

export default enUS;
