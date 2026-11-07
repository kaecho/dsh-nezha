import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apply } from '../src/index.js';
import { createFakeContext, createFakeCredentials, createFakeTools, startFakeNezha } from './helpers/fake-nezha.js';

function setup(t) {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-nezha-service-'));
  const credentials = createFakeCredentials();
  const tools = createFakeTools();
  const fakeContext = createFakeContext({ profileDir: dir, credentials, tools });
  t.after(async () => {
    await fakeContext.dispose();
    rmSync(dir, { recursive: true, force: true });
  });
  apply(fakeContext.ctx);
  const service = fakeContext.provided.nezhaSettings;
  assert.ok(service, 'apply() must provide the nezhaSettings service');
  return { service, credentials, tools, fakeContext };
}

test('snapshot starts idle without configuration', async t => {
  const { service } = setup(t);
  const snapshot = await service.snapshot();
  assert.equal(snapshot.status, 'idle');
  assert.equal(snapshot.configured, false);
  assert.equal(snapshot.enabled, true);
  assert.deepEqual(snapshot.tools, []);
  assert.deepEqual(snapshot.token, { configured: false, writable: true });
});

test('save connects, registers tools, and calls Nezha through a tool definition', async t => {
  const fake = await startFakeNezha();
  t.after(() => fake.close());
  const { service, credentials, tools } = setup(t);

  const saved = await service.save({ url: fake.origin, token: 'nzp_test', enabled: true, timeoutMs: 5_000 });
  assert.equal(saved.error, null);
  assert.equal(saved.snapshot.status, 'connected');
  assert.equal(saved.snapshot.configured, true);
  assert.equal(saved.snapshot.server.name, 'Nezha');
  assert.equal(saved.snapshot.protocolVersion, '2024-11-05');
  assert.deepEqual(
    saved.snapshot.tools.map(tool => tool.name),
    ['mcp__nezha__server_list', 'mcp__nezha__fs_read', 'mcp__nezha__server_exec'],
  );
  assert.equal(credentials.records.get('dsh-nezha/token').key, 'nzp_test');
  assert.ok(tools.definitions.has('mcp__nezha__server_list'));

  const definition = tools.definitions.get('mcp__nezha__server_list');
  const value = await definition.execute({ online_only: true }, { signal: new AbortController().signal });
  assert.deepEqual(value.structuredContent, { servers: [] });
  assert.deepEqual(value.content, [{ type: 'text', text: '{"servers":[]}' }]);
});

test('test uses draft values without saving them', async t => {
  const fake = await startFakeNezha();
  t.after(() => fake.close());
  const { service, credentials } = setup(t);

  const tested = await service.test({ url: fake.origin, token: 'nzp_test' });
  assert.equal(tested.ok, true);
  assert.equal(tested.tools.length, 3);
  assert.equal(credentials.records.size, 0);
  assert.equal((await service.snapshot()).url, '');

  const bad = await service.test({ url: fake.origin, token: 'nzp_bad' });
  assert.equal(bad.ok, false);
  assert.equal(bad.error.code, 'auth');
  assert.match(bad.error.message, /认证失败/);

  const emptyUrl = await service.test({ url: '', token: 'nzp_test' });
  assert.equal(emptyUrl.ok, false);
  assert.equal(emptyUrl.error.code, 'missing_url');
});

test('invalid input is rejected without changing saved state', async t => {
  const { service } = setup(t);
  const invalidUrl = await service.save({ url: 'ftp://nezha.example.com' });
  assert.equal(invalidUrl.error.code, 'invalid_url');
  assert.equal((await service.snapshot()).url, '');

  const invalidTimeout = await service.save({ timeoutMs: 1 });
  assert.equal(invalidTimeout.error.code, 'invalid_timeout');
  assert.equal((await service.snapshot()).timeoutMs, 60_000);
});

test('clearing the PAT and disabling the plugin unregister tools', async t => {
  const fake = await startFakeNezha();
  t.after(() => fake.close());
  const { service, tools } = setup(t);

  await service.save({ url: fake.origin, token: 'nzp_test' });
  assert.equal(tools.definitions.size, 3);

  const cleared = await service.save({ clearToken: true });
  assert.equal(cleared.snapshot.token.configured, false);
  assert.equal(cleared.snapshot.status, 'idle');
  assert.equal(tools.definitions.size, 0);

  const disabled = await service.save({ enabled: false });
  assert.equal(disabled.snapshot.status, 'disabled');

  await service.save({ url: fake.origin, token: 'nzp_test', enabled: true });
  assert.equal(tools.definitions.size, 3);
});

test('disposal unregisters every tool', async t => {
  const fake = await startFakeNezha();
  t.after(() => fake.close());
  const { service, tools, fakeContext } = setup(t);
  await service.save({ url: fake.origin, token: 'nzp_test' });
  assert.equal(tools.definitions.size, 3);
  await fakeContext.dispose();
  assert.equal(tools.definitions.size, 0);
});
