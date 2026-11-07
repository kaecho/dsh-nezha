import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export const DEFAULT_TIMEOUT_MS = 60_000;
export const MIN_TIMEOUT_MS = 5_000;
export const MAX_TIMEOUT_MS = 300_000;

function clampTimeout(value) {
  if (!Number.isFinite(value)) return DEFAULT_TIMEOUT_MS;
  return Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, Math.round(value)));
}

function defaults() {
  return { url: '', enabled: true, timeoutMs: DEFAULT_TIMEOUT_MS };
}

function normalize(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  return {
    url: typeof source.url === 'string' ? source.url : '',
    enabled: source.enabled !== false,
    timeoutMs: clampTimeout(source.timeoutMs),
  };
}

/**
 * Non-secret plugin settings. The PAT lives in the DSH credential store, not
 * in this file. The file is written atomically with owner-only permissions.
 */
export function createSettingsStore({ profileDir }) {
  const directory = join(profileDir, 'dsh-nezha');
  const path = join(directory, 'settings.json');

  return {
    path,
    read() {
      try {
        if (!existsSync(path)) return defaults();
        return normalize(JSON.parse(readFileSync(path, 'utf8')));
      } catch {
        return defaults();
      }
    },
    write(value) {
      const next = normalize(value);
      mkdirSync(directory, { recursive: true, mode: 0o700 });
      const temporary = join(directory, `.settings-${randomUUID()}.tmp`);
      writeFileSync(temporary, `${JSON.stringify(next, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
      try {
        renameSync(temporary, path);
      } catch (error) {
        // Windows can refuse replacing an existing file; the direct write is
        // still atomic enough for a small JSON document.
        writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
        try { rmSync(temporary, { force: true }); } catch {}
        try { chmodSync(path, 0o600); } catch {}
        if (error && error.code !== 'EEXIST' && error.code !== 'EPERM') throw error;
      }
      try { chmodSync(path, 0o600); } catch {}
      return next;
    },
  };
}
