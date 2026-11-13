// Scans docs/worlds, validates every world, and writes docs/worlds/index.json (the catalog, PLAN.md §2) and
// docs/worlds/vocab.json (English lemma -> shard ids). Deterministic: sorted, no dates; a rerun gives no diff.
//   node tools/build-catalog.mjs [worlds-dir]      write the files
//   node tools/build-catalog.mjs --check           exit 1 when the files on disk are not what a build gives
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { parse, str } from './sopworld/sopworld.mjs';
import { validateWorlds } from './validate.mjs';
import { readHeader, moduleInfo, schemaWorld, WORLDS_DIR, REPO } from './lib/worlds.mjs';

const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const uniqSorted = (xs) => [...new Set(xs)].sort(byText);
const SOPWORLD = /commit: (\w{7})/.exec(readFileSync(join(REPO, 'tools/sopworld/VERSION'), 'utf8'))[1];
const GENERATED = new Set(['index.json', 'vocab.json']);

// A value token as plain text: strings unquoted; references and variables are not words.
const text = (token) => (token.startsWith('"') ? str(token) : /^[$?]/.test(token) ? null : token);
const isWordy = (t) => t && /\p{L}/u.test(t);
const lemma = (t) => t.toLowerCase();
const sourceId = (s) => text(s).trim().split(/\s+/).join('-');

// The catalog version: a content hash of every published world file (not of the generated files).
function contentVersion(root) {
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort(byText)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (!(dir === root && GENERATED.has(name))) files.push(p);
    }
  };
  walk(root);
  const h = createHash('sha256');
  for (const f of files) h.update(relative(root, f).split('\\').join('/')).update('\0').update(readFileSync(f)).update('\0');
  return h.digest('hex').slice(0, 12);
}

export function buildCatalog(root = WORLDS_DIR) {
  const v = validateWorlds(root);
  if (!v.ok) return { errors: v.errors };
  const { worlds, results } = v;
  const vocab = new Map();
  const addWord = (word, shardId) => {
    if (!isWordy(word)) return;
    const k = lemma(word);
    if (!vocab.has(k)) vocab.set(k, new Set());
    vocab.get(k).add(shardId);
  };
  const entries = [];
  for (const world of worlds) {
    const info = moduleInfo(world.schemaText) ?? { name: world.id, imports: [], exports: [] };
    const { world: sw } = schemaWorld(worlds, world.id);
    const idKeys = new Map();
    const identityKeys = (type) => {
      if (!idKeys.has(type)) {
        const s = sw.schema(type);
        idKeys.set(type, s ? Object.entries(s.keys).filter(([, k]) => k.id).map(([name]) => name) : []);
      }
      return idKeys.get(type);
    };
    const shardWires = new Map();
    const shards = world.shards.map((shard) => {
      const wires = parse(shard.text);
      shardWires.set(shard.id, wires);
      const header = readHeader(shard.text);
      const keys = [];
      for (const w of wires) {
        if (w.type === 'core.word') {
          for (const t of w.attrs.text ?? []) addWord(text(t), shard.id);
          continue;
        }
        for (const k of identityKeys(w.type)) for (const t of w.attrs[k] ?? []) {
          const x = text(t);
          if (isWordy(x)) { keys.push(lemma(x)); addWord(x, shard.id); }
        }
      }
      const license = header.license?.[0] ?? null;
      const r = results.find((x) => x.shard === shard.id);
      const entry = {
        id: shard.id, path: shard.path, wires: wires.length, bytes: shard.bytes, keys: uniqSorted(keys),
        sources: uniqSorted(wires.flatMap((w) => (w.attrs['core.source'] ?? []).map(sourceId))),
        license,
      };
      if (license && /NC/.test(license)) entry.nc = true;
      entry.warnings = r.warnings;
      return entry;
    });
    // Words of the schema: a value word goes to the shards holding that value under that key;
    // a word for a type or a key of the world goes to every shard of the world.
    for (const w of parse(world.schemaText)) {
      if (w.type !== 'core.word') continue;
      const means = text(w.attrs.means?.[0] ?? '');
      const of = w.attrs.of?.[0];
      const targets = of
        ? world.shards.filter((s) => shardWires.get(s.id).some((x) => (x.attrs[of.slice(of.lastIndexOf('.') + 1)] ?? []).some((t) => text(t) === means))).map((s) => s.id)
        : world.shards.map((s) => s.id);
      for (const t of w.attrs.text ?? []) for (const id of targets) addWord(text(t), id);
    }
    const schemaHeader = readHeader(world.schemaText);
    entries.push({
      id: world.id,
      version: schemaHeader.version?.[0] ?? null,
      schema: world.schemaPath,
      exports: uniqSorted(info.exports),
      depends: uniqSorted(info.imports),
      shards,
      sources: uniqSorted(shards.flatMap((s) => s.sources)),
      licenses: uniqSorted(shards.map((s) => s.license).filter(Boolean)),
      warnings: results.find((x) => x.world === world.id && x.shard === null)?.warnings ?? [],
    });
  }
  const index = { version: contentVersion(root), sopworld: SOPWORLD, worlds: entries };
  const vocabObj = Object.fromEntries([...vocab.keys()].sort(byText).map((k) => [k, [...vocab.get(k)].sort(byText)]));
  return { errors: [], index, vocab: vocabObj };
}

export const serialize = (obj) => `${JSON.stringify(obj, null, 1)}\n`;

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes('--check');
  const root = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? WORLDS_DIR;
  const { errors, index, vocab } = buildCatalog(root);
  if (errors.length) {
    for (const e of errors) console.error(`error: ${e}`);
    process.exit(1);
  }
  const files = { 'index.json': serialize(index), 'vocab.json': serialize(vocab) };
  let stale = false;
  for (const [name, content] of Object.entries(files)) {
    const p = join(root, name);
    let old = null;
    try { old = readFileSync(p, 'utf8'); } catch {}
    if (old === content) continue;
    if (check) { console.error(`stale: ${name}`); stale = true; } else writeFileSync(p, content);
  }
  const shards = index.worlds.reduce((n, w) => n + w.shards.length, 0);
  console.log(`${index.worlds.length} worlds, ${shards} shards, ${Object.keys(vocab).length} words, version ${index.version}`);
  process.exit(stale ? 1 : 0);
}
