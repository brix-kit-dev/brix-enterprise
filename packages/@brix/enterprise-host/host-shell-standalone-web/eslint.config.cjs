/**
 * @file ESLint 架构守护配置
 * @description Host 层前端架构守护 - 继承共享规则 + 极薄Host原则
 * @version 3.1.0
 * 
 * 【架构分层】
 * - 通用红线规则：从 @brix-sdk/eslint-config-architecture 继承
 * - 极薄Host规则：从共享包导入，在本地应用到 hooks/ 目录
 * 
 * @see @brix-sdk/eslint-config-architecture 共享规则
 * @see v3.0.4-运行壳架构设计蓝图.md 第9章
 */

const architectureRules = require('@brix-sdk/eslint-config-architecture');
const { ultraThinHostRules } = require('@brix-sdk/eslint-config-architecture');
const tsParser = require('@typescript-eslint/parser');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  // ============================================================================
  // 继承共享架构守护规则（通用红线）
  // ============================================================================
  ...architectureRules,

  // ============================================================================
  // Host 层 TypeScript 解析器配置
  // ============================================================================
  {
    name: 'host/typescript-parser',
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: './tsconfig.json' }
    }
  },

  // ============================================================================
  // Host 层环境覆盖
  // ============================================================================
  {
    name: 'host/environment-overrides',
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }]
    }
  },

  // ============================================================================
  // 【极薄Host原则】应用到 hooks/ 目录
  // ============================================================================
  {
    name: 'host/ultra-thin-hooks',
    files: ['src/hooks/**/*.ts', 'src/hooks/**/*.tsx'],
    rules: ultraThinHostRules
  },

  // ============================================================================
  // services/ 层豁免
  // ============================================================================
  {
    name: 'host/services-layer-exemption',
    files: ['src/services/**/*.ts', 'src/services/**/*.tsx'],
    rules: { 'no-restricted-globals': 'off' }
  },

  // ============================================================================
  // 忽略配置文件
  // ============================================================================
  {
    ignores: ['node_modules/**', 'dist/**', '*.config.js', '*.config.cjs', '*.config.mjs', 'rspack.config.*']
  }
];

