# Changelog

本文件记录 Shinwa Solutions 的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [3.2.0] - 2026-02-13

### 新增

#### identity (身份认证)
- **identity-ui-web**: 完成前后端分离重构
  - 新增 Repository 层（数据仓库模式）
  - 新增 Hooks 层（业务逻辑编排）
  - 页面组件简化为纯 UI 渲染
- **identity-server**: 完善 Manifest 权限声明

#### booking (预约管理)
- **booking-ui-web**: 完成前后端分离重构
  - 新增 Repository 层和 Hooks 层
  - 新增时间槽选择组件
- **booking-server**: 新增资源锁定机制

#### messenger (消息通知)
- **messenger-ui-web**: 完成前后端分离重构
  - 新增实时消息 WebSocket 支持
- **messenger-server**: 新增消息推送队列

#### partners (合作伙伴)
- **partners-ui-web**: 完成前后端分离重构
  - 新增合同管理功能

### 变更
- **全局**: 统一 Repository 模式和 Hooks 模式
- **依赖更新**: 升级 React Query 至 v5，支持更好的缓存管理

### 修复
- 修复用户列表分页状态不正确问题
- 修复预约时间槽并发预定问题
- 修复消息通知已读状态不同步问题

### 删除
- 移除废弃的迁移脚本（4个）
- 移除 .bak 备份文件（7个）

---

## [3.1.0] - 2026-01-15

### 新增

#### 业务插件
- **shinwa-app-identity** - 身份认证
  - 用户管理、角色权限、JWT 认证
- **shinwa-app-booking** - 预约管理
  - 资源预约、时间槽管理
- **shinwa-app-messenger** - 消息通知
  - 站内信、邮件、SMS 通知
- **shinwa-app-partners** - 合作伙伴
  - 供应商管理、合同管理
- **shinwa-app-products** - 产品管理
  - 产品目录、SKU 管理
- **shinwa-app-storage** - 文件存储
  - 文件上传、OSS 集成
- **shinwa-app-carousel** - 轮播图
  - 首页轮播、内容管理
- **shinwa-app-contracts** - 合同管理
  - 合同模板、电子签章

### 变更
- 所有插件采用 DDD 分层架构
- 前端统一使用 Manifest 声明路由和权限

---

## [3.0.0] - 2025-12-01

### 新增
- **插件化架构**: 将业务功能拆分为独立插件
- **Manifest 声明**: 路由和权限通过 Manifest 配置

### 重大变更
- 从单体应用迁移到插件化架构
- 每个业务模块独立部署

---

## [2.x] - 归档版本

2.x 版本已归档，不再维护。请升级到 3.x。

---

[3.2.0]: https://github.com/shinwa/shinwa-solutions/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/shinwa/shinwa-solutions/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/shinwa/shinwa-solutions/releases/tag/v3.0.0
