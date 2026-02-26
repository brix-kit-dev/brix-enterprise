/**
 * @file Contracts Module Rspack Configuration
 * @description Rspack bundler configuration with Module Federation
 * @module @shinwa/contracts-ui-web
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
    publicPath: isDev ? 'http://localhost:3051/' : 'auto',
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
      name: 'contracts',
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
        // Contract Template Pages
        './pages/ContractTemplateList': './src/pages/ContractTemplateList.tsx',
        './pages/ContractTemplateDetail': './src/pages/ContractTemplateDetail.tsx',
        './pages/ContractTemplateCreate': './src/pages/ContractTemplateCreate.tsx',

        // Contract Instance Pages
        './pages/ContractList': './src/pages/ContractList.tsx',
        './pages/ContractDetail': './src/pages/ContractDetail.tsx',
        './pages/ContractCreate': './src/pages/ContractCreate.tsx',

        // Hooks (ViewModel Layer)
        './hooks': './src/hooks/index.ts',

        // Components (View Layer)
        './components': './src/components/index.ts',

        // Repositories (Data Access Layer)
        './repositories': './src/repositories/index.ts',
      },

      /**
       * Shared Dependencies
       *
       * Framework libraries are shared to avoid version conflicts
       * and reduce bundle size across federated modules.
       */
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.3.1',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.3.1',
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: '^6.22.0',
        },
        '@brix/runtime-sdk-react': {
          singleton: true,
        },
        '@brix/runtime-sdk-api-web': {
          singleton: true,
        },
        '@shinwa/contracts-shared': {
          singleton: true,
        },
      },
    }),
  ],

  devServer: {
    port: 3051,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    static: {
      directory: path.join(__dirname, 'public'),
    },
    historyApiFallback: true,
  },

  devtool: isDev ? 'eval-source-map' : 'source-map',
};
