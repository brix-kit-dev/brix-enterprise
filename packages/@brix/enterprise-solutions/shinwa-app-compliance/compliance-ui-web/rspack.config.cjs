// @ts-check
const { defineConfig } = require('@rspack/cli');
const { ModuleFederationPlugin } = require('@rspack/core').container;

module.exports = defineConfig({
  entry: './src/bootstrap.tsx',
  output: {
    publicPath: 'auto',
    uniqueName: 'compliance_ui_web',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@': './src',
    },
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
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        type: 'css',
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'compliance_ui_web',
      filename: 'remoteEntry.js',
      exposes: {
        // Page components
        './ScriptTemplateListPage': './src/pages/ScriptTemplateListPage',
        './ScriptTemplateDetailPage': './src/pages/ScriptTemplateDetailPage',
        './ScriptTemplateCreatePage': './src/pages/ScriptTemplateCreatePage',
        './ForbiddenWordListPage': './src/pages/ForbiddenWordListPage',
        './ForbiddenWordCreatePage': './src/pages/ForbiddenWordCreatePage',
        './ComplianceCheckPage': './src/pages/ComplianceCheckPage',
        // Hooks
        './hooks': './src/hooks/index',
        // Components
        './components': './src/components/index',
      },
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
      },
    }),
  ],
  devServer: {
    port: 3052,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    historyApiFallback: true,
  },
});
