/**
 * Rspack Configuration - Module Federation Remote Plugin
 *
 * @module partners-ui-web
 * @version 3.1.0
 *
 * v3.1.0 Changes (Shared Runtime Integration):
 * - Migrated to @brix-sdk/shared-runtime-web for MF shared configuration
 * - Uses getRemoteSharedConfig() instead of manual shared config
 * - Per v3.0.7 Blueprint Constraint 8: Single Source of Truth for runtime deps
 *
 * v3.0 Manifest-Driven Architecture:
 * - Uses Module Federation to expose components
 * - Port: 3003
 */

import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import path from 'path';
import fs from 'fs';
import { getRemoteSharedConfig } from '@brix-sdk/shared-runtime-web/mf-config';

const isDev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3003;

const SCOPE_NAME = 'partners';

/**
 * Module Federation exposes map — single source of truth.
 * Referenced by both MF plugin config and the manifest-serving middleware.
 */
const MF_EXPOSES: Record<string, string> = {
  './pages/PartnerListPage': './src/pages/PartnerListPage.tsx',
  './pages/PartnerListPageV2': './src/pages/PartnerListPageV2.tsx',
  './pages/PartnerDetailPage': './src/pages/PartnerDetailPage.tsx',
  './pages/PartnerCreatePage': './src/pages/PartnerCreatePage.tsx',
  './pages/PartnerEditPage': './src/pages/PartnerEditPage.tsx',
};

export default defineConfig({
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: isDev ? `http://localhost:${PORT}/` : '/',
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    uniqueName: 'partners-web',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@brix-sdk/enterprise-partners-shared': path.resolve(__dirname, '../partners-shared/src/index.ts'),
      'partners-shared': path.resolve(__dirname, '../partners-shared/src/index.ts'),
      // Shared Runtime resolution (v3.0.7 Layer 2B) — build-time only (rspack.config import)
      '@brix-sdk/shared-runtime-web': path.resolve(__dirname, '../../../../../../brix/packages/@brix/shared-runtime/shared-runtime-web/dist'),
      // =========================================================================
      // IMPORTANT: NO aliases for Module Federation shared modules!
      // =========================================================================
      // Per v3.0.7 Blueprint Constraint 8:
      // ALL packages declared in getRemoteSharedConfig() MUST be resolved via
      // normal node_modules resolution (not aliases). This includes:
      //   - React, router, UI libraries, and state runtimes
      //   - @brix-sdk/runtime-sdk-react, @brix-sdk/runtime-sdk-api-web
      //
      // resolve.alias converts package imports to absolute file paths BEFORE
      // Module Federation's ConsumeSharedPlugin can intercept them. This causes
      // rspack to bundle the package directly instead of consuming it from the
      // Host's shared scope — breaking singleton guarantees (e.g., separate
      // RuntimeContext instances → useUI() returns empty adapter → broken UI).
      //
      // These packages are available in node_modules via pnpm link: protocol
      // (see devDependencies in package.json). Their package.json exports
      // fields correctly point to dist/index.js.
      // =========================================================================
    },
    // Module resolution paths - shared-runtime-web's node_modules is primary
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
      exposes: MF_EXPOSES,
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
    // Serve ui-manifest.json — converted from ui-manifest.yaml at request time.
    // Per Blueprint §7.2.5: Manifest-Driven Discovery — plugins declare capabilities
    // in their own manifest, Host discovers at runtime.
    setupMiddlewares(middlewares: any[]) {
      // Serve ui-manifest.json by unshifting middleware BEFORE historyApiFallback
      middlewares.unshift((req: any, res: any, next: any) => {
        if (req.url !== '/ui-manifest.json') return next();
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const jsYaml = require('js-yaml');
          const yamlPath = path.resolve(__dirname, 'ui-manifest.yaml');
          const raw = jsYaml.load(fs.readFileSync(yamlPath, 'utf8')) as Record<string, any>;

          const resolveTitle = (title: unknown): string => {
            if (typeof title === 'string') return title;
            if (typeof title === 'object' && title !== null) {
              const obj = title as Record<string, string>;
              return obj['zh-CN'] || obj['en-US'] || Object.values(obj)[0] || '';
            }
            return String(title ?? '');
          };

          const manifest = {
            plugin: {
              ...raw.plugin,
              name: resolveTitle(raw.plugin?.name),
            },
            federation: {
              name: SCOPE_NAME,
              filename: 'remoteEntry.js',
              exposes: MF_EXPOSES,
            },
            pages: (raw.pages || []).map((page: any) => ({
              ...page,
              id: page.id || page.pageId,
              pageId: page.pageId || page.id,
              path: page.path || page.platforms?.web?.suggestedPath || `/${SCOPE_NAME}/${page.pageId}`,
              title: resolveTitle(page.title),
            })),
            menus: (raw.menus || []).map((menu: any) => ({
              ...menu,
              title: resolveTitle(menu.title),
              children: menu.children?.map((child: any) => ({
                ...child,
                title: resolveTitle(child.title),
              })),
            })),
            permissions: raw.permissions || [],
          };

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify(manifest));
        } catch (err: any) {
          console.error('[manifest-middleware] Failed to serve ui-manifest.json:', err.message);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to load manifest' }));
        }
      });
      return middlewares;
    },
  },
});
