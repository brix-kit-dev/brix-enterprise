/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Commercial use requires a valid Brix Enterprise license.
 */
/**
 * @file English translations for app-carousel plugin
 * @module carousel-ui-web/i18n/en-US
 * @version 3.3.0
 */

const enUS: Record<string, string> = {
  // ── Common ────────────────────────────────────────────────────────────
  'common.loading': 'Loading...',
  'common.unknownError': 'Unknown error',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.add': 'Add',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.back': 'Back',
  'common.reset': 'Reset',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.confirmDelete': 'Confirm Delete',
  'common.sort': 'Sort',
  'common.views': 'Views',
  'common.clicks': 'Clicks',

  // ── Status Labels ─────────────────────────────────────────────────────
  'status.enabled': 'Enabled',
  'status.disabled': 'Disabled',
  'status.ENABLED': 'Enabled',
  'status.DISABLED': 'Disabled',
  'status.DRAFT': 'Draft',
  'status.EXPIRED': 'Expired',

  // ── Operation Messages ────────────────────────────────────────────────
  'message.addSuccess': 'Added successfully',
  'message.addFailed': 'Add failed',
  'message.createSuccess': 'Created successfully',
  'message.createFailed': 'Create failed',
  'message.updateSuccess': 'Updated successfully',
  'message.updateFailed': 'Update failed',
  'message.deleteSuccess': 'Deleted successfully',
  'message.deleteFailed': 'Delete failed',
  'message.operationSuccess': 'Operation successful',
  'message.operationFailed': 'Operation failed',

  // ── List Page ─────────────────────────────────────────────────────────
  'list.title': 'Carousel Management',
  'list.create': 'Create Carousel',
  'list.refreshTooltip': 'Refresh list',
  'list.empty': 'No carousels found. Click "Create Carousel" to get started.',
  'list.loadFailed': 'Failed to load carousel list',
  'list.col.code': 'Code',
  'list.col.name': 'Name',
  'list.col.size': 'Size',
  'list.col.bannerCount': 'Banners',
  'list.col.autoPlay': 'Auto Play',
  'list.col.status': 'Status',
  'list.col.actions': 'Actions',
  'list.action.viewBanners': 'View Banners',
  'list.deleteConfirm': 'Are you sure you want to delete carousel {name}? This will also delete all banners and cannot be undone.',
  'list.deleting': 'Deleting...',

  // ── Detail Page ───────────────────────────────────────────────────────
  'detail.editTitle': 'Edit Carousel',
  'detail.createTitle': 'Create Carousel',
  'detail.section.basic': 'Basic Info',
  'detail.section.size': 'Size Settings',
  'detail.section.playback': 'Playback Settings',
  'detail.field.code': 'Carousel Code',
  'detail.field.code.helper': 'Unique identifier, cannot be changed after creation',
  'detail.field.name': 'Carousel Name',
  'detail.field.description': 'Description',
  'detail.field.width': 'Width (px)',
  'detail.field.height': 'Height (px)',
  'detail.field.maxBannerCount': 'Max Banner Count',
  'detail.field.autoPlay': 'Auto Play',
  'detail.field.interval': 'Interval (ms)',
  'detail.field.showIndicator': 'Show Indicator',
  'detail.field.showArrow': 'Show Arrows',
  'detail.saving': 'Saving...',
  'detail.creating': 'Creating...',
  'detail.saveChanges': 'Save Changes',
  'detail.createCarousel': 'Create Carousel',

  // ── Banner Management ─────────────────────────────────────────────────
  'banner.title': '{name} - Banner Management',
  'banner.add': 'Add Banner',
  'banner.editDialog': 'Edit Banner',
  'banner.addDialog': 'Add Banner',
  'banner.empty': 'No banners found. Click "Add Banner" to get started.',
  'banner.loadFailed': 'Failed to load banner data',
  'banner.field.title': 'Title',
  'banner.field.subtitle': 'Subtitle',
  'banner.field.imageUrlPc': 'Image URL (Desktop)',
  'banner.field.imageUrlMobile': 'Image URL (Mobile)',
  'banner.field.platform': 'Platform',
  'banner.field.actionType': 'Action Type',
  'banner.field.actionValueWeb': 'Action Value (Web)',
  'banner.field.actionValueApp': 'Action Value (App)',
  'banner.field.sortOrder': 'Sort Order',
  'banner.field.startTime': 'Start Time',
  'banner.field.endTime': 'End Time',
  'banner.sortLabel': 'Sort: {order}',
  'banner.statsLabel': 'Views: {views} | Clicks: {clicks}',
  'banner.enableTooltip': 'Enable',
  'banner.disableTooltip': 'Disable',
  'banner.deleteConfirm': 'Are you sure you want to delete banner "{title}"? This action cannot be undone.',

  // ── Platform Labels ───────────────────────────────────────────────────
  'platform.ALL': 'All Platforms',
  'platform.WEB': 'Web',
  'platform.H5': 'H5',
  'platform.IOS': 'iOS',
  'platform.ANDROID': 'Android',
  'platform.MINI_PROGRAM': 'Mini Program',

  // ── Action Type Labels ────────────────────────────────────────────────
  'actionType.NONE': 'None',
  'actionType.LINK': 'Link',
  'actionType.ROUTE': 'Route',
  'actionType.POPUP': 'Popup',
  'actionType.DEEP_LINK': 'Deep Link',
};

export default enUS;
