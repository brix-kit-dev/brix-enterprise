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
 * @file Pages Barrel Export
 * @description Centralized export for all storage UI pages
 * @module @brix-sdk/enterprise-storage-ui-web
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
 * @author Brix Team
 * @date 2026-02-23
 */

export { FileListPage } from './FileList';
export { FileDetailPage } from './FileDetail';
export { FileUploadPage } from './FileUpload';
