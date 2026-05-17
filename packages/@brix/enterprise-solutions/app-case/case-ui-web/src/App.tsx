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
 * @file Case Module Root Component
 * @description Root component with routing for case management module.
 *              Migrated to use UIAdapter components per v3.0.8 Blueprint Constraint 9.
 * @module @brix-sdk/enterprise-case-ui-web
 * @version 3.2.0
 *
 * Design Notes (v3.0.8 BrixUI Migration):
 * - ThemeProvider obtained from UIAdapter via useUI() hook
 * - No direct UI library imports in plugin code
 * - RuntimeContext provided by Host Shell (production) or standalone wrapper (dev)
 *
 * Architecture Compliance:
 * - Following v3.0.4 blueprint:
 *   - Standalone mode: Uses BrowserRouter
 *   - Remote module mode: Router controlled by host shell
 * - Following v3.0.8 Constraint 9:
 *   - All UI components obtained through useUI()
 *   - No direct UI framework imports
 *
 * @author Brix Platform Team
 * @date 2026-03-18
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUI } from '@brix-sdk/runtime-sdk-react';
import {
  CaseListPageV2,
  CaseDetailPageV2,
  CaseCreatePage,
  TemplateListPage,
  TemplateDetailPage,
  TemplateCreatePage,
} from './pages';

/**
 * Application Root Component
 *
 * This component provides routing for the case management module.
 * When running standalone, it uses BrowserRouter.
 * When loaded as a remote module via Module Federation,
 * the host shell controls the router.
 *
 * Design Notes (v3.0.8):
 * - Uses UIAdapter ThemeProvider for consistent styling (obtained via useUI())
 * - Routes follow ui-manifest.yaml declarations
 * - View → ViewModel → Repository architecture enforced
 * - All UI components accessed through UIAdapter abstraction
 */
const App: React.FC = () => {
  // Obtain ThemeProvider from UIAdapter via runtime context
  // This ensures plugin does not directly depend on MUI ThemeProvider
  const { ThemeProvider } = useUI();

  return (
    <ThemeProvider theme="light">
      <BrowserRouter>
        <Routes>
          {/* Case Routes - Using BrixUI components via useUI() */}
          <Route path="/case" element={<CaseListPageV2 />} />
          <Route path="/case/create" element={<CaseCreatePage />} />
          <Route path="/case/:id" element={<CaseDetailPageV2 />} />
          <Route path="/case/:id/edit" element={<CaseCreatePage />} />

          {/* Template Routes */}
          <Route path="/template" element={<TemplateListPage />} />
          <Route path="/template/create" element={<TemplateCreatePage />} />
          <Route path="/template/:id" element={<TemplateDetailPage />} />
          <Route path="/template/:id/edit" element={<TemplateCreatePage />} />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/case" replace />} />
          <Route path="*" element={<Navigate to="/case" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
