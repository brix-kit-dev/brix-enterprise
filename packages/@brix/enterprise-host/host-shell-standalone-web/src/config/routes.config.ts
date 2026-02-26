/**
 * @file Routes Config
 * @description Host-level route declarations
 * @module host-standalone-web/config/routes.config
 * @version 3.0.0
 */

import type { RoutesConfig } from '../types';

/**
 * Routes configuration
 */
export const routesConfig: RoutesConfig = {
  defaultHomePath: '/dashboard',
  loginPath: '/login',
  notFoundPath: '/404',
  unauthorizedPath: '/403',

  publicRoutes: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/404',
    '/403',
  ],

  protectedRoutes: [
    '/dashboard',
    '/settings',
    '/profile',
  ],

  pluginRoutes: {
    'booking': '/booking',
    'identity': '/identity',
    'products': '/products',
    'partners': '/partners',
  },
};