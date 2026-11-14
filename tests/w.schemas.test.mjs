// The world schemas (w.*, Round 11 item 2; block "06:55" item 3): each loads with std.acts with no error and no
// warning, names no function, has words for the world, its kinds and its keys, is found by name in the catalog,
// and is driven by the acts in an example session. A session step that needs a newer sopworld than the pinned one
// is written and skipped, with the release it needs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { WORLDS_DIR, REPO } from '../tools/lib/worlds.mjs';
import { scanSchemas, describeSchema, actsWorld } from '../tools/lib/schemas.mjs';
import { parse } from '../tools/sopworld/sopworld.mjs';

const schemas = scanSchemas();
const index = JSON.parse(readFileSync(join(WORLDS_DIR, 'index.json'), 'utf8'));
const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
const session = (w) => (action, args) => w.act({ action, args });
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
// The pinned build's release, and whether it has a construct of a later one.
const VERSION = readFileSync(join(REPO, 'tools/sopworld/VERSION'), 'utf8').match(/^version: (\S+)$/m)[1];
const atLeast = (v) => { const [a, b] = [VERSION, v].map((x) => x.split('.').map(Number)); for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]; return true; };
const needs = (v) => (atLeast(v) ? false : `needs sopworld ${v} or later (pinned: ${VERSION}); questions.md Q43`);
// The facts of a knowledge world's shards (all, or those whose file name passes `pick`).
const facts = (world, pick = () => true) => readdirSync(join(WORLDS_DIR, world, 'shards')).filter((f) => f.endsWith('.sop') && pick(f)).flatMap((f) => parse(readFileSync(join(WORLDS_DIR, world, 'shards', f), 'utf8')));

test('seven world schemas; each names no function, loads with std.acts, has words, and is in the catalog', () => {
  assert.deepEqual(schemas.map((s) => s.id), ['w.chart', 'w.document', 'w.face', 'w.list', 'w.map', 'w.seating', 'w.timeline']);
  for (const s of schemas) {
    const d = describeSchema(s);
    assert.deepEqual(d.errors, [], s.id);
    assert.deepEqual(d.entry.warnings, [], s.id);
    assert.deepEqual(index.schemas.find((x) => x.id === s.id), d.entry, s.id);
    assert.match(s.schemaText, /^# license: CC0-1\.0$/m);
  }
  // All seven together in one world: no name of one clashes with another.
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
  for (const [word, id] of [['seating plan', 'w.seating'], ['table plan', 'w.seating'], ['shopping list', 'w.list'], ['checklist', 'w.list'], ['timeline', 'w.timeline'], ['chronology', 'w.timeline'], ['face', 'w.face'], ['avatar', 'w.face'], ['map', 'w.map'], ['world map', 'w.map'], ['bar chart', 'w.chart'], ['pie chart', 'w.chart'], ['line graph', 'w.chart']]) {
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

test('a session with a chart (Q45 (ii)): a bar chart with a series of values is made, changed, asked and picked; a wrong value is refused', () => {
  const w = actsWorld(['w.chart']), act = session(w);
  assert.equal(act('make', { kind: 'w.chart.chart', title: 'sales', form: 'bar', unit: 'euro' }).result.thing, 'w_chart_chart1');
  assert.equal(act('make', { kind: 'w.chart.series', name: '2025', chart: '$w_chart_chart1', n: 1 }).ok, true);
  for (const [i, [category, value]] of [['January', 10], ['February', 12], ['March', 9]].entries()) assert.equal(act('make', { kind: 'w.chart.point', category, value, series: '$w_chart_series1', n: i + 1 }).ok, true, category);
  assert.equal(act('ask', { thing: 'w.chart.chart', nth: 1, attr: 'form' }).result.value, 'bar');
  assert.equal(act('change', { thing: 'w.chart.chart', nth: 1, attr: 'form', value: 'line' }).ok, true);
  assert.equal(act('ask', { thing: 'w.chart.chart', nth: 1, attr: 'form' }).result.value, 'line');
  assert.equal(act('change', { thing: 'w.chart.chart', nth: 1, attr: 'form', value: 'donut' }).ok, false, 'not a form of chart');
  assert.equal(act('change', { thing: 'w.chart.point', nth: 2, attr: 'value', value: 15 }).ok, true);
  assert.equal(act('ask', { thing: 'w.chart.point', nth: 2, attr: 'value' }).result.value, '15');
  assert.deepEqual(act('pick', { kind: 'w.chart.point', category: 'March' }).result.things, ['w_chart_point3']);
  assert.equal(act('make', { kind: 'w.chart.point', category: 'April', value: 'many', series: '$w_chart_series1' }).ok, false, 'a value is a number');
  assert.equal(act('remove', { thing: 'w_chart_point1' }).ok, true);
  assert.equal(act('pick', { kind: 'w.chart.point' }).result.things.length, 2);
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

test('w.seating, the acts the case corpus needs: tables placed, linked and grouped; guests copied and placed; a table holds its seats', () => {
  const w = actsWorld(['w.seating']), act = session(w);
  assert.equal(act('make', { kind: 'w.seating.table', name: 'family', seats: 2 }).ok, true);
  assert.equal(act('make', { kind: 'w.seating.table', name: 'friends' }).ok, true);
  assert.deepEqual([act('place', { thing: 'w_seating_table1', x: 3 }).ok, w.get('w_seating_table1').attrs.x], [true, ['3']]);
  assert.equal(act('change', { thing: 'w_seating_table1', attr: 'y', value: 5 }).ok, true);
  assert.equal(act('connect', { a: 'w_seating_table1', b: 'w_seating_table2', rel: 'next to' }).ok, true);
  assert.equal(act('group', { things: ['w_seating_table1', 'w_seating_table2'], name: 'garden' }).ok, true);
  // A table holds at most its seats; a table with no `seats` takes any number.
  for (const n of [1, 2]) assert.equal(act('make', { kind: 'w.seating.seat', table: '$w_seating_table1', n }).ok, true);
  const full = act('make', { kind: 'w.seating.seat', table: '$w_seating_table1', n: 3 });
  assert.deepEqual([full.ok, full.violations[0].why], [false, 'w_seating_table1 has room for 0 more w.seating.seats (seats 2)']);
  assert.equal(act('change', { thing: 'w_seating_table1', attr: 'seats', value: 1 }).ok, false);
  for (const n of [1, 2, 3]) assert.equal(act('make', { kind: 'w.seating.seat', table: '$w_seating_table2', n }).ok, true);
  // Guests: seated, copied (the copy keeps the attributes), connected, grouped.
  assert.equal(act('make', { kind: 'w.seating.guest', name: 'Ana', party: 'bride' }).ok, true);
  assert.equal(act('change', { thing: 'w_seating_guest1', attr: 'seat', value: '$w_seating_seat1' }).ok, true);
  assert.equal(act('copy', { thing: 'w_seating_guest1' }).ok, true);
  assert.deepEqual(w.get('w_seating_guest2').attrs.party, ['bride']);
  assert.equal(act('change', { thing: 'w_seating_guest2', attr: 'name', value: 'Bo' }).ok, true);
  assert.equal(act('change', { thing: 'w_seating_guest2', attr: 'seat', value: '$w_seating_seat3' }).ok, true);
  assert.equal(act('group', { things: ['w_seating_guest1', 'w_seating_guest2'], name: 'bride' }).ok, true);
  // A seat has no place of its own in the room.
  assert.equal(act('place', { thing: 'w_seating_seat1', x: 2 }).ok, false);
});

test('w.seating: a guest placed on a seat through the seat slot (place at=<seat>)', { skip: needs('0.33.0') }, () => {
  const w = actsWorld(['w.seating']), act = session(w);
  act('make', { kind: 'w.seating.table', name: 'family' });
  act('make', { kind: 'w.seating.seat', table: '$w_seating_table1', n: 1 });
  act('make', { kind: 'w.seating.guest', name: 'Ana' });
  const r = act('place', { thing: 'w_seating_guest1', at: '$w_seating_seat1' });
  assert.deepEqual([r.ok, w.get('w_seating_guest1').attrs.seat], [true, ['$w_seating_seat1']]);
});

test('w.timeline: every number in its range; an event stays inside its timeline and ends after it begins', () => {
  const w = actsWorld(['w.timeline']), act = session(w);
  assert.equal(act('make', { kind: 'w.timeline.timeline', name: 'twentieth century', from: 1901, to: 2000 }).ok, true);
  assert.equal(act('make', { kind: 'w.timeline.event', title: 'first flight', at: 1903, timeline: '$w_timeline_timeline1' }).ok, true);
  const why = (r) => (r.ok ? 'done' : r.violations[0].why);
  assert.equal(why(act('make', { kind: 'w.timeline.event', title: 'steam engine', at: 1712, timeline: '$w_timeline_timeline1' })), 'An event is inside its timeline: 1712 is before its start, 1901.');
  assert.equal(why(act('change', { thing: 'w_timeline_event1', attr: 'at', value: 2003 })), 'An event is inside its timeline: 2003 is after its end, 2000.');
  // Either side may move: an end of the timeline cannot leave an event outside.
  assert.equal(why(act('change', { thing: 'w_timeline_timeline1', attr: 'from', value: 1910 })), 'An event is inside its timeline: 1903 is before its start, 1910.');
  assert.equal(why(act('make', { kind: 'w.timeline.event', title: 'cold war', at: 1947, until: 2001, timeline: '$w_timeline_timeline1' })), 'An event is inside its timeline: it lasts until 2001, after its end, 2000.');
  assert.equal(why(act('make', { kind: 'w.timeline.event', title: 'cold war', at: 1947, until: 1991, timeline: '$w_timeline_timeline1' })), 'done');
  assert.equal(why(act('change', { thing: 'w_timeline_event2', attr: 'until', value: 1940 })), 'An event does not end before it begins: until 1940 is before 1947.');
  // One step more stays inside; five steps from 1998 would not.
  assert.equal(act('make', { kind: 'w.timeline.event', title: 'euro', at: 1999, timeline: '$w_timeline_timeline1' }).ok, true);
  assert.equal(act('change', { thing: 'w_timeline_event3', attr: 'at', by: 'less' }).result.value, '1998');
  assert.equal(act('change', { thing: 'w_timeline_event3', attr: 'at', by: 'more', amount: 5 }).ok, false);
  // The range: a number out of it is refused with the bound; an event on no timeline only has the range.
  assert.equal(why(act('make', { kind: 'w.timeline.event', title: 'slip', at: 19690 })), 'must be at most 10000');
  assert.equal(why(act('make', { kind: 'w.timeline.event', title: 'pyramids', at: -2560 })), 'done');
});

test('w.face: its kinds are the slots of k.faces; its colour keys are those of a k.faces preset; its expressions and variants are read from k.faces', () => {
  const s = schemas.find((x) => x.id === 'w.face'), wires = parse(s.schemaText);
  const kinds = wires.filter((x) => x.type === 'std.schema.kind').map((k) => k.attrs.of[0]).filter((t) => t !== 'w.face.face').map((t) => t.slice('w.face.'.length)).sort();
  const slots = [...new Set(facts('k.faces', (f) => f.endsWith('slots.sop')).filter((x) => x.type === 'k.faces.slot').map((x) => x.attrs.name[0]))].sort();
  assert.deepEqual(kinds, slots);
  // The face's colour keys are keys of k.faces.preset, so a preset is copied key for key.
  const faceKeys = wires.filter((x) => x.type === 'core.slot' && x.attrs.of[0] === 'w.face.face').map((x) => x.attrs.key[0]);
  const presetKeys = parse(readFileSync(join(WORLDS_DIR, 'k.faces/schema.sop'), 'utf8')).filter((x) => x.type === 'core.slot' && x.attrs.of[0] === 'k.faces.preset').map((x) => x.attrs.key[0]);
  for (const k of ['style', 'skin', 'hair_colour', 'eye_colour', 'clothes']) assert.ok(faceKeys.includes(k) && presetKeys.includes(k), k);
  // No value list of k.faces is written here again: variant, colours, expression and style are open names.
  for (const x of wires.filter((y) => y.type === 'core.slot')) if (['variant', 'colour', 'expression', 'style', 'skin', 'hair_colour', 'eye_colour', 'clothes', 'preset'].includes(x.attrs.key[0])) assert.equal(x.attrs.enum, undefined, x.id);
});

test('w.face: a session: a k.faces preset becomes a face; parts resized, moved, recoloured; one part of each kind; an expression as a mode', () => {
  const w = actsWorld(['w.face']), act = session(w);
  const presets = facts('k.faces', (f) => f === 'presets.sop');
  const robot = presets.find((x) => x.type === 'k.faces.preset' && x.attrs.name[0] === 'robot');
  const kinds = new Set(parse(schemas.find((x) => x.id === 'w.face').schemaText).filter((x) => x.type === 'std.schema.kind').map((k) => k.attrs.of[0]));
  // The face takes the preset's style and colours; each slot the preset fills becomes a part with that variant.
  const own = Object.fromEntries(['style', 'skin', 'hair_colour', 'eye_colour', 'clothes'].map((k) => [k, tok(robot.attrs[k][0])]));
  assert.equal(act('make', { kind: 'w.face.face', name: 'Robo', preset: 'robot', ...own }).ok, true);
  // (`clothes` is a colour on a preset and on a face, and the name of a slot of the style toon-head: the face's key
  // is the colour, the kind w.face.clothes the part.)
  const filled = Object.keys(robot.attrs).filter((k) => kinds.has(`w.face.${k}`) && !(k in own));
  for (const k of filled) assert.equal(act('make', { kind: `w.face.${k}`, face: '$w_face_face1', variant: tok(robot.attrs[k][0]) }).ok, true, k);
  assert.equal(w.ofType('w.face.part').length, filled.length);
  // Every variant on the face is a k.faces variant of its slot.
  const variants = new Set(facts('k.faces', (f) => f.startsWith('plain-')).filter((x) => x.type === 'k.faces.variant').map((x) => `${x.attrs.slot[0]} ${tok(x.attrs.name[0])}`));
  for (const p of w.ofType('w.face.part')) assert.ok(variants.has(`${p.type.slice('w.face.'.length)} ${tok(p.attrs.variant[0])}`), p.id);
  // Size: 1 as drawn, by tenths, 0.6 to 1.5.
  assert.equal(act('ask', { thing: 'w.face.nose', attr: 'size' }).result.value, '1');
  assert.equal(act('change', { thing: 'w.face.nose', attr: 'size', by: 'more' }).result.value, '1.1');
  const big = act('change', { thing: 'w.face.nose', attr: 'size', value: 2 });
  assert.deepEqual([big.ok, big.violations[0].why], [false, 'must be at most 1.5']);
  assert.equal(act('change', { thing: 'w.face.nose', attr: 'size', value: 0.5 }).ok, false);
  // Place: x by the act place, y by change ("raise the eyes": less y).
  assert.deepEqual([act('place', { thing: 'w.face.eyes', x: 2 }).ok, w.get('w_face_eyes1').attrs.x], [true, ['2']]);
  assert.equal(act('change', { thing: 'w.face.eyes', attr: 'y', by: 'less' }).result.value, '-1');
  assert.equal(act('change', { thing: 'w.face.ears', attr: 'colour', value: 'red' }).ok, true);
  // One part of each kind on a face: a second hat is refused; a hat on a second face is not.
  const hat = act('make', { kind: 'w.face.hat', face: '$w_face_face1', variant: 'crown' });
  assert.deepEqual([hat.ok, hat.violations[0].why], [false, 'A face has one part of each kind: this face has a w.face.hat already.']);
  assert.equal(act('change', { thing: 'w.face.hat', attr: 'variant', value: 'crown' }).ok, true);
  assert.equal(act('make', { kind: 'w.face.face', name: 'Ana' }).ok, true);
  assert.equal(act('make', { kind: 'w.face.hat', face: '$w_face_face2', variant: 'cap' }).ok, true);
  // Taking a part off and putting it back.
  assert.equal(act('remove', { thing: 'w_face_hat2' }).ok, true);
  assert.equal(act('undo', {}).ok, true);
  assert.equal(w.ofType('w.face.hat').length, 2);
  // The expression is a mode of the face: the parts keep their variants while it is set and after.
  const expressions = new Set(facts('k.faces', (f) => f === 'presets.sop').filter((x) => x.type === 'k.faces.expression').map((x) => tok(x.attrs.name[0])));
  assert.ok(expressions.has('happy'));
  assert.equal(act('change', { thing: 'w_face_face1', attr: 'expression', value: 'happy' }).ok, true);
  assert.deepEqual(w.get('w_face_mouth1').attrs.variant, ['grille']);
  assert.equal(act('undo', {}).ok, true);
  assert.equal(w.get('w_face_face1').attrs.expression, undefined);
  // Refused: a part has no seats; a face cannot be placed (its parts are).
  assert.equal(act('change', { thing: 'w.face.nose', attr: 'seats', value: 3 }).ok, false);
  assert.equal(act('place', { thing: 'w_face_face1', x: 3 }).ok, false);
});

test('w.map: its sorts of place are k.geo types; a session: show, highlight, pin, remove the pins, zoom and layer, what the map shows', () => {
  for (const sort of ['country', 'city']) assert.match(readFileSync(join(WORLDS_DIR, 'k.geo/schema.sop'), 'utf8'), new RegExp(`core\\.type of=k\\.geo\\.${sort}\\b`));
  const geo = facts('k.geo', (f) => !f.includes('borders') && !f.startsWith('numbers'));
  const named = (type, name) => geo.some((x) => x.type === type && tok(x.attrs.name?.[0]) === name);
  const w = actsWorld(['w.map']), act = session(w);
  // Show France and centre the map on it, in one sentence (one undo step).
  assert.ok(named('k.geo.country', 'France'));
  assert.equal(w.act([{ action: 'make', args: { kind: 'w.map.place', name: 'France', sort: 'country' } }, { action: 'make', args: { kind: 'w.map.view', centre: 'France' } }]).ok, true);
  // Highlight Peru in red; then Spain, and take the highlight off again.
  assert.ok(named('k.geo.country', 'Peru'));
  assert.equal(act('make', { kind: 'w.map.place', name: 'Peru', highlight: true, colour: 'red' }).ok, true);
  assert.equal(act('make', { kind: 'w.map.place', name: 'Spain', highlight: true }).ok, true);
  assert.equal(act('change', { thing: 'w_map_place3', attr: 'highlight', value: false }).ok, true);
  assert.deepEqual(act('pick', { kind: 'w.map.place', highlight: true }).result.things, ['w_map_place2']);
  // Pins on two cities; what the map shows; remove the pins, one undo step.
  for (const c of ['Paris', 'Lima']) assert.ok(named('k.geo.city', c), c);
  assert.equal(act('make', { kind: 'w.map.pin', on: 'Paris', sort: 'city', label: 'our hotel' }).ok, true);
  assert.equal(act('make', { kind: 'w.map.pin', on: 'Lima', colour: 'blue' }).ok, true);
  // (0.30 refuses `show thing=*` at the view's own state, which has no place on the map; 0.32 leaves it out.)
  const shown = ['w.map.place', 'w.map.pin'].flatMap((k) => act('show', { thing: k, set: 'each', view: 'w.map' }).result.things);
  assert.deepEqual(shown.map((t) => [t.kind, t.values.name ?? t.values.on, tok(t.values.highlight ?? t.values.label)]), [['w.map.place', 'France', 'false'], ['w.map.place', 'Peru', 'true'], ['w.map.place', 'Spain', 'false'], ['w.map.pin', 'Paris', 'our hotel'], ['w.map.pin', 'Lima', null]]);
  assert.deepEqual(act('remove', { thing: 'w.map.pin', set: 'all' }).result.things, ['w_map_pin1', 'w_map_pin2']);
  assert.equal(act('undo', {}).ok, true);
  assert.equal(act('pick', { kind: 'w.map.pin' }).result.things.length, 2);
  // The view: zoom from 3 by steps, at most 10; the layer from its three; one view.
  assert.equal(act('ask', { thing: 'w.map.view', attr: 'zoom' }).result.value, '3');
  assert.equal(act('change', { thing: 'w.map.view', attr: 'zoom', by: 'more', amount: 2 }).result.value, '5');
  assert.equal(act('change', { thing: 'w.map.view', attr: 'zoom', value: 12 }).violations[0].why, 'must be at most 10');
  assert.equal(act('change', { thing: 'w.map.view', attr: 'layer', value: 'borders' }).ok, true);
  assert.deepEqual(act('change', { thing: 'w.map.view', attr: 'layer', value: 'satellite' }).violations[0].allowed, ['borders', 'rivers', 'none']);
  assert.equal(act('make', { kind: 'w.map.view' }).violations[0].why, 'at most 1 w.map.view');
  // Refused: a sort of place the map does not have (k.geo rivers are drawn as a layer); a place cannot be zoomed.
  assert.deepEqual(act('make', { kind: 'w.map.pin', on: 'Danube', sort: 'river' }).violations[0].allowed, ['country', 'city']);
  assert.equal(act('change', { thing: 'w_map_place1', attr: 'zoom', value: 4 }).ok, false);
});

test('w.map: "zoom in" names no thing: the view makes its state on first use and the act changes it', { skip: needs('0.37.0') }, () => {
  const w = actsWorld(['w.map']), act = session(w);
  const r = act('change', { attr: 'zoom', by: 'more' });
  assert.deepEqual([r.ok, r.result.thing, r.result.value], [true, 'view_w_map', '4']);
  assert.equal(act('change', { attr: 'layer', value: 'rivers' }).ok, true);
  assert.equal(act('ask', { thing: 'w.map', attr: 'layer' }).result.value, 'rivers');
});
