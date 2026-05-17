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
 * @file App Component
 * @description Root application component for the intake module
 * @module @brix-sdk/enterprise-intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Provides routing for all intake pages.
 * Can be mounted standalone or integrated into the platform shell.
 *
 * @author Brix Team
 * @date 2026-06-10
 */

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  IntakeTaskListPage,
  IntakeTaskDetailPage,
  IntakeSubmitPage,
  IntakeReviewPage,
} from './pages';

// ============================================================================
// Loading Component
// ============================================================================

/**
 * Loading fallback component
 */
const LoadingFallback: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
      color: '#666',
    }}
  >
    加载中...
  </div>
);

// ============================================================================
// App Component
// ============================================================================

/**
 * Application root component
 *
 * Provides routing for all intake module pages.
 *
 * @example
 * ```tsx
 * // Standalone mode
 * import { App } from '@brix-sdk/enterprise-intake-ui-web';
 * ReactDOM.render(<App />, document.getElementById('root'));
 *
 * // Integrated mode (mounted by platform shell)
 * import { App } from 'intake_ui_web/App';
 * ```
 */
export const App: React.FC = () => {
  return (
    <BrowserRouter basename="/intake">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Task list */}
          <Route path="/tasks" element={<IntakeTaskListPage />} />

          {/* Task detail */}
          <Route path="/tasks/:taskId" element={<IntakeTaskDetailPage />} />

          {/* Submit page (customer) */}
          <Route path="/tasks/:taskId/submit" element={<IntakeSubmitPage />} />

          {/* Review page (reviewer) */}
          <Route path="/tasks/:taskId/review" element={<IntakeReviewPage />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/tasks" replace />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
