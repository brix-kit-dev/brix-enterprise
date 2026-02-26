/**
 * @file Storage Module Rspack Configuration
 * @description Rspack bundler configuration with Module Federation
 * @module @shinwa/storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 blueprint Module Federation architecture:
 * - Acts as remote module loaded dynamically by host shell
 * - Exposes page components, hooks, and shared utilities
 * - Shares React and runtime dependencies to avoid duplication
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */
const { ModuleFederationPlugin } = require('@rspack/core').container;
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

/** @type {import('@rspack/core').Configuration} */
module.exports = {
  entry: './src/bootstrap.tsx',

  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: isDev ? 'http://localhost:3053/' : 'auto',
    filename: '[name].[contenthash].js',
    clean: true,
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
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
                  development: isDev,
                  refresh: isDev,
                },
              },
            },
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  plugins: [
    /**
     * Module Federation Configuration
     *
     * Remote Module Setup:
     * - name: Module identifier for host shell reference
     * - filename: Remote entry point file name
     * - exposes: Exposed components and modules
     * - shared: Shared dependencies to avoid duplication
     */
    new ModuleFederationPlugin({
      name: 'storage',
      filename: 'remoteEntry.js',

      /**
       * Exposed Components and Modules
       *
       * Following v3.0.4 blueprint:
       * - Pages: Routable page components
       * - Hooks: Reusable stateful logic (ViewModel layer)
       * - Components: Presentational components (View layer)
       * - Repositories: Data access layer
       */
      exposes: {
        // Pages
        './pages/FileList': './src/pages/FileList.tsx',
        './pages/FileDetail': './src/pages/FileDetail.tsx',
        './pages/FileUpload': './src/pages/FileUpload.tsx',

        // Hooks (ViewModel Layer)
        './hooks/useFileList': './src/hooks/useFileList.ts',
        './hooks/useFileDetail': './src/hooks/useFileDetail.ts',
        './hooks/useFileUpload': './src/hooks/useFileUpload.ts',
        './hooks/useFileAccessLogs': './src/hooks/useFileAccessLogs.ts',

        // Components (View Layer)
        './components/FileCard': './src/components/FileCard.tsx',
        './components/FilePreview': './src/components/FilePreview.tsx',
        './components/UploadDropzone': './src/components/UploadDropzone.tsx',
        './components/AccessLogTable': './src/components/AccessLogTable.tsx',
        './components/FileTypeIcon': './src/components/FileTypeIcon.tsx',

        // Repositories (Data Access Layer)
        './repositories': './src/repositories/index.ts',
      },

      /**
       * Shared Dependencies Configuration
       *
       * These dependencies are shared between host and remotes to:
       * - Reduce bundle size
       * - Ensure single instance for stateful libraries (React)
       * - Maintain version consistency
       */
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.0.0',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.0.0',
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: '^6.0.0',
        },
        '@runtime/ui-sdk': {
          singleton: true,
          requiredVersion: '^3.0.0',
        },
        // Runtime SDK modules provided by host shell (no local fallback)
        '@brix/runtime-sdk-react': {
          singleton: true,
          import: false, // No local fallback - must be provided by host
          requiredVersion: '*',
        },
        '@brix/runtime-sdk-api-web': {
          singleton: true,
          import: false,
          requiredVersion: '*',
        },
        '@aspect/runtime-sdk-react': {
          singleton: true,
          import: false,
          requiredVersion: '*',
        },
        '@shinwa/storage-shared': {
          singleton: true,
          import: false,
          requiredVersion: '*',
        },
      },
    }),
  ],

  devServer: {
    port: 3053,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
    historyApiFallback: true,
  },
};
