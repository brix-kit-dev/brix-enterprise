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
 * Root application component for the Compliance UI Web module.
 * Provides routing configuration for script templates, forbidden words,
 * and compliance check functionality.
 * Following v3.0.4 Runtime Shell Architecture Blueprint.
 * @module compliance-ui-web/App
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Lazy load page components for code splitting
const ScriptTemplateListPage = React.lazy(() => import('./pages/ScriptTemplateListPage'));
const ScriptTemplateDetailPage = React.lazy(() => import('./pages/ScriptTemplateDetailPage'));
const ScriptTemplateCreatePage = React.lazy(() => import('./pages/ScriptTemplateCreatePage'));
const ForbiddenWordListPage = React.lazy(() => import('./pages/ForbiddenWordListPage'));
const ForbiddenWordCreatePage = React.lazy(() => import('./pages/ForbiddenWordCreatePage'));
const ComplianceCheckPage = React.lazy(() => import('./pages/ComplianceCheckPage'));

/**
 * Loading fallback component displayed during lazy loading of page components.
 * @returns JSX element showing loading state
 */
const LoadingFallback: React.FC = () => (
  <div className="compliance-loading-container">
    <div className="compliance-loading-spinner" />
    <span className="compliance-loading-text">加载中...</span>
  </div>
);

/**
 * Root application component providing route configuration
 * for the compliance management module.
 * @returns The compliance module router configuration
 */
const App: React.FC = () => {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Script Template Routes */}
        <Route path="/scripts" element={<ScriptTemplateListPage />} />
        <Route path="/scripts/create" element={<ScriptTemplateCreatePage />} />
        <Route path="/scripts/:id" element={<ScriptTemplateDetailPage />} />
        <Route path="/scripts/:id/edit" element={<ScriptTemplateCreatePage />} />

        {/* Forbidden Word Routes */}
        <Route path="/forbidden-words" element={<ForbiddenWordListPage />} />
        <Route path="/forbidden-words/create" element={<ForbiddenWordCreatePage />} />
        <Route path="/forbidden-words/:id/edit" element={<ForbiddenWordCreatePage />} />

        {/* Compliance Check Route */}
        <Route path="/check" element={<ComplianceCheckPage />} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/scripts" replace />} />
        <Route path="*" element={<Navigate to="/scripts" replace />} />
      </Routes>
    </React.Suspense>
  );
};

export default App;
