# dsh-nezha

[![CI](https://github.com/kaecho/dsh-nezha/actions/workflows/ci.yml/badge.svg)](https://github.com/kaecho/dsh-nezha/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

把 [哪吒监控（Nezha Monitoring）V2](https://nezha.wiki/) 内置的 MCP 服务接入 [DeepSeek Harness（DSH）](https://github.com/deepseek-ai/dsh) 的插件。安装后，Agent 可以通过一组 `mcp__nezha__*` 工具查看服务器、执行一次性命令、读写文件和生成大文件传输链接；服务器地址、PAT、启用状态和工具刷新都可以在 DSH Web UI 的插件详情页完成。

> 当前版本：`0.1.0` · 许可证：MIT · 运行要求：DSH `>=0.2.1-rc.2`、Node.js `>=22`、Nezha V2（开启 `enable_mcp`）

## 目录

- [功能](#功能)
- [环境要求](#环境要求)
- [安装](#安装)
- [首次配置](#首次配置)
- [工具名称](#工具名称)
- [PAT 权限与 Scope](#pat-权限与-scope)
- [安全说明](#安全说明)
- [可用工具](#可用工具)
- [故障排查](#故障排查)
- [开发](#开发)
- [发布流程](#发布流程)
- [许可证](#许可证)
- [English summary](#english-summary)

## 功能

- 连接 Nezha Dashboard 的 MCP 端点：`POST /mcp`，使用 `Authorization: Bearer nzp_...` 认证。
- 启动或保存配置后自动执行 MCP `initialize`、`notifications/initialized` 和 `tools/list`，并把 Nezha 工具动态注册到 DSH。
- 工具统一使用 `mcp__nezha__<tool>` 命名，例如 `mcp__nezha__server_list`、`mcp__nezha__fs_read`。
- 在 DSH Web UI 插件详情页内提供设置面板：服务器地址、PAT、启用/停用、超时、测试连接、保存、刷新工具和清除令牌。
- 连接失败、认证失败、权限不足、404、限流和超时都会转换成可读的错误信息。
- 无运行时依赖，不需要构建步骤；PAT 保存在 DSH 凭据记录中，普通设置文件不包含密钥。
- 同时兼容 JSON 与 SSE 形式的 MCP 响应体；Nezha 当前使用 POST 请求/响应模式，不依赖长连接 SSE 会话。

## 环境要求

| 项目 | 要求 |
| --- | --- |
| DeepSeek Harness | `>=0.2.1-rc.2`（见 `package.json` 的 `engines.dsh`） |
| Node.js | `>=22`（开发和打包需要；DSH 运行时自带 Node） |
| Nezha | Nezha Monitoring V2，Dashboard 配置中开启 `enable_mcp: true` |
| 认证 | Nezha API Token（PAT），以 `nzp_` 开头，不能使用浏览器登录 JWT |
| 网络 | DSH 所在主机能够通过 HTTP(S) 访问 Dashboard 的 `/mcp` 端点 |
| 反向代理 | 允许 `POST /mcp`，转发 `Authorization` 请求头，请求体上限至少 8 MiB |

Nezha 的 MCP 默认关闭。请先在 Dashboard 配置文件或管理设置中开启：

```yaml
enable_mcp: true
```

修改后需要重启或重新加载 Dashboard，使 `/mcp` 生效。

## 安装

当前版本以 GitHub Release 的 `.tgz` 和本地目录安装为主，尚未发布到 npm。发布到 npm 后，也可以直接在 DSH 插件页按包名安装。

### 从本地目录安装（开发/自用推荐）

1. 克隆或下载本仓库到 DSH 所在主机，例如 `/path/to/dsh-nezha`。
2. 打开 DSH Web UI 的 **Plugins / 插件** 页面，选择添加插件。
3. 在“包名或地址”中填写该目录的绝对路径，例如 `/path/to/dsh-nezha`，然后安装并保持启用。
4. 如果页面提示需要重启（`restart-required`），重启 DSH 后再打开插件详情页。

### 从本地 `.tgz` 安装

适用于固定版本或离线环境：

```bash
npm pack
```

命令会在仓库根目录生成 `dsh-nezha-0.1.0.tgz`。在 DSH 插件页选择从本地安装/安装本地 bundle，指向该 `.tgz` 文件即可。插件没有外部依赖，安装时不需要执行依赖构建脚本。

### 从 npm 安装（发布后）

发布到 npm 后，在 DSH 插件页的“包名或地址”中填写 `dsh-nezha` 即可按包名安装。

安装完成后，插件列表中应出现标题为 **Nezha MCP / 哪吒 MCP** 的条目和对应图标。

## 首次配置

1. 打开 **Plugins / 插件** 页面，进入 `dsh-nezha` 的详情页。
2. 在插件配置区（`plugins.bundle.config` 槽位）填写以下内容：

   | 字段 | 说明 |
   | --- | --- |
   | **Dashboard 地址** | Nezha Dashboard 地址。可以填 `https://nezha.example.com`、`https://nezha.example.com/nezha` 或完整的 `https://nezha.example.com/mcp`，插件会自动规范化为 `/mcp`。不要填写用户名、密码、查询参数或 URL 片段。 |
   | **API Token / PAT** | 以 `nzp_` 开头的 Nezha API Token。保存后会写入 DSH 凭据记录 `dsh-nezha/token`，不会写入普通设置文件。留空表示保留已保存的令牌。 |
   | **启用** | 关闭后插件不连接 Nezha，也不会注册任何工具。 |
   | **超时** | 单次 MCP 请求的超时时间，范围 5–300 秒，默认 60 秒。执行耗时较长的 `server.exec` 时应调大，同时确保反向代理超时也足够。 |

3. 点击 **测试连接**。测试使用当前表单中的地址和 PAT（若 PAT 留空则使用已保存的 PAT），执行一次 `initialize` 和 `tools/list`，不会保存配置，也不会执行命令或文件操作。成功后可以看到服务器名称、版本、协议版本和可用工具。
4. 点击 **保存并连接**。插件会保存地址、启用状态和超时到 profile 设置文件，并把 PAT 写入 DSH 凭据记录，然后自动重连并刷新工具。
5. 如果之后修改了 Nezha 的 PAT scope、服务器白名单或 Nezha 版本，点击 **刷新工具** 重新连接并重新读取 `tools/list`。
6. 需要撤销已保存的 PAT 时，勾选设置页的 **清除已保存的 PAT（保存时生效）** 并保存；清除后连接状态会回到未配置状态。

保存后，Agent 即可使用 `mcp__nezha__*` 工具。工具列表来自当前 Nezha 实例的 `tools/list` 响应，因此不同 Nezha 版本的可用工具可能略有差异。

## 工具名称

DSH 会把 Nezha 的原始工具名注册为：

```text
mcp__nezha__<tool>
```

Nezha 的工具名包含点号（例如 `server.list`）。插件会将点号等非法字符替换为下划线，因此实际暴露的名称为：

| Nezha 原始工具 | DSH 工具名 |
| --- | --- |
| `meta.whoami` | `mcp__nezha__meta_whoami` |
| `server.list` | `mcp__nezha__server_list` |
| `server.get` | `mcp__nezha__server_get` |
| `server.exec` | `mcp__nezha__server_exec` |
| `fs.list` | `mcp__nezha__fs_list` |
| `fs.read` | `mcp__nezha__fs_read` |
| `fs.write` | `mcp__nezha__fs_write` |
| `fs.delete` | `mcp__nezha__fs_delete` |
| `fs.download_url` | `mcp__nezha__fs_download_url` |
| `fs.upload_url` | `mcp__nezha__fs_upload_url` |

如果工具名经过替换后超过 64 个字符，插件会追加一个短哈希后缀，避免不同工具重名。正常情况下，上表中的官方工具名不受影响。

## PAT 权限与 Scope

在 Nezha Dashboard 的 **API / API Token（PAT）** 页面创建专用 Token，选择需要的 scope 和服务器 ID 白名单，并设置有效期。`/mcp` 只接受 API Token，不接受浏览器登录产生的 JWT、Cookie 或 OAuth 会话。

官方文档：

- [Nezha MCP 指南](https://nezha.wiki/guide/mcp.html)
- [Nezha API Token（PAT）](https://nezha.wiki/guide/api.html#api-token-pat)

工具和所需 scope 的对应关系：

| Scope | 可用的工具 |
| --- | --- |
| 任意有效 PAT | `meta.whoami` |
| `nezha:inventory:read` | `server.list` |
| `nezha:server:read` | `server.get`、`fs.list`、`fs.read`、`fs.download_url` |
| `nezha:server:exec` | `server.exec` |
| `nezha:server:write` | `fs.write`、`fs.upload_url` |
| `nezha:server:delete` | `fs.delete` |

建议遵循最小权限原则：

- 只做监控和巡检：授予 `nezha:inventory:read` 与 `nezha:server:read`。
- 需要远程执行命令才添加 `nezha:server:exec`。
- 需要修改或删除文件才添加 `nezha:server:write`、`nezha:server:delete`。
- 对包含 `nezha:server:exec`、`nezha:server:write`、`nezha:server:delete` 的 Token 设置服务器 ID 白名单，并设置较短的有效期。

## 安全说明

- **PAT 存储位置**：PAT 保存在 DSH 凭据系统的记录 `dsh-nezha/token` 中，记录类型为 `api-key`。设置页只显示 Token 是否已配置，不回显 Token 值。
- **普通配置**：非机密配置写入当前 profile 目录下的 `<profile>/dsh-nezha/settings.json`（DSH 环境变量 `DSH_PROFILE_DIR` 指向该 profile 目录）。文件内容仅包含 `url`、`enabled` 和 `timeoutMs`，不包含 PAT。
- **文件权限**：插件以 `0700` 创建 `dsh-nezha` 目录，并以 `0600` 原子写入 `settings.json`。请同时保护好 DSH profile 目录、备份和凭据存储。
- **传输安全**：生产环境请使用 HTTPS，避免在公共网络中明文传输 PAT。反向代理应只向可信来源开放，并正确转发 `Authorization`。
- **高风险工具**：`server.exec` 会在被监控服务器上执行命令；`fs.write`、`fs.delete`、`fs.upload_url` 会修改或删除文件。请只授予必要的 scope，并依赖 DSH 的工具权限/确认机制。
- **临时传输 URL**：`fs.download_url` 和 `fs.upload_url` 生成一次性 URL，默认有效期约 300 秒，单文件上限 100 MiB。Token 被撤销或 Nezha 关闭 MCP 后，未使用的 URL 会失效。
- **撤销**：不再使用时，在 Nezha 中撤销或删除 PAT，并在插件设置页清除已保存的令牌。

## 可用工具

| 工具 | Scope | 用途 |
| --- | --- | --- |
| `meta.whoami` | 任意有效 PAT | 查看当前用户、管理员状态、Token ID、scope 和服务器白名单。 |
| `server.list` | `nezha:inventory:read` | 列出当前 Token 可见的服务器。 |
| `server.get` | `nezha:server:read` | 读取单台服务器的 Host、State、GeoIP 等快照。 |
| `server.exec` | `nezha:server:exec` | 在目标服务器执行非交互式一次性命令，默认超时 30 秒，最大 300 秒。 |
| `fs.list` | `nezha:server:read` | 列出目录内容。 |
| `fs.read` | `nezha:server:read` | 读取文件或读取指定范围，适合小文件和日志片段。 |
| `fs.write` | `nezha:server:write` | 原子写入文件，支持 `if_match_sha256` 乐观锁。 |
| `fs.delete` | `nezha:server:delete` | 删除文件或目录，删除非空目录时使用 `recursive`。 |
| `fs.download_url` | `nezha:server:read` | 为最大 100 MiB 的文件生成一次性下载 URL。 |
| `fs.upload_url` | `nezha:server:write` | 为最大 100 MiB 的文件生成一次性上传 URL。 |

工具的实际参数以 Nezha 返回的 `inputSchema` 为准；插件会把它们注册为 DSH 工具参数，并在缺失顶层类型时补齐为 `object`。

## 故障排查

### 401 / 认证失败

- PAT 无效、已过期、已被撤销，或复制时带入了多余空格。
- 误用了浏览器登录 JWT、Cookie 或 OAuth 会话；`/mcp` 只接受 `nzp_` 开头的 API Token。
- 在 Nezha 中重新创建 PAT，填入插件设置后点击 **保存并连接**。

### 403 / 没有权限

- PAT 缺少对应工具的 scope（见 [PAT 权限与 Scope](#pat-权限与-scope)）。
- PAT 的服务器白名单不包含目标服务器，或当前用户对目标服务器没有权限。
- 调整 scope 或白名单后，点击 **刷新工具**，再重试工具调用。

### 404 / MCP 接口不存在

- 地址没有指向 `/mcp`。插件会自动补 `/mcp`，但请确认 Dashboard 位于该路径，而不是反向代理的其他子路径。
- Nezha 未开启 `enable_mcp: true`，或修改配置后没有重启 Dashboard。
- 反向代理没有把 `/mcp` 转发到 Nezha，或拦截了 `POST`。
- Nezha 的 `GET /mcp` 和 `DELETE /mcp` 返回 405 是设计行为；本插件只使用 `POST /mcp`。

### 连接超时 / 网络错误

- 检查 DNS、TLS 证书、防火墙和反向代理是否允许 DSH 所在主机访问 Dashboard。
- 反向代理应转发 `Authorization`，允许 `POST`，将请求体上限提高到至少 8 MiB，并为长时间运行的 `server.exec` 设置足够长的读超时。
- 插件默认请求超时为 60 秒；可在设置页调整到最长 300 秒。Nezha 的 `server.exec` 自身默认 30 秒、最大 300 秒。
- 自签证书场景请为 DSH 进程配置可信 CA（例如 `NODE_EXTRA_CA_CERTS`），不要关闭 TLS 校验。

### 429 / 请求过于频繁

Nezha 默认对每个 Token 限制约每秒 10 次、每分钟 120 次请求。降低并发或稍后重试；高频巡检建议拆分任务。

### 工具列表为空或工具没有出现

- 先点击 **测试连接**，确认 `initialize` 和 `tools/list` 成功。
- 确认插件已启用且状态为 `connected`；保存或刷新后工具会重新注册。
- 检查 PAT 的 scope；工具虽然可能出现在列表中，但无 scope 的调用会失败。
- 如果 DSH 提示 `restart-required`，重启 DSH。

### `dashboard_host` / 临时传输 URL 失败

`fs.download_url` 和 `fs.upload_url` 依赖 Nezha 的 `dashboard_host` 配置。若看到类似 `MCP transfer URL host is not an operator-declared dashboard host` 的错误：

- 在 Dashboard 配置中设置 `dashboard_host`，值为 MCP 客户端可达的域名或 `IP[:port]`，不要包含 `http://`、`https://` 或路径。
- 不要使用 NAT 服务主机名；确保该地址能被 DSH 主机访问。
- 如果 HTTPS 在反向代理终止，请转发 `X-Forwarded-Proto: https`，否则临时 URL 可能生成 HTTP 地址。
- 临时 URL 只能使用一次并在约 300 秒后过期（最长 600 秒）；文件上限 100 MiB。

## 开发

要求 Node.js `>=22`，无需安装运行时依赖，也没有构建步骤。

```bash
# 校验 package.json、cordis.patch.yml、locale、icon，并对所有 JS 文件做语法检查
npm run check

# 运行 node:test 测试
npm test

# 依次执行 check 和 test
npm run test:all

# 检查 npm 包内容，不生成 tarball
npm run pack:check
```

`scripts/check.mjs` 使用 Node 内置模块实现，不依赖第三方包。它会检查：

- `package.json` 的 `name`、`version`、`license`、`engines`、`exports`、`files`、`dsh` 和 `scripts` 字段；
- `cordis.patch.yml` 中插入的 `dsh-nezha` 行；
- `locale/en.json`、`locale/zh.json` 中的 `meta.title` 和 `meta.description`；
- `icon.svg` 是否存在、是否以 `<svg` 开头且不超过 256 KiB；
- 仓库内所有 `.js` / `.mjs` / `.cjs` 文件的语法（跳过 `node_modules`）。

测试文件暂时不存在时检查脚本不会因此失败；`npm test` 使用的是 `node --test test/*.test.js`，新增测试时把文件放在 `test/` 目录。

目录结构：

```text
.
├── src/
│   ├── index.js          # Host 插件入口、设置服务、工具注册
│   ├── mcp.js            # Nezha MCP 客户端与端点/错误处理
│   ├── tool-bridge.js    # 把 Nezha 工具适配为 DSH ToolDefinition
│   ├── settings-store.js # 非机密设置持久化
│   ├── descriptors.js    # 设置页 Remote 描述符
│   └── typert.host.js    # Typert Host 类型描述
├── client.js             # Web 设置页（plugins.bundle.config）
├── cordis.patch.yml      # DSH bundle patch
├── locale/               # 中英文显示元数据
├── icon.svg              # 插件图标
├── scripts/check.mjs     # 仓库自检
└── test/                 # node:test 测试
```

开发时可用本地 Nezha 实例验证：开启 `enable_mcp`、创建测试 PAT，在插件设置页填写地址和 Token，点击 **测试连接**，然后用 `mcp__nezha__meta_whoami` 或 `mcp__nezha__server_list` 做只读调用。不要用生产 Token 测试 `server.exec`、`fs.write` 或 `fs.delete`。

## 发布流程

1. 更新 `package.json` 的 `version`，并在 `CHANGELOG.md` 中记录变更。
2. 提交变更并创建与版本一致的 tag，例如 `v0.1.0`：

   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

3. 推送 tag 会触发 `.github/workflows/release.yml`：
   - 校验 tag 必须等于 `v` + `package.json` 中的 `version`，不一致直接失败；
   - 执行 `npm run check` 和 `npm test`；
   - 执行 `npm pack` 生成 `dsh-nezha-<version>.tgz`；
   - 使用 `gh release create` 创建 GitHub Release，标题为 tag 名，使用自动生成的 release notes，并附加该 `.tgz` 文件。
4. Release 工作流声明了 `contents: write` 权限，用于创建 Release；**不会执行 `npm publish`**。

`.github/workflows/ci.yml` 会在推送到 `main` 以及针对 `main` 的 Pull Request 上运行，使用 Node.js 22 和 24 两个版本执行 `npm run check`、`npm test` 和 `npm pack --dry-run`。

## 许可证

[MIT](LICENSE) © 2026 kaecho

## English summary

`dsh-nezha` connects a Nezha Monitoring V2 dashboard's built-in MCP endpoint (`POST /mcp`, Bearer `nzp_...` PAT) to DeepSeek Harness. It discovers tools dynamically and exposes them as `mcp__nezha__<tool>` (for example `mcp__nezha__server_list` and `mcp__nezha__fs_read`).

Install it from the DSH Plugins page by pointing at the repository directory or the `dsh-nezha-0.1.0.tgz` produced by `npm pack` (npm publication is not part of this release yet). Configure the dashboard URL and PAT in the plugin detail page, then use **Test connection**, **Save**, and **Refresh tools**. The PAT is stored as the DSH credential record `dsh-nezha/token`; non-secret settings live in `<profile>/dsh-nezha/settings.json`.

Development uses Node.js 22+ with no external dependencies: `npm run check`, `npm test`, and `npm run pack:check`. Pushing a tag such as `v0.1.0` runs the release workflow, verifies that the tag matches `package.json`, packs the plugin, and creates a GitHub Release with the `.tgz` asset. Licensed under MIT.
