/**
 * @file Intake Module Rspack Configuration
 * @description Rspack bundler configuration with Module Federation
 * @module @shinwa/intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 blueprint Module Federation architecture:
 * - Acts as remote module loaded dynamically by host shell
 * - Exposes page components, hooks, and shared utilities
 * - Shares React and runtime dependencies to avoid duplication
 *
 * @author Shinwa Team
 * @date 2026-06-10
 */
const { ModuleFederationPlugin } = require('@rspack/core').container;
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

/** @type {import('@rspack/core').Configuration} */
module.exports = {
  entry: './src/bootstrap.tsx',

  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: isDev ? 'http://localhost:3056/' : 'auto',
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
      name: 'intake',
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

      /**
       * Shared Dependencies
       *
       * Ensures single instance of React and other critical dependencies
       * across host and remote modules.
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
        '@shinwa/intake-shared': {
          singleton: true,
          requiredVersion: '^3.0.0',
        },
      },
    }),

    // HTML template (for development)
    isDev && new (require('@rspack/core').HtmlRspackPlugin)({
      template: './public/index.html',
      title: 'Intake Module',
    }),
  ].filter(Boolean),

  devServer: {
    port: 3056,
    hot: true,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },

  // Development mode configuration
  ...(isDev && {
    devtool: 'source-map',
    optimization: {
      minimize: false,
    },
  }),
};
