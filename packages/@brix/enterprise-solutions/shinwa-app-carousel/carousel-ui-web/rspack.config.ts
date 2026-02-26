/**
 * Rspack 配置 - Module Federation
 *
 * @module carousel-web (原 carousel-ui-web)
 * @version 3.0.0
 *
 * v3.0 Manifest-Driven 架构规范：
 * - 使用 Module Federation 暴露组件
 * - exposes 与 ui-manifest.yaml 中的 federation.exposes 保持一致
 * - 与基座共享 react, react-dom, @mui/material
 * - 移除 react-router-dom、zustand 等直接依赖（改用能力契约）
 * - 端口规划：Web 3007（轮播 Banner 管理）
 *
 * 【架构红线】
 * ❌ 禁止共享 react-router-dom（插件不应直接依赖路由）
 * ❌ 禁止共享 zustand（状态通过 PluginStateCapability 管理）
 * ✅ 通过 runtime-sdk-api-web 访问能力契约
 */

import { defineConfig } from '@rspack/cli';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import path from 'path';

const isDev = process.env.NODE_ENV !== 'production';
// 端口规划: carousel 模块 Web 端口 3007
const PORT = process.env.PORT || 3007;

// Module Federation 的 scope 名称（与 ui-manifest.yaml 中的 federation.name 一致）
const SCOPE_NAME = 'carousel';

export default defineConfig({
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: isDev ? `http://localhost:${PORT}/` : '/',
    filename: '[name].[contenthash].js',
    uniqueName: 'carousel-web',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      /**
       * 【v3.0 开发时依赖解析】
       * @brix 包指向源文件，用于开发时构建
       * 生产环境中这些包由 Host 通过 Module Federation 共享
       */
      '@brix/runtime-sdk-api-web': path.resolve(__dirname, '../../../runtime-sdk/runtime-sdk-api-web/src/index.ts'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                },
              },
            },
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
        type: 'javascript/auto',
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|ico)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: SCOPE_NAME,
      filename: 'remoteEntry.js',
      /**
       * 【v3.0】禁用 DTS 类型生成
       * 原因：开发时使用源文件引用，类型由 tsconfig paths 解析
       * 生产时由 Host 提供共享依赖
       */
      dts: false,
      /**
       * 暴露的模块
       *
       * 【重要】与 ui-manifest.yaml 中的 federation.exposes 保持一致
       * 使用新的目录结构：src/pages/[PageName]/index.tsx
       *
       * 【v3.0 架构原则】
       * - 只暴露页面组件和可嵌入组件
       * - 不暴露 App 组件（插件没有独立 App）
       * - 路径格式：./pages/[PageName] 或 ./components/[ComponentName]
       */
      exposes: {
        // 页面组件（对应 ui-manifest.yaml 中的 pages）
        './pages/CarouselList': './src/pages/CarouselListPage/index.tsx',
        './pages/CarouselDetail': './src/pages/CarouselDetailPage/index.tsx',
        './pages/BannerList': './src/pages/BannerListPage/index.tsx',
        // 可嵌入组件（供其他插件或 Host 使用）
        './components/CarouselView': './src/components/CarouselView/index.tsx',
      },
      /**
       * 共享依赖
       *
       * 【v3.0 架构原则】
       * ❌ 移除 react-router-dom：插件通过 NavigationCapability 导航
       * ❌ 移除 zustand：插件通过 PluginStateCapability 管理状态
       * ✅ 保留 react、react-dom：基础 React 运行时
       * ✅ 保留 @mui/material：UI 组件库
       * ✅ 保留 i18next：国际化（通过 Host 配置）
       */
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.3.1',
          eager: isDev,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.3.1',
          eager: isDev,
        },
        '@mui/material': {
          singleton: true,
          requiredVersion: '^5.16.14',
          eager: isDev,
        },
        '@emotion/react': {
          singleton: true,
          eager: isDev,
        },
        '@emotion/styled': {
          singleton: true,
          eager: isDev,
        },
        'react-i18next': {
          singleton: true,
          eager: isDev,
        },
        i18next: {
          singleton: true,
          eager: isDev,
        },
        '@brix/runtime-sdk-api-web': {
          singleton: true,
          eager: isDev,
        },
      },
    }),
  ],
  devServer: {
    port: PORT as number,
    hot: true,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
  },
});
