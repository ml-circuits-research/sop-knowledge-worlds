// tests/<world>.questions.jsonl: questions each world must answer through sopworld `query`, and statements whose
// soft issues it must report. Nothing may be refused.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, scanWorlds, fullWorld, schemaWorld, moduleInfo } from '../tools/lib/worlds.mjs';

const worlds = scanWorlds();
// SKW_WORLDS=<world>,<world> asks only the questions of these worlds (tools/test-run.mjs --changed sets it when only
// they changed); unset, every world's.
const only = process.env.SKW_WORLDS ? new Set(process.env.SKW_WORLDS.split(',')) : null;
const files = readdirSync(join(REPO, 'tests')).filter((f) => f.endsWith('.questions.jsonl') && (!only || only.has(f.replace(/\.questions\.jsonl$/, '')))).sort();

// A world whose own shards are large (k.objects: 36 MB, 271,000 points, 44-50 s to load in full; k.words 9.8 MB) is loaded with the
// worlds it imports in full and, of its own shards, only the facts of the types its questions ask or tell and its
// words (KR5 / reviewer 16:45: this file under 30 s). Every other world is loaded in full.
const LARGE = 5e6;
function worldFor(id, questions) {
  const entry = worlds.find((w) => w.id === id);
  if (entry.shards.reduce((a, s) => a + s.bytes, 0) < LARGE) return fullWorld(id, worlds);
  const types = new Set(['core.word']);
  for (const q of questions) {
    if (q.query) types.add(q.query.type);
    for (const m of (q.tell ?? '').matchAll(/^@\S+ (\S+)/gm)) types.add(m[1]);
  }
  const { world, result } = schemaWorld(worlds, id);
  if (!result.ok) throw new Error(`${id}: ${JSON.stringify(result.violations)}`);
  const seen = new Set([id]);
  const deps = (wid) => {
    for (const dep of moduleInfo(worlds.find((w) => w.id === wid).schemaText)?.imports ?? []) {
      if (seen.has(dep)) continue;
      seen.add(dep);
      deps(dep);
      for (const s of worlds.find((w) => w.id === dep).shards) { const r = world.tell(s.text); if (!r.ok) throw new Error(`${s.id}: ${JSON.stringify(r.violations)}`); }
    }
  };
  deps(id);
  for (const s of entry.shards) { // shard by shard, as fullWorld tells them (an id may be told in two shards)
    const own = s.text.split('\n').filter((l) => { const m = /^@\S+ (\S+)/.exec(l); return m && types.has(m[1]); });
    const r = world.tell(own.join('\n'));
    if (!r.ok) throw new Error(`${s.id}: ${JSON.stringify(r.violations).slice(0, 500)}`);
  }
  return world;
}

for (const file of files) {
  const id = file.replace(/\.questions\.jsonl$/, '');
  const lines = readFileSync(join(REPO, 'tests', file), 'utf8').split('\n').filter((l) => l.trim());
  test(`${id}: ${lines.length} questions`, async (t) => {
    const base = worldFor(id, lines.map((l) => JSON.parse(l)));
    for (const line of lines) {
      const q = JSON.parse(line);
      await t.test(`${q.id} ${q.ask}`, () => {
        const w = base.fork();
        if (q.query) {
          const a = w.query(q.query);
          const got = { status: a.status };
          if ('value' in q.expect) got.value = a.value;
          if ('values' in q.expect) got.values = a.values;
          assert.deepEqual(got, q.expect, JSON.stringify(a));
        } else {
          const r = w.tell(q.tell, q.ns ? { ns: q.ns } : {});
          assert.equal(r.ok, true, `refused: ${JSON.stringify(r.violations)}`);
          assert.deepEqual((r.issues ?? []).map((i) => i.why).sort(), [...q.expect.issues].sort());
        }
      });
    }
  });
}
