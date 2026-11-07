import test from 'node:test';
import assert from 'node:assert/strict';
import { NezhaMcpClient, NezhaMcpError, normalizeEndpoint, parseRpcBody, publicToolName } from '../src/mcp.js';
import { startFakeNezha } from './helpers/fake-nezha.js';

test('normalizeEndpoint appends /mcp and rejects unsafe addresses', () => {
  assert.equal(normalizeEndpoint('https://nezha.example.com'), 'https://nezha.example.com/mcp');
  assert.equal(normalizeEndpoint('https://nezha.example.com/'), 'https://nezha.example.com/mcp');
  assert.equal(normalizeEndpoint('https://nezha.example.com/nezha/'), 'https://nezha.example.com/nezha/mcp');
  assert.equal(normalizeEndpoint('https://nezha.example.com/mcp/'), 'https://nezha.example.com/mcp');
  assert.throws(() => normalizeEndpoint('ftp://nezha.example.com'), /http/);
  assert.throws(() => normalizeEndpoint('https://user:pass@nezha.example.com'), /用户名|密码|username|password/);
  assert.throws(() => normalizeEndpoint('not a url'), /无效|invalid/);
});

test('publicToolName keeps Nezha names readable and bounded', () => {
  assert.equal(publicToolName('server.list'), 'mcp__nezha__server_list');
  assert.equal(publicToolName('fs.download_url'), 'mcp__nezha__fs_download_url');
  const long = publicToolName('x'.repeat(120));
  assert.equal(long.length, 64);
  assert.match(long, /_[0-9a-f]{12}$/);
});

test('parseRpcBody accepts JSON and SSE bodies', () => {
  assert.deepEqual(parseRpcBody('{"jsonrpc":"2.0","id":1,"result":{}}'), [{ jsonrpc: '2.0', id: 1, result: {} }]);
  const sse = 'event: message\ndata: {"jsonrpc":"2.0","id":2,"result":{"ok":true}}\n\n';
  assert.deepEqual(parseRpcBody(sse, 'text/event-stream'), [{ jsonrpc: '2.0', id: 2, result: { ok: true } }]);
  assert.throws(() => parseRpcBody('not json'), /无法解析|invalid/i);
});

test('connect initializes a session, paginates tools, and calls a tool', async t => {
  const fake = await startFakeNezha();
  t.after(() => fake.close());
  const client = new NezhaMcpClient({ endpoint: fake.origin, token: 'nzp_test', timeoutMs: 2_000 });
  const info = await client.connect();
  assert.equal(info.protocolVersion, '2024-11-05');
  assert.deepEqual(info.serverInfo, { name: 'Nezha', version: '2.0.0' });
  assert.deepEqual(info.tools.map(tool => tool.name), ['server.list', 'fs.read', 'server.exec']);
  assert.equal(client.sessionId, 'session-1');
  assert.ok(fake.seen.sessionHeaders.length > 0);
  assert.ok(fake.seen.sessionHeaders.every(value => value === 'session-1'));

  const result = await client.callTool('server.list', { online_only: true });
  assert.deepEqual(result.structuredContent, { servers: [] });
  assert.equal(result.content[0].text, '{"servers":[]}');
  await client.close();
});

test('callTool tolerates SSE responses', async t => {
  const fake = await startFakeNezha();
  t.after(() => fake.close());
  const client = new NezhaMcpClient({ endpoint: fake.origin, token: 'nzp_test', timeoutMs: 2_000 });
  await client.connect();
  const result = await client.callTool('sse', {});
  assert.equal(result.content[0].text, 'from sse');
  await client.close();
});

test('authentication and endpoint failures carry stable codes', async t => {
  const fake = await startFakeNezha();
  t.after(() => fake.close());
  const badToken = new NezhaMcpClient({ endpoint: fake.origin, token: 'nzp_bad', timeoutMs: 1_000 });
  await assert.rejects(badToken.connect(), error => error instanceof NezhaMcpError && error.code === 'auth');

  const missing = new NezhaMcpClient({ endpoint: `${fake.origin}/missing`, token: 'nzp_test', timeoutMs: 1_000 });
  await assert.rejects(missing.connect(), error => error instanceof NezhaMcpError && error.code === 'not_found');
});

test('timeouts become a timeout error', async t => {
  const fake = await startFakeNezha();
  t.after(() => fake.close());
  const client = new NezhaMcpClient({ endpoint: fake.origin, token: 'nzp_test', timeoutMs: 2_000 });
  await client.connect();
  const slow = new NezhaMcpClient({ endpoint: fake.origin, token: 'nzp_test', timeoutMs: 100 });
  await slow.connect();
  await assert.rejects(slow.callTool('slow', {}), error => error instanceof NezhaMcpError && error.code === 'timeout');
  await client.close();
  await slow.close();
});
