# dsh-nezha 设置页与插件详情页改版 · 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 dsh-nezha 的插件设置页升级为参考 dsh-grok-search 的状态头 + 连接路由 + 弹窗交互体验，并用精选 detail 文档替换整篇 README。

**Architecture:** 保持单文件浏览器插件（`client.js`，React + DSH 设计令牌）与既有 Remote 设置服务；后端只增加服务器概览缓存与 `servers()` 轻量方法；详情页通过 `locale.meta.detail` 指向精选 Markdown，并注册 `plugins.detail.badge`。

**Tech Stack:** Node.js 22+（无运行时依赖）、DSH 插件 API（`ctx.remote.$mount` / `ctx.slots` / `ctx.locale`）、React（宿主提供）、`node:test`、Playwright（仅验证）。

参考设计：`docs/superpowers/specs/2026-11-19-dsh-nezha-ui-redesign-design.md`

---

## 文件结构

| 文件 | 职责 |
| --- | --- |
| `client.js` | 设置页 UI：纯函数 + React 组件 + `plugins.bundle.config` / `plugins.detail.badge` 注册 |
| `src/index.js` | `NezhaSettingsService`：设置、连接、工具注册、服务器概览缓存、`servers()` |
| `src/mcp.js` | MCP 客户端；新增 `extractServerOverview(result)` 纯函数 |
| `src/descriptors.js` | Remote 方法描述符（snapshot/save/test/refresh/servers） |
| `locale/*.json` | 插件标题、描述、`meta.detail` |
| `docs/plugin-detail.*.md` | 插件详情页精选文档 |
| `scripts/check.mjs` | 仓库自检（新增 detail 文档校验） |
| `test/` | node:test 用例与 fake Nezha |

---

### Task 1: MCP 结果解析纯函数

**Files:**
- Modify: `src/mcp.js`
- Test: `test/mcp.test.js`

- [ ] **Step 1: 写失败测试**

```js
import { extractServerOverview } from '../src/mcp.js';

test('extractServerOverview parses server.list text content', () => {
  const result = {
    content: [{ type: 'text', text: JSON.stringify({ servers: [
      { id: 1, name: 'a', online: true, platform: 'debian', arch: 'x86_64', ipv4: '1.2.3.4', last_active: '2026-11-19T00:00:00Z' },
      { id: 2, name: 'b', online: false },
      { bad: true },
    ], count: 2 }) }],
    structuredContent: { servers: [{ id: 9, name: 'structured', online: true }] },
  };
  assert.deepEqual(extractServerOverview(result), {
    servers: [
      { id: 1, name: 'a', online: true, platform: 'debian', arch: 'x86_64', ipv4: '1.2.3.4', ipv6: '', lastActive: '2026-11-19T00:00:00Z' },
      { id: 2, name: 'b', online: false, platform: '', arch: '', ipv4: '', ipv6: '', lastActive: '' },
    ],
    summary: { total: 2, online: 1 },
  });
});

test('extractServerOverview tolerates missing or malformed results', () => {
  assert.equal(extractServerOverview(undefined), null);
  assert.equal(extractServerOverview({ content: [{ type: 'text', text: 'not json' }] }), null);
  assert.equal(extractServerOverview({ content: [], structuredContent: { servers: 'x' } }), null);
  assert.deepEqual(extractServerOverview({ structuredContent: { servers: [] } }), { servers: [], summary: { total: 0, online: 0 } });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test test/mcp.test.js`
Expected: FAIL `extractServerOverview is not a function`

- [ ] **Step 3: 实现**

在 `src/mcp.js` 中 `summarizeTool` 后新增：

```js
function cleanString(value) {
  return typeof value === 'string' ? value : '';
}

/** Parse a Nezha `server.list` tools/call result into the UI overview shape. */
export function extractServerOverview(result) {
  if (!result || typeof result !== 'object') return null;
  let payload;
  if (Array.isArray(result.content)) {
    const text = result.content
      .filter(block => block && block.type === 'text' && typeof block.text === 'string')
      .map(block => block.text)
      .join('\n')
      .trim();
    if (text !== '') {
      try { payload = JSON.parse(text); } catch { payload = undefined; }
    }
  }
  if (payload === undefined && result.structuredContent && typeof result.structuredContent === 'object') {
    payload = result.structuredContent;
  }
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.servers)) return null;
  const servers = [];
  for (const item of payload.servers) {
    if (!item || typeof item !== 'object') continue;
    const name = cleanString(item.name);
    if (name === '') continue;
    servers.push({
      id: Number.isFinite(item.id) ? item.id : 0,
      name,
      online: item.online === true,
      platform: cleanString(item.platform),
      arch: cleanString(item.arch),
      ipv4: cleanString(item.ipv4),
      ipv6: cleanString(item.ipv6),
      lastActive: cleanString(item.last_active ?? item.lastActive),
    });
  }
  const online = servers.filter(server => server.online).length;
  return { servers, summary: { total: servers.length, online } };
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test test/mcp.test.js`
Expected: PASS（含既有用例）

---

### Task 2: 服务端服务器概览缓存与 `servers()` 方法

**Files:**
- Modify: `src/index.js`
- Modify: `src/descriptors.js`
- Test: `test/service.test.js`
- Test helper: `test/helpers/fake-nezha.js`

- [ ] **Step 1: 扩展 fake Nezha**

`server.list` 的 `tools/call` 返回：

```js
{
  content: [{ type: 'text', text: JSON.stringify({ servers: [
    { id: 46, name: 'web-01', online: true, platform: 'ubuntu', arch: 'x86_64', ipv4: '198.51.100.24', last_active: '2026-11-19T01:53:18Z' },
    { id: 102, name: 'gpu-02', online: false },
  ], count: 2 }) }],
}
```

并新增 `server.list-error` 场景返回 `{ content: [{ type: 'text', text: 'scope denied' }], isError: true }`。

- [ ] **Step 2: 写失败测试**

```js
test('snapshot exposes settings path, plugin version, and server overview after connect', async t => {
  const fake = await startFakeNezha();
  t.after(() => fake.close());
  const { service } = setup(t);
  const before = await service.snapshot();
  assert.match(before.settingsPath, /dsh-nezha[\\/]settings\.json$/);
  assert.match(before.pluginVersion, /^\d+\.\d+\.\d+/);
  assert.equal(before.serverSummary, null);

  const saved = await service.save({ url: fake.origin, token: 'nzp_test' });
  assert.equal(saved.snapshot.status, 'connected');
  assert.equal(saved.snapshot.serverSummary.total, 2);
  assert.equal(saved.snapshot.serverSummary.online, 1);
  assert.deepEqual(saved.snapshot.servers.map(s => s.name), ['web-01', 'gpu-02']);

  const refreshed = await service.servers();
  assert.equal(refreshed.error, null);
  assert.equal(refreshed.serverSummary.total, 2);
  assert.ok(refreshed.fetchedAt);
});

test('server overview failure does not break connection or tools', async t => {
  const fake = await startFakeNezha({ serverList: 'error' });
  t.after(() => fake.close());
  const { service, tools } = setup(t);
  const saved = await service.save({ url: fake.origin, token: 'nzp_test' });
  assert.equal(saved.snapshot.status, 'connected');
  assert.equal(saved.snapshot.serverSummary, null);
  assert.equal(tools.definitions.size, 3);
  const refreshed = await service.servers();
  assert.equal(refreshed.error.code, 'servers_unavailable');
});
```

- [ ] **Step 3: 实现**

`src/index.js`：

```js
import { NezhaMcpClient, NezhaMcpError, extractServerOverview, normalizeEndpoint, summarizeTool } from './mcp.js';

// 私有字段
#servers = null;
#serverSummary = null;
#serversFetchedAt = null;
#connectedAt = null;
#storePath;
```

构造器：`this.#storePath = this.#store.path;`

`snapshot()` 追加：

```js
pluginVersion: PACKAGE_VERSION,
settingsPath: this.#storePath,
connectedAt: this.#connectedAt,
servers: this.#servers ?? [],
serverSummary: this.#serverSummary,
serversFetchedAt: this.#serversFetchedAt,
```

新增方法：

```js
/** Refresh the monitored-server overview without reconnecting MCP. */
async servers() {
  const client = this.#client;
  if (this.#status !== 'connected' || client === null) {
    return {
      servers: [], serverSummary: null, fetchedAt: null,
      error: { code: 'not_connected', message: '尚未连接 Nezha，无法读取服务器列表。' },
    };
  }
  const fetched = await this.#fetchServerOverview(client);
  return fetched;
}

async #fetchServerOverview(client) {
  try {
    const result = await client.callTool('server.list', {}, AbortSignal.timeout(this.#settings.timeoutMs));
    const overview = extractServerOverview(result);
    if (overview === null) {
      return { servers: [], serverSummary: null, fetchedAt: null,
        error: { code: 'servers_unavailable', message: '无法解析 Nezha 服务器列表，可能权限不足或返回格式已变化。' } };
    }
    this.#servers = overview.servers;
    this.#serverSummary = overview.summary;
    this.#serversFetchedAt = new Date().toISOString();
    return { servers: overview.servers, serverSummary: overview.summary, fetchedAt: this.#serversFetchedAt, error: null };
  } catch (error) {
    return { servers: [], serverSummary: null, fetchedAt: null, error: publicError(error) };
  }
}
```

`#performRestart()` 中：重连前清空 `#servers/#serverSummary/#serversFetchedAt/#connectedAt`；连接成功后 `this.#connectedAt = new Date().toISOString(); await this.#fetchServerOverview(client);`（忽略返回值，best-effort）。

`src/descriptors.js`：按 `refresh` 的形状新增

```js
{
  id: `dsh-nezha#${SERVICE}/servers`, service: SERVICE, namespace: SERVICE, method: 'servers',
  description: 'Refresh and return the monitored-server overview from the connected Nezha MCP server.',
  invocation: { kind: 'direct' }, parameters: [],
  result: resultCodec('servers'),
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test test/service.test.js test/mcp.test.js`
Expected: PASS

---

### Task 3: 客户端纯函数与测试

**Files:**
- Modify: `client.js`
- Test: `test/client.test.js`

- [ ] **Step 1: 在 `client.js` 内实现并导出纯函数**

```js
const TOOL_GROUPS = [
  { id: 'server', test: raw => raw.startsWith('server.'), zh: '服务器', en: 'Servers' },
  { id: 'fs', test: raw => raw.startsWith('fs.'), zh: '文件', en: 'Files' },
  { id: 'meta', test: raw => raw.startsWith('meta.'), zh: '身份权限', en: 'Identity' },
];
const TOOL_LABELS = {
  'meta.whoami': ['令牌身份', 'Token identity'],
  'server.list': ['服务器列表', 'List servers'],
  'server.get': ['服务器详情', 'Server details'],
  'server.exec': ['执行命令', 'Run command'],
  'fs.list': ['列目录', 'List directory'],
  'fs.read': ['读文件', 'Read file'],
  'fs.write': ['写文件', 'Write file'],
  'fs.delete': ['删除文件', 'Delete file'],
  'fs.download_url': ['下载链接', 'Download URL'],
  'fs.upload_url': ['上传链接', 'Upload URL'],
};

function toolGroupId(rawName) { ... }
function groupTools(tools) { ... }   // 返回 [{ id, zh, en, tools: [{ name, rawName, description }] }]
function statusTone(status, configured, enabled) { ... } // 'ok' | 'warn' | 'error' | 'idle'
function summarizeServers(servers) { ... } // { total, online, offline }
function endpointPreview(raw) { ... } // 规范化预览，失败返回 { ok: false, error: '...' }
```

模块返回值追加：

```js
return { NS, inject, apply, helpers: Object.freeze({ groupTools, toolGroupId, toolLabel, statusTone, summarizeServers, endpointPreview }) };
```

- [ ] **Step 2: 写失败测试**

```js
test('client helpers group tools and map statuses', async () => {
  const module = await loadClient();
  const { groupTools, toolLabel, statusTone, summarizeServers, endpointPreview } = module.helpers;
  const groups = groupTools([
    { name: 'mcp__nezha__server_list', rawName: 'server.list', description: 'List servers' },
    { name: 'mcp__nezha__fs_read', rawName: 'fs.read', description: 'Read a file' },
    { name: 'mcp__nezha__meta_whoami', rawName: 'meta.whoami', description: '' },
    { name: 'mcp__nezha__custom_tool', rawName: 'custom.tool', description: '' },
  ]);
  assert.deepEqual(groups.map(g => g.id), ['server', 'fs', 'meta', 'other']);
  assert.equal(groups[0].tools[0].label, '服务器列表');
  assert.equal(groups[3].tools[0].label, 'custom.tool');
  assert.equal(toolLabel('fs.read').zh, '读文件');
  assert.equal(statusTone('connected', true, true), 'ok');
  assert.equal(statusTone('error', true, true), 'error');
  assert.equal(statusTone('idle', false, true), 'idle');
  assert.deepEqual(summarizeServers([{ online: true }, { online: false }, { online: true }]), { total: 3, online: 2, offline: 1 });
  assert.deepEqual(endpointPreview('https://nezha.example.com/nezha'), { ok: true, endpoint: 'https://nezha.example.com/nezha/mcp' });
  assert.equal(endpointPreview('ftp://x').ok, false);
});
```

- [ ] **Step 3: 运行确认失败 → 实现 → 运行确认通过**

Run: `node --test test/client.test.js`

---

### Task 4: 设置页 UI 重写

**Files:**
- Modify: `client.js`

- [ ] **Step 1: 替换 CSS**

CSS 维持单字符串常量，选择器全部以 `.dsh-nezha` 开头；包含：
状态胶囊、提示条、点阵画布 stage、三类节点卡、连线（CSS `::before` 竖脊 + 行 stub）、
可折叠分组行、服务器/工具列表、按钮层级（primary/ghost/danger）、弹窗与遮罩、焦点环、
`prefers-reduced-motion`、容器查询（`@container (max-width: 800px)`）纵向堆叠。

- [ ] **Step 2: 替换组件**

组件拆分（同文件）：

```js
function ConfigPage({ remote, t }) { ... }        // 数据加载/状态机/弹窗开关/页面提示
function Header({ snapshot, onOpenSettings, onTest, t }) { ... }
function NoticeBanner({ ... }) { ... }
function RouteStage({ snapshot, serversState, onRefreshServers, onOpenSettings, t }) { ... }
function HostNode({ t }) { ... }
function HubNode({ snapshot, onOpenSettings, t }) { ... }
function GroupRow({ group, expanded, onToggle, children }) { ... }  // 折叠/展开
function ServerGroup({ state, onRefresh, t }) { ... }
function ToolGroup({ group, t }) { ... }
function PageFooter({ path, onCopy, onRefresh, busy, t }) { ... }
function SettingsDialog({ snapshot, remote, t, onClose, onSaved }) { ... }
function TestDialog({ snapshot, remote, t, onClose }) { ... }
function Modal({ title, onClose, children, footer }) { ... }       // 焦点圈定/ESC/遮罩
function GithubBadge({ subject }) { ... }                          // plugins.detail.badge
```

- [ ] **Step 3: `apply()` 注册两个槽位**

```js
ctx.inject(['remote.nezhaSettings', 'slots', 'locale'], scoped => {
  scoped.slots.inject('plugins.bundle.config', () => scoped.slots.register({
    name: 'plugins.bundle.config', key: 'dsh-nezha', locale: NS, order: 30,
    inject: () => ({ remote: scoped.remote, t: scoped.locale.bind(NS) }),
  }, ConfigPage));
  scoped.slots.inject('plugins.detail.badge', () => scoped.slots.register({
    name: 'plugins.detail.badge', id: 'dsh-nezha-github', locale: NS, order: 30,
  }, GithubBadge));
});
```

`rawDescriptors` 增加 `servers` 方法，与 `refresh` 同形。

- [ ] **Step 4: 语法与单测**

Run: `node --check client.js && node --test test/client.test.js`

---

### Task 5: 语言包、精选文档、清单与 README

**Files:**
- Modify: `locale/zh.json`, `locale/en.json`, `package.json`, `README.md`, `CHANGELOG.md`
- Create: `docs/plugin-detail.zh.md`, `docs/plugin-detail.en.md`
- Modify: `scripts/check.mjs`
- Test: `test/client.test.js`

- [ ] **Step 1: 语言包加 `meta.detail`**

```json
{ "meta": { "title": "哪吒 MCP", "description": "...", "detail": "docs/plugin-detail.zh.md" } }
```

- [ ] **Step 2: 写精选文档**

`plugin-detail.zh.md` 结构（en 版同构）：一句话定位 → 能力列表 → 快速开始（4 步）→
工具表（10 个）→ 权限与安全 → 常见问题（401/403/404/超时/工具不出现）→ 完整文档链接。

- [ ] **Step 3: 更新 `package.json`**

`version: 0.2.0`；`files` 增加 `"docs/plugin-detail.zh.md"`、`"docs/plugin-detail.en.md"`。

- [ ] **Step 4: `scripts/check.mjs` 校验 detail 文档**

locales 检查组内：若 `meta.detail` 存在，必须是相对路径、文件存在、且 `files` 明确包含该路径。
`REQUIRED_FILES` 增加两个 detail 文档；runtime identity 增加 `plugins.detail.badge` 断言。

- [ ] **Step 5: README / CHANGELOG**

README 增加"插件详情页界面"章节（状态头、连接路由、弹窗、详情文档）并更新配置步骤措辞；
CHANGELOG 增加 0.2.0（Added/Changed）。

- [ ] **Step 6: 全量校验**

Run: `npm run check && npm test && npm run pack:check`
Expected: 全部 PASS；`pack:check` 输出包含两个 detail 文档

---

### Task 6: 真机 UI 验证

**Files:** 无代码改动（必要时修正 `client.js` CSS/DOM）

- [ ] **Step 1:** 启动第二个实例：`dsh web --no-open --port 3099`（后台），读取打印的 token URL
- [ ] **Step 2:** Playwright 打开插件页 →「哪吒 MCP」详情页：
  - 浅色截图；切到深色主题后截图；
  - 打开连接设置弹窗截图，检查字段校验与 PAT 显示切换；
  - 打开测试连接弹窗，跑真实测试并截图结果；
  - 点击"保存并连接"（保持原值）验证重连；`diff` profile 的设置文件确认无变化；
  - 缩窄视口到 700px 截图，确认无横向溢出；
  - 展开服务器分组与工具分组截图。
- [ ] **Step 3:** 关闭第二个实例，清理临时截图（保留交付用图到 `docs/images/`）。

---

### Task 7: 提交

```bash
npm run check && npm test
git add -A
git commit -m "feat: redesign Nezha settings page with connection route and curated docs"
```

提交前确认 `git status` 不包含临时文件与 `docs/superpowers/` 以外的无关产物。
