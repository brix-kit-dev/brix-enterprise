/**
 * @file Components Barrel Export
 * @description Centralized export for all storage UI components
 * @module @shinwa/storage-ui-web
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
 * @author Shinwa Team
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
