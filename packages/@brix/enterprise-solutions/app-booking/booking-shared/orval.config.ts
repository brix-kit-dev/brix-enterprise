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
 * @file orval 配置文件 - 预约模块 API 类型自动生成
 * @description 从 OpenAPI 规范自动生成 TypeScript 类型和 Repository 客户端
 * @module @brix-sdk/enterprise-booking-shared
 * @version 3.0.4
 *
 * 【设计说明】
 * 本配置实现 Phase 5.2 前端类型自动生成管线：
 * 1. 从 booking-api/src/main/resources/openapi.json 读取 OpenAPI 规范
 * 2. 生成 TypeScript 类型定义 (types.generated.ts)
 * 3. 生成 Repository 客户端 (BookingRepository.generated.ts)
 * 4. 使用自定义 HttpCapability 适配器替代 axios/fetch
 *
 * 【工作流程】
 * 后端开发者修改 Controller/DTO
 *   ↓ mvn springdoc-openapi:generate
 * booking-api/src/main/resources/openapi.json (committed)
 *   ↓ pnpm run generate:api (orval)
 * booking-shared/src/generated/
 *   ├── types.generated.ts      ← 从 DTO Schema 生成
 *   ├── BookingRepository.ts    ← 从 API Path 生成（使用 HttpCapability）
 *   └── index.ts                ← 统一导出
 *
 * 【运行命令】
 * pnpm run generate:api
 *
 * @see https://orval.dev/reference/configuration/overview
 */

import { defineConfig } from 'orval';

export default defineConfig({
  /**
   * 预约模块 API 配置
   */
  booking: {
    /**
     * 输入配置 - OpenAPI 规范文件
     */
    input: {
      /** OpenAPI 规范文件路径（相对于本配置文件） */
      target: '../booking-api/src/main/resources/openapi.json',
      /** 输入验证选项 */
      validation: true,
    },

    /**
     * 输出配置 - 生成代码设置
     */
    output: {
      /** 生成模式：single（单文件）| split（多文件）| tags（按标签分文件） */
      mode: 'tags-split',
      /** Repository 客户端输出目录 */
      target: './src/generated/repositories',
      /** 类型定义输出目录 */
      schemas: './src/generated/types',
      /** 客户端类型：react-query 支持 TanStack Query hooks */
      client: 'react-query',
      /** 使用 TypeScript */
      mock: false,

      /**
       * 覆盖配置
       */
      override: {
        /**
         * 自定义 HTTP 客户端 mutator
         *
         * 使用 HttpCapability 适配器替代默认的 axios/fetch
         *
         * [v3.2 Architecture Refactoring - Phase 3.1]
         * mutator 路径已从 shared 层迁移到 ui-web 层
         * 原路径: ../http-client.ts (shared/src/http-client.ts)
         * 新路径: ../../../../booking-ui-web/src/api/http-client.ts
         */
        mutator: {
          /** 适配器文件路径（相对于输出目录 src/generated/repositories） */
          path: '../../../../booking-ui-web/src/api/http-client.ts',
          /** 导出的函数名 */
          name: 'httpCapabilityClient',
        },
        /**
         * React Query 配置
         */
        query: {
          /** 使用 TanStack Query v5 版本 */
          useQuery: true,
          useMutation: true,
          useInfinite: true,
          /** Query 选项 */
          options: {
            /** 默认 staleTime */
            staleTime: 5 * 60 * 1000, // 5 分钟
          },
        },
      },
    },

    /**
     * 钩子配置 - 生成后处理
     */
    hooks: {
      /** 生成后执行格式化 */
      afterAllFilesWrite: 'prettier --write',
    },
  },
});
