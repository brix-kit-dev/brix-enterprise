/**
 * Shinwa Platform — ESLint 架构守护配置
 * 
 * 引用 @brix/eslint-config-architecture 共享规则包，
 * 对应 v3.0 运行壳架构蓝图中的红线规则（TypeScript 侧）。
 * 
 * 架构红线覆盖：
 *   红线1 — 禁止业务模块直接导入基础设施适配器（@brix/infra-adapter-*）
 *   红线3 — 禁止直接使用 HTTP 客户端库（axios/fetch 等）
 *   红线6 — 禁止直接访问 localStorage/sessionStorage
 *   红线7 — 禁止 console.log（允许 warn/error）
 * 
 * Shell 层如有合理的豁免需求（如 Shell 层需要直接 fetch 登录接口），
 * 请在对应代码行添加 eslint-disable 注释并注明原因。
 * 
 * @see @brix/eslint-config-architecture
 * @see docs/v3.0-运行壳架构设计蓝图.md §9.1 架构红线
 */
const architectureRules = require('@brix/eslint-config-architecture');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  ...architectureRules,
  {
    // 仅对 TypeScript/TSX 源文件生效
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    }
  },
  {
    // 忽略构建产物和依赖
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.js', '**/*.cjs', '**/*.mjs']
  }
];
