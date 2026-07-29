/**
 * @file Rspack Configuration
 * @description Host Standalone Web build configuration
 * @module host-standalone-web/rspack.config
 * @version 3.3.0
 *
 * [Configuration Notes]
 * 1. Module Federation Host configuration
 * 2. React + TypeScript support
 * 3. Development server (port 3001)
 * 4. DefinePlugin configuration (resolves process undefined issue)
 * 5. Environment variable loading (.env files)
 *
 * [v3.3.0 Changes - Shared Runtime Integration]
 * - Migrated to @brix-sdk/shared-runtime-web for MF shared configuration
 * - Uses getHostSharedConfig() instead of manual shared config
 * - Per v3.0.7 Blueprint Constraint 8: Single Source of Truth for runtime deps
 */

import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { getHostSharedConfig } from '@brix-sdk/shared-runtime-web/mf-config';

// Load .env files
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

// Load environment variables
const envVars = loadEnv(mode);

// Merge VITE_ variables from process.env (supports cross-env setup)
Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .forEach(key => {
    envVars[key] = process.env[key];
  });

// Build complete import.meta.env object (resolves property access undefined issue)
const importMetaEnv = {
  MODE: mode,
  DEV: isDev,
  PROD: !isDev,
  // Include all VITE_ environment variables
  ...Object.keys(envVars)
    .filter(key => key.startsWith('VITE_'))
    .reduce((acc, key) => {
      acc[key] = envVars[key];
      return acc;
    }, {}),
};

// Define both full object and individual properties (compatible with different access patterns)
const defineEnv = {
  // Full import.meta.env object (for spread or whole-object access)
  'import.meta.env': JSON.stringify(importMetaEnv),
  // Individual property definitions (for direct import.meta.env.VITE_XXX access)
  'import.meta.env.MODE': JSON.stringify(mode),
  'import.meta.env.DEV': JSON.stringify(isDev),
  'import.meta.env.PROD': JSON.stringify(!isDev),
  ...Object.keys(envVars)
    .filter(key => key.startsWith('VITE_'))
    .reduce((acc, key) => {
      acc[`import.meta.env.${key}`] = JSON.stringify(envVars[key]);
      return acc;
    }, {}),
};

// ============================================================================
// Plugin Proxy Configuration (Environment-Driven)
// ============================================================================
// Per v3.0.7 Blueprint Constraint 8: configuration-driven, not hardcoded.
// VITE_LOCAL_PLUGINS controls which plugins proxy to local dev servers.
// Non-listed plugins bypass local proxy �?their remoteEntry.js will 404
// immediately instead of hanging for 60s, allowing usePluginSystem's
// ignoreFailures to gracefully skip them.
// ============================================================================

/**
 * Plugin development server port registry.
 * Maps plugin name to its local dev server port.
 * Aligned with start-frontend.ps1 and each plugin's rspack.config.ts.
 */
const PLUGIN_PORT_REGISTRY = {
  products:   3004,
  partners:   3003,
  messenger:  3006,
  identity:   3016,
  carousel:   3007,
  booking:    3015,
  case:       3050,
  contracts:  3051,
  intake:     3056,
  storage:    3053,
  compliance: 3052,
  tenant:     3054,
};

/**
 * Build dev server proxy configuration.
 * Only plugins listed in VITE_LOCAL_PLUGINS get local proxy rules.
 * All other /plugins/* requests go to the remote backend.
 */
function buildPluginProxies() {
  const remoteBackend = envVars.VITE_REMOTE_BACKEND || 'http://84.247.154.52:8081';
  const localPluginNames = (envVars.VITE_LOCAL_PLUGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const proxies = [];

  // API proxy �?always goes to remote backend
  proxies.push({
    context: ['/api'],
    target: remoteBackend,
    changeOrigin: true,
    proxyTimeout: 60000,
    timeout: 60000,
  });

  // Local plugin proxies �?only for plugins in VITE_LOCAL_PLUGINS
  for (const pluginName of localPluginNames) {
    const port = PLUGIN_PORT_REGISTRY[pluginName];
    if (!port) {
      console.warn(`[proxy] Unknown plugin "${pluginName}" in VITE_LOCAL_PLUGINS, skipping.`);
      continue;
    }
    proxies.push({
      context: [`/plugins/brix-app-${pluginName}`],
      target: `http://localhost:${port}`,
      changeOrigin: true,
      pathRewrite: { [`^/plugins/brix-app-${pluginName}`]: '' },
      // Short timeout �?if local dev server isn't running, fail fast
      proxyTimeout: 5000,
      timeout: 5000,
    });
    console.log(`[proxy] Plugin "${pluginName}" �?http://localhost:${port}`);
  }

  // Fallback: other /plugins requests go to remote backend
  // (e.g., ui-manifest.json served by backend, or plugin assets from CDN)
  proxies.push({
    context: ['/plugins'],
    target: remoteBackend,
    changeOrigin: true,
  });

  return proxies;
}

export default defineConfig({
  // Explicit mode ensures rspack's internal DefinePlugin and optimization
  // settings are consistent. Without this, rspack defaults to 'production',
  // which conflicts with the dev server's 'development' expectations.
  mode,
  // rspack serve auto-enables top-level lazyCompilation for web apps when the
  // option is undefined. Production preview disables HMR/liveReload, so those
  // proxies can leave async bootstrap modules pending on the loading fallback.
  lazyCompilation: false,
  context: __dirname,
  entry: {
    main: './src/main.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    // Use absolute path to avoid relative path issues under SPA sub-routes
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'],
    // Prefer ESM module entry for MUI v7 compatibility (v3.0.7 Blueprint fix)
    conditionNames: ['import', 'module', 'browser', 'default'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Shared Runtime (v3.0.7 Layer 2B - Single Source of Truth)
      '@brix-sdk/shared-runtime-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/shared-runtime/shared-runtime-web/dist'),
      // =========================================================================
      // IMPORTANT: NO aliases for Module Federation shared modules!
      // =========================================================================
      // Per v3.0.7 Blueprint Constraint 8:
      // React, react-dom, react-router-dom, @mui/*, @emotion/*, zustand
      // are resolved via MF shared scope, NOT via resolve.alias.
      //
      // Using aliases conflicts with MF factory generation, causing:
      // "RuntimeError: factory is undefined (webpack/sharing/consume/...)"
      //
      // Instead, we use resolve.modules to specify the node_modules path,
      // allowing MF to manage shared module resolution correctly.
      // =========================================================================
      // Platform packages (brix repository)
      '@brix-sdk/platform-auth-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-auth-web/dist/index.js'),
      '@brix-sdk/platform-auth-service-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-auth-service-web/dist/index.js'),
      '@brix-sdk/platform-auth-ui-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-auth-ui-web/dist/index.js'),
      '@brix-sdk/platform-config-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-config-web/dist/index.js'),
      '@brix-sdk/platform-i18n-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-i18n-web/dist/index.js'),
      '@brix-sdk/platform-router-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-router-web/dist/index.js'),
      '@brix-sdk/platform-navigation-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-navigation-web/dist/index.js'),
      '@brix-sdk/platform-eventbus-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-eventbus-web/dist/index.js'),
      '@brix-sdk/platform-tenant-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-tenant-web/dist/index.js'),
      '@brix-sdk/platform-admin-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-admin-web/dist/index.js'),
      '@brix-sdk/runtime-orchestrator-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/runtime-sdk/runtime-orchestrator-web/dist/index.js'),
      // Runtime SDK packages (required for useUI, useUIOptional hooks)
      '@brix-sdk/runtime-sdk-react': path.resolve(__dirname, '../../../../../brix/packages/@brix/runtime-sdk/runtime-sdk-react/dist/index.js'),
      '@brix-sdk/runtime-sdk-api-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/runtime-sdk/runtime-sdk-api-web/dist/index.js'),
      // UI Adapter packages (v3.2.1 Phase 2)
      '@brix-sdk/infra-adapter-ui-mui': path.resolve(__dirname, '../../../../../brix/packages/@brix/infra-adapters/packages/web/infra-adapter-ui-mui/dist/index.js'),
      '@brix-sdk/infra-adapter-ui-native': path.resolve(__dirname, '../../../../../brix/packages/@brix/infra-adapters/packages/web/infra-adapter-ui-native/dist/index.js'),
      '@brix-sdk/infra-adapter-mf-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/infra-adapters/packages/web/infra-adapter-mf-web/dist/index.js'),
      '@brix-sdk/infra-adapter-http-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/infra-adapters/packages/web/infra-adapter-http-web/dist/index.js'),
      // @brix-sdk/ aliases (for packages that use @brix-sdk/ naming convention)
      '@brix-sdk/platform-auth-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-auth-web/dist/index.js'),
      '@brix-sdk/platform-auth-service-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-auth-service-web/dist/index.js'),
      '@brix-sdk/platform-auth-ui-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-auth-ui-web/dist/index.js'),
      '@brix-sdk/platform-router-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-router-web/dist/index.js'),
      '@brix-sdk/platform-navigation-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-navigation-web/dist/index.js'),
      '@brix-sdk/platform-eventbus-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-eventbus-web/dist/index.js'),
      '@brix-sdk/platform-tenant-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-tenant-web/dist/index.js'),
      '@brix-sdk/platform-state-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-state-web/dist/index.js'),
      '@brix-sdk/platform-config-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-config-web/dist/index.js'),
      '@brix-sdk/platform-i18n-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-i18n-web/dist/index.js'),
      '@brix-sdk/platform-shared': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-shared/dist/index.js'),
      '@brix-sdk/runtime-orchestrator-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/runtime-sdk/runtime-orchestrator-web/dist/index.js'),
      '@brix-sdk/runtime-sdk-react': path.resolve(__dirname, '../../../../../brix/packages/@brix/runtime-sdk/runtime-sdk-react/dist/index.js'),
      '@brix-sdk/runtime-sdk-api-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/runtime-sdk/runtime-sdk-api-web/dist/index.js'),
      '@brix-sdk/runtime-manifest-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/runtime-sdk/runtime-manifest-web/dist/index.js'),
      '@brix-sdk/infra-adapter-ui-mui': path.resolve(__dirname, '../../../../../brix/packages/@brix/infra-adapters/packages/web/infra-adapter-ui-mui/dist/index.js'),
      '@brix-sdk/infra-adapter-ui-native': path.resolve(__dirname, '../../../../../brix/packages/@brix/infra-adapters/packages/web/infra-adapter-ui-native/dist/index.js'),
      '@brix-sdk/infra-adapter-mf-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/infra-adapters/packages/web/infra-adapter-mf-web/dist/index.js'),
      '@brix-sdk/infra-adapter-http-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/infra-adapters/packages/web/infra-adapter-http-web/dist/index.js'),
      '@brix-sdk/infra-adapter-router-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/infra-adapters/packages/web/infra-adapter-router-web/dist/index.js'),
      '@brix-sdk/infra-adapter-state-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/infra-adapters/packages/web/infra-adapter-state-web/dist/index.js'),
      '@brix-sdk/shared-runtime-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/shared-runtime/shared-runtime-web/dist/index.js'),
      '@brix-sdk/platform-design-tokens': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-design-tokens/dist/index.js'),
      '@brix-sdk/platform-frame-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-frame-web/dist/index.js'),
      '@brix-sdk/platform-frame-web': path.resolve(__dirname, '../../../../../brix/packages/@brix/platform-commons/packages/client/platform-frame-web/dist/index.js'),
    },
    // Enable symlink resolution
    symlinks: true,
    // Module entry field priority
    mainFields: ['module', 'main'],
    // Ensure shared modules resolve from host's node_modules
    modules: [
      // Shared runtime node_modules (v3.0.7 Layer 2B - Single Source of Truth)
      path.resolve(__dirname, '../../../../../brix/packages/@brix/shared-runtime/shared-runtime-web/node_modules'),
      path.resolve(__dirname, 'node_modules'),
      // MUI adapter's node_modules for @mui/* dependencies
      path.resolve(__dirname, '../../../../../brix/packages/@brix/infra-adapters/packages/web/infra-adapter-ui-mui/node_modules'),
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
    // HTML template
    new rspack.HtmlRspackPlugin({
      template: './public/index.html',
      title: 'Brix Platform',
    }),
    
    // Environment variable definitions for browser context.
    //
    // IMPORTANT: Do NOT define process.env.NODE_ENV here �?rspack auto-injects
    // it from the `mode` field. Defining it separately would cause:
    //   "Conflicting values for 'process.env.NODE_ENV' (development !== production)"
    //
    // The `process.env` object definition below includes NODE_ENV derived from
    // the config `mode`, so all access patterns are consistent:
    //   - process.env.NODE_ENV  �?matched by rspack's auto-define from `mode`
    //   - process.env           �?matched by the explicit object below
    new rspack.DefinePlugin({
      'process.env': JSON.stringify({ NODE_ENV: mode }),
      // Inject VITE_ environment variables into import.meta.env
      ...defineEnv,
    }),
    
    // Module Federation Host configuration using shared-runtime (v3.0.7 Constraint 8)
    //
    // getHostSharedConfig() provides:
    // - React, ReactDOM with eager: true (loaded with initial bundle)
    // - Router, State, UI libraries with singleton: true
    // - Version constraints from @brix-sdk/shared-runtime-web
    //
    // This replaces manual shared config and ensures all Remotes use Host's instances.
    new rspack.container.ModuleFederationPlugin({
      name: 'host',
      filename: 'remoteEntry.js',
      remotes: {
        // Remote plugin configuration (dynamically loaded)
        // 'booking': 'booking@http://localhost:3010/remoteEntry.js',
        // 'identity': 'identity@http://localhost:3011/remoteEntry.js',
      },
      shared: getHostSharedConfig(),
    }),
  ],
  devServer: {
    port: parseInt(envVars.VITE_PORT || process.env.VITE_PORT || '3001', 10),
    hot: isDev,          // Only enable HMR in development mode (Constraint 8)
    liveReload: isDev,   // Production serve uses contenthash assets; auto reload causes hash churn loops.
    // The HTML template lives under public/index.html, but the dev server must
    // return the HtmlRspackPlugin-generated document so JS/CSS assets are
    // injected. Serving public/index.html directly leaves the app on the static
    // "loading" placeholder forever and bypasses SPA history fallback.
    static: false,
    historyApiFallback: {
      index: '/index.html',
      // Keep SPA fallback for route URLs such as /platform/login, but never
      // turn missing chunks or sourcemaps into index.html with HTTP 200.
      disableDotRule: false,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      // Local dev/preview rebuilds emit new chunk hashes. Prevent browsers
      // from reusing an old app shell that points at removed assets.
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    // Environment-driven proxy configuration (v3.0.7 Constraint 8)
    // Controlled by VITE_LOCAL_PLUGINS and VITE_REMOTE_BACKEND in .env
    proxy: buildPluginProxies(),
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
