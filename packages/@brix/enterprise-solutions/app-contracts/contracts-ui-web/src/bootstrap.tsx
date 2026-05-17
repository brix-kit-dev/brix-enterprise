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
 * @file Contracts Module UI Entry Point
 * @description Module Federation requires async entry loading to avoid shared dependency conflicts
 * @module @brix-sdk/enterprise-contracts-ui-web
 * @version 3.0.0
 * 
 * @author Brix Team
 * @date 2026-02-23
 */
import('./App').then(({ default: App }) => {
  import('react-dom/client').then(({ createRoot }) => {
    const container = document.getElementById('root');
    if (container) {
      const root = createRoot(container);
      root.render(<App />);
    }
  });
});
