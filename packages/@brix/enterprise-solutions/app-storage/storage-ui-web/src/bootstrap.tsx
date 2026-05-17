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
 * @file Storage Module Bootstrap Entry
 * @description Module Federation entry point for the storage UI module
 * @module @brix-sdk/enterprise-storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This file is the bootstrap entry for Module Federation.
 * It handles dynamic import of the main App component to ensure
 * shared dependencies are properly loaded before rendering.
 *
 * Architecture Compliance:
 * - Follows v3.0.4 Module Federation pattern
 * - Lazy loads main application for proper dependency resolution
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import('./App').then(({ default: render }) => {
  render();
});
