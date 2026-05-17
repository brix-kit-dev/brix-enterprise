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
 * @module @brix-sdk/enterprise-carousel-shared/http-client
 * @version 3.2.0
 *
 * [v3.2 Architecture Refactoring - Phase 3.1 shared Layer Purification]
 * This file has been refactored to contain ONLY type definitions.
 * Runtime code (setHttpCapability, httpCapabilityClient) has been migrated to:
 * - carousel-ui-web/src/api/http-client.ts
 *
 * 【中文技术说明】
 * 根据 v3.0.4 运行壳架构设计蓝图的约束7（前后端完全分离原则）：
 * - shared 模块仅作为前后端类型契约，只包含 TypeScript 类型、事件定义、权限常量
 * - 运行时代码（setHttpCapability, httpCapabilityClient）已迁移至 ui-web 层
 * - 本文件现在只包含类型定义，满足"shared 纯类型化"的要求
 *
 * @see carousel-ui-web/src/api/http-client.ts - Runtime implementation
 */

// ============================================================================
// Type Definitions (Pure Types - No Runtime Code)
// ============================================================================

/**
 * orval request parameter type
 *
 * Consistent with the request parameter structure of orval generated code.
 *
 * 【中文说明】orval 请求参数类型
 */
export interface HttpClientParams<TData = unknown> {
  /** Request URL */
  url: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  /** URL query parameters */
  params?: Record<string, unknown>;
  /** Request body data */
  data?: TData;
  /** Request headers */
  headers?: Record<string, string>;
  /** Response type */
  responseType?: 'json' | 'blob' | 'text';
  /** Signal (for request cancellation) */
  signal?: AbortSignal;
}

/**
 * HTTP Error type
 *
 * Used for unified HTTP request error handling.
 *
 * 【中文说明】HTTP 错误类型
 */
export interface HttpError {
  /** HTTP status code */
  status: number;
  /** Error message */
  message: string;
  /** Original error data */
  data?: unknown;
}
