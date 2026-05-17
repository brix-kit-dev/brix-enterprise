/**
 * Rspack Configuration - Module Federation Remote Plugin
 *
 * @module identity-ui-web
 * @version 3.1.0
 *
 * v3.1.0 Changes (Shared Runtime Integration):
 * - Migrated to @brix-sdk/shared-runtime-web for MF shared configuration
 * - Uses getRemoteSharedConfig() instead of manual shared config
 * - Per v3.0.7 Blueprint Constraint 8: Single Source of Truth for runtime deps
 * - FIXED: Removed eager: isDev which caused React multi-instance issues
 *
 * v3.0 Manifest-Driven Architecture:
 * - Uses Module Federation to expose components
 * - Port: 3016
 */

import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import path from 'path';
import { getRemoteSharedConfig } from '@brix-sdk/shared-runtime-web/mf-config';

const isDev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3016;

const SCOPE_NAME = 'identity';

export default defineConfig({
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: isDev ? `http://localhost:${PORT}/` : '/',
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    uniqueName: 'identity-web',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@brix-sdk/enterprise-identity-shared': path.resolve(__dirname, '../identity-shared/src/index.ts'),
      'identity-shared': path.resolve(__dirname, '../identity-shared/src/index.ts'),
      // Shared Runtime resolution
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
    // Module Federation Remote Plugin configuration using shared-runtime (v3.0.7 Constraint 8)
    new rspack.container.ModuleFederationPlugin({
      name: SCOPE_NAME,
      filename: 'remoteEntry.js',
      exposes: {
        './pages/Login': './src/pages/Login/index.tsx',
        './pages/OAuth2Callback': './src/pages/OAuth2Callback/index.tsx',
        './pages/OrganizationList': './src/pages/OrganizationList/index.tsx',
        './pages/OrganizationDetail': './src/pages/OrganizationDetail/index.tsx',
        './pages/UserList': './src/pages/UserList/index.tsx',
        './pages/UserDetail': './src/pages/UserDetail/index.tsx',
        './pages/UserCreate': './src/pages/UserCreate/index.tsx',
        './pages/RoleList': './src/pages/RoleList/index.tsx',
        './pages/RoleDetail': './src/pages/RoleDetail/index.tsx',
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
