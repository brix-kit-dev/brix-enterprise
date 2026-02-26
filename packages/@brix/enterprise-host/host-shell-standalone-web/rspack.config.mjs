/**
 * @file Rspack 配置文件
 * @description Host Standalone Web 的构建配置
 * @module host-standalone-web/rspack.config
 * @version 3.0.0
 * 
 * 【配置说明】
 * 1. Module Federation Host 配置
 * 2. React + TypeScript 支持
 * 3. 开发服务器配置（端口 3001）
 * 4. DefinePlugin 配置（解决 process 未定义问题）
 * 5. 环境变量加载（.env 文件）
 */

import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// 加载 .env 文件
function loadEnv(mode) {
  const envFiles = [
    '.env',
    `.env.${mode}`,
    '.env.local',
    `.env.${mode}.local`,
  ];
  
  const env = {};
  
  for (const file of envFiles) {
    const filePath = path.resolve(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key) {
            env[key.trim()] = valueParts.join('=').trim();
          }
        }
      }
    }
  }
  
  return env;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== 'production';
const mode = isDev ? 'development' : 'production';

// 加载环境变量
const envVars = loadEnv(mode);

// 合并 process.env 中的 VITE_ 变量（支持 cross-env 设置）
Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .forEach(key => {
    envVars[key] = process.env[key];
  });

// 将 VITE_ 开头的环境变量注入到 import.meta.env
const defineEnv = Object.keys(envVars)
  .filter(key => key.startsWith('VITE_'))
  .reduce((acc, key) => {
    acc[`import.meta.env.${key}`] = JSON.stringify(envVars[key]);
    return acc;
  }, {
    'import.meta.env.MODE': JSON.stringify(mode),
    'import.meta.env.DEV': JSON.stringify(isDev),
    'import.meta.env.PROD': JSON.stringify(!isDev),
  });

export default defineConfig({
  context: __dirname,
  entry: {
    main: './src/main.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    // 使用绝对路径，避免 SPA 子路由下的相对路径问题
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Ensure single React instance (critical for Context to work)
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      // 显式解析平台包路径（解决 link: 依赖解析问题）
      '@brix/platform-auth-web': path.resolve(__dirname, '../../platform-commons/packages/client/platform-auth-web/dist/index.js'),
      '@brix/platform-auth-service-web': path.resolve(__dirname, '../../platform-commons/packages/client/platform-auth-service-web/dist/index.js'),
      '@brix/platform-auth-ui-web': path.resolve(__dirname, '../../platform-commons/packages/client/platform-auth-ui-web/dist/index.js'),
      '@brix/platform-router-web': path.resolve(__dirname, '../../platform-commons/packages/client/platform-router-web/dist/index.js'),
      '@shinwa/shinwa-platform-shell-web': path.resolve(__dirname, '../../shinwa-platform/shinwa-platform-shell-web/dist/index.js'),
      '@brix/platform-navigation-web': path.resolve(__dirname, '../../platform-commons/packages/client/platform-navigation-web/dist/index.js'),
      '@brix/platform-eventbus-web': path.resolve(__dirname, '../../platform-commons/packages/client/platform-eventbus-web/dist/index.js'),
      '@brix/runtime-sdk-api-web': path.resolve(__dirname, '../../runtime-sdk/runtime-sdk-api-web/dist/index.js'),
      '@brix/runtime-orchestrator-web': path.resolve(__dirname, '../../runtime-sdk/runtime-orchestrator-web/dist/index.js'),
      // UI Adapter packages (v3.2.1 Phase 2)
      '@brix/runtime-sdk-react': path.resolve(__dirname, '../../runtime-sdk/runtime-sdk-react/dist/index.js'),
      '@brix/infra-adapter-ui-mui': path.resolve(__dirname, '../../infra-adapters/packages/web/infra-adapter-ui-mui/dist/index.js'),
      '@brix/infra-adapter-ui-native': path.resolve(__dirname, '../../infra-adapters/packages/web/infra-adapter-ui-native/dist/index.js'),
    },
    // 启用符号链接解析
    symlinks: true,
    // 模块入口优先级
    mainFields: ['module', 'main'],
    // 确保从 host 的 node_modules 解析共享模块
    modules: [
      path.resolve(__dirname, 'node_modules'),
      // MUI adapter's node_modules for @mui/* dependencies
      path.resolve(__dirname, '../../infra-adapters/packages/web/infra-adapter-ui-mui/node_modules'),
      'node_modules'
    ],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
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
        type: 'css',
      },
    ],
  },
  plugins: [
    // HTML 模板
    new rspack.HtmlRspackPlugin({
      template: './public/index.html',
      title: 'Shinwa Platform',
    }),
    
    // 环境变量定义（解决 process is not defined）
    new rspack.DefinePlugin({
      'process.env': JSON.stringify({}),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      // 注入 VITE_ 环境变量到 import.meta.env
      ...defineEnv,
    }),
    
    // Module Federation Host 配置（使用 rspack 内置插件）
    new rspack.container.ModuleFederationPlugin({
      name: 'host',
      remotes: {
        // 远程插件配置（动态加载）
        // 'booking': 'booking@http://localhost:3010/remoteEntry.js',
        // 'identity': 'identity@http://localhost:3011/remoteEntry.js',
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.2.0',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.2.0',
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: '^6.20.0',
        },
      },
    }),
  ],
  devServer: {
    port: parseInt(envVars.VITE_PORT || process.env.VITE_PORT || '3001', 10),
    hot: true,
    historyApiFallback: {
      index: '/index.html',
      disableDotRule: true,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      // 插件静态资源代理（开发环境）
      // TODO: 生产环境应由 Nginx 或后端统一服务
      '/plugins': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
  optimization: {
    splitChunks: isDev ? false : {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
});
