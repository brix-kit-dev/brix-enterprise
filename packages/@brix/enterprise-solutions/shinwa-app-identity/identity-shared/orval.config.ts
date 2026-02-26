/**
 * orval 配置文件 - 身份认证模块 API 类型自动生成
 */
import { defineConfig } from 'orval';

export default defineConfig({
  identity: {
    input: {
      target: '../identity-api/src/main/resources/openapi.json',
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
          path: '../../../../identity-ui-web/src/api/http-client.ts',
          name: 'httpCapabilityClient',
        },
        query: {
          useQuery: true,
          useMutation: true,
          useInfinite: true,
          options: {
            staleTime: 5 * 60 * 1000,
          },
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
});
