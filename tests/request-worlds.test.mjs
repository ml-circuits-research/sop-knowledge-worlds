// w.request, w.dialogue and k.expect (owner's GO, reviewer block 2026-11-15 14:00): a request and its constraints are
// made with the acts; every reaction has a revision; the scale grows from tiny to huge; the cues of w.lang.en name
// only keys, amounts and reactions that exist.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { actsWorld } from '../tools/lib/schemas.mjs';
import { parse } from '../tools/sopworld/sopworld.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const read = (...p) => parse(readFileSync(join(WORLDS_DIR, ...p), 'utf8'));
const enumOf = (wires, slot) => (wires.find((w) => w.id === slot).attrs.enum ?? []).map(tok);

test('a request with constraints and an unread word; a dialogue records its result and replaces it', () => {
  const w = actsWorld(['w.request', 'w.dialogue']), act = (action, args) => w.act({ action, args });
  assert.equal(act('make', { kind: 'w.request.request', act: 'make', target: 'diagram', n: 1, text: 'a diagram with 5-10 nodes, not all circles, blorp' }).result.thing, 'w_request_request1');
  assert.equal(act('make', { kind: 'w.request.constraint', request: '$w_request_request1', on: 'count', min: 5, max: 10, of: 'node' }).ok, true);
  assert.equal(act('make', { kind: 'w.request.constraint', request: '$w_request_request1', on: 'kind', value: 'circle', want: 'not_all' }).ok, true);
  assert.equal(act('make', { kind: 'w.request.constraint', request: '$w_request_request1', on: 'kind', value: 'circle', want: 'maybe' }).ok, false);
  assert.equal(act('make', { kind: 'w.request.unread', request: '$w_request_request1', text: 'blorp', n: 9 }).ok, true);
  assert.equal(act('make', { kind: 'w.dialogue.result', request: '$w_request_request1', thing: ['n1', 'n2'] }).result.thing, 'w_dialogue_result1');
  assert.equal(act('make', { kind: 'w.request.request', act: 'make', target: 'diagram', n: 2, revises: '$w_request_request1' }).ok, true);
  assert.equal(act('make', { kind: 'w.dialogue.result', request: '$w_request_request2', replaces: '$w_dialogue_result1' }).ok, true);
  assert.equal(act('change', { thing: '$w_dialogue_result1', attr: 'status', value: 'replaced' }).ok, true);
});

test('every reaction has a revision; the cues of reactions name only these reactions', () => {
  const schema = read('w.dialogue', 'schema.sop');
  const reactions = enumOf(schema, 'w.dialogue.turn.reaction');
  const revised = new Set(schema.filter((w) => w.type === 'w.dialogue.revision').map((w) => one(w, 'reaction')));
  assert.deepEqual([...revised].sort(), [...reactions].sort());
  const cues = read('w.lang.en', 'shards', 'hand-cues.sop').filter((w) => w.type === 'w.lang.en.cue');
  const cued = new Set(cues.filter((c) => one(c, 'on') === 'reaction').map((c) => one(c, 'value')));
  for (const r of reactions) assert.ok(cued.has(r), `no cue for the reaction ${r}`);
  for (const r of cued) assert.ok(reactions.includes(r), `cue of an unknown reaction ${r}`);
});

test('the cues set every key of a constraint; their amounts and scale steps are k.expect facts', () => {
  const ons = enumOf(read('w.request', 'schema.sop'), 'w.request.constraint.on');
  const cues = read('w.lang.en', 'shards', 'hand-cues.sop').filter((w) => w.type === 'w.lang.en.cue');
  for (const on of ons) assert.ok(cues.some((c) => one(c, 'on') === on), `no cue sets ${on}`);
  const hand = read('k.expect', 'shards', 'hand.sop');
  const amounts = new Set(hand.filter((w) => w.type === 'k.expect.amount').map((w) => one(w, 'name')));
  const steps = new Set(hand.filter((w) => w.type === 'k.expect.scale').map((w) => one(w, 'step')));
  for (const c of cues) {
    if (one(c, 'amount')) assert.ok(amounts.has(one(c, 'amount')), c.id);
    if (['size', 'extent'].includes(one(c, 'on')) && one(c, 'value')) assert.ok(steps.has(one(c, 'value')), c.id);
    assert.ok((c.attrs.lead ?? []).length || (c.attrs.trail ?? []).length || (c.attrs.between ?? []).length, `${c.id}: no words`);
  }
});

test('k.expect: the scale grows from tiny to huge; every make has parts and typical within min and max', () => {
  const facts = ['hand.sop', 'scenes.sop', 'diagrams.sop'].flatMap((f) => read('k.expect', 'shards', f));
  const scale = facts.filter((w) => w.type === 'k.expect.scale').sort((a, b) => one(a, 'order') - one(b, 'order'));
  assert.deepEqual(scale.map((w) => one(w, 'step')), ['tiny', 'small', 'default', 'big', 'huge']);
  for (const k of ['count_factor', 'size_factor', 'extent']) for (let i = 1; i < scale.length; i++) assert.ok(Number(one(scale[i], k)) > Number(one(scale[i - 1], k)), k);
  const makes = facts.filter((w) => w.type === 'k.expect.make'), parts = facts.filter((w) => w.type === 'k.expect.part');
  for (const m of makes) {
    const [min, max, typ] = ['min', 'max', 'typical'].map((k) => Number(one(m, k)));
    assert.ok(min <= typ && typ <= max, `${m.id}: ${min} ${typ} ${max}`);
    assert.ok(parts.some((p) => one(p, 'of') === one(m, 'thing')), `${m.id}: no part`);
  }
  for (const p of parts) { const [min, max, typ] = ['min', 'max', 'typical'].map((k) => Number(one(p, k))); assert.ok(min <= typ && typ <= max, p.id); }
  // The owner's expectations: a diagram 5-9 nodes of 2-3 shapes; a pond has water and at least water, plant, animal.
  const diagram = makes.find((m) => one(m, 'thing') === 'diagram');
  assert.deepEqual(['min', 'max', 'kinds_min', 'kinds_max'].map((k) => Number(one(diagram, k))), [5, 9, 2, 3]);
  const pond = parts.filter((p) => one(p, 'of') === 'pond');
  assert.ok(pond.some((p) => one(p, 'part') === 'water' && one(p, 'needed') === 'yes'));
  assert.deepEqual([...new Set(pond.map((p) => one(p, 'group')))].sort(), ['animal', 'ground', 'plant', 'water']);
});
