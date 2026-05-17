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
 * @file HTTP Client Type Definitions
 * @description Type definitions for HTTP client operations (pure types, no runtime code)
 * @module @brix-sdk/enterprise-storage-shared/http-client
 * @version 3.2.0
 *
 * [v3.2 Architecture Refactoring - Phase 3.1 shared Layer Purification]
 * This module currently has no ui-web module.
 * HTTP client types are reserved for future frontend implementation.
 *
 * 【中文技术说明】
 * storage 插件目前为纯后端插件，没有 ui-web 模块。
 * 本文件保留纯类型定义，以备将来添加前端模块时使用。
 */

/**
 * orval request parameter type
 */
export interface HttpClientParams<TData = unknown> {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  params?: Record<string, unknown>;
  data?: TData;
  headers?: Record<string, string>;
  responseType?: 'json' | 'blob' | 'text';
  signal?: AbortSignal;
}

/**
 * HTTP Error type
 */
export interface HttpError {
  status: number;
  message: string;
  data?: unknown;
}
