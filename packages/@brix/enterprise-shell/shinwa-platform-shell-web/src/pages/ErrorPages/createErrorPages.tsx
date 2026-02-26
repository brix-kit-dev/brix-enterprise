/**
 * @file createErrorPages Factory Function
 * @description Creates pre-assembled error pages (404, 403)
 * @module @shinwa/shinwa-platform-shell-web/pages/ErrorPages
 * @version 3.0.0
 */

import React, { useMemo } from 'react';
import type { ErrorPageConfig, SimpleErrorPageConfig } from '../types';
import { generateErrorPageStyles, DEFAULT_PRIMARY_COLOR } from '../styles';

/**
 * Create 404 page
 */
export function createNotFoundPage(config: ErrorPageConfig): React.FC {
  const { navigationService, routes, branding } = config;
  const homePath = routes?.homePath || '/dashboard';
  const primaryColor = branding?.primaryColor || DEFAULT_PRIMARY_COLOR;
  
  const NotFoundPage: React.FC = () => {
    const styles = useMemo(() => generateErrorPageStyles(primaryColor), []);
    
    return (
      <>
        <style>{styles}</style>
        <div className="shell-error-page">
          <div className="shell-error-container">
            <div className="shell-error-code">404</div>
            <h1 className="shell-error-title">页面未找到</h1>
            <p className="shell-error-message">
              抱歉，您访问的页面不存在或已被移除。
            </p>
            <div className="shell-error-actions">
              <button
                className="shell-btn shell-btn-primary"
                onClick={() => navigationService.navigate(homePath)}
              >
                返回首页
              </button>
              <button
                className="shell-btn shell-btn-secondary"
                onClick={() => navigationService.goBack()}
              >
                返回上一页
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };
  
  NotFoundPage.displayName = 'PrebuiltNotFoundPage';
  
  return NotFoundPage;
}

/**
 * Create simplified 404 page
 */
export function createSimpleNotFoundPage(config: SimpleErrorPageConfig): React.FC {
  return createNotFoundPage({
    navigationService: {
      navigate: config.onGoHome as any,
      goBack: config.onGoBack || (() => window.history.back()),
    },
    branding: config.branding,
  });
}

/**
 * Create 403 Unauthorized page
 */
export function createUnauthorizedPage(config: ErrorPageConfig): React.FC {
  const { navigationService, routes, branding } = config;
  const homePath = routes?.homePath || '/dashboard';
  const loginPath = routes?.loginPath || '/login';
  const primaryColor = branding?.primaryColor || DEFAULT_PRIMARY_COLOR;
  
  const UnauthorizedPage: React.FC = () => {
    const styles = useMemo(() => generateErrorPageStyles(primaryColor), []);
    
    return (
      <>
        <style>{styles}</style>
        <div className="shell-error-page">
          <div className="shell-error-container">
            <div className="shell-error-icon">🔒</div>
            <div className="shell-error-code error-403">403</div>
            <h1 className="shell-error-title">访问被拒绝</h1>
            <p className="shell-error-message">
              抱歉，您没有权限访问此页面。请联系管理员获取访问权限。
            </p>
            <div className="shell-error-actions">
              <button
                className="shell-btn shell-btn-primary"
                onClick={() => navigationService.navigate(homePath)}
              >
                返回首页
              </button>
              <button
                className="shell-btn shell-btn-secondary"
                onClick={() => navigationService.navigate(loginPath)}
              >
                重新登录
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };
  
  UnauthorizedPage.displayName = 'PrebuiltUnauthorizedPage';
  
  return UnauthorizedPage;
}

/**
 * Create simplified 403 page
 */
export function createSimpleUnauthorizedPage(config: SimpleErrorPageConfig): React.FC {
  return createUnauthorizedPage({
    navigationService: {
      navigate: (path) => {
        if (path.includes('login') && config.onReLogin) {
          config.onReLogin();
        } else {
          config.onGoHome();
        }
      },
      goBack: config.onGoBack || (() => window.history.back()),
    },
    branding: config.branding,
  });
}
