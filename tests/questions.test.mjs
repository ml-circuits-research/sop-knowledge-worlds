// tests/<world>.questions.jsonl: questions each world must answer through sopworld `query`, and statements whose
// soft issues it must report. Nothing may be refused.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, scanWorlds, schemaWorld, moduleInfo } from '../tools/lib/worlds.mjs';

const worlds = scanWorlds();
const files = readdirSync(join(REPO, 'tests')).filter((f) => f.endsWith('.questions.jsonl')).sort();

// A world with the schema of `id` and every shard of it and of the worlds it depends on.
export function fullWorld(id) {
  const { world, result } = schemaWorld(worlds, id);
  assert.ok(result.ok, JSON.stringify(result.violations));
  const seen = new Set();
  const add = (wid) => {
    if (seen.has(wid)) return;
    seen.add(wid);
    const entry = worlds.find((w) => w.id === wid);
    for (const dep of moduleInfo(entry.schemaText).imports) add(dep);
    for (const s of entry.shards) {
      const r = world.tell(s.text);
      assert.ok(r.ok, `${s.id}: ${JSON.stringify(r.violations)}`);
    }
  };
  add(id);
  return world;
}

for (const file of files) {
  const id = file.replace(/\.questions\.jsonl$/, '');
  const lines = readFileSync(join(REPO, 'tests', file), 'utf8').split('\n').filter((l) => l.trim());
  test(`${id}: ${lines.length} questions`, async (t) => {
    const base = fullWorld(id);
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
