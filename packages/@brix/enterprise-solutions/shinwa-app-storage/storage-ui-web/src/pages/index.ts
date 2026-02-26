/**
 * @file Pages Barrel Export
 * @description Centralized export for all storage UI pages
 * @module @shinwa/storage-ui-web
 * @version 3.0.0
 *
 * This module exports all page components following
 * v3.0.4 View layer architecture.
 *
 * Exposed via Module Federation:
 * - FileListPage: Main file browsing page
 * - FileDetailPage: Individual file detail view
 * - FileUploadPage: Batch upload page
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

export { FileListPage } from './FileList';
export { FileDetailPage } from './FileDetail';
export { FileUploadPage } from './FileUpload';
