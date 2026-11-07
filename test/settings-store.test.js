import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSettingsStore, DEFAULT_TIMEOUT_MS } from '../src/settings-store.js';

test('settings store defaults, persists, and clamps timeouts', t => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-nezha-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const store = createSettingsStore({ profileDir: dir });

  assert.deepEqual(store.read(), { url: '', enabled: true, timeoutMs: DEFAULT_TIMEOUT_MS });

  const saved = store.write({ url: 'https://nezha.example.com/mcp', enabled: false, timeoutMs: 1 });
  assert.deepEqual(saved, { url: 'https://nezha.example.com/mcp', enabled: false, timeoutMs: 5_000 });
  assert.deepEqual(JSON.parse(readFileSync(store.path, 'utf8')), saved);
  assert.equal(statSync(store.path).mode & 0o777, 0o600);
  assert.deepEqual(store.read(), saved);

  const bounded = store.write({ url: '', enabled: true, timeoutMs: 999_999 });
  assert.equal(bounded.timeoutMs, 300_000);
});
