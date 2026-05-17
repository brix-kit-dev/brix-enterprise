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
 * @file Storage Module Main Application Component
 * @description Root component for the storage UI module
 * @module @brix-sdk/enterprise-storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This component serves as the module root when running standalone
 * for development. In production, individual pages are loaded via
 * Module Federation by the host shell.
 *
 * Architecture Compliance:
 * - Follows v3.0.4 UI Runtime architecture
 * - Provides standalone dev mode for isolated development
 * - Routes match ui-manifest.yaml registration
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages (View Layer)
import { FileListPage } from './pages/FileList';
import { FileDetailPage } from './pages/FileDetail';
import { FileUploadPage } from './pages/FileUpload';

/**
 * Storage Module Application Component
 *
 * Provides routing for standalone development mode.
 * In production, the host shell handles routing and
 * loads individual pages via Module Federation.
 */
function App(): JSX.Element {
  return (
    <BrowserRouter basename="/storage">
      <Routes>
        {/* File List - Main entry for file center */}
        <Route path="/files" element={<FileListPage />} />

        {/* File Upload - Batch upload interface */}
        <Route path="/upload" element={<FileUploadPage />} />

        {/* File Detail - File metadata and access logs */}
        <Route path="/files/:id" element={<FileDetailPage />} />

        {/* Default redirect to file list */}
        <Route path="*" element={<Navigate to="/files" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * Mount the application to the DOM
 *
 * This function is called from bootstrap.tsx to render the app.
 * It handles finding or creating the root container element.
 */
export default function render(): void {
  const containerId = 'storage-root';
  let container = document.getElementById(containerId);

  // Create container if not exists (standalone dev mode)
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
