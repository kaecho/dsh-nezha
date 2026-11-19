Connect the built-in MCP server of [Nezha Monitoring V2](https://nezha.wiki/) to [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/dsh). Once connected, the agent gets a set of `mcp__nezha__*` tools for inspecting servers, running one-shot commands, reading and writing server files, and minting large-file transfer URLs.

> Tested with plugin `0.2.x` · DSH `>=0.2.1-rc.2` · Nezha V2 (`enable_mcp` enabled)

## What it offers

| Tool | Purpose |
| --- | --- |
| `meta_whoami` | Show the PAT identity and scopes |
| `server_list` / `server_get` | List servers or read one server snapshot |
| `server_exec` | Run a one-shot command on a target server |
| `fs_list` / `fs_read` | Browse directories and read files |
| `fs_write` / `fs_delete` | Atomic writes and deletions |
| `fs_download_url` / `fs_upload_url` | Signed transfer URLs (≤100 MiB) |

- The settings page renders a **connection route** from DSH to the Nezha MCP server to server and tool groups.
- **Test connection** validates the URL, MCP handshake, tool list, and server overview without saving anything.
- The PAT lives in the DSH credential store; non-secret settings live in `<profile>/dsh-nezha/settings.json`.

## Quick start

1. Enable MCP in Nezha: set `enable_mcp: true` in the dashboard configuration, then restart or reload it.
2. In DSH open **Plugins → Installed → Nezha MCP** and click **Connection settings**.
3. Enter the **Dashboard URL** (`https://nezha.example.com`, `https://nezha.example.com/nezha`, or the full `.../mcp`; `/mcp` is appended automatically).
4. Enter an **API token (PAT)**: create an `nzp_`-prefixed token under Nezha **Profile → API** and grant only the scopes you need.
5. Click **Test connection**, then **Save and connect**. The route view then shows tool groups, monitored servers, and online counts.

## Configuration

| Field | Description |
| --- | --- |
| Dashboard URL | Dashboard root or the full `/mcp` endpoint; no credentials, query string, or fragment |
| API token | `nzp_` PAT; leave blank to keep the saved token |
| Enable | When off, no connection is made and no tools are registered |
| Request timeout | 5–300 seconds; raise it for long commands and matching reverse-proxy timeouts |

## Permissions and safety

- The PAT scopes decide what the agent can do. Prefer narrow scopes such as `nezha:server:*` and use the Nezha server allow list where possible.
- `server_exec`, `fs_write`, and `fs_delete` run with the Nezha agent's operating permissions. They are high-risk and should only be granted in trusted sessions.
- The plugin never writes the PAT into the plain settings file; `settings.json` only holds the URL, enable flag, and timeout.
- The reverse proxy must allow `POST /mcp`, forward the `Authorization` header, and accept request bodies of at least 8 MiB.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| 401 authentication failed | The PAT is invalid or expired; a browser login JWT is not a PAT |
| 403 forbidden | PAT scopes and the Nezha server allow list |
| 404 not found | The URL ends in `/mcp` and `enable_mcp` is on |
| Timeouts | Network, certificate, and reverse-proxy timeouts; raise the request timeout |
| Empty tool list | The token scopes cover the needed tools; then click **Refresh tools** |
| Empty server overview | The PAT may lack `nezha:server:*`; tools still work |

## More

- Full install, PAT scopes, troubleshooting, and development notes: [README](https://github.com/kaecho/dsh-nezha#readme).
- Feedback: [GitHub Issues](https://github.com/kaecho/dsh-nezha/issues).
