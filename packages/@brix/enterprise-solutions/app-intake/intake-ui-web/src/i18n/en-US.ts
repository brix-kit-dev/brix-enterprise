/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Commercial use requires a valid Brix Enterprise license.
 */
/**
 * @file English translations for app-intake plugin
 * @module intake-ui-web/i18n/en-US
 * @version 3.3.0
 */

const enUS: Record<string, string> = {
  // Common
  'common.loading': 'Loading...',
  'common.back': 'Back',
  'common.backToList': 'Back to List',
  'common.backToDetail': 'Back to Detail',
  'common.cancel': 'Cancel',
  'common.edit': 'Edit',
  'common.refresh': 'Refresh',
  'common.status': 'Status',

  // Document fields
  'doc.fileName': 'File Name',
  'doc.fileSize': 'File Size',
  'doc.submitTime': 'Submit Time',
  'doc.submitter': 'Submitter',
  'doc.reviewer': 'Reviewer',
  'doc.reviewTime': 'Review Time',
  'doc.reviewComment': 'Review Comment',
  'doc.rejectReason': 'Rejection Reason',
  'doc.required': 'Required',

  // Task fields
  'task.customerId': 'Customer ID',
  'task.relatedCase': 'Related Case',
  'task.deadline': 'Deadline',
  'task.createdAt': 'Created At',
  'task.createdBy': 'Created By',
  'task.updatedAt': 'Last Updated',
  'task.priority': 'Priority',
  'task.remarks': 'Remarks',

  // Actions
  'action.approve': 'Approve',
  'action.reject': 'Reject',
  'action.upload': 'Upload',
  'action.approveAll': 'Approve All',
  'action.confirmReject': 'Confirm Rejection',
  'action.activate': 'Activate Task',
  'action.activateShort': 'Activate',
  'action.submitDocuments': 'Submit Documents',
  'action.reviewDocuments': 'Review Documents',
  'action.cancelTask': 'Cancel Task',
  'action.deleteTask': 'Delete Task',
  'action.createTask': 'Create Task',

  // Status labels
  'status.draft': 'Draft',
  'status.inProgress': 'In Progress',
  'status.reviewing': 'Under Review',
  'status.completed': 'Completed',
  'status.cancelled': 'Cancelled',
  'review.pending': 'Pending Review',
  'review.approved': 'Approved',
  'review.rejected': 'Rejected',

  // Page titles
  'page.taskList': 'Document Collection Tasks',
  'page.review': 'Review Documents',
  'page.submit': 'Submit Documents',

  // Table headers
  'table.title': 'Title',
  'table.status': 'Status',
  'table.priority': 'Priority',
  'table.progress': 'Progress',
  'table.deadline': 'Deadline',
  'table.actions': 'Actions',

  // Messages
  'message.loading': 'Loading...',
  'message.taskNotFound': 'Task not found',
  'message.reviewNotAllowed': 'This task does not allow document review in its current status',
  'message.submitNotAllowed': 'This task does not allow document submission in its current status',
  'message.allApproved': 'All submitted documents have been approved',
  'message.allSubmitted': 'All documents submitted. Awaiting review.',
  'empty.noTasks': 'No tasks',
  'empty.noSubmitted': 'No submitted documents',
  'confirm.cancelTask': 'Are you sure you want to cancel this task?',
  'confirm.deleteTask': 'Are you sure you want to delete this task? This action cannot be undone.',
  'confirm.approveAll': 'Are you sure you want to approve all {count} pending documents?',

  // Upload
  'upload.dropzone': 'Click or drag files here to upload',
  'upload.maxSize': 'Maximum file size',
  'upload.uploading': 'Uploading...',
  'upload.success': 'Upload successful',
  'upload.uploadFile': 'Upload File',
  'upload.unsupportedType': 'Unsupported file type',
  'upload.sizeExceeded': 'File size exceeds limit',
  'upload.supportedFormats': 'JPG format supported',
  'upload.maxSizeHint': 'Max 10MB per file',
  'upload.requiredHint': 'All required items must be submitted to complete the task',
};

export default enUS;
