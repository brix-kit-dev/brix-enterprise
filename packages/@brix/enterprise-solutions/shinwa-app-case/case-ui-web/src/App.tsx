/**
 * @file Case Module Root Component
 * @description Root component with routing for case management module
 * @module @shinwa/case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 blueprint:
 * - Standalone mode: Uses BrowserRouter
 * - Remote module mode: Router controlled by host shell
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  CaseListPage,
  CaseDetailPage,
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
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Case Routes */}
        <Route path="/case" element={<CaseListPage />} />
        <Route path="/case/create" element={<CaseCreatePage />} />
        <Route path="/case/:id" element={<CaseDetailPage />} />
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
  );
};

export default App;
