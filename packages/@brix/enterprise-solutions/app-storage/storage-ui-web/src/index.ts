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
 * @file Module Entry Point
 * @description Main export entry for storage-ui-web module
 * @module @brix-sdk/enterprise-storage-ui-web
 * @version 3.0.0
 *
 * This is the main entry point for the storage UI module.
 * Exports all public APIs including:
 * - Pages: FileListPage, FileDetailPage, FileUploadPage
 * - Hooks: useFileList, useFileDetail, useFileUpload, useFileAccessLogs
 * - Components: FileCard, FilePreview, FileTypeIcon, UploadDropzone, AccessLogTable
 *
 * Module Federation Configuration:
 * - Remote name: "storage"
 * - Port: 3053
 * - Exposes: ./pages, ./hooks, ./components
 *
 * @author Brix Platform Team
 * @date 2026-02-23
 */

// Pages
export { FileListPage, FileDetailPage, FileUploadPage } from './pages';

// Hooks
export {
  useFileList,
  useFileDetail,
  useFileUpload,
  useFileAccessLogs,
} from './hooks';

// Components
export {
  FileCard,
  FilePreview,
  FileTypeIcon,
  UploadDropzone,
  AccessLogTable,
} from './components';

// Re-export types from shared module for convenience
export type {
  FileDTO,
  FileSummary,
  FileAccessLog,
  FileQueryParams,
  AccessLogQueryParams,
  PagedResponse,
  UploadFileRequest,
  UpdateFileRequest,
  FileStatus,
  FileCategory,
  AccessAction,
} from '@brix-sdk/enterprise-storage-shared';
