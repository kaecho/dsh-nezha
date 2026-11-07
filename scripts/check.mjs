#!/usr/bin/env node
/**
 * Repository checks for dsh-nezha.
 *
 * Dependency-free by design: only Node.js built-in modules are used. The
 * script is tolerant of a missing test directory (tests are added
 * separately), but strict about the published manifest, bundle patch,
 * locale files, icon, and JavaScript syntax.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const REQUIRED_EXPORTS = [
  '.',
  './client',
  './typert',
  './locale/*.json',
  './icon',
  './package.json',
];
const REQUIRED_FILES = [
  'src/',
  'client.js',
  'cordis.patch.yml',
  'locale/*.json',
  'icon.svg',
  'README.md',
  'LICENSE',
];
const SKIP_DIRECTORIES = new Set(['node_modules', '.git', 'coverage', '.plugin-manager']);
const groups = [];

function readText(relativePath) {
  try {
    return readFileSync(join(root, relativePath), 'utf8');
  } catch {
    return null;
  }
}

function readJson(relativePath) {
  const text = readText(relativePath);
  if (text === null) return { error: 'file is missing' };
  try {
    return { value: JSON.parse(text) };
  } catch (error) {
    return { error: error.message };
  }
}

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Run one named group of assertions.
 * @param {string} name
 * @param {(add: (condition: boolean, message: string) => void) => void} run
 * @param {string} [summary]
 */
function group(name, run, summary) {
  const results = [];
  const add = (condition, message) => {
    results.push({ ok: Boolean(condition), message });
  };
  try {
    run(add);
  } catch (error) {
    results.push({ ok: false, message: `unexpected error: ${error?.message ?? String(error)}` });
  }
  groups.push({ name, results, summary });
}

// ---------------------------------------------------------------------------
// package.json
// ---------------------------------------------------------------------------

group('manifest (package.json)', add => {
  const parsed = readJson('package.json');
  if (parsed.error) {
    add(false, `cannot read package.json: ${parsed.error}`);
    return;
  }
  const pkg = parsed.value;
  if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) {
    add(false, 'package.json must contain a JSON object');
    return;
  }

  add(pkg.name === 'dsh-nezha', 'name must be "dsh-nezha"');
  add(typeof pkg.version === 'string' && SEMVER.test(pkg.version), 'version must be a valid semantic version');
  add(pkg.license === 'MIT', 'license must be "MIT"');
  add(pkg.type === 'module', 'type must be "module"');
  add(typeof pkg.description === 'string' && pkg.description.trim() !== '', 'description must be a non-empty string');

  const author = typeof pkg.author === 'string' ? pkg.author : pkg.author?.name;
  add(typeof author === 'string' && author.includes('kaecho'), 'author must be kaecho');

  const nodeEngine = typeof pkg.engines?.node === 'string' ? pkg.engines.node : '';
  const nodeMajor = Number((/(\d+)/.exec(nodeEngine) ?? [])[1]);
  add(Number.isFinite(nodeMajor) && nodeMajor >= 22, 'engines.node must require Node.js >= 22');
  add(
    typeof pkg.engines?.dsh === 'string' && /^>=/.test(pkg.engines.dsh.trim()),
    'engines.dsh must declare a minimum DSH version',
  );

  add(pkg.exports && typeof pkg.exports === 'object' && !Array.isArray(pkg.exports), 'exports must be an object');
  for (const key of REQUIRED_EXPORTS) {
    const target = pkg.exports?.[key];
    add(
      typeof target === 'string' && target.startsWith('./'),
      `exports["${key}"] must be a relative path`,
    );
  }
  add(pkg.main === pkg.exports?.['.'], 'main must match exports["."]');

  add(Array.isArray(pkg.files), 'files must be an array');
  for (const entry of REQUIRED_FILES) {
    add(Array.isArray(pkg.files) && pkg.files.includes(entry), `files must include "${entry}"`);
  }

  add(pkg.dsh && typeof pkg.dsh === 'object' && !Array.isArray(pkg.dsh), 'dsh must be an object');
  add(pkg.dsh?.bundle?.patch === './cordis.patch.yml', 'dsh.bundle.patch must be "./cordis.patch.yml"');
  add(pkg.dsh?.client?.platform === 'web', 'dsh.client.platform must be "web"');
  add(pkg.dsh?.client?.immediately === true, 'dsh.client.immediately must be true');
  add(
    Array.isArray(pkg.dsh?.client?.inject) && pkg.dsh.client.inject.length > 0,
    'dsh.client.inject must list at least one package',
  );

  add(pkg.scripts?.check === 'node scripts/check.mjs', 'scripts.check must run "node scripts/check.mjs"');
  add(typeof pkg.scripts?.test === 'string' && pkg.scripts.test.trim() !== '', 'scripts.test must be defined');
});

// ---------------------------------------------------------------------------
// Files referenced by the manifest
// ---------------------------------------------------------------------------

group('manifest file references', add => {
  const parsed = readJson('package.json');
  if (parsed.error) {
    add(false, `cannot read package.json: ${parsed.error}`);
    return;
  }
  const pkg = parsed.value;

  if (pkg.exports && typeof pkg.exports === 'object') {
    for (const [key, target] of Object.entries(pkg.exports)) {
      if (typeof target !== 'string' || target.includes('*')) continue;
      add(isFile(join(root, target)), `exports["${key}"] points to missing file "${target}"`);
    }
  }

  if (Array.isArray(pkg.files)) {
    for (const entry of pkg.files) {
      if (typeof entry !== 'string' || entry.includes('*')) continue;
      const target = join(root, entry);
      const ok = entry.endsWith('/') ? isDirectory(target) : isFile(target);
      add(ok, `files entry "${entry}" does not exist`);
    }
  }
});

// ---------------------------------------------------------------------------
// cordis.patch.yml
// ---------------------------------------------------------------------------

group('bundle patch (cordis.patch.yml)', add => {
  const yaml = readText('cordis.patch.yml');
  if (yaml === null) {
    add(false, 'cordis.patch.yml is missing');
    return;
  }
  const text = yaml.replace(/\r\n?/g, '\n');
  add(/^\s*-\s*insert:\s*$/m.test(text), 'patch must contain an "insert" list');
  add(
    /^\s*(?:-\s*)?id:\s*['"]?dsh-nezha['"]?\s*(?:#.*)?$/m.test(text),
    'patch must insert a row with id "dsh-nezha"',
  );
  add(
    /^\s*(?:-\s*)?name:\s*['"]?dsh-nezha['"]?\s*(?:#.*)?$/m.test(text),
    'patch must insert a row with name "dsh-nezha"',
  );
});

// ---------------------------------------------------------------------------
// Locales
// ---------------------------------------------------------------------------

group('locales (locale/en.json, locale/zh.json)', add => {
  for (const language of ['en', 'zh']) {
    const parsed = readJson(`locale/${language}.json`);
    if (parsed.error) {
      add(false, `locale/${language}.json: ${parsed.error}`);
      continue;
    }
    const meta = parsed.value?.meta;
    add(
      typeof meta?.title === 'string' && meta.title.trim() !== '',
      `locale/${language}.json meta.title must be a non-empty string`,
    );
    add(
      typeof meta?.description === 'string' && meta.description.trim() !== '',
      `locale/${language}.json meta.description must be a non-empty string`,
    );
  }
});

// ---------------------------------------------------------------------------
// Runtime identity (client bundle and Typert host face)
// ---------------------------------------------------------------------------

group('runtime identity', add => {
  const client = readText('client.js');
  add(client !== null, 'client.js is missing');
  if (client !== null) {
    add(/id:\s*'dsh-nezha'/.test(client), "client.js must register the module id 'dsh-nezha'");
    add(/key:\s*'dsh-nezha'/.test(client), "client.js must register the plugins.bundle.config key 'dsh-nezha'");
    add(client.includes('plugins.bundle.config'), 'client.js must register a plugins.bundle.config page');
    add(/package:\s*'dsh-nezha'/.test(client), "client.js must mount the Remote contribution for 'dsh-nezha'");
    add(client.includes('nezhaSettings'), 'client.js must call the nezhaSettings Remote namespace');
  }

  const typert = readText('src/typert.host.js');
  add(typert !== null, 'src/typert.host.js is missing');
  if (typert !== null) {
    add(/package:\s*'dsh-nezha'/.test(typert), "src/typert.host.js TYPERT.package must be 'dsh-nezha'");
    add(/face:\s*'host'/.test(typert), "src/typert.host.js TYPERT.face must be 'host'");
    add(/invocations:\s*SETTINGS_DESCRIPTORS/.test(typert), 'src/typert.host.js must publish SETTINGS_DESCRIPTORS');
  }
});

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

group('icon (icon.svg)', add => {
  const path = join(root, 'icon.svg');
  if (!isFile(path)) {
    add(false, 'icon.svg is missing or is not a regular file');
    return;
  }
  const stat = statSync(path);
  add(stat.size > 0, 'icon.svg must not be empty');
  add(stat.size < 256 * 1024, `icon.svg must be smaller than 256 KiB (got ${stat.size} bytes)`);

  let svg = '';
  try {
    svg = readFileSync(path, 'utf8').replace(/^\uFEFF/, '').trimStart();
  } catch {
    add(false, 'icon.svg is not readable UTF-8 text');
    return;
  }
  add(svg.startsWith('<svg'), 'icon.svg must start with "<svg"');
  add(svg.includes('</svg>'), 'icon.svg must close with "</svg>"');
});

// ---------------------------------------------------------------------------
// JavaScript syntax
// ---------------------------------------------------------------------------

const jsFiles = [];

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (SKIP_DIRECTORIES.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile() && /\.(?:js|mjs|cjs)$/.test(entry.name)) jsFiles.push(path);
  }
}

group('javascript syntax', add => {
  try {
    walk(root);
  } catch (error) {
    add(false, `cannot scan repository: ${error?.message ?? String(error)}`);
    return;
  }
  jsFiles.sort();
  if (jsFiles.length === 0) {
    add(false, 'no .js, .mjs, or .cjs files found to syntax-check');
    return;
  }
  for (const path of jsFiles) {
    const name = relative(root, path).split(sep).join('/');
    const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
    if (result.error) {
      add(false, `${name}: ${result.error.message}`);
      continue;
    }
    if (result.status !== 0) {
      const detail = `${result.stderr ?? ''}${result.stdout ?? ''}`
        .trim()
        .split('\n')
        .slice(0, 5)
        .join(' | ');
      add(false, `${name}: syntax check failed${detail ? `: ${detail}` : ''}`);
      continue;
    }
    add(true, `${name}: syntax ok`);
  }
}, () => `${jsFiles.length} files`);

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

let failed = 0;

for (const { name, results, summary } of groups) {
  const problems = results.filter(result => !result.ok);
  if (problems.length === 0) {
    const detail = typeof summary === 'function' ? summary() : summary;
    const label = detail ?? `${results.length} check${results.length === 1 ? '' : 's'}`;
    console.log(`PASS ${name} (${label})`);
    continue;
  }
  failed += problems.length;
  console.error(`FAIL ${name}`);
  for (const problem of problems) console.error(`  - ${problem.message}`);
}

if (!existsSync(join(root, 'test'))) {
  console.log('note test/ is absent; test files are optional for this check');
}

if (failed === 0) {
  console.log('\nAll checks passed.');
  process.exit(0);
}

console.error(`\n${failed} check${failed === 1 ? '' : 's'} failed.`);
process.exit(1);
