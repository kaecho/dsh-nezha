# dsh-nezha 设置页与插件详情页改版 · 设计文档

- 日期：2026-11-19
- 参考实现：dsh-grok-search 0.4.0（已安装于本机 DSH web profile，并使用 Playwright 实测其真实渲染）
- 目标版本：dsh-nezha 0.2.0

## 1. 背景与问题

当前 dsh-nezha（0.1.0）的插件详情页有两个明显短板：

1. **详情页被整篇 README 占满**：DSH 在插件未声明 `locale.meta.detail` 时用 README 充当详细介绍，
   987 行的 README 在详情页内形成一个独立滚动区，把真正的配置区推到很下面。
2. **配置区只是普通表单**：状态、服务器信息、工具清单和表单混在一张卡片里，超时字段因
   `auto-fit` 网格居中错位；没有连接关系可视化、没有测试连接流程、没有配置路径提示，
   与 dsh-grok-search 的体验差距明显。

dsh-grok-search 0.4.0 在同一条插件详情页里提供了：

- 状态头（标题 + 状态胶囊 + 迷你路由条 + 测试连接按钮）；
- 点阵画布上的"搜索路由"拓扑（DSH ↔ grok-search-rs ↔ 各搜索来源），来源可展开配置；
- 独立的"最近记录"卡片与测试连接弹窗；
- 通过 `locale.meta.detail` 换成精选文档（并隐藏空的 detail 区块）；
- `plugins.detail.badge` 贡献标题旁徽标。

本设计把同类信息架构与交互语言迁移到 dsh-nezha，映射关系：

| dsh-grok-search | dsh-nezha |
| --- | --- |
| 搜索路由（DSH → Grok Search Rs → 搜索来源） | 连接路由（DeepSeek Harness → 哪吒 MCP → 服务器 / 工具组） |
| 主搜索 / 补充来源 / 专用抽取 | 监测服务器 / 服务器工具 / 文件工具 / 身份权限 |
| 来源开关与配置弹窗 | 连接设置弹窗（地址、PAT、超时、启用） |
| 测试连接（逐来源进度） | 测试连接（地址 → 握手 → 工具列表 → 服务器概览） |
| 最近记录（透明化） | 不在本期范围（方案 B 再做） |
| 精选 detail 文档 + 来源徽标 | 精选 `docs/plugin-detail.*.md` + GitHub 徽标 |

## 2. 方案选择

- **方案 1（采用）**：保留 React + DSH 设计令牌（`--dsw-alias-*`），照搬 grok-search 的信息架构。
  深浅色跟随 DSH 主题自动生效，改动可控、可测试、无新增运行时依赖。
- 方案 2（否决）：像 grok 一样用 Shadow DOM + 自研设计系统 + 原生 JS controller 重写。
  视觉最接近，但代码量 3~5 倍，主题/焦点/动画都需要手写，设置页收益不足。
- 方案 3（否决）：只修补现有表单。改动最小，但达不到"设计逻辑"层面的更新。

## 3. 页面信息架构

全部渲染在 `plugins.bundle.config`（key `dsh-nezha`）内，不新增页面级依赖。

```
连接  ● 已连接        nehza-mcp · v2.6.0 · MCP 2024-11-05   [迷你路由条] [测试连接] [连接设置]
─────────────────────────────────────────────────────────────────────────────
状态提示条（按状态出现：待配置引导 / 失败原因+重试 / 已停用 / 权限受限 / 保存成功）
─────────────────────────────────────────────────────────────────────────────
连接路由（点阵画布 + CSS/SVG 连线）
  [DeepSeek Harness] ── [哪吒 MCP 状态/版本/连接设置›] ──┬─ [监测服务器 30 · 28 在线]
                                                      ├─ [服务器工具 3]
                                                      ├─ [文件工具 6]
                                                      └─ [身份权限 1]
  行可展开：服务器在线列表（在线优先，可刷新）、工具中文名 + 原始名 + 说明
─────────────────────────────────────────────────────────────────────────────
配置文件 …/dsh-nezha/settings.json [复制路径]                         [刷新工具]
```

### 3.1 状态机

| 状态 | 胶囊 | 提示条 | 可用操作 |
| --- | --- | --- | --- |
| `load` | 读取中 | 无 | — |
| `idle`（未配置） | 待配置 | 引导填写地址与 PAT | 连接设置 |
| `disabled` | 已停用 | 停用中不会注册工具 | 启用并连接 / 连接设置 |
| `connecting` | 连接中（呼吸点） | 正在握手并读取工具 | 取消（关闭页面即可）/ 连接设置 |
| `connected` | 已连接 | 保存成功、令牌不可写等瞬时提示 | 测试连接 / 刷新工具 / 连接设置 |
| `error` | 连接失败 | 错误码 + 可读信息 + 建议 | 重试连接 / 连接设置 |

### 3.2 交互契约

- 点击 hub 节点或 `连接设置` 打开设置弹窗；弹窗内保存成功后关闭，页面刷新快照并给出成功提示。
- 点击 `测试连接` 打开测试弹窗：先确认"使用当前表单的地址与 PAT、不保存配置"，再执行；
  步骤依次为 地址规范化 → MCP 握手（服务器/版本/协议）→ tools/list（工具数）→ 服务器概览；
  失败时按错误码给出建议（401 检查 PAT、403 检查 scope、404 检查 `enable_mcp` 与 `/mcp`、超时检查反向代理）。
- 工具与服务器列表在画布第三列以可折叠分组呈现；服务器分组带"刷新"按钮，调用轻量 `servers` 方法，
  不重连 MCP。
- 底部展示设置文件路径与复制按钮；`刷新工具` 触发重连 + 重新 tools/list。
- 弹窗：`role="dialog"`、`aria-modal`、焦点圈定、ESC 关闭、遮罩点击关闭、关闭后焦点归还。
- 动画遵守 `prefers-reduced-motion`；窄屏（<800px）画布纵向堆叠、隐藏连线。

### 3.3 主题与样式

- 仅使用 DSH 令牌：`--dsw-alias-bg-layer-1/2`、`--dsw-alias-border-l1/l2`、`--dsw-alias-label-*`、
  `--dsw-alias-brand-primary`、`--dsw-alias-state-*`、`--dsw-radius-*`、`--dsw-font-*`；
  派生色一律用 `color-mix()` 基于令牌计算，不写死颜色，深浅色自动适配。
- 点阵画布：`radial-gradient` + 令牌派生色；连线用 `border`/SVG `stroke=currentColor`。
- 样式选择器全部限定在 `[data-dsh-nezha]` 作用域内，避免污染宿主页面。

## 4. 数据与后端增量

不改变既有 Remote 方法语义，只做增量：

- `snapshot()` 增加字段：`pluginVersion`、`settingsPath`、`connectedAt`、`servers[]`、
  `serverSummary { total, online }`、`serverSummaryError`（可选，仅调试用）。
  `servers[]` 形如 `{ id, name, online, platform, arch, ipv4, ipv6, lastActive }`，
  连接成功后 best-effort 调用上游 `server.list` 获取并缓存；失败（无 scope/解析失败）时静默降级。
- 新增 Remote 方法 `servers()`：重新读取 `server.list` 并返回
  `{ servers, serverSummary, fetchedAt, error }`，不重连 MCP；快照缓存随之更新。
- `test()` 在握手成功后 best-effort 追加 `servers` 概览（失败不影响测试成功）。
- 下划线连接断开、重连、保存、刷新等既有逻辑保持不变。

## 5. 详情页文档与徽标

- 新增 `docs/plugin-detail.zh.md`、`docs/plugin-detail.en.md`：快速开始、工具表、权限与安全、
  常见问题，篇幅约 100 行，替换详情页里的整篇 README。
- `locale/zh.json`、`locale/en.json` 增加 `meta.detail` 指向对应文档。
- 注册 `plugins.detail.badge`：仅当 `subject.kind === 'bundle' && subject.pkg.name === 'dsh-nezha'`
  时渲染 GitHub 图标链接徽标，其余返回 `null`。

## 6. 文件清单

| 文件 | 变更 |
| --- | --- |
| `client.js` | 重写设置页；新增纯函数导出（`groupTools` 等）供测试 |
| `src/index.js` | 服务器概览缓存、`servers()` 方法、snapshot 字段 |
| `src/descriptors.js` | 新增 `servers` 描述符 |
| `src/mcp.js` | 新增导出纯函数 `extractServerOverview()`（解析 `server.list` 结果） |
| `locale/zh.json`、`locale/en.json` | `meta.detail` |
| `docs/plugin-detail.zh.md`、`docs/plugin-detail.en.md` | 新增精选文档 |
| `package.json` | 版本 0.2.0；`files` 增加两个 detail 文档 |
| `README.md` | 增加"界面"章节、更新配置说明 |
| `CHANGELOG.md` | 0.2.0 记录 |
| `scripts/check.mjs` | 校验 `meta.detail` 文件存在且随包发布 |
| `test/client.test.js` | 新槽位、纯函数、语言包检查 |
| `test/service.test.js` | 服务器概览与 `servers()`、降级路径 |
| `test/mcp.test.js` | `extractServerOverview()` 解析用例 |
| `test/helpers/fake-nezha.js` | `server.list` 返回多样例数据（含 isError 场景） |

`docs/superpowers/` 只作为开发过程文档，不进入 npm `files`。

## 7. 非目标（YAGNI）

- 聊天内 `tool.call.toolview` 富卡片（方案 C）。
- 最近调用记录 / 逐工具调用日志（方案 B）。
- 新增工具开关、按服务器限权等后端能力。
- 引入构建步骤或第三方运行时依赖。

## 8. 验证

1. `npm run check`、`npm test`、`npm pack --dry-run` 全部通过。
2. 第二个 `dsh web` 实例（3099 端口，同 profile，`dsh-nezha` 为 link 安装）实测：
   - 插件详情页在浅色/深色主题下的截图；
   - 打开连接设置弹窗、测试连接弹窗并完成一次真实 Nezha 测试；
   - 以原值保存一次，确认重连成功且 `settings.json` 内容不变；
   - 窄屏（约 700px）布局不溢出。
3. 对比改版前后截图，作为交付说明附件。

## 9. 风险与回滚

- 主要风险是插件页面在宿主 CSS 变化下的观感偏差；样式全部限定作用域并使用令牌，可独立回退
  `client.js` 与文档改动。
- 服务器概览依赖上游 `server.list` 与 PAT scope；所有路径都 best-effort，失败不影响连接与工具注册。
- 回滚方式：`git revert` 对应提交即可，不涉及宿主配置或数据迁移。
