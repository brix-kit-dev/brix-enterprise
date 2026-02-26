/**
 * @file Case Module Rspack Configuration
 * @description Rspack bundler configuration with Module Federation
 * @module @shinwa/case-ui-web
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
    publicPath: isDev ? 'http://localhost:3050/' : 'auto',
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
      name: 'case',
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
        './pages/CaseList': './src/pages/CaseList.tsx',
        './pages/CaseDetail': './src/pages/CaseDetail.tsx',
        './pages/CaseCreate': './src/pages/CaseCreate.tsx',
        './pages/TemplateList': './src/pages/TemplateList.tsx',
        './pages/TemplateDetail': './src/pages/TemplateDetail.tsx',
        './pages/TemplateCreate': './src/pages/TemplateCreate.tsx',
        './pages': './src/pages/index.ts',

        // Hooks (ViewModel layer)
        './hooks/useCase': './src/hooks/useCase.ts',
        './hooks/useCaseNodes': './src/hooks/useCaseNodes.ts',
        './hooks/useSchedule': './src/hooks/useSchedule.ts',
        './hooks/useTimeline': './src/hooks/useTimeline.ts',
        './hooks/useParameters': './src/hooks/useParameters.ts',
        './hooks/useTemplate': './src/hooks/useTemplate.ts',
        './hooks': './src/hooks/index.ts',

        // Components (View layer)
        './components/CaseCard': './src/components/CaseCard.tsx',
        './components/CaseStatusChip': './src/components/CaseStatusChip.tsx',
        './components/CasePriorityChip': './src/components/CasePriorityChip.tsx',
        './components/NodeStepper': './src/components/NodeStepper.tsx',
        './components/ScheduleTab': './src/components/ScheduleTab.tsx',
        './components/TimelineTab': './src/components/TimelineTab.tsx',
        './components/ParameterTab': './src/components/ParameterTab.tsx',
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
        '@shinwa/case-shared': {
          singleton: true,
          requiredVersion: '^1.0.0',
        },
      },
    }),

    // HTML template (for development)
    isDev && new (require('@rspack/core').HtmlRspackPlugin)({
      template: './public/index.html',
      title: 'Case Module',
    }),
  ].filter(Boolean),

  devServer: {
    port: 3050,
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
