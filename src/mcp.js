import { createHash } from 'node:crypto';

/**
 * Protocol revision this client offers during `initialize`. Nezha documents
 * `2024-11-05` in its MCP examples and negotiates the final version in the
 * response, so the client always honours the server's answer afterwards.
 */
export const PROTOCOL_VERSION = '2024-11-05';
export const CLIENT_NAME = 'dsh-nezha';
export const DEFAULT_TIMEOUT_MS = 60_000;
export const MAX_TOOL_PAGES = 50;
export const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;
const MAX_PUBLIC_NAME_LENGTH = 64;
const HASH_LENGTH = 12;

/** A failure with a stable, UI-safe code. Never carries the PAT. */
export class NezhaMcpError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'NezhaMcpError';
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

/**
 * Normalize a dashboard address to Nezha's MCP endpoint.
 * Accepts `https://host`, `https://host/`, `https://host/nezha` and
 * `https://host/nezha/mcp`; the result always ends in `/mcp`.
 */
export function normalizeEndpoint(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new NezhaMcpError('invalid_url', '请填写 Nezha Dashboard 地址。');
  }
  let parsed;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new NezhaMcpError('invalid_url', '地址格式无效，请使用 http:// 或 https:// 开头的完整地址。');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new NezhaMcpError('invalid_url', '地址必须以 http:// 或 https:// 开头。');
  }
  if (parsed.username || parsed.password) {
    throw new NezhaMcpError('invalid_url', '地址中不能包含用户名或密码，PAT 请填写在单独的令牌字段。');
  }
  parsed.hash = '';
  parsed.search = '';
  let path = parsed.pathname.replace(/\/+$/, '');
  if (!path.endsWith('/mcp')) path = `${path}/mcp`;
  parsed.pathname = path;
  return parsed.href.replace(/\/$/, '');
}

/**
 * Stable model-facing tool name; mirrors the `mcp__<server>__<tool>` shape.
 * Dots become underscores so Nezha's `server.list` reads naturally as
 * `mcp__nezha__server_list`. A hash suffix is only appended when truncation is
 * required; collisions are rejected during registration instead of silently
 * renaming a tool.
 */
export function publicToolName(rawName, serverName = 'nezha') {
  const raw = String(rawName ?? '');
  const readable = raw.replace(/\./g, '_').replace(/[^A-Za-z0-9_-]/g, '_');
  const joined = `mcp__${serverName}__${readable}`;
  if (joined.length <= MAX_PUBLIC_NAME_LENGTH) return joined;
  const hash = createHash('sha256')
    .update(`${serverName}\0${raw}`)
    .digest('hex')
    .slice(0, HASH_LENGTH);
  return `${joined.slice(0, MAX_PUBLIC_NAME_LENGTH - HASH_LENGTH - 1)}_${hash}`;
}

/** Summarize one upstream tool for the settings UI. */
export function summarizeTool(tool) {
  return {
    name: publicToolName(tool?.name),
    rawName: String(tool?.name ?? ''),
    description: typeof tool?.description === 'string' ? tool.description : '',
  };
}

function boundedMessage(value, limit = 300) {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

function httpError(status, body) {
  const detail = boundedMessage(body);
  if (status === 401) return new NezhaMcpError('auth', '认证失败（401），请检查 PAT 是否有效、是否已过期。', { status });
  if (status === 403) return new NezhaMcpError('forbidden', '没有访问权限（403），请检查 PAT 的 scope 和服务器白名单。', { status });
  if (status === 404) {
    return new NezhaMcpError('not_found', 'MCP 接口不存在（404），请确认地址以 /mcp 结尾，且 Dashboard 已开启 enable_mcp。', { status });
  }
  if (status === 429) return new NezhaMcpError('rate_limited', '请求过于频繁（429），请稍后再试。', { status });
  if (status >= 500) {
    return new NezhaMcpError('server_error', `Nezha 服务端错误（HTTP ${status}）${detail ? `：${detail}` : '。'}`, { status });
  }
  return new NezhaMcpError('http_error', `请求失败（HTTP ${status}）${detail ? `：${detail}` : '。'}`, { status });
}

/**
 * Parse a JSON or Streamable-HTTP SSE body into JSON-RPC messages.
 * @param {string} body
 * @param {string} contentType
 * @returns {unknown[]}
 */
export function parseRpcBody(body, contentType = '') {
  if (typeof body !== 'string' || body.trim() === '') return [];
  if (contentType.includes('text/event-stream')) {
    const messages = [];
    for (const block of body.split(/\r?\n\r?\n/)) {
      const data = block
        .split(/\r?\n/)
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).replace(/^ /, ''))
        .join('\n')
        .trim();
      if (!data || data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) messages.push(...parsed);
        else messages.push(parsed);
      } catch {
        throw new NezhaMcpError('invalid_response', 'Nezha 返回了无法解析的 SSE 数据。');
      }
    }
    return messages;
  }
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new NezhaMcpError('invalid_response', 'Nezha 返回了无法解析的 MCP 响应。');
  }
  return Array.isArray(parsed) ? parsed : [parsed];
}

function rpcError(error) {
  const message = boundedMessage(error?.message) || 'MCP 请求失败。';
  return new NezhaMcpError('rpc_error', message, {
    code: error?.code ?? null,
    ...(error?.data === undefined ? {} : { data: error.data }),
  });
}

function asNezhaError(error, fallbackCode = 'unexpected', fallbackMessage = '连接 Nezha 失败，请检查配置。') {
  if (error instanceof NezhaMcpError) return error;
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
    return new NezhaMcpError('timeout', '连接 Nezha 超时，请检查网络和反向代理。');
  }
  if (error instanceof TypeError) {
    return new NezhaMcpError('network', '无法连接到 Nezha 服务，请检查地址、网络和反向代理。');
  }
  return new NezhaMcpError(fallbackCode, fallbackMessage);
}

function abortReason(signal) {
  const reason = signal?.reason;
  if (reason instanceof Error) return reason;
  return new NezhaMcpError('cancelled', '请求已取消。');
}

/**
 * Lean Nezha MCP client. Nezha implements MCP Streamable HTTP as POST
 * request/response (GET and DELETE return 405), so this client sends one
 * JSON-RPC message per POST and tolerates either JSON or SSE response bodies.
 */
export class NezhaMcpClient {
  #endpoint;
  #token;
  #timeoutMs;
  #fetch;
  #clientVersion;
  #nextId = 1;
  #sessionId = null;
  #protocolVersion = PROTOCOL_VERSION;
  #serverInfo = null;
  #capabilities = null;
  #closed = false;

  constructor(options) {
    if (!options || typeof options !== 'object') throw new NezhaMcpError('invalid_options', '缺少 MCP 客户端参数。');
    this.#endpoint = normalizeEndpoint(options.endpoint);
    if (typeof options.token !== 'string' || options.token.trim() === '') {
      throw new NezhaMcpError('missing_token', '请填写 Nezha API Token（PAT）。');
    }
    this.#token = options.token.trim();
    this.#timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
      ? Math.round(options.timeoutMs)
      : DEFAULT_TIMEOUT_MS;
    this.#fetch = typeof options.fetch === 'function' ? options.fetch : fetch;
    this.#clientVersion = typeof options.clientVersion === 'string' ? options.clientVersion : '0.1.0';
  }

  get endpoint() { return this.#endpoint; }
  get sessionId() { return this.#sessionId; }
  get protocolVersion() { return this.#protocolVersion; }
  get serverInfo() { return this.#serverInfo; }
  get capabilities() { return this.#capabilities; }
  get closed() { return this.#closed; }

  /** Initialize the session, send the initialized notification, then list tools. */
  async connect(signal) {
    if (this.#closed) throw new NezhaMcpError('closed', 'MCP 连接已关闭。');
    const result = await this.#request('initialize', {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: CLIENT_NAME, version: this.#clientVersion },
    }, signal);
    if (result && typeof result.protocolVersion === 'string') this.#protocolVersion = result.protocolVersion;
    this.#serverInfo = result?.serverInfo && typeof result.serverInfo === 'object' ? result.serverInfo : null;
    this.#capabilities = result?.capabilities && typeof result.capabilities === 'object' ? result.capabilities : null;
    await this.#notify('notifications/initialized', {}, signal);
    const tools = await this.listTools(signal);
    return { serverInfo: this.#serverInfo, protocolVersion: this.#protocolVersion, capabilities: this.#capabilities, tools };
  }

  /** Read every page of `tools/list`. */
  async listTools(signal) {
    const tools = [];
    let cursor;
    for (let page = 0; page < MAX_TOOL_PAGES; page += 1) {
      const result = await this.#request('tools/list', cursor === undefined ? {} : { cursor }, signal);
      if (Array.isArray(result?.tools)) {
        for (const tool of result.tools) if (tool && typeof tool.name === 'string' && tool.name !== '') tools.push(tool);
      }
      cursor = typeof result?.nextCursor === 'string' && result.nextCursor !== '' ? result.nextCursor : undefined;
      if (cursor === undefined) return tools;
    }
    throw new NezhaMcpError('invalid_response', 'Nezha 的工具列表分页过多，已停止读取。');
  }

  /** Call one upstream tool by its raw MCP name. */
  async callTool(name, args, signal) {
    if (typeof name !== 'string' || name === '') throw new NezhaMcpError('invalid_tool', '工具名称无效。');
    const result = await this.#request('tools/call', {
      name,
      arguments: args && typeof args === 'object' && !Array.isArray(args) ? args : {},
    }, signal);
    if (!result || typeof result !== 'object') {
      throw new NezhaMcpError('invalid_response', `工具 ${name} 返回了无效结果。`);
    }
    return result;
  }

  async close() {
    this.#closed = true;
    this.#sessionId = null;
  }

  async #request(method, params, signal) {
    if (this.#closed) throw new NezhaMcpError('closed', 'MCP 连接已关闭。');
    const id = this.#nextId++;
    const message = { jsonrpc: '2.0', id, method };
    if (params !== undefined) message.params = params;
    const messages = await this.#post(message, signal);
    const match = messages.find(item => item && item.id === id);
    if (!match) {
      const failure = messages.find(item => item && item.error);
      if (failure) throw rpcError(failure.error);
      throw new NezhaMcpError('invalid_response', `Nezha 未返回 ${method} 的匹配响应。`);
    }
    if (match.error) throw rpcError(match.error);
    return match.result;
  }

  async #notify(method, params, signal) {
    if (this.#closed) throw new NezhaMcpError('closed', 'MCP 连接已关闭。');
    const message = { jsonrpc: '2.0', method };
    if (params !== undefined) message.params = params;
    await this.#post(message, signal);
  }

  async #post(message, signal) {
    const headers = {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      authorization: `Bearer ${this.#token}`,
    };
    if (this.#sessionId !== null) headers['mcp-session-id'] = this.#sessionId;
    if (message.method !== 'initialize') headers['mcp-protocol-version'] = this.#protocolVersion;

    const timeout = AbortSignal.timeout(this.#timeoutMs);
    const combined = signal === undefined ? timeout : AbortSignal.any([signal, timeout]);
    let response;
    try {
      response = await this.#fetch(this.#endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(message),
        signal: combined,
        redirect: 'follow',
      });
    } catch (error) {
      if (signal?.aborted) throw abortReason(signal);
      throw asNezhaError(error);
    }

    const sessionId = response.headers?.get?.('mcp-session-id');
    if (typeof sessionId === 'string' && sessionId !== '') this.#sessionId = sessionId;

    const declaredLength = Number(response.headers?.get?.('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
      throw new NezhaMcpError('response_too_large', 'Nezha 返回的响应体过大，已停止读取。');
    }
    const text = await response.text().catch(error => {
      if (signal?.aborted) throw abortReason(signal);
      throw asNezhaError(error);
    });
    if (text.length > MAX_RESPONSE_BYTES) {
      throw new NezhaMcpError('response_too_large', 'Nezha 返回的响应体过大，已停止读取。');
    }
    if (!response.ok) throw httpError(response.status, text);
    const contentType = response.headers?.get?.('content-type') ?? '';
    return parseRpcBody(text, contentType);
  }
}
