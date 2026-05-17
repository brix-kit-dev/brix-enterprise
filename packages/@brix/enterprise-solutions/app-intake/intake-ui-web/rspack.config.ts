/**
 * Rspack Configuration — Module Federation Remote Plugin
 *
 * @module intake-ui-web
 * @since 3.0.0
 *
 * Architecture Notes:
 * - Acts as a Module Federation remote loaded dynamically by the Host shell
 * - Uses getRemoteSharedConfig() per v3.0.7 Blueprint Constraint 8 (Single Source of Truth)
 * - All runtime dependencies (React, Router, UI) provided by Host via shared-runtime
 */

import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import path from 'path';
import { getRemoteSharedConfig } from '@brix-sdk/shared-runtime-web/mf-config';

const isDev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3056;

const SCOPE_NAME = 'intake';

export default defineConfig({
  entry: './src/bootstrap.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: isDev ? `http://localhost:${PORT}/` : '/',
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    uniqueName: 'intake-web',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@brix-sdk/enterprise-intake-shared': path.resolve(__dirname, '../intake-shared/src/index.ts'),
      'intake-shared': path.resolve(__dirname, '../intake-shared/src/index.ts'),
      // Shared Runtime resolution (v3.0.7 Layer 2B)
      '@brix-sdk/shared-runtime-web': path.resolve(__dirname, '../../../../../../brix/packages/@brix/shared-runtime/shared-runtime-web/dist'),
      // Runtime SDK (v3.0.7 Layer 2A) — unified @brix-sdk/* naming convention
      '@brix-sdk/runtime-sdk-react': path.resolve(__dirname, '../../../../../../brix/packages/@brix/runtime-sdk/runtime-sdk-react/dist/index.js'),
      '@brix-sdk/runtime-sdk-api-web': path.resolve(__dirname, '../../../../../../brix/packages/@brix/runtime-sdk/runtime-sdk-api-web/dist/index.js'),
    },
    modules: [
      path.resolve(__dirname, '../../../../../../brix/packages/@brix/shared-runtime/shared-runtime-web/node_modules'),
      path.resolve(__dirname, 'node_modules'),
      'node_modules',
    ],
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
                  runtime: 'classic',
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
        // Pages
        './pages/IntakeTaskList': './src/pages/IntakeTaskListPage.tsx',
        './pages/IntakeTaskDetail': './src/pages/IntakeTaskDetailPage.tsx',
        './pages/IntakeSubmit': './src/pages/IntakeSubmitPage.tsx',
        './pages/IntakeReview': './src/pages/IntakeReviewPage.tsx',
        './pages': './src/pages/index.ts',

        // Hooks (ViewModel layer)
        './hooks/useIntakeTasks': './src/hooks/useIntakeTasks.ts',
        './hooks/useIntakeTaskDetail': './src/hooks/useIntakeTaskDetail.ts',
        './hooks/useIntakeSubmission': './src/hooks/useIntakeSubmission.ts',
        './hooks/useIntakeReview': './src/hooks/useIntakeReview.ts',
        './hooks': './src/hooks/index.ts',

        // Components (View layer)
        './components/IntakeChecklist': './src/components/IntakeChecklist.tsx',
        './components/IntakeFileUploader': './src/components/IntakeFileUploader.tsx',
        './components/IntakeStatusBadge': './src/components/IntakeStatusBadge.tsx',
        './components/IntakeProgressBar': './src/components/IntakeProgressBar.tsx',
        './components/IntakeDocumentCard': './src/components/IntakeDocumentCard.tsx',
        './components': './src/components/index.ts',

        // Repositories (Data layer)
        './repositories': './src/repositories/index.ts',

        // Root App
        './App': './src/App.tsx',
      },
      shareScope: 'default',
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
