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
 * @file HttpCapability Adapter - orval Custom HTTP Client
 * @description Forwards HTTP requests from orval-generated code to HttpCapability contract implementation
 * @module booking-ui-web/api/http-client
 * @version 3.2.0
 *
 * [v3.2 Architecture Refactoring - Phase 3.1 shared Layer Purification]
 * This file was migrated from booking-shared/src/http-client.ts
 * Reason: shared layer should only contain type/interface/enum definitions
 * Runtime code (functions) should reside in ui-web layer
 *
 * Design Notes:
 * This file implements orval's custom mutator, enabling all auto-generated Repository
 * calls to use the HttpCapability contract for requests, rather than using axios/fetch directly.
 *
 * Architecture Compliance:
 * - Follows [Blueprint Section 7.1] Plugin layer must not use HTTP client libraries directly
 * - Obtains HttpCapability instance through dependency injection pattern
 * - Supports React Query hooks generation mode
 *
 * @see https://orval.dev/reference/configuration/output#mutator
 */

import type {
  HttpCapability,
  HttpRequestConfig,
  HttpResponse,
} from '@brix-sdk/runtime-sdk-api-web';

// ============================================================================
// HttpCapability Instance Management
// ============================================================================

/**
 * HttpCapability instance reference
 *
 * Injected by Runtime Shell during plugin initialization phase.
 * Uses module-level singleton pattern to ensure the entire plugin shares the same instance.
 */
let httpInstance: HttpCapability | null = null;

/**
 * Set HttpCapability instance
 *
 * <p>Called during plugin lifecycle onMount phase, injected by Shell layer.</p>
 *
 * @param capability - HttpCapability implementation provided by Shell layer
 *
 * @example
 * ```typescript
 * // In plugin bootstrap/entry file
 * import { setHttpCapability } from './api/http-client';
 * import { useHttp } from '@brix-sdk/runtime-sdk-react';
 *
 * export function BookingPluginProvider({ children }) {
 *   const http = useHttp();
 *   
 *   useEffect(() => {
 *     setHttpCapability(http);
 *   }, [http]);
 *   
 *   return children;
 * }
 * ```
 */
export function setHttpCapability(capability: HttpCapability): void {
  httpInstance = capability;
}

/**
 * Get HttpCapability instance (internal use)
 *
 * @returns HttpCapability instance
 * @throws Error if not initialized
 */
function getHttpCapability(): HttpCapability {
  if (!httpInstance) {
    throw new Error(
      '[booking-ui-web] HttpCapability not initialized. ' +
      'Please call setHttpCapability() during plugin initialization. ' +
      'Recommended: use useHttp() hook in plugin provider component.'
    );
  }
  return httpInstance;
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * orval request parameter type
 *
 * Consistent with the request parameter structure of orval generated code
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
 * Used for unified HTTP request error handling, compatible with React Query
 *
 * 【中文说明】HTTP 错误类型
 * 用于统一 HTTP 请求错误处理，兼容 React Query 的错误处理机制
 */
export interface HttpError {
  /** HTTP status code */
  status: number;
  /** Error message */
  message: string;
  /** Original error data */
  data?: unknown;
}

// ============================================================================
// orval Custom Mutator
// ============================================================================

/**
 * HttpCapability custom client
 *
 * <p>Used as orval's mutator, forwards all API requests to HttpCapability.</p>
 *
 * 【中文说明】HttpCapability 自定义客户端
 * 作为 orval 的 mutator 使用，将所有 API 请求转发到 HttpCapability。
 * 这确保了所有 HTTP 请求都通过能力契约层，而不是直接使用 fetch/axios。
 *
 * <h3>orval Integration</h3>
 * Configure in orval.config.ts:
 * ```typescript
 * override: {
 *   mutator: {
 *     path: '../../booking-ui-web/src/api/http-client.ts',
 *     name: 'httpCapabilityClient',
 *   },
 * },
 * ```
 *
 * <h3>Return Value Note</h3>
 * Returns the response data itself, not the complete HttpResponse object,
 * which is consistent with orval generated code expectations.
 *
 * @typeParam TResponse - Response data type
 * @typeParam TData - Request data type
 * @param params - Request parameters
 * @returns Promise wrapped response data
 *
 * @example
 * ```typescript
 * // orval generated code will automatically call this function
 * const bookings = await httpCapabilityClient<BookingDTO[]>({
 *   url: '/api/v1/bookings',
 *   method: 'GET',
 *   params: { page: 1, size: 10 },
 * });
 * ```
 */
export async function httpCapabilityClient<TResponse, TData = unknown>(
  params: HttpClientParams<TData>
): Promise<TResponse> {
  const http = getHttpCapability();

  const config: HttpRequestConfig = {
    url: params.url,
    method: params.method,
    params: params.params,
    data: params.data,
    headers: params.headers,
  };

  const response: HttpResponse<TResponse> = await http.request<TResponse>(config);
  return response.data;
}

/**
 * Default export - for orval mutator usage
 *
 * 【中文说明】默认导出，供 orval mutator 使用
 */
export default httpCapabilityClient;

// ============================================================================
// Type Re-exports
// ============================================================================

/**
 * Type exports - for generated code usage
 *
 * 【中文说明】类型重导出，供生成代码使用
 */
export type { HttpCapability, HttpRequestConfig, HttpResponse };
