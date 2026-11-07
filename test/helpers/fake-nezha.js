import { createServer } from 'node:http';

function json(res, status, value, headers = {}) {
  const body = value === undefined ? '' : JSON.stringify(value);
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body),
    ...headers,
  });
  res.end(body);
}

/**
 * In-process Nezha MCP stand-in: initialize, paginated tools/list, tools/call,
 * SSE responses, auth failure, 404, and a slow call for timeout tests.
 */
export async function startFakeNezha() {
  let initialized = false;
  const seen = { sessionHeaders: [], authHeaders: [] };
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    let message;
    try { message = JSON.parse(body); } catch { message = null; }

    if (req.url !== '/mcp') return json(res, 404, { error: 'not found' });
    seen.authHeaders.push(req.headers.authorization ?? '');
    if (req.headers.authorization !== 'Bearer nzp_test') return json(res, 401, { error: 'unauthorized' });
    if (req.headers['mcp-session-id']) seen.sessionHeaders.push(req.headers['mcp-session-id']);

    if (message?.method === 'initialize') {
      initialized = true;
      return json(res, 200, {
        jsonrpc: '2.0', id: message.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'Nezha', version: '2.0.0' },
        },
      }, { 'mcp-session-id': 'session-1' });
    }
    if (message?.method === 'notifications/initialized') {
      res.writeHead(202);
      return res.end();
    }
    if (!initialized) return json(res, 400, { error: 'not initialized' });

    if (message?.method === 'tools/list') {
      if (!message.params?.cursor) {
        return json(res, 200, {
          jsonrpc: '2.0', id: message.id,
          result: {
            tools: [
              { name: 'server.list', description: 'List servers', inputSchema: { type: 'object', properties: { online_only: { type: 'boolean' } } } },
              { name: 'fs.read', description: 'Read a file', inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
            ],
            nextCursor: 'page-2',
          },
        });
      }
      return json(res, 200, {
        jsonrpc: '2.0', id: message.id,
        result: { tools: [{ name: 'server.exec', description: 'Run a command', inputSchema: { type: 'object', properties: {} } }] },
      });
    }

    if (message?.method === 'tools/call') {
      const name = message.params?.name;
      if (name === 'server.list') {
        return json(res, 200, {
          jsonrpc: '2.0', id: message.id,
          result: {
            content: [{ type: 'text', text: '{"servers":[]}' }],
            structuredContent: { servers: [] },
          },
        });
      }
      if (name === 'fail') {
        return json(res, 200, {
          jsonrpc: '2.0', id: message.id,
          result: { content: [{ type: 'text', text: 'remote failure' }], isError: true },
        });
      }
      if (name === 'sse') {
        const payload = JSON.stringify({
          jsonrpc: '2.0', id: message.id,
          result: { content: [{ type: 'text', text: 'from sse' }] },
        });
        const body = `event: message\ndata: ${payload}\n\n`;
        res.writeHead(200, { 'content-type': 'text/event-stream', 'content-length': Buffer.byteLength(body) });
        return res.end(body);
      }
      if (name === 'slow') {
        await new Promise(resolve => setTimeout(resolve, 300));
        return json(res, 200, { jsonrpc: '2.0', id: message.id, result: { content: [] } });
      }
      return json(res, 200, {
        jsonrpc: '2.0', id: message.id,
        error: { code: -32601, message: 'unknown tool' },
      });
    }

    return json(res, 200, { jsonrpc: '2.0', id: message?.id ?? null, error: { code: -32600, message: 'invalid request' } });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {
    origin,
    seen,
    close: () => new Promise(resolve => server.close(resolve)),
  };
}

export function createFakeCredentials() {
  const records = new Map();
  return {
    records,
    async readRecord(key) { return records.get(key); },
    async describeRecord(key) { return { configured: records.has(key), writable: true }; },
    async modifyRecord(key, mutate) {
      const next = await mutate(records.get(key));
      if (next !== undefined) records.set(key, next);
      return next;
    },
    async deleteRecord(key) { records.delete(key); },
  };
}

export function createFakeTools() {
  const definitions = new Map();
  return {
    definitions,
    register(definition) {
      definitions.set(definition.name, definition);
      return () => definitions.delete(definition.name);
    },
  };
}

/** Minimal Cordis-shaped context for the plugin's Host service. */
export function createFakeContext({ profileDir, credentials, tools }) {
  const effects = [];
  const provided = {};
  const ctx = {
    profileContext: { dir: profileDir },
    credentials,
    tools,
    logger: { warn() {} },
    get(name) {
      if (name === 'profileContext') return ctx.profileContext;
      if (name === 'credentials') return credentials;
      if (name === 'tools') return tools;
      return undefined;
    },
    effect(fn) {
      const dispose = fn();
      effects.push(dispose);
      return dispose;
    },
    provide(name, value) { provided[name] = value; },
  };
  return {
    ctx,
    provided,
    async dispose() {
      for (const dispose of effects.reverse()) await dispose?.();
    },
  };
}
