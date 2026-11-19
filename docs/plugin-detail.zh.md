把[哪吒监控（Nezha Monitoring）V2](https://nezha.wiki/)内置的 MCP 服务接入 [DeepSeek Harness（DSH）](https://github.com/deepseek-ai/dsh)。连接成功后，Agent 会获得一组 `mcp__nezha__*` 工具，可以查看服务器、执行一次性命令、读写服务器文件，以及生成大文件传输链接。

> 适用版本：插件 `0.2.x` · DSH `>=0.2.1-rc.2` · Nezha V2（需开启 `enable_mcp`）

## 能做什么

| 工具 | 用途 |
| --- | --- |
| `meta_whoami` | 查看当前 PAT 的身份与 scope |
| `server_list` / `server_get` | 列出或查看服务器状态 |
| `server_exec` | 在目标服务器执行一次性命令 |
| `fs_list` / `fs_read` | 浏览目录、读取文件 |
| `fs_write` / `fs_delete` | 原子写入、删除文件或目录 |
| `fs_download_url` / `fs_upload_url` | 生成一次性下载/上传链接（≤100 MiB） |

- 设置页提供**连接路由**：一眼看清 DSH → 哪吒 MCP → 服务器与工具组的连接状态。
- **测试连接**不保存配置，会依次验证地址、MCP 握手、工具列表和服务器概览。
- PAT 保存于 DSH 凭据库，非机密设置保存在 profile 的 `dsh-nezha/settings.json`。

## 快速开始

1. 在 Nezha Dashboard 打开 MCP：配置文件中设置 `enable_mcp: true`，然后重启或重载 Dashboard。
2. 在 DSH 的 **插件 → 已安装 → 哪吒 MCP** 详情页点击 **连接设置**。
3. 填写 **Dashboard 地址**（`https://nezha.example.com`、`https://nezha.example.com/nezha` 或完整的 `.../mcp` 均可，保存时会自动补全 `/mcp`）。
4. 填写 **API Token（PAT）**：在 Nezha **个人信息 → API 接口** 创建以 `nzp_` 开头的令牌，只授予需要的 scope。
5. 点击 **测试连接** 确认可达，再 **保存并连接**。连接成功后，工具组、服务器列表与在线数量会显示在连接路由中。

## 常用配置

| 字段 | 说明 |
| --- | --- |
| Dashboard 地址 | 面板根地址或完整 `/mcp` 地址；不要包含用户名、密码、查询参数或片段 |
| API Token | `nzp_` 开头的 PAT；留空表示保留已保存的令牌 |
| 启用 | 关闭后不连接 Nezha，也不会注册任何工具 |
| 请求超时 | 5–300 秒，长命令可调大；反向代理超时也需要足够长 |

## 权限与安全

- PAT 的 scope 决定 Agent 能做什么，建议只授予 `nezha:server:*` 等实际需要的权限，并使用服务器白名单限制范围。
- `server_exec` 和 `fs_write` / `fs_delete` 直接使用哪吒 Agent 的运行权限，属于高危操作，请只在可信会话中授权。
- 插件不会把 PAT 写入普通设置文件；`settings.json` 仅包含地址、启用状态和超时。
- 反向代理需允许 `POST /mcp`、转发 `Authorization` 请求头，请求体上限至少 8 MiB。

## 常见问题

| 现象 | 处理 |
| --- | --- |
| 401 认证失败 | 检查 PAT 是否有效、是否过期；浏览器登录 JWT 不能当作 PAT 使用 |
| 403 没有权限 | 检查 PAT scope 和 Nezha 服务器白名单 |
| 404 接口不存在 | 确认地址以 `/mcp` 结尾，并且 Dashboard 已开启 `enable_mcp` |
| 连接超时 | 检查网络、证书与反向代理超时，必要时调大请求超时 |
| 工具列表为空 | 确认令牌 scope 覆盖所需工具；修改后点击 **刷新工具** |
| 服务器概览为空 | PAT 可能缺少 `nezha:server:*`，不影响工具本身的使用 |

## 更多

- 完整安装、PAT scope、故障排查与开发说明见 [README](https://github.com/kaecho/dsh-nezha/blob/main/README.zh.md)。
- 问题反馈：[GitHub Issues](https://github.com/kaecho/dsh-nezha/issues)。
