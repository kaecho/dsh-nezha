import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInThisContext } from 'node:vm';

test('client module registers locale, Remote contribution, and settings slot', async () => {
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
  assert.equal(module.NS, 'plugins.dshNezha');
  assert.deepEqual(module.inject, ['slots', 'locale', 'remote']);

  const calls = {};
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
          inject(name, install) { calls.slot = name; return install(); },
          register(options, component) {
            calls.registered = { options, component };
            return () => {};
          },
        },
      });
    },
  };

  const dispose = await module.apply(ctx);
  assert.equal(calls.locale.ns, 'plugins.dshNezha');
  assert.equal(calls.locale.dicts.zh.title, '哪吒 MCP');
  assert.equal(calls.locale.dicts.en.title, 'Nezha MCP');
  assert.equal(calls.mount.package, 'dsh-nezha');
  assert.equal(calls.mount.descriptors.length, 4);
  assert.deepEqual(calls.mount.descriptors.map(descriptor => descriptor.method), ['snapshot', 'save', 'test', 'refresh']);
  assert.deepEqual(calls.inject, ['remote.nezhaSettings', 'slots', 'locale']);
  assert.equal(calls.slot, 'plugins.bundle.config');
  assert.equal(calls.registered.options.key, 'dsh-nezha');
  assert.equal(calls.registered.options.locale, 'plugins.dshNezha');
  assert.equal(typeof calls.registered.component, 'function');
  const injected = calls.registered.options.inject();
  assert.equal(calls.bindNs, 'plugins.dshNezha');
  assert.equal(injected.t('title'), 'title');
  assert.equal(injected.remote, ctx.remote);
  await dispose();
});
