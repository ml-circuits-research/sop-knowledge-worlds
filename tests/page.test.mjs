// The JavaScript example of docs/index.html runs against the files of docs/worlds (fetch served from disk).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { REPO, WORLDS_DIR } from '../tools/lib/worlds.mjs';

const html = readFileSync(join(REPO, 'docs/index.html'), 'utf8');
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

test('the page has the example, and pages files exist', () => {
  assert.ok(existsSync(join(REPO, 'docs/.nojekyll')));
  assert.match(html, /<pre id="example">/);
});

test('the example of the page runs and gives the answers it shows', { skip: !existsSync(join(WORLDS_DIR, 'k.commonsense')) }, async () => {
  const code = unescape(/<pre id="example">([\s\S]*?)<\/pre>/.exec(html)[1])
    .replace("'./sopworld.mjs'", JSON.stringify(pathToFileURL(join(REPO, 'tools/sopworld/sopworld.mjs')).href));
  const base = /const base = '([^']+)'/.exec(code)[1];
  const logs = [];
  const saved = { fetch: globalThis.fetch, log: console.log };
  globalThis.fetch = async (url) => {
    assert.ok(url.startsWith(base), url);
    const p = join(WORLDS_DIR, url.slice(base.length));
    return existsSync(p)
      ? { ok: true, status: 200, text: async () => readFileSync(p, 'utf8'), json: async () => JSON.parse(readFileSync(p, 'utf8')) }
      : { ok: false, status: 404 };
  };
  console.log = (...a) => logs.push(a);
  const dir = mkdtempSync(join(tmpdir(), 'skw-page-'));
  try {
    writeFileSync(join(dir, 'example.mjs'), code);
    await import(pathToFileURL(join(dir, 'example.mjs')).href);
  } finally {
    globalThis.fetch = saved.fetch;
    console.log = saved.log;
    rmSync(dir, { recursive: true });
  }
  assert.deepEqual(logs[0], ['supported', 'water']);
  assert.equal(logs[1][0], true);
  assert.ok(logs[1][1].includes('A fish usually lives in water, not in the sky.'), JSON.stringify(logs[1]));
});
