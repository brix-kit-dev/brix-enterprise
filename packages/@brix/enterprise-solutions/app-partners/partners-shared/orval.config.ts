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
 * orval 配置文件 - 合作伙伴模块 API 类型自动生成
 */
import { defineConfig } from 'orval';

export default defineConfig({
  partners: {
    input: {
      target: '../partners-api/src/main/resources/openapi.json',
      validation: true,
    },
    output: {
      mode: 'tags-split',
      target: './src/generated/repositories',
      schemas: './src/generated/types',
      client: 'react-query',
      mock: false,
      override: {
        mutator: {
          /** 
           * 适配器文件路径
           * [v3.2 Architecture Refactoring - Phase 3.1]
           * mutator 路径已从 shared 层迁移到 ui-web 层
           */
          path: '../../../../partners-ui-web/src/api/http-client.ts',
          name: 'httpCapabilityClient',
        },
        query: {
          useQuery: true,
          useMutation: true,
          useInfinite: true,
          options: { staleTime: 5 * 60 * 1000 },
        },
      },
    },
    hooks: { afterAllFilesWrite: 'prettier --write' },
  },
});
