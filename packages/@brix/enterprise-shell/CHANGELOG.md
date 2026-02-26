# Changelog

本文件记录 Shinwa Platform Shell 的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [3.2.0] - 2026-02-13

### 新增
- **manifest-loader**: 支持远程 Manifest 动态加载
- **router**: 新增路由守卫权限验证

### 变更
- **依赖更新**: 升级 React 至 18.3，Vite 至 5.x
- **布局优化**: 改进响应式布局适配

### 修复
- 修复多 Tab 页签状态不同步问题
- 修复 Sidebar 折叠动画卡顿问题

### 删除
- 移除废弃的编码修复脚本（4个）

---

## [3.1.0] - 2026-01-15

### 新增
- **Web Shell**
  - `shinwa-platform-shell-web` - Web 端应用壳
  - 布局系统（Sidebar、Header、Content）
  - Manifest 加载器
  - 路由注册机制

- **Mobile Shell**
  - `shinwa-platform-shell-mobile` - 移动端应用壳
  - 底部导航
  - 页面栈管理

### 变更
- 采用 Manifest 驱动的插件加载模式

---

## [3.0.0] - 2025-12-01

### 新增
- **极薄Host架构**: 实现前端运行壳
- **Manifest 驱动**: 路由和组件通过 Manifest 声明

### 重大变更
- 从单体前端迁移到微前端架构
- Shell 层不再包含业务代码

---

## [2.x] - 归档版本

2.x 版本已归档，不再维护。请升级到 3.x。

---

[3.2.0]: https://github.com/shinwa/shinwa-platform/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/shinwa/shinwa-platform/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/shinwa/shinwa-platform/releases/tag/v3.0.0
