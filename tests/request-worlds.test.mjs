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
  // `continue` is read by structure (a fragment that names only a kind), not by a cue word: its revision row says what it does
  for (const r of reactions.filter((x) => x !== 'continue')) assert.ok(cued.has(r), `no cue for the reaction ${r}`);
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

test('chart source fields: three reader keys resolve to their domain slots, apart from titles, page coordinates, the primary dimension and concrete series', () => {
  const keys = read('w.request', 'shards', 'keys.sop').filter((w) => w.type === 'w.request.key');
  const key = (name) => keys.find((w) => one(w, 'name') === name);
  const wanted = { 'chart.xField': 'w.diagram.group.x_field', 'chart.yField': 'w.diagram.group.y_field', 'chart.seriesDimension': 'w.diagram.group.series_field' };
  for (const [name, id] of Object.entries(wanted)) {
    const k = key(name);
    assert.ok(k, `${name} is not a reader key`);
    assert.equal(one(k, 'head'), 'span', name);
    assert.equal(one(k, 'means'), id, name);
  }
  const schema = read('w.diagram', 'schema.sop');
  const slot = (id) => schema.find((w) => w.id === id);
  for (const id of Object.values(wanted)) {
    assert.equal(one(slot(id), 'of'), 'w.diagram.group', id);
    assert.deepEqual(slot(id).attrs.kind.map(tok), ['atom', 'string'], id);
  }
  // The existing owners stay distinct: the primary grouping, the axis titles, the page coordinates and the concrete series.
  assert.equal(one(key('chart.dimension'), 'means'), 'w.diagram.group.dimension');
  assert.equal(one(key('chart.xLabel'), 'means'), 'w.diagram.group.x_label');
  assert.equal(one(key('chart.yLabel'), 'means'), 'w.diagram.group.y_label');
  assert.equal(one(key('chart.x'), 'means'), 'w.diagram.group.x');
  assert.equal(one(key('chart.y'), 'means'), 'w.diagram.group.y');
  assert.equal(one(key('chart.series'), 'means'), undefined);
  assert.equal(one(key('chart.colourBy'), 'means'), undefined);
  // The deferred fourth property is not published.
  assert.equal(key('chart.intendedUse'), undefined);
  assert.equal(slot('w.diagram.group.intended_use'), undefined);
  // Domain-owned direct property labels, not the reader's constructions.
  const words = read('w.diagram', 'shards', 'words.sop').filter((w) => w.type === 'core.word');
  const texts = (means) => new Set(words.filter((w) => one(w, 'means') === means).flatMap((w) => (w.attrs.text ?? []).map(tok)));
  assert.ok(texts('w.diagram.group.x_field').has('x field'));
  assert.ok(texts('w.diagram.group.y_field').has('y field'));
  assert.ok(texts('w.diagram.group.series_field').has('series field'));
  const fieldWords = new Set([...Object.keys(wanted).map((n) => one(key(n), 'means')).flatMap((m) => [...texts(m)])]);
  for (const phrase of ['against', 'split by']) assert.ok(!fieldWords.has(phrase), phrase);
  // The native schema accepts the three fields beside dimension, measure and the axis titles.
  const w = actsWorld(['w.diagram']);
  const chart = w.act({ action: 'make', args: { kind: 'w.diagram.diagram', title: 'scatter' } });
  assert.equal(chart.ok, true);
  const group = w.act({ action: 'make', args: { kind: 'w.diagram.group', label: 'scatter', diagram: `$${chart.result.thing}`, layout: 'scatter', dimension: 'month', x_field: 'tenure', y_field: 'salary', series_field: 'department', x_label: 'Tenure', y_label: 'Salary' } });
  assert.equal(group.ok, true, JSON.stringify(group.violations));
  assert.equal(w.act({ action: 'ask', args: { thing: group.result.thing, attr: 'x_field' } }).result.value, 'tenure');
  assert.equal(w.act({ action: 'ask', args: { thing: group.result.thing, attr: 'series_field' } }).result.value, 'department');
});
