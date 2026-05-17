/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Commercial use requires a valid Brix Enterprise license.
 */
/**
 * @file English translations for app-storage plugin
 * @module storage-ui-web/i18n/en-US
 * @version 3.3.0
 */

const enUS: Record<string, string> = {
  // File status
  'fileStatus.active': 'Active',
  'fileStatus.uploading': 'Uploading',
  'fileStatus.uploaded': 'Uploaded',
  'fileStatus.processing': 'Processing',
  'fileStatus.ready': 'Ready',
  'fileStatus.failed': 'Failed',
  'fileStatus.archived': 'Archived',
  'fileStatus.deleted': 'Deleted',

  // File categories
  'category.document': 'Document',
  'category.image': 'Image',
  'category.video': 'Video',
  'category.audio': 'Audio',
  'category.medical': 'Medical',
  'category.contract': 'Contract',
  'category.idDocument': 'ID Document',
  'category.certificate': 'Certificate',
  'category.other': 'Other',

  // Actions
  'action.preview': 'Preview',
  'action.download': 'Download',
  'action.delete': 'Delete',
  'action.edit': 'Edit',
  'action.back': 'Back',
  'action.backToList': 'Back to File List',
  'action.saving': 'Saving...',
  'action.save': 'Save',
  'action.cancel': 'Cancel',
  'action.upload': 'Upload File',
  'action.clearList': 'Clear List',
  'action.startUpload': 'Start Upload',
  'action.clearCompleted': 'Clear Completed',
  'action.selectFile': 'Select File',
  'action.editFileInfo': 'Edit File Info',

  // Form labels
  'form.displayName': 'Display Name',
  'form.description': 'Description',
  'form.category': 'Category',
  'form.tags': 'Tags',
  'form.originalName': 'Original Name',
  'form.fileType': 'File Type',
  'form.fileSize': 'File Size',
  'form.status': 'Status',
  'form.fileId': 'File ID',
  'form.uploadTime': 'Upload Time',
  'form.uploader': 'Uploader',
  'form.lastModified': 'Last Modified',
  'form.storagePath': 'Storage Path',
  'form.checksum': 'Checksum',

  // Page titles & tabs
  'page.fileCenter': 'File Center',
  'page.detail': 'Details',
  'page.accessLog': 'Access Log',
  'page.upload': 'Upload File',
  'page.basicInfo': 'Basic Info',
  'page.systemInfo': 'System Info',

  // Preview
  'preview.loading': 'Loading...',
  'preview.loadFailed': 'Preview failed to load',
  'preview.unsupported': 'Cannot preview this file type',
  'preview.directDownload': 'Direct Download',
  'preview.downloadFile': 'Download File',
  'preview.close': 'Close (Esc)',
  'preview.zoomOut': 'Zoom Out (-)',
  'preview.zoomIn': 'Zoom In (+)',
  'preview.reset': 'Reset (0)',

  // Access log
  'accessLog.title': 'Access Log',
  'accessLog.view': 'View',
  'accessLog.download': 'Download',
  'accessLog.preview': 'Preview',
  'accessLog.share': 'Share',
  'accessLog.delete': 'Delete',
  'accessLog.update': 'Update',
  'accessLog.noRecords': 'No access records',
  'accessLog.filterType': 'Filter by operation type',
  'accessLog.allOperations': 'All Operations',
  'accessLog.operation': 'Operation',
  'accessLog.user': 'User',
  'accessLog.time': 'Time',
  'accessLog.address': 'Address',
  'accessLog.detail': 'Detail',

  // Upload page
  'upload.pending': 'Pending',
  'upload.uploading': 'Uploading',
  'upload.completed': 'Completed',
  'upload.failed': 'Failed',
  'upload.noFiles': 'No files to upload',
  'upload.dragHint': 'Drag files from above or click to select',
  'upload.tabPending': 'Pending',
  'upload.tabUploading': 'Uploading',
  'upload.tabCompleted': 'Completed',
  'upload.tabFailed': 'Failed',
  'upload.dropzone': 'Drag files here to upload',
  'upload.clickToSelect': 'or click to select files',
  'upload.sizeExceeded': 'File size exceeds limit',
  'upload.unsupportedType': 'Unsupported file type',

  // Confirm dialogs
  'confirm.deleteTitle': 'Confirm Delete',
  'confirm.deleteMessage': 'Are you sure you want to delete file {name}?',
  'confirm.irreversible': 'This action cannot be undone',
  'confirm.deleting': 'Deleting...',
  'confirm.confirm': 'Confirm Delete',

  // Placeholders
  'placeholder.search': 'Search files...',
  'placeholder.description': 'Add file description...',
  'placeholder.tags': 'Tag 1, Tag 2, ...',
  'placeholder.displayName': 'File display name',
  'placeholder.tagSeparator': 'Comma separated',

  // View modes & pagination
  'view.grid': 'Grid View',
  'view.list': 'List View',
  'count.files': '{count} file(s)',
  'pagination.prev': 'Previous',
  'pagination.next': 'Next',
  'empty.noFiles': 'No files',
  'empty.uploadToStart': 'Upload files to start using the File Center',
  'empty.noCategoryFiles': 'No files in this category',
  'empty.noAccessLog': 'No access records for this file',
  'message.notFound': 'File not found',
};

export default enUS;
