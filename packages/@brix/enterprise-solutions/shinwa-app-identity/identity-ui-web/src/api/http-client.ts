/**
 * @file HttpCapability Adapter - orval Custom HTTP Client
 * @description Forwards HTTP requests from orval-generated code to HttpCapability contract implementation
 * @module identity-ui-web/api/http-client
 * @version 3.2.0
 *
 * [v3.2 Architecture Refactoring - Phase 3.1 shared Layer Purification]
 * This file was migrated from identity-shared/src/http-client.ts
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
 */
let httpInstance: HttpCapability | null = null;

/**
 * Set HttpCapability instance
 *
 * 【中文说明】设置 HttpCapability 实例
 * 调用时机：插件生命周期 onMount 阶段，由 Shell 层注入
 *
 * @param capability - HttpCapability implementation provided by Shell layer
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
      '[identity-ui-web] HttpCapability not initialized. ' +
      'Please call setHttpCapability() during plugin initialization.'
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
 * 【中文说明】orval 请求参数类型
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
 *
 * 【中文说明】HTTP 错误类型
 */
export interface HttpError {
  status: number;
  message: string;
  data?: unknown;
}

// ============================================================================
// orval Custom Mutator
// ============================================================================

/**
 * HttpCapability custom client
 *
 * 【中文说明】HttpCapability 自定义客户端
 * 作为 orval 的 mutator 使用，将所有 API 请求转发到 HttpCapability
 *
 * @typeParam TResponse - Response data type
 * @typeParam TData - Request data type
 * @param params - Request parameters
 * @returns Promise wrapped response data
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

export default httpCapabilityClient;

export type { HttpCapability, HttpRequestConfig, HttpResponse };
