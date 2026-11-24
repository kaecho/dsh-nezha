# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 的结构，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [0.2.1] - 2026-11-24

### Changed

- 首次发布到 npm：用户在插件页或 CLI 中输入 `dsh-nezha` 即可按包名安装，无需构建步骤或依赖构建脚本。
- README 安装章节改为以 npm 安装为主，新增 CLI 安装命令与 npm 徽章；本地目录与 `.tgz` 安装调整为开发调试、固定版本和离线场景的备选方案。
- README 发布流程补充 `npm publish` 步骤，明确 Release 工作流只创建 GitHub Release，不会代替发布到 registry。

## [0.2.0] - 2026-11-19

### Added

- 参考 dsh-grok-search 重做插件设置页：状态头 + 状态胶囊、连接路由画布（DSH → 哪吒 MCP → 服务器 / 工具组）、可折叠工具与服务器列表、配置路径与复制按钮。
- 新增「连接设置」弹窗：地址实时预览、PAT 显示/隐藏、超时校验、启用开关、清除令牌。
- 新增「测试连接」弹窗：依次展示地址规范化、MCP 握手、工具列表与服务器概览结果，并按错误码给出处理建议。
- 连接后 best-effort 读取 `server.list`，在设置页显示服务器在线统计与列表；新增轻量 Remote 方法 `servers` 单独刷新服务器状态，不重连 MCP。
- `snapshot` 增加 `pluginVersion`、`settingsPath`、`connectedAt`、`servers`、`serverSummary`、`serversFetchedAt` 字段。
- 新增精选插件详情文档 `docs/plugin-detail.zh.md` / `docs/plugin-detail.en.md`，并通过 `locale.meta.detail` 在详情页展示。
- 注册 `plugins.detail.badge`，在插件标题旁显示 GitHub 仓库徽标。
- 深色/浅色主题均使用 DSH 设计令牌自动适配；支持 `prefers-reduced-motion` 与窄屏纵向布局。
- 新增 `extractServerOverview` 纯函数与 `servers` 设置描述符，并补充对应测试。

### Changed

- 插件详情页不再渲染整篇 README，改为精选文档；完整说明仍保留在 README 与 GitHub。
- 设置页状态、错误与操作反馈改为可读中文提示与建议，工具按 `server` / `fs` / `meta` 分组并显示中文名称。
- README 改为中英双语：默认英文 `README.md`，中文为 `README.zh.md`，两者顶部互相链接。
- Release 工作流升级：推送版本 tag 时校验版本、读取 CHANGELOG、上传 `.tgz`，并自动把新版本标记为 latest Release（旧版本补发不会顶掉 latest，重复执行可安全重跑）。
- 版本号升级到 `0.2.0`。

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

[Unreleased]: https://github.com/kaecho/dsh-nezha/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/kaecho/dsh-nezha/releases/tag/v0.2.1
[0.2.0]: https://github.com/kaecho/dsh-nezha/releases/tag/v0.2.0
[0.1.0]: https://github.com/kaecho/dsh-nezha/releases/tag/v0.1.0
