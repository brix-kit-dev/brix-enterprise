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
 * 【中文技术说明】
 * 本文件是 orval 代码生成器的自定义 HTTP 客户端适配器。
 * 根据 v3.0.4 运行壳架构设计蓝图的约束7（前后端完全分离原则）：
 * - shared 模块仅作为前后端类型契约，只包含 TypeScript 类型、事件定义、权限常量
 * - 运行时代码（可执行函数）必须放在 ui-web 层
 * - Repository 层通过工厂模式注入 HttpCapability
 *
 * Design Notes:
 * This file implements orval's custom mutator, enabling all auto-generated Repository
 * calls to use the HttpCapability contract for requests, rather than using axios/fetch directly.
 *
 * Architecture Compliance:
 * - Follows [Blueprint §7.1] Plugin layer must not use HTTP client libraries directly
 * - Obtains HttpCapability instance through dependency injection pattern
 * - Supports React Query hooks generation mode
 *
 * @see https://orval.dev/reference/configuration/output#mutator
 */

import type {
  HttpCapability,
  HttpRequestConfig,
  HttpResponse,
} from '@brix/runtime-sdk-api-web';

// ============================================================================
// HttpCapability Instance Management
// ============================================================================

/**
 * HttpCapability instance reference
 *
 * 【中文说明】HttpCapability 实例引用
 * 在插件初始化阶段由运行壳（Shell 层）注入
 * 采用模块级单例模式，确保整个插件共享同一实例
 */
let httpInstance: HttpCapability | null = null;

/**
 * Set HttpCapability instance
 *
 * <p>Called during plugin lifecycle onMount phase, injected by Shell layer.</p>
 *
 * 【中文说明】设置 HttpCapability 实例
 * 调用时机：插件生命周期 onMount 阶段，由 Shell 层注入
 *
 * @param capability - HttpCapability implementation provided by Shell layer
 *
 * @example
 * ```typescript
 * // In plugin bootstrap/entry file
 * import { setHttpCapability } from './api/http-client';
 * import { useHttp } from '@brix/runtime-sdk-react';
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
 *
 * 【中文说明】orval 请求参数类型
 * 与 orval 生成代码的请求参数结构保持一致
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
