/**
 * Shinwa Solutions 插件前端 — ESLint 架构守护配置
 * 
 * 引用 @brix/eslint-config-architecture 共享规则包，
 * 对应 v3.0 运行壳架构蓝图中的红线规则（TypeScript 侧）。
 * 
 * 架构红线覆盖：
 *   红线1 — 禁止插件直接导入基础设施适配器（@brix/infra-adapter-*）
 *   红线3 — 禁止直接使用 HTTP 客户端库（axios/fetch 等）
 *   红线6 — 禁止直接访问 localStorage/sessionStorage
 *   红线7 — 禁止 console.log（允许 warn/error）
 * 
 * @see @brix/eslint-config-architecture
 * @see docs/v3.0-运行壳架构设计蓝图.md §9.1 架构红线
 */
const architectureRules = require('@brix/eslint-config-architecture');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  ...architectureRules,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    }
  },
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.js', '**/*.cjs', '**/*.mjs']
  }
];
