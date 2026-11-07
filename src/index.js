import { readFileSync } from 'node:fs';
import { NezhaMcpClient, NezhaMcpError, normalizeEndpoint, summarizeTool } from './mcp.js';
import { createToolDefinition } from './tool-bridge.js';
import { createSettingsStore, MAX_TIMEOUT_MS, MIN_TIMEOUT_MS } from './settings-store.js';
import { SERVICE, SETTINGS_DESCRIPTORS } from './descriptors.js';

export const name = 'dsh-nezha';
export const inject = ['tools', 'credentials', 'profileContext'];

const TOKEN_KEY = 'dsh-nezha/token';
const REMOTE_METHOD_DESCRIPTOR = '@deepseek-ai/dsh-typert-protocol/remote-methods';
const PACKAGE_VERSION = readPackageVersion();

function readPackageVersion() {
  try {
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    return typeof manifest.version === 'string' ? manifest.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function publicError(error) {
  if (error instanceof NezhaMcpError) return { code: error.code, message: error.message };
  return { code: 'unexpected', message: '连接 Nezha 失败，请检查地址、PAT 和反向代理配置。' };
}

function normalizeServer(info) {
  if (!info || typeof info !== 'object') return null;
  return {
    name: typeof info.name === 'string' ? info.name : '',
    version: typeof info.version === 'string' ? info.version : '',
  };
}

class NezhaSettingsService {
  #profileDir;
  #store;
  #settings;
  #status = 'idle';
  #error = null;
  #server = null;
  #protocolVersion = null;
  #availableTools = [];
  #toolDisposers = new Map();
  #client = null;
  #connectPromise = null;
  #queue = Promise.resolve();
  #generation = 0;
  #disposed = false;

  constructor(ctx) {
    this.ctx = ctx;
    this.typertRemote = Object.freeze({ service: this, serviceKey: SERVICE, namespace: SERVICE });

    const profile = ctx.get('profileContext') ?? ctx.profileContext;
    this.#profileDir = typeof profile?.dir === 'string' && profile.dir !== ''
      ? profile.dir
      : (process.env.DSH_PROFILE_DIR ?? process.cwd());
    this.#store = createSettingsStore({ profileDir: this.#profileDir });
    this.#settings = this.#store.read();
    this.#status = this.#settings.enabled ? 'idle' : 'disabled';

    ctx.effect(() => () => { void this.#dispose(); });
    void this.#restart();
  }

  /** Read configuration, credential presence, live status, and registered tools. */
  async snapshot() {
    const token = await this.#describeToken();
    return {
      configured: this.#settings.url !== '' && token.configured,
      enabled: this.#settings.enabled,
      url: this.#settings.url,
      endpoint: this.#settings.url,
      token,
      timeoutMs: this.#settings.timeoutMs,
      status: this.#status,
      error: this.#error,
      server: this.#server,
      protocolVersion: this.#protocolVersion,
      tools: this.#availableTools.map(summarizeTool),
    };
  }

  /** Save endpoint/PAT/enable settings, then reconnect and refresh tools. */
  async save(request = {}) {
    const next = { ...this.#settings };
    if (request.url !== undefined) {
      if (typeof request.url !== 'string') {
        return { snapshot: await this.snapshot(), error: { code: 'invalid_url', message: '地址必须是字符串。' } };
      }
      const raw = request.url.trim();
      if (raw === '') next.url = '';
      else {
        try { next.url = normalizeEndpoint(raw); }
        catch (error) { return { snapshot: await this.snapshot(), error: publicError(error) }; }
      }
    }
    if (request.enabled !== undefined && typeof request.enabled !== 'boolean') {
      return { snapshot: await this.snapshot(), error: { code: 'invalid_enabled', message: '启用状态必须是布尔值。' } };
    }
    if (request.enabled !== undefined) next.enabled = request.enabled;
    if (request.timeoutMs !== undefined) {
      const timeoutMs = Number(request.timeoutMs);
      if (!Number.isFinite(timeoutMs) || timeoutMs < MIN_TIMEOUT_MS || timeoutMs > MAX_TIMEOUT_MS) {
        return {
          snapshot: await this.snapshot(),
          error: { code: 'invalid_timeout', message: `超时需在 ${MIN_TIMEOUT_MS / 1000}–${MAX_TIMEOUT_MS / 1000} 秒之间。` },
        };
      }
      next.timeoutMs = Math.round(timeoutMs);
    }

    try {
      if (request.clearToken === true) {
        await this.ctx.credentials.deleteRecord(TOKEN_KEY);
      } else if (typeof request.token === 'string' && request.token.trim() !== '') {
        const token = request.token.trim();
        await this.ctx.credentials.modifyRecord(TOKEN_KEY, async () => ({ kind: 'api-key', key: token }));
      }
    } catch {
      return {
        snapshot: await this.snapshot(),
        error: { code: 'credential_write_failed', message: '无法保存 PAT，请检查 DSH 凭据服务是否可用。' },
      };
    }

    try {
      this.#settings = this.#store.write(next);
    } catch {
      return {
        snapshot: await this.snapshot(),
        error: { code: 'config_write_failed', message: '无法写入插件配置文件，请检查 profile 目录权限。' },
      };
    }

    await this.#restart();
    return { snapshot: await this.snapshot(), error: null };
  }

  /** Test a draft endpoint/PAT without saving it. */
  async test(request = {}) {
    let endpoint = this.#settings.url;
    if (typeof request.url === 'string' && request.url.trim() !== '') {
      try { endpoint = normalizeEndpoint(request.url); }
      catch (error) { return { ok: false, error: publicError(error) }; }
    }
    if (endpoint === '') {
      return { ok: false, error: { code: 'missing_url', message: '请先填写 Nezha Dashboard 地址。' } };
    }

    let token = '';
    if (typeof request.token === 'string' && request.token.trim() !== '') {
      token = request.token.trim();
    } else {
      token = (await this.#readToken()) ?? '';
    }
    if (token === '') {
      return { ok: false, endpoint, error: { code: 'missing_token', message: '请填写 Nezha API Token（PAT）。' } };
    }

    const client = new NezhaMcpClient({
      endpoint,
      token,
      timeoutMs: Math.min(this.#settings.timeoutMs, 20_000),
      clientVersion: PACKAGE_VERSION,
    });
    try {
      const info = await client.connect();
      return {
        ok: true,
        endpoint,
        server: normalizeServer(info.serverInfo),
        protocolVersion: info.protocolVersion,
        tools: info.tools.map(summarizeTool),
      };
    } catch (error) {
      return { ok: false, endpoint, error: publicError(error) };
    } finally {
      await client.close().catch(() => {});
    }
  }

  /** Reconnect the saved configuration and refresh registered tools. */
  async refresh() {
    await this.#restart();
    return { snapshot: await this.snapshot(), error: null };
  }

  #enqueue(task) {
    const run = this.#queue.then(task, task);
    this.#queue = run.then(() => undefined, () => undefined);
    return run;
  }

  #restart() {
    return this.#enqueue(() => this.#performRestart());
  }

  async #performRestart() {
    this.#generation += 1;
    const generation = this.#generation;
    await this.#disposeClient();
    this.#disposeTools();
    this.#availableTools = [];
    this.#server = null;
    this.#protocolVersion = null;

    if (this.#disposed) return;
    if (!this.#settings.enabled) {
      this.#status = 'disabled';
      this.#error = null;
      return;
    }

    let endpoint;
    try { endpoint = this.#settings.url === '' ? '' : normalizeEndpoint(this.#settings.url); }
    catch (error) {
      this.#status = 'error';
      this.#error = publicError(error);
      return;
    }
    if (endpoint === '') {
      this.#status = 'idle';
      this.#error = null;
      return;
    }

    const token = await this.#readToken();
    if (token === null) {
      this.#status = 'idle';
      this.#error = null;
      return;
    }

    this.#status = 'connecting';
    this.#error = null;
    const client = new NezhaMcpClient({
      endpoint,
      token,
      timeoutMs: this.#settings.timeoutMs,
      clientVersion: PACKAGE_VERSION,
    });
    try {
      const info = await client.connect();
      if (this.#disposed || generation !== this.#generation) {
        await client.close().catch(() => {});
        return;
      }
      this.#client = client;
      this.#server = normalizeServer(info.serverInfo);
      this.#protocolVersion = info.protocolVersion;
      this.#availableTools = info.tools;
      this.#registerTools(info.tools);
      this.#status = 'connected';
    } catch (error) {
      await client.close().catch(() => {});
      if (this.#disposed || generation !== this.#generation) return;
      this.#status = 'error';
      this.#error = publicError(error);
      this.ctx.logger?.warn?.(`[dsh-nezha] connect failed: ${error?.code ?? 'unknown'} ${error?.message ?? ''}`);
    }
  }

  async #ensureConnected() {
    if (this.#client !== null && this.#status === 'connected') return;
    if (this.#connectPromise !== null) {
      await this.#connectPromise;
      return;
    }
    this.#connectPromise = this.#restart().finally(() => { this.#connectPromise = null; });
    await this.#connectPromise;
  }

  async #callTool(rawName, args, signal) {
    if (this.#client === null || this.#status !== 'connected') await this.#ensureConnected();
    const client = this.#client;
    if (client === null || this.#status !== 'connected') {
      throw new NezhaMcpError('not_connected', this.#error?.message ?? 'Nezha MCP 尚未连接，请在插件设置中完成配置并重试。');
    }
    return client.callTool(rawName, args, signal);
  }

  #registerTools(tools) {
    const seen = new Set();
    for (const tool of tools) {
      let definition;
      try {
        definition = createToolDefinition({
          tool,
          callTool: (rawName, args, signal) => this.#callTool(rawName, args, signal),
          timeoutMs: this.#settings.timeoutMs,
        });
      } catch (error) {
        this.ctx.logger?.warn?.(`[dsh-nezha] skipped invalid tool: ${error?.message ?? String(error)}`);
        continue;
      }
      if (seen.has(definition.name) || this.#toolDisposers.has(definition.name)) continue;
      seen.add(definition.name);
      try {
        this.#toolDisposers.set(definition.name, this.ctx.tools.register(definition));
      } catch (error) {
        this.ctx.logger?.warn?.(`[dsh-nezha] tool registration failed for ${definition.name}: ${error?.message ?? String(error)}`);
      }
    }
  }

  #disposeTools() {
    for (const dispose of this.#toolDisposers.values()) {
      try { dispose(); } catch {}
    }
    this.#toolDisposers.clear();
  }

  async #disposeClient() {
    const client = this.#client;
    this.#client = null;
    if (client !== null) await client.close().catch(() => {});
  }

  async #readToken() {
    try {
      const record = await this.ctx.credentials.readRecord(TOKEN_KEY);
      if (record && record.kind === 'api-key' && typeof record.key === 'string' && record.key !== '') return record.key;
      return null;
    } catch {
      return null;
    }
  }

  async #describeToken() {
    try {
      const info = await this.ctx.credentials.describeRecord(TOKEN_KEY);
      return { configured: info.configured === true, writable: info.writable !== false };
    } catch {
      return { configured: false, writable: false };
    }
  }

  async #dispose() {
    this.#disposed = true;
    this.#generation += 1;
    this.#disposeTools();
    await this.#disposeClient();
  }
}

Object.defineProperty(NezhaSettingsService.prototype, REMOTE_METHOD_DESCRIPTOR, {
  configurable: true,
  value: Object.freeze({
    version: 1,
    methods: Object.freeze(SETTINGS_DESCRIPTORS.map(descriptor => Object.freeze({
      method: descriptor.method,
      invocation: descriptor.invocation,
    }))),
  }),
});

export function apply(ctx) {
  const service = new NezhaSettingsService(ctx);
  ctx.provide(SERVICE, service);
}

export { NezhaSettingsService };
