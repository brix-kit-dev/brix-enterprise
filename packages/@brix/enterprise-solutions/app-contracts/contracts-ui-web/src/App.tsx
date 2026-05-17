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
 * @file Contracts Module Root Component
 * @description Root component with routing for contracts management module
 * @module @brix-sdk/enterprise-contracts-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 blueprint:
 * - Standalone mode: Uses BrowserRouter
 * - Remote module mode: Router controlled by host shell
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  ContractTemplateListPage,
  ContractTemplateDetailPage,
  ContractTemplateCreatePage,
  ContractListPage,
  ContractDetailPage,
  ContractCreatePage,
} from './pages';

/**
 * Application Root Component
 *
 * This component provides routing for the contracts management module.
 * When running standalone, it uses BrowserRouter.
 * When loaded as a remote module via Module Federation,
 * the host shell controls the router.
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Contract Template Routes */}
        <Route path="/contracts/templates" element={<ContractTemplateListPage />} />
        <Route path="/contracts/templates/create" element={<ContractTemplateCreatePage />} />
        <Route path="/contracts/templates/:id" element={<ContractTemplateDetailPage />} />
        <Route path="/contracts/templates/:id/edit" element={<ContractTemplateCreatePage />} />

        {/* Contract Instance Routes */}
        <Route path="/contracts" element={<ContractListPage />} />
        <Route path="/contracts/create" element={<ContractCreatePage />} />
        <Route path="/contracts/:id" element={<ContractDetailPage />} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/contracts" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
