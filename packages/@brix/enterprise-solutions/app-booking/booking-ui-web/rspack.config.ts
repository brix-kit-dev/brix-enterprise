/**
 * Rspack Configuration - Module Federation Remote Plugin
 *
 * @module booking-ui-web
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
 * - exposes aligns with ui-manifest.yaml federation.exposes
 * - Shares React and UI runtime packages with Host
 * - Port: 3015
 */

import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import path from 'path';
import { getRemoteSharedConfig } from '@brix-sdk/shared-runtime-web/mf-config';

const isDev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3015;

const SCOPE_NAME = 'booking';

export default defineConfig({
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: isDev ? `http://localhost:${PORT}/` : '/',
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    uniqueName: 'booking-web',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@brix-sdk/enterprise-booking-shared': path.resolve(__dirname, '../booking-shared/src/index.ts'),
      'booking-shared': path.resolve(__dirname, '../booking-shared/src/index.ts'),
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
    //
    // getRemoteSharedConfig() provides:
    // - React, ReactDOM with eager: false (NOT bundled, obtained from Host)
    // - Router, State, UI libraries with singleton: true
    // - Version constraints from @brix-sdk/shared-runtime-web
    //
    // This ensures Remote plugins use Host's instances, preventing Hooks errors.
    new rspack.container.ModuleFederationPlugin({
      name: SCOPE_NAME,
      filename: 'remoteEntry.js',
      exposes: {
        './pages/BookingList': './src/pages/BookingList/index.tsx',
        './pages/BookingDetail': './src/pages/BookingDetail/index.tsx',
        './pages/BookingCreate': './src/pages/BookingCreate/index.tsx',
        './pages/BookingCalendar': './src/pages/BookingCalendar/index.tsx',
        './pages/ResourceManagement': './src/pages/ResourceManagement/index.tsx',
        './components/TimeSlotPicker': './src/components/TimeSlotPicker.tsx',
        './components/BookingCalendar': './src/components/BookingCalendar.tsx',
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
