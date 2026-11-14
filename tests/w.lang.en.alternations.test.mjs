// w.lang.en alternations (reviewer 21:55; the library's Q54 item 2): variants of a sentence brought back to the
// canonical form a frame is written in, by rules that are facts of the language world. Checks: the shard is what the
// tool writes and loads in the schema; families form a layered graph; every test sentence comes back to its canonical
// form with the rules named, read by the pinned build's `normalise` (src/alternate.mjs of the library; the test's
// copy of it was deleted when the pin reached 0.90, reviewer 00:40).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, schemaWorld } from '../tools/lib/worlds.mjs';
import { alternationShard, CASES } from '../tools/lang-en-alternations.mjs';
import { normalise as libNormalise, alternationsOf } from '../tools/sopworld/sopworld.mjs';

const path = join(WORLDS_DIR, 'w.lang.en', 'shards', 'alternations.sop');
const base = schemaWorld(scanWorlds(), 'w.lang.en');
const world = base.world.fork();
const told = world.tell(readFileSync(path, 'utf8'));
const bare = (v) => String(v).replace(/^"|"$/g, '').replace(/\\"/g, '"');

// The library's reading, one reader (reviewer 12:05): the pinned build's alternationsOf / normalise.
const R = alternationsOf(world);
const normalise = (rules, text) => libNormalise(world, text, { rules });

test('the shard is what tools/lang-en-alternations.mjs writes, and loads in the schema of w.lang.en with no error or warning', () => {
  assert.equal(readFileSync(path, 'utf8'), alternationShard());
  assert.ok(told.ok, JSON.stringify(told.violations?.slice(0, 3)));
  assert.equal(world.warnings.length, base.world.warnings.length);
});

test('every alternation has a family; families form a layered graph up to "alternation"; no `a|b` inside a value', () => {
  const fams = new Map(world.ofType('w.lang.en.alternation_family').map((f) => [bare(f.attrs.name[0]), f.attrs.parent ? bare(f.attrs.parent[0]) : null]));
  for (const f of world.ofType('w.lang.en.alternation')) {
    let fam = bare(f.attrs.family[0]), steps = 0;
    assert.ok(fams.has(fam), fam);
    while (fams.get(fam)) { fam = fams.get(fam); steps += 1; }
    assert.ok(fam === 'alternation' && steps <= 3, bare(f.attrs.name[0]));
    for (const k of ['from', 'to']) assert.doesNotMatch(bare(f.attrs[k][0]), /[|[\]]/);
  }
  const used = new Set(world.ofType('w.lang.en.alternation').map((f) => bare(f.attrs.family[0])));
  for (const f of ['polite word', 'ability question', 'desire', 'question vs command', 'embedded question', 'wh in situ', 'passive', 'dative shift', 'ellipsis']) assert.ok(used.has(f), f);
  // The library applies the rules in the order the world holds them: that order is `n`.
  const ns = world.ofType('w.lang.en.alternation').map((x) => Number(x.attrs.n[0]));
  assert.deepEqual(ns, ns.map((_, i) => i + 1), 'n is the order told');
  assert.equal(R.length, ns.length);
});

test('every test sentence comes back to its canonical form with the rules named, in order, by the library\'s reading', () => {
  const cases = world.ofType('w.lang.en.alternation_case');
  assert.equal(cases.length, CASES.length);
  for (const c of cases) {
    const textOf = bare(c.attrs.text[0]);
    const r = normalise(R, textOf);
    assert.equal(r.text, bare(c.attrs.canonical[0]), textOf);
    assert.deepEqual(r.applied, (c.attrs.applied ?? []).map(bare), `${textOf}: rules`);
    // The library keeps the first mode applied: a request wrapper before a question gives "request" (questions.md Q60).
    const mode = c.attrs.mode ? bare(c.attrs.mode[0]) : undefined;
    if (r.applied[0] === 'can_you' && mode === 'question') assert.equal(r.mode, 'request', textOf);
    else assert.equal(r.mode, mode, `${textOf}: mode`);
  }
});

test('the canonical forms are fixpoints, and a frame example of w.lang.en is left as it is', () => {
  for (const [, canon] of CASES) assert.deepEqual(normalise(R, canon).applied, [], canon);
  const examples = scanWorlds().find((w) => w.id === 'w.lang.en').shards.flatMap((s) => [...s.text.matchAll(/ w\.lang\.en\.frame .*? example="([^"]+)"/g)].map((m) => m[1]));
  const changed = examples.filter((e) => normalise(R, e).applied.length);
  // Frame examples that are themselves variants (a wrapper, a dative) are the frames the second worker marks.
  console.log(`frame examples: ${examples.length}; changed by an alternation: ${changed.length} (${changed.join(' | ')})`);
  assert.ok(examples.length > 200 && changed.length / examples.length < 0.2, `${changed.length} of ${examples.length}`);
});
