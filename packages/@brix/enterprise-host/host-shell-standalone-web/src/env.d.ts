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
/// <reference types="@rspack/core/module" />

/**
 * @file Environment variable type declarations
 * @description Type support for import.meta.env
 */

interface ImportMetaEnv {
  /**
   * API base URL
   */
  readonly VITE_API_BASE?: string;
  readonly VITE_API_BASE_URL?: string;
  
  /**
   * Tenant ID
   */
  readonly VITE_TENANT_ID?: string;
  
  /**
   * App title
   */
  readonly VITE_APP_TITLE?: string;
  
  /**
   * Region config
   */
  readonly VITE_REGION?: 'china' | 'international' | 'auto';
  
  /**
   * Auth storage mode
   */
  readonly VITE_AUTH_STORAGE_MODE?: 'memory' | 'session' | 'cookie';
  
  /**
   * Google OAuth config
   */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_REDIRECT_URI?: string;
  
  /**
   * UI Adapter selection
   * - 'mui': Material UI implementation (default)
   * - 'native': Pure CSS implementation (lightweight)
   */
  readonly VITE_UI_ADAPTER?: 'mui' | 'native';

  /**
   * Local plugin list — comma-separated plugin IDs that are served from localhost.
   * Written by start-frontend.ps1 into .env.local; read by resolvePluginUrl to
   * allow localhost fallback even when NODE_ENV=production (local preview mode).
   */
  readonly VITE_LOCAL_PLUGINS?: string;

  /**
   * Plugin base URLs — set in production deployments; omitted when the plugin
   * is running locally (listed in VITE_LOCAL_PLUGINS uses localhost fallback).
   */
  readonly VITE_PLUGIN_TENANT_URL?: string;
  readonly VITE_PLUGIN_PARTNERS_URL?: string;
  readonly VITE_PLUGIN_PRODUCTS_URL?: string;

  /**
   * Remote backend address (used by rspack devServer proxy for /api and
   * non-local plugin assets).
   */
  readonly VITE_REMOTE_BACKEND?: string;

  /**
   * Dev mode flags
   */
  readonly DEV?: boolean;
  readonly MODE?: string;

  /**
   * Index signature — allows dynamic env var access via import.meta.env[key].
   * Used by resolvePluginUrl() to read VITE_PLUGIN_XXX_URL generically.
   */
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}