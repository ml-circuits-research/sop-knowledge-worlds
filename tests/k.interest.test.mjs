// k.interest (blocks "14:45" item 1, "15:00"): the facts load and are what the tool gives; every feature names an
// appraisal, a measure and its sources (or is marked own), its numbers are sane, every source is cited in WORLD.md,
// and every type a measure reads exists in the catalog. Integration case for the library's interest scoring: facts
// of the catalog measured here by hand (the library computes the measures) and scored by the reference arithmetic
// come out in the order a composer must find (a surprising exception > a far number > the obvious; a repeat never).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { interestShards, share, score } from '../tools/interest-core.mjs';

const worlds = scanWorlds();
const world = fullWorld('k.interest', worlds);
const tok = (t) => (typeof t === 'string' && t.startsWith('"') ? JSON.parse(t) : t);
const num = (t) => (t === undefined ? undefined : Number(t));
const rows = (type) => world.ofType(type).map((w) => Object.fromEntries(Object.entries(w.attrs).map(([k, v]) => [k, v.length > 1 || ['source', 'reads'].includes(k) ? v.map(tok) : tok(v[0])])));
const appraisals = rows('k.interest.appraisal').map((a) => ({ ...a, base: Number(a.base) }));
const features = rows('k.interest.feature').map((f) => ({ ...f, start_at: num(f.start_at), peak_at: num(f.peak_at), full_at: num(f.full_at), weight_min: Number(f.weight_min), weight_max: Number(f.weight_max) }));
const measures = rows('k.interest.measure');
const sources = rows('k.interest.source');

test('k.interest: the shards are what tools/interest-core.mjs gives; the counts', () => {
  for (const [name, t] of Object.entries(interestShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.interest', 'shards', name), 'utf8'), t, name);
  assert.deepEqual(appraisals.map((a) => a.name).sort(), ['coping', 'novelty', 'penalty', 'relevance']);
  assert.ok(features.length >= 20 && measures.length >= 20 && sources.length >= 20, `${features.length} features, ${measures.length} measures, ${sources.length} sources`);
});

test('k.interest: every feature names an appraisal, a measure, a sane shape and weight range, sources or its own choice', () => {
  const names = new Set(sources.map((s) => s.name));
  for (const f of features) {
    assert.ok(appraisals.some((a) => a.name === f.appraisal), `${f.name}: appraisal`);
    assert.ok(measures.some((m) => m.name === f.measure), `${f.name}: measure`);
    assert.ok(f.weight_min <= f.weight_max, `${f.name}: weights`);
    assert.ok(f.source?.length || f.own, `${f.name}: a source or own`);
    for (const s of f.source ?? []) assert.ok(names.has(s), `${f.name}: source ${s}`);
    assert.ok(f.own.length > 0, `${f.name}: the numbers are marked as own choice`);
    if (f.shape === 'peak') assert.ok(f.start_at < f.peak_at && f.peak_at < f.full_at, f.name);
    if (f.shape === 'rising' || f.shape === 'falling') assert.ok(f.start_at < f.full_at, f.name);
    // A penalty is subtracted, so its weights are positive; a lowering feature of another appraisal is negative.
    if (f.appraisal === 'penalty') assert.ok(f.weight_min > 0, f.name);
  }
  for (const a of appraisals) for (const s of a.source) assert.ok(names.has(s), `${a.name}: ${s}`);
  // Raises and lowers: at least one feature lowers coping and relevance, and the penalties cover the four dull things asked.
  assert.ok(features.some((f) => f.appraisal === 'coping' && f.weight_max < 0) && features.some((f) => f.appraisal === 'relevance' && f.weight_max < 0));
  for (const n of ['repeated_fact', 'repeated_pattern', 'obvious', 'list_without_point']) assert.ok(features.some((f) => f.name === n && f.appraisal === 'penalty'), n);
  // The features the owner named: distance between worlds, rarity, a far number, a contrast with common sense, a question.
  for (const n of ['distant_link', 'rare_kind', 'far_number', 'rule_exception', 'sibling_contrast', 'opens_question']) assert.ok(features.some((f) => f.name === n && f.appraisal === 'novelty'), n);
  // Every measure is used, every source is used.
  for (const m of measures) assert.ok(features.some((f) => f.measure === m.name), `measure ${m.name} unused`);
  for (const s of sources) assert.ok(features.some((f) => f.source?.includes(s.name)) || appraisals.some((a) => a.source.includes(s.name)), `source ${s.name} unused`);
});

test('k.interest: every source is cited in WORLD.md; every type a measure reads exists in the catalog', () => {
  const md = readFileSync(join(WORLDS_DIR, 'k.interest', 'WORLD.md'), 'utf8');
  for (const s of sources) {
    const author = s.cite.split(',')[0];
    assert.ok(md.includes(author) && md.includes(String(s.year)), `${s.name}: ${author} ${s.year} in WORLD.md`);
    if (s.doi) assert.match(s.doi, /^10\.\d{4,5}\//, s.name);
  }
  const declared = new Set(worlds.flatMap((w) => [...w.schemaText.matchAll(/core\.type of=(\S+)/g)].map((m) => m[1])));
  for (const m of measures) for (const r of m.reads ?? []) assert.ok(declared.has(r), `${m.name} reads ${r}`);
});

test('k.interest: the shapes give shares from 0 to 1 as documented', () => {
  const f = (shape, at) => ({ shape, ...at });
  assert.deepEqual([0, 1, 2, 3, 4].map((x) => share(f('rising', { start_at: 1, full_at: 3 }), x)), [0, 0, 0.5, 1, 1]);
  assert.deepEqual([0, 1, 2, 3].map((x) => share(f('falling', { start_at: 0, full_at: 2 }), x)), [1, 0.5, 0, 0]);
  assert.deepEqual([0, 0.25, 0.5, 0.75, 1].map((x) => share(f('peak', { start_at: 0, peak_at: 0.5, full_at: 1 }), x)), [0, 0.5, 1, 0.5, 0]);
  assert.deepEqual([0, 1].map((x) => share(f('step', { full_at: 1 }), x)), [0, 1]);
});

// The measures of three facts of the catalog, computed here from the facts (the library will compute them).
const animals = fullWorld('k.animals', worlds).ofType('k.animals.animal').map((w) => ({ name: tok(w.attrs.name[0]), cls: w.attrs.class?.[0], can: w.attrs.can ?? [], cannot: w.attrs.cannot ?? [], drawing: w.attrs.drawing?.[0] }));
const numbers = fullWorld('k.attributes', worlds).ofType('k.attributes.number').map((w) => ({ name: tok(w.attrs.name[0]), weight: num(w.attrs.weight_about?.[0]) }));
const animal = (n) => animals.find((a) => a.name === n);
// sibling_contrast: of the siblings (same class) that say the verb either way, the share with the other value.
const siblingContrast = (thing, verb, value) => {
  const said = animals.filter((a) => a.cls === animal(thing).cls && a.name !== thing && (a.can.includes(verb) || a.cannot.includes(verb)));
  if (said.length < 5) return 0;
  return said.filter((a) => (value === 'cannot' ? a.can : a.cannot).includes(verb)).length / said.length;
};
// range_distance: the typical range is the interquartile range of the key among things of the kind.
const quartiles = (xs) => { const s = [...xs].sort((a, b) => a - b); const q = (p) => s[Math.floor(p * (s.length - 1))]; return [q(0.25), q(0.75)]; };
const rangeDistance = (x, [lo, hi]) => (x > hi ? (x - hi) / (hi - lo) : x < lo ? (lo - x) / (hi - lo) : 0);

test('k.interest, integration case: a surprising exception > a far number > the obvious; the said is never chosen; each score explained', () => {
  const penguin = animal('penguin');
  assert.ok(penguin.cannot.includes('fly') && penguin.cls === 'bird');
  const contrast = siblingContrast('penguin', 'fly', 'cannot');
  assert.ok(contrast > 0.5, `birds that say it: ${contrast.toFixed(2)} can fly`);
  const animalNames = new Set(animals.map((a) => a.name));
  const weights = numbers.filter((n) => animalNames.has(n.name) && n.weight).map((n) => n.weight);
  const range = quartiles(weights);
  const elephant = numbers.find((n) => n.name === 'elephant').weight;
  const far = rangeDistance(elephant, range);
  assert.ok(far > 1, `elephant ${elephant} kg against ${range}`);
  const common = { concreteness: 1, animacy: 1, topic_distance: 0 };
  const facts = {
    'a penguin cannot fly': { ...common, sibling_contrast: contrast, obviousness: 0 },
    'an elephant weighs about 5,000 kg': { ...common, range_distance: far, number_with_unit: 1, obviousness: 0 },
    'a dog is a mammal': { ...common, obviousness: 1 },
  };
  const scored = Object.fromEntries(Object.entries(facts).map(([k, m]) => [k, score(appraisals, features, m)]));
  const s = (k) => scored[k].score;
  console.log(Object.entries(scored).map(([k, r]) => `${k}: ${r.score.toFixed(3)} (${r.parts.map(([n, c]) => `${n} ${c.toFixed(2)}`).join(', ')})`).join('\n'));
  assert.ok(s('a penguin cannot fly') > s('an elephant weighs about 5,000 kg'));
  assert.ok(s('an elephant weighs about 5,000 kg') > s('a dog is a mammal'));
  assert.ok(s('a dog is a mammal') <= 0, 'the obvious scores nothing');
  // Said once already: the penalty of a repeat outweighs any product (which is at most 1).
  assert.ok(score(appraisals, features, { ...facts['a penguin cannot fly'], said_before: 1 }).score <= 0);
  // Off the topic (3 joins away): the same exception counts for much less (a seductive detail).
  assert.ok(score(appraisals, features, { ...facts['a penguin cannot fly'], topic_distance: 3 }).score < s('a penguin cannot fly') / 3);
  // Every contribution is named by its feature (the explanation a composer gives).
  assert.deepEqual(scored['a penguin cannot fly'].parts.map(([n]) => n).sort(), ['animate', 'concrete_thing', 'on_topic', 'sibling_contrast']);
  // Within the ranges: the order holds at both ends of every weight range.
  for (const pick of [(f) => f.weight_min, (f) => f.weight_max]) {
    const r = Object.fromEntries(Object.entries(facts).map(([k, m]) => [k, score(appraisals, features, m, pick).score]));
    assert.ok(r['a penguin cannot fly'] > r['a dog is a mammal'] && r['an elephant weighs about 5,000 kg'] > r['a dog is a mammal']);
  }
});
