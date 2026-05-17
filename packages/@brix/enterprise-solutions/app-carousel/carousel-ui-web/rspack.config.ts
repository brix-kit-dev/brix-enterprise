/**
 * Rspack Configuration - Module Federation Remote Plugin
 *
 * @module carousel-ui-web
 * @version 3.1.0
 *
 * v3.1.0 Changes (Shared Runtime Integration):
 * - Migrated to @brix-sdk/shared-runtime-web for MF shared configuration
 * - Uses getRemoteSharedConfig() instead of manual shared config
 * - Per v3.0.7 Blueprint Constraint 8: Single Source of Truth for runtime deps
 *
 * v3.0 Manifest-Driven Architecture:
 * - Uses Module Federation to expose components
 * - Port: 3007
 */

import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import path from 'path';
import { getRemoteSharedConfig } from '@brix-sdk/shared-runtime-web/mf-config';

const isDev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3007;

const SCOPE_NAME = 'carousel';

export default defineConfig({
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: isDev ? `http://localhost:${PORT}/` : '/',
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    uniqueName: 'carousel-web',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@brix-sdk/enterprise-carousel-shared': path.resolve(__dirname, '../carousel-shared/src/index.ts'),
      'carousel-shared': path.resolve(__dirname, '../carousel-shared/src/index.ts'),
      '@brix-sdk/shared-runtime-web': path.resolve(__dirname, '../../../../../../../brix/packages/@brix/shared-runtime/shared-runtime-web/dist'),
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
    new rspack.container.ModuleFederationPlugin({
      name: SCOPE_NAME,
      filename: 'remoteEntry.js',
      exposes: {
        './pages/CarouselListPage': './src/pages/CarouselListPage.tsx',
        './pages/CarouselDetailPage': './src/pages/CarouselDetailPage.tsx',
        './pages/BannerListPage': './src/pages/BannerListPage.tsx',
      },
      shared: getRemoteSharedConfig(),
    }),
  ],
  devServer: {
    port: PORT as number,
    hot: isDev,
    liveReload: isDev,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
  },
});
