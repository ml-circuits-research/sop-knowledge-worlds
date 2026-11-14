// tests/<world>.questions.jsonl: questions each world must answer through sopworld `query`, and statements whose
// soft issues it must report. Nothing may be refused.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';

const worlds = scanWorlds();
// SKW_WORLDS=<world>,<world> asks only the questions of these worlds (tools/test-run.mjs --changed sets it when only
// they changed); unset, every world's.
const only = process.env.SKW_WORLDS ? new Set(process.env.SKW_WORLDS.split(',')) : null;
const files = readdirSync(join(REPO, 'tests')).filter((f) => f.endsWith('.questions.jsonl') && (!only || only.has(f.replace(/\.questions\.jsonl$/, '')))).sort();

for (const file of files) {
  const id = file.replace(/\.questions\.jsonl$/, '');
  const lines = readFileSync(join(REPO, 'tests', file), 'utf8').split('\n').filter((l) => l.trim());
  test(`${id}: ${lines.length} questions`, async (t) => {
    const base = fullWorld(id, worlds);
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
