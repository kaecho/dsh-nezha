# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 的结构，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [0.1.0] - 2026-11-07

### Added

- 新增 DeepSeek Harness 插件 `dsh-nezha`，连接 Nezha Monitoring V2 的 MCP 端点（`POST /mcp`，Bearer PAT）。
- 自动执行 MCP `initialize`、`notifications/initialized` 和 `tools/list`，并把 Nezha 工具注册为 `mcp__nezha__<tool>`。
- 支持 `meta.whoami`、`server.list`、`server.get`、`server.exec`、`fs.list`、`fs.read`、`fs.write`、`fs.delete`、`fs.download_url` 和 `fs.upload_url` 等 Nezha MCP 工具。
- 在 DSH Web UI 的插件详情页（`plugins.bundle.config`）新增设置面板：服务器地址、PAT、启用/停用、请求超时、测试连接、保存、刷新工具和清除令牌。
- 提供连接状态、服务器信息、协议版本和已注册工具的实时展示。
- 把 401、403、404、429、超时、网络错误和 MCP 错误转换成可读提示。
- 支持 JSON 与 SSE 形式的 MCP 响应体，并兼容 Nezha 的 POST 请求/响应模式。
- 将 PAT 保存到 DSH 凭据记录 `dsh-nezha/token`，非机密设置保存到 `<profile>/dsh-nezha/settings.json`。
- 新增中英文插件显示元数据和插件图标。
- 新增无第三方依赖的 `scripts/check.mjs`，校验 manifest、bundle patch、locale、图标和 JS 语法。
- 新增 GitHub Actions CI（Node.js 22/24）和基于 `v*` tag 的 GitHub Release 工作流。

[Unreleased]: https://github.com/kaecho/dsh-nezha/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/kaecho/dsh-nezha/releases/tag/v0.1.0
