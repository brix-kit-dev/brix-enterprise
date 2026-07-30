import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getHostSharedConfig,
  getRemoteSharedConfig,
} from '@brix-sdk/shared-runtime-web/mf-config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const brixRoot = path.resolve(__dirname, '../../../../../brix');
const isDev = process.env.NODE_ENV !== 'production';
const mode = isDev ? 'development' : 'production';

const importMetaEnv = {
  MODE: mode,
  DEV: isDev,
  PROD: !isDev,
};
const hostSharedConfig = getHostSharedConfig();
const remoteSharedConfig = getRemoteSharedConfig();
const federationArtifact = {
  schema: 'io.brix.frontend.release-artifact/v1',
  host: {
    id: 'host-shell-standalone-web',
    kind: 'standalone-web',
    profile: 'standalone-web',
  },
  federation: {
    name: 'brix_standalone_host',
    filename: 'remoteEntry.js',
    shareScope: 'default',
    sharedProfiles: {
      host: hostSharedConfig,
      remote: remoteSharedConfig,
    },
  },
  runtimeIdentity: {
    schema: 'io.brix.frontend.runtime-identity/v1',
    global: '__BRIX_FRONTEND_RUNTIME_IDENTITY__',
  },
  supplyChainEvidence: {
    required: [
      'sbom',
      'license',
      'sca',
      'signature',
      'provenance',
    ],
  },
};

class BrixFrontendReleaseArtifactPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('BrixFrontendReleaseArtifactPlugin', compilation => {
      compilation.hooks.processAssets.tap(
        {
          name: 'BrixFrontendReleaseArtifactPlugin',
          stage: rspack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          compilation.emitAsset(
            'brix-frontend-release-artifact.json',
            new rspack.sources.RawSource(JSON.stringify(federationArtifact, null, 2))
          );
        }
      );
    });
  }
}

export default defineConfig({
  mode,
  context: __dirname,
  entry: {
    main: './src/main.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'],
    conditionNames: ['import', 'module', 'browser', 'default'],
    alias: {
      '@brix-sdk/runtime-orchestrator-web': path.resolve(
        brixRoot,
        'packages/@brix/runtime-sdk/runtime-orchestrator-web/src/index.ts'
      ),
      '@brix-sdk/runtime-sdk-api-web': path.resolve(
        brixRoot,
        'packages/@brix/runtime-sdk/runtime-sdk-api-web/src/index.ts'
      ),
      '@brix-sdk/runtime-sdk-react': path.resolve(
        brixRoot,
        'packages/@brix/runtime-sdk/runtime-sdk-react/src/index.ts'
      ),
      '@brix-sdk/platform-admin-web': path.resolve(
        brixRoot,
        'packages/@brix/platform-commons/packages/client/platform-admin-web/src/index.ts'
      ),
      '@brix-sdk/shared-runtime-web': path.resolve(
        brixRoot,
        'packages/@brix/shared-runtime/shared-runtime-web/src/index.ts'
      ),
      '@brix-sdk/shared-runtime-web/react': path.resolve(
        brixRoot,
        'packages/@brix/shared-runtime/shared-runtime-web/src/react.ts'
      ),
      '@brix-sdk/shared-runtime-web/router': path.resolve(
        brixRoot,
        'packages/@brix/shared-runtime/shared-runtime-web/src/router.ts'
      ),
      '@brix-sdk/shared-runtime-web/mf-config': path.resolve(
        brixRoot,
        'packages/@brix/shared-runtime/shared-runtime-web/src/mf-shared-config.ts'
      ),
      '@brix-sdk/shared-runtime-web/runtime-identity': path.resolve(
        brixRoot,
        'packages/@brix/shared-runtime/shared-runtime-web/src/runtime-identity.ts'
      ),
    },
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
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
        test: /\.(png|jpe?g|gif|webp|avif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './public/index.html',
      title: 'Brix Platform Host',
    }),
    new rspack.DefinePlugin({
      'process.env': JSON.stringify({ NODE_ENV: mode }),
      'import.meta.env': JSON.stringify(importMetaEnv),
      'import.meta.env.MODE': JSON.stringify(mode),
      'import.meta.env.DEV': JSON.stringify(isDev),
      'import.meta.env.PROD': JSON.stringify(!isDev),
    }),
    new rspack.container.ModuleFederationPlugin({
      name: federationArtifact.federation.name,
      filename: federationArtifact.federation.filename,
      exposes: {
        './runtime-identity': './src/runtime-identity-entry.ts',
      },
      remotes: {},
      shared: hostSharedConfig,
    }),
    new BrixFrontendReleaseArtifactPlugin(),
  ],
  devServer: {
    port: Number.parseInt(process.env.VITE_PORT || '3002', 10),
    hot: isDev,
    liveReload: isDev,
    static: false,
    historyApiFallback: {
      index: '/index.html',
      disableDotRule: false,
    },
  },
});
