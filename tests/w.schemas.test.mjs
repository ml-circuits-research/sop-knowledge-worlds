// The reusable worlds (w.*, Round 11 item 2): each loads with std.acts with no error and no warning, is data only,
// has words for the world, its kinds and its keys, is found by name in the catalog, and is driven by the acts in
// an example session.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { WORLDS_DIR, REPO } from '../tools/lib/worlds.mjs';
import { scanSchemas, describeSchema, actsWorld } from '../tools/lib/schemas.mjs';

const schemas = scanSchemas();
const index = JSON.parse(readFileSync(join(WORLDS_DIR, 'index.json'), 'utf8'));
const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
const session = (w) => (action, args) => w.act({ action, args });

test('three reusable worlds; each is data only, loads with std.acts, has words, and is in the catalog', () => {
  assert.deepEqual(schemas.map((s) => s.id), ['w.list', 'w.seating', 'w.timeline']);
  for (const s of schemas) {
    const d = describeSchema(s);
    assert.deepEqual(d.errors, [], s.id);
    assert.deepEqual(d.entry.warnings, [], s.id);
    assert.deepEqual(index.schemas.find((x) => x.id === s.id), d.entry, s.id);
    assert.match(s.schemaText, /^# license: CC0-1\.0$/m);
  }
  // All three together in one world: no name of one clashes with another.
  assert.deepEqual(actsWorld().warnings ?? [], []);
});

test('one sopworld build: the reusable worlds are validated with the build that validates the knowledge worlds (Q35)', () => {
  assert.equal(existsSync(join(REPO, 'tools/sopworld/w')), false);
  assert.equal(index.sopworld_schemas, undefined);
  const v = Object.fromEntries(readFileSync(join(REPO, 'tools/sopworld/VERSION'), 'utf8').trim().split('\n').map((l) => l.split(': ')));
  assert.equal(index.sopworld, v.commit.slice(0, 7));
  assert.match(readFileSync(join(REPO, 'tools/lib/schemas.mjs'), 'utf8'), /from '\.\.\/sopworld\/sopworld\.mjs'/);
});

test('a host finds a schema by name: the words of the vocabulary lead to the schema', () => {
  for (const [word, id] of [['seating plan', 'w.seating'], ['table plan', 'w.seating'], ['shopping list', 'w.list'], ['checklist', 'w.list'], ['timeline', 'w.timeline'], ['chronology', 'w.timeline']]) {
    assert.ok(vocab[word]?.includes(`${id}/schema.sop`), word);
    assert.ok(index.schemas.find((x) => x.id === id).names.includes(word), word);
  }
});

test('a session with a list: items are made, ticked off, picked, copied and removed; a wrong act is refused', () => {
  const w = actsWorld(['w.list']), act = session(w);
  assert.equal(act('make', { kind: 'w.list.list', name: 'shopping' }).result.thing, 'w_list_list1');
  assert.equal(act('make', { kind: 'w.list.item', text: 'milk', list: '$w_list_list1', n: 1, quantity: 'a litre' }).ok, true);
  assert.equal(act('make', { kind: 'w.list.item', text: 'bread', list: '$w_list_list1', n: 2 }).ok, true);
  assert.equal(act('ask', { thing: 'w.list.item', nth: 2, attr: 'done' }).result.value, 'false');
  assert.equal(act('change', { thing: 'w.list.item', nth: 1, attr: 'done', value: 'true' }).ok, true);
  assert.deepEqual(act('pick', { kind: 'w.list.item', done: 'false' }).result.things, ['w_list_item2']);
  assert.equal(act('copy', { thing: 'w_list_item2' }).ok, true);
  assert.equal(act('undo', {}).ok, true);
  assert.deepEqual(act('pick', { kind: 'w.list.item' }).result.things.length, 2);
  assert.equal(act('copy', { thing: 'w_list_item2' }).ok, true);
  assert.equal(act('remove', { thing: 'w_list_item2' }).ok, true);
  // Undo right after remove brings the removed item back (a defect of 0.26.0, Q35; fixed by 0.30.0).
  assert.equal(act('undo', {}).ok, true);
  assert.equal(act('pick', { kind: 'w.list.item' }).result.things.length, 3);
  assert.equal(act('remove', { thing: 'w_list_item2' }).ok, true);
  // `amount` is the act's own argument (how many to make), not a key of an item: two items are made at once.
  assert.deepEqual(act('make', { kind: 'w.list.item', text: 'egg', list: '$w_list_list1', amount: 2 }).result.things.length, 2);
  assert.equal(act('undo', {}).ok, true);
  // Refused: an item has no place in a picture; a list that does not exist.
  assert.equal(act('place', { thing: 'w_list_item1', x: 3 }).ok, false);
  assert.equal(act('make', { kind: 'w.list.item', text: 'x', list: '$w_seating_table1' }).ok, false);
  assert.deepEqual(act('pick', { kind: 'w.list.item' }).result.things.length, 2);
});

test('a session with a seating plan: a table, seats, guests on seats, a link between guests, a shape that is not allowed', () => {
  const w = actsWorld(['w.seating']), act = session(w);
  assert.equal(act('make', { kind: 'w.seating.table', name: 'family', seats: 6 }).ok, true);
  assert.equal(act('ask', { thing: 'w.seating.table', attr: 'shape' }).result.value, 'round');
  for (const n of [1, 2]) assert.equal(act('make', { kind: 'w.seating.seat', table: '$w_seating_table1', n }).ok, true);
  assert.equal(act('make', { kind: 'w.seating.guest', name: 'Ana', seat: '$w_seating_seat1', needs: 'vegetarian' }).ok, true);
  assert.equal(act('make', { kind: 'w.seating.guest', name: 'Ben' }).ok, true);
  assert.equal(act('change', { thing: 'w_seating_guest2', attr: 'seat', value: '$w_seating_seat2' }).ok, true);
  assert.equal(act('connect', { a: 'w_seating_guest1', b: 'w_seating_guest2', rel: 'next to' }).ok, true);
  assert.deepEqual(act('pick', { kind: 'w.seating.guest', seat: '$w_seating_seat2' }).result.things, ['w_seating_guest2']);
  const no = act('change', { thing: 'w.seating.table', attr: 'shape', value: 'oval' });
  assert.equal(no.ok, false);
  assert.deepEqual(no.violations[0].allowed, ['round', 'square', 'long']);
  assert.equal(act('make', { kind: 'w.seating.seat', table: '$w_seating_guest1' }).ok, false);
});

test('a session with a timeline: events with their time, moved later and back, picked by time', () => {
  const w = actsWorld(['w.timeline']), act = session(w);
  assert.equal(act('make', { kind: 'w.timeline.timeline', name: 'space' }).ok, true);
  assert.equal(act('ask', { thing: 'w.timeline.timeline', attr: 'unit' }).result.value, 'year');
  assert.equal(act('make', { kind: 'w.timeline.event', title: 'first person on the Moon', at: 1969, timeline: '$w_timeline_timeline1' }).ok, true);
  assert.equal(act('make', { kind: 'w.timeline.event', title: 'first satellite', at: 1957, timeline: '$w_timeline_timeline1', sort: 'launch' }).ok, true);
  assert.equal(act('change', { thing: 'w_timeline_event2', attr: 'at', by: 'more' }).result.value, '1958');
  assert.equal(act('undo', {}).ok, true);
  assert.deepEqual(act('pick', { kind: 'w.timeline.event', at: 1957 }).result.things, ['w_timeline_event2']);
  assert.equal(act('connect', { a: 'w_timeline_event2', b: 'w_timeline_event1', rel: 'leads to' }).ok, true);
  assert.equal(act('change', { thing: 'w_timeline_event1', attr: 'at', value: 'soon' }).ok, false);
});
