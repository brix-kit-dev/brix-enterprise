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
 * @file Components Barrel Export
 * @description Centralized export for all storage UI components
 * @module @brix-sdk/enterprise-storage-ui-web
 * @version 3.0.0
 *
 * This module exports all presentational components following
 * v3.0.4 View layer architecture:
 *
 * - FileTypeIcon: MIME type icon mapping
 * - FileCard: File summary card display
 * - FilePreview: Image/PDF preview with zoom
 * - UploadDropzone: Drag-drop upload area
 * - AccessLogTable: Audit log table
 *
 * @author Brix Team
 * @date 2026-02-23
 */

export { FileTypeIcon, type FileTypeIconProps } from './FileTypeIcon';
export { FileCard, type FileCardProps } from './FileCard';
export { FilePreview, type FilePreviewProps } from './FilePreview';
export {
  UploadDropzone,
  type UploadDropzoneProps,
  type FileValidationError,
} from './UploadDropzone';
export {
  AccessLogTable,
  type AccessLogTableProps,
  type TablePagination,
} from './AccessLogTable';
