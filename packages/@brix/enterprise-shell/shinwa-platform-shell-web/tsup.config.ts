import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'pages/index': 'src/pages/index.ts',
    'layouts/index': 'src/layouts/index.ts',
    'components/index': 'src/components/index.ts',
    'hooks/index': 'src/hooks/index.ts',
  },
  format: ['esm'],
  dts: false, // 暂时禁用类型声明生成（外部模块类型解析问题）
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react', 
    'react-dom', 
    'react-router-dom', 
    '@brix/platform-auth-web',
    '@brix/runtime-sdk-api-web',
    '@brix/runtime-sdk-react',
    '@brix/design-tokens',
    '@brix/infra-adapter-mf-web',
  ],
  treeshake: true,
});
