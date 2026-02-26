# Changelog

本文件记录 Shinwa Host Assembly 的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [3.2.0] - 2026-02-13

### 新增
- **host-shell-standalone**: 新增健康检查端点
- **Docker**: 支持多阶段构建优化镜像大小

### 变更
- **依赖更新**: 升级 Spring Boot 至 3.2.x
- **配置优化**: 改进环境变量注入方式

### 修复
- 修复容器启动时配置加载顺序问题
- 修复日志配置不生效问题

### 安全
- 移除配置文件中的硬编码密码
- 敏感配置全部改用环境变量

---

## [3.1.0] - 2026-01-15

### 新增
- **Host Shell 模块**
  - `host-shell-standalone` - 生产部署 Shell
  - `host-shell-embedded` - 测试/开发 Shell
  - `host-shell-standalone-web` - 静态资源 Shell

- **容器化支持**
  - Dockerfile 多阶段构建
  - docker-compose 编排配置

### 变更
- 采用 @Import 模式组装模块

---

## [3.0.0] - 2025-12-01

### 新增
- **极薄Host架构**: 实现后端运行壳
- **纯组装层**: Host 只包含 @SpringBootApplication 和 @Import

### 重大变更
- 从传统 Spring Boot 单体迁移到极薄 Host 架构
- Host 层不再包含任何实现代码

---

## [2.x] - 归档版本

2.x 版本已归档，不再维护。请升级到 3.x。

---

[3.2.0]: https://github.com/shinwa/shinwa-host-assembly/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/shinwa/shinwa-host-assembly/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/shinwa/shinwa-host-assembly/releases/tag/v3.0.0
