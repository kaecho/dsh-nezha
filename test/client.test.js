import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInThisContext } from 'node:vm';

async function loadClient() {
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  let loaded;
  globalThis.window = {
    __ModuleLoader__: {
      load(entry) { loaded = entry; },
    },
  };
  runInThisContext(source, { filename: 'client.js' });
  assert.equal(loaded.id, 'dsh-nezha');
  const React = {
    createElement(type, props, ...children) { return { type, props, children }; },
    useState(value) { return [value, () => {}]; },
    useEffect() {},
    useRef(value) { return { current: value }; },
  };
  const module = loaded.factory(specifier => {
    if (specifier === 'react') return React;
    throw new Error(`unexpected require: ${specifier}`);
  });
  return module;
}

test('client module registers locale, Remote contribution, settings page, and detail badge', async () => {
  const module = await loadClient();
  assert.equal(module.NS, 'plugins.dshNezha');
  assert.deepEqual(module.inject, ['slots', 'locale', 'remote']);

  const calls = { slots: [], registered: [] };
  const locale = {
    register(ns, dicts) { calls.locale = { ns, dicts }; return () => {}; },
    bind(ns) { calls.bindNs = ns; return key => key; },
  };
  const ctx = {
    effect(fn) { return fn(); },
    locale,
    remote: {
      async $mount(contribution) {
        calls.mount = contribution;
        return async () => {};
      },
    },
    inject(services, callback) {
      calls.inject = services;
      callback({
        remote: ctx.remote,
        locale,
        slots: {
          inject(name, install) {
            calls.slots.push(name);
            return install();
          },
          register(options, component) {
            calls.registered.push({ options, component });
            return () => {};
          },
        },
      });
    },
  };

  const dispose = await module.apply(ctx);
  assert.equal(calls.locale.ns, 'plugins.dshNezha');
  assert.equal(calls.locale.dicts.zh.routeTitle, '连接路由');
  assert.equal(calls.locale.dicts.en.routeTitle, 'Connection route');
  assert.equal(calls.locale.dicts.zh.status_connected, '已连接');
  assert.equal(calls.locale.dicts.en.status_connected, 'Connected');
  assert.equal(calls.mount.package, 'dsh-nezha');
  assert.deepEqual(
    calls.mount.descriptors.map(descriptor => descriptor.method),
    ['snapshot', 'save', 'test', 'refresh', 'servers'],
  );
  assert.deepEqual(calls.inject, ['remote.nezhaSettings', 'slots', 'locale']);
  assert.deepEqual(calls.slots, ['plugins.bundle.config', 'plugins.detail.badge']);

  const settings = calls.registered.find(entry => entry.options.name === 'plugins.bundle.config');
  const badge = calls.registered.find(entry => entry.options.name === 'plugins.detail.badge');
  assert.equal(settings.options.key, 'dsh-nezha');
  assert.equal(settings.options.locale, 'plugins.dshNezha');
  assert.equal(typeof settings.component, 'function');
  assert.equal(badge.options.id, 'dsh-nezha-github');
  assert.equal(typeof badge.component, 'function');

  const injected = settings.options.inject();
  assert.equal(calls.bindNs, 'plugins.dshNezha');
  assert.equal(injected.t('routeTitle'), 'routeTitle');
  assert.equal(injected.remote, ctx.remote);
  await dispose();
});

test('client helpers group tools by Nezha namespace', async () => {
  const module = await loadClient();
  const { groupTools, toolGroupId, toolLabelKey, toolLabel } = module.helpers;
  const groups = groupTools([
    { name: 'mcp__nezha__server_list', rawName: 'server.list', description: 'List servers' },
    { name: 'mcp__nezha__fs_read', rawName: 'fs.read', description: 'Read a file' },
    { name: 'mcp__nezha__meta_whoami', rawName: 'meta.whoami', description: '' },
    { name: 'mcp__nezha__custom_tool', rawName: 'custom.tool', description: '' },
  ]);
  assert.deepEqual(groups.map(group => group.id), ['server', 'fs', 'meta', 'other']);
  assert.equal(groups[0].labelKey, 'group_server');
  assert.equal(groups[0].tools[0].rawName, 'server.list');
  assert.equal(toolGroupId('fs.upload_url'), 'fs');
  assert.equal(toolGroupId('unknown'), 'other');
  assert.equal(toolLabelKey('fs.read'), 'tool_fs_read');
  assert.equal(toolLabel(key => `t:${key}`, 'fs.read'), 't:tool_fs_read');
  assert.equal(toolLabel(key => `t:${key}`, 'custom.tool'), 'custom.tool');
});

test('client helpers map status tones, servers, errors, and endpoints', async () => {
  const module = await loadClient();
  const { statusTone, summarizeServers, endpointPreview, errorHintKey } = module.helpers;
  assert.equal(statusTone('connected'), 'ok');
  assert.equal(statusTone('error'), 'error');
  assert.equal(statusTone('connecting'), 'warn');
  assert.equal(statusTone('idle'), 'idle');
  assert.equal(statusTone('disabled'), 'idle');
  assert.deepEqual(
    summarizeServers([{ online: true }, { online: false }, { online: true }]),
    { total: 3, online: 2, offline: 1 },
  );
  assert.deepEqual(summarizeServers(undefined), { total: 0, online: 0, offline: 0 });
  assert.deepEqual(endpointPreview('https://nezha.example.com/nezha'), {
    ok: true,
    endpoint: 'https://nezha.example.com/nezha/mcp',
  });
  assert.deepEqual(endpointPreview('https://nezha.example.com/mcp/'), {
    ok: true,
    endpoint: 'https://nezha.example.com/mcp',
  });
  assert.equal(endpointPreview('ftp://x').code, 'protocol');
  assert.equal(endpointPreview('not a url').code, 'invalid');
  assert.equal(endpointPreview('https://user:pass@x.example.com').code, 'credentials');
  assert.equal(endpointPreview('   ').code, 'empty');
  assert.equal(errorHintKey('auth'), 'hint_auth');
  assert.equal(errorHintKey('unknown-code'), 'hint_default');
});
