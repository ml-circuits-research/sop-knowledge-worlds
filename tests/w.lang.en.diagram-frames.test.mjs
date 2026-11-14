// The diagram frames of w.lang.en (reviewer block 2026-11-15 06:00 item 1; shard diagram-frames,
// tools/lang-en-diagram-frames.mjs): the edit and request wording PSys2 measured in its DIAG-GAP set (psys2
// training/eval/diagram-gap-2026-11-15.jsonl, ids dg..) read back to the intended act and roles by the reference frame
// reader (tools/lib/lang-en.mjs) in a diagram world, and the joins of the lexicons the frames name to k.diagrams,
// w.diagram and the arrangement phrases.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { frameReader, toks } from '../tools/lib/lang-en.mjs';
import { diagramFrameShard, lexicons } from '../tools/lang-en-diagram-frames.mjs';

const shardsOf = (id) => readdirSync(join(WORLDS_DIR, id, 'shards')).filter((f) => f.endsWith('.sop')).sort().map((f) => readFileSync(join(WORLDS_DIR, id, 'shards', f), 'utf8'));
const all = shardsOf('w.lang.en').flatMap((t) => parse(t));
const actions = shardsOf('k.actions').flatMap((t) => parse(t));
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const vals = (w, k) => (w.attrs[k] ?? []).map(tok);
const schema = (id) => parse(readFileSync(join(WORLDS_DIR, id, 'schema.sop'), 'utf8'));
const kinds = shardsOf('k.diagrams').flatMap((t) => parse(t)).filter((w) => w.type === 'k.diagrams.kind');
const kindWords = schema('k.diagrams').filter((w) => w.type === 'core.word' && one(w, 'of') === 'k.diagrams.kind.name');
const arrangements = all.filter((w) => w.type === 'w.lang.en.arrangement');
const lex = (name) => vals(all.find((w) => w.type === 'w.lang.en.lex' && one(w, 'name') === name), 'item');

// the k.diagrams kind a word names (its name, or a word of it), and the diagram layout of a direction phrase
const kindOf = (w) => kinds.find((k) => one(k, 'name').toLowerCase() === w)?.attrs.name.map(tok)[0]
  ?? one(kindWords.find((x) => vals(x, 'text').map((t) => t.toLowerCase()).includes(w)) ?? { attrs: {} }, 'means');
const layoutOf = (phrase) => one(arrangements.find((a) => one(a, 'text') === phrase) ?? { attrs: {} }, 'diagram_layout');

// A diagram world: the frames with no needs and those a world of nodes and edges with attributes, values and layouts
// meets; a host's lexicons of that world (its kinds, attributes, values).
const NEEDS = new Set([undefined, 'attrs', 'values', 'layout', 'in', 'dir', 'scale', 'more', 'less', 'number', 'none', 'clear']);
const read = frameReader(all, actions, {
  needs: (n) => NEEDS.has(n),
  lexicons: { kind: ['box', 'circle', 'arrow', 'rectangle', 'diamond', 'node', 'shape', 'step', 'oval'], attribute: ['colour', 'size', 'label', 'shape', 'layout', 'text'], value: ['red', 'blue', 'green', 'diamond', 'circle', 'rectangle', 'oval'], more: ['bigger', 'larger'], less: ['smaller'], noun: ['box', 'arrow', 'circle'] },
});

// [request, id in the DIAG-GAP set or '' for a paraphrase, act/mode, args]
const LAYOUT = [
  ['make the arrows go left to right', 'dg19', 'place/layout', { thing: 'arrows', direction: 'left to right' }],
  ['lay the flow out left to right', 'dg20', 'place/layout', { thing: 'flow', direction: 'left to right' }],
  ['make the arrows go top to bottom', '', 'place/layout', { thing: 'arrows', direction: 'top to bottom' }],
  ['flow from left to right', '', 'place/layout', { direction: 'from left to right', thing: 'everything' }],
  ['make it flow from left to right', '', 'place/layout', { thing: 'it', direction: 'from left to right' }],
  ['the arrows should go from top to bottom', '', 'place/layout', { thing: 'arrows', direction: 'from top to bottom' }],
  ['arrange the steps from top to bottom', '', 'place/layout', { thing: 'steps', direction: 'from top to bottom' }],
  ['draw the flowchart top to bottom', '', 'place/layout', { thing: 'flowchart', direction: 'top to bottom' }],
  ['make the arrows point right to left', '', 'place/layout', { thing: 'arrows', direction: 'right to left' }],
  ['make the diagram go down the page', '', 'place/layout', { thing: 'diagram', direction: 'down the page' }],
];
const LABEL = [
  ['call the arrow yes', 'dg49', 'change/set', { thing: 'arrow', value: 'yes', attribute: 'label' }],
  ['label the arrow yes', 'dg47', 'change/set', { thing: 'arrow', value: 'yes', attribute: 'label' }],
  ['name the arrow yes', 'dg50', 'change/set', { thing: 'arrow', value: 'yes', attribute: 'label' }],
  ['label the arrow from A to B yes', 'dg48', 'change/set', { thing: 'arrow from a to b', value: 'yes', attribute: 'label' }],
  ["label the arrow from A to B 'no'", '', 'change/set', { thing: 'arrow from a to b', value: 'no', attribute: 'label' }],
  ['label the line between start and end no', '', 'change/set', { thing: 'line between start and end', value: 'no', attribute: 'label' }],
  ['write yes on the arrow', '', 'change/set', { value: 'yes', thing: 'arrow', attribute: 'label' }],
  ['put the label no on the arrow', '', 'change/set', { value: 'no', thing: 'arrow', attribute: 'label' }],
  ['mark the arrows as optional', '', 'change/set', { thing: 'arrows', value: 'optional', attribute: 'label' }],
];
const KINDS = [
  ['make a flowchart of making tea', 'dg21', 'make/', { kind: 'flowchart', topic: 'making tea' }],
  ['draw a flowchart for making tea', 'dg22', 'make/', { kind: 'flowchart', topic: 'making tea' }],
  ['a flowchart of how to make tea', 'dg23', 'make/', { kind: 'flowchart', topic: 'how to make tea' }],
  ['make a tree of the parts of a car', 'dg24', 'make/', { kind: 'tree', topic: 'parts of a car' }],
  ['draw a tree of the parts of a car', 'dg25', 'make/', { kind: 'tree', topic: 'parts of a car' }],
  ['a hierarchy of the parts of a car', 'dg26', 'make/', { kind: 'hierarchy', topic: 'parts of a car' }],
  ['make a cycle of the seasons', 'dg27', 'make/', { kind: 'cycle', topic: 'seasons' }],
  ['draw a cycle of the seasons', 'dg28', 'make/', { kind: 'cycle', topic: 'seasons' }],
  ['a cycle diagram of the four seasons', 'dg29', 'make/', { kind: 'cycle diagram', topic: 'four seasons' }],
  ['make a timeline of the planets by distance', 'dg30', 'make/', { kind: 'timeline', topic: 'planets by distance' }],
  ['a timeline of the planets by distance from the sun', 'dg31', 'make/', { kind: 'timeline', topic: 'planets by distance from the sun' }],
  ['make a mind map about bees', 'dg33', 'make/', { kind: 'mind map', topic: 'bees' }],
  ['draw a mind map of bees', 'dg34', 'make/', { kind: 'mind map', topic: 'bees' }],
  ['a mind map about honey bees', 'dg35', 'make/', { kind: 'mind map', topic: 'honey bees' }],
  ['make a Venn diagram of birds and animals that fly', 'dg36', 'make/', { kind: 'venn diagram', topic: 'birds and animals that fly' }],
  ['draw an org chart of the school', '', 'make/', { kind: 'org chart', topic: 'school' }],
];
// Arrangements PSys2 sent to its avatar world (dg02, dg03, dg06, dg08, dg10): w.lang.en's layout frame already reads them
// (acts.place.layout takes the verbs of place); the cause is the host's routing, not a missing frame.
const ARRANGED = [
  ['put the boxes in a circle', 'dg02', 'place/layout', { thing: 'boxes', direction: 'in a circle' }],
  ['put them in a circle', 'dg03', 'place/layout', { thing: 'them', direction: 'in a circle' }],
  ['put them in a grid', 'dg06', 'place/layout', { thing: 'them', direction: 'grid' }],
  ['put the boxes in a row', 'dg08', 'place/layout', { thing: 'boxes', direction: 'row' }],
  ['put the boxes in a column', 'dg10', 'place/layout', { thing: 'boxes', direction: 'column' }],
];

const check = (rows) => {
  const bad = [];
  for (const [s, id, actMode, args] of rows) {
    const [r] = read(s);
    const got = r ? `${r.act}/${r.mode ?? ''} ${JSON.stringify(Object.fromEntries(Object.entries(r.args).sort()))}` : 'nothing';
    const want = `${actMode} ${JSON.stringify(Object.fromEntries(Object.entries(args).sort()))}`;
    if (got !== want) bad.push(`${id || '-'} "${s}": ${got} (${r?.frame}), want ${want}`);
  }
  return bad;
};

test('the shard diagram-frames is what tools/lang-en-diagram-frames.mjs gives (its lexicons follow k.diagrams, w.diagram and the arrangements)', () => {
  assert.equal(readFileSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'diagram-frames.sop'), 'utf8'), diagramFrameShard(), 'run node tools/lang-en-diagram-frames.mjs (npm run build does)');
});

test('layout direction: "make the arrows go left to right" and its paraphrases read as place/layout with a direction whose diagram layout is a layout of k.diagrams', () => {
  assert.deepEqual(check(LAYOUT), []);
  const kindLayouts = new Set(kinds.flatMap((k) => vals(k, 'layout')));
  for (const [, , , { direction }] of LAYOUT) assert.ok(kindLayouts.has(layoutOf(direction)), `${direction}: ${layoutOf(direction)}`);
  assert.equal(layoutOf('left to right'), 'left_right');
  assert.equal(layoutOf('top to bottom'), 'top_down');
  assert.ok(vals(kinds.find((k) => one(k, 'name') === 'flowchart'), 'layout').includes('left_right'));
});

test('edge labels: "call the arrow yes", "label the arrow from A to B no" read as change/set of the label of the edge', () => {
  assert.deepEqual(check(LABEL), []);
  const edgeKeys = schema('w.diagram').filter((w) => w.type === 'core.slot' && one(w, 'of') === 'w.diagram.edge').map((w) => one(w, 'key'));
  assert.ok(edgeKeys.includes('label'));
  // the thing is an edge: its first word is a word of w.diagram.edge
  const edge = new Set(schema('w.diagram').filter((w) => w.type === 'core.word' && one(w, 'means') === 'w.diagram.edge').flatMap((w) => vals(w, 'text')));
  for (const [, , , { thing }] of LABEL) assert.ok(edge.has(toks(thing)[0]), thing);
  // a name stays a name where the world has one ("Call yourself Robi": the avatar's frame)
  const avatar = frameReader(all, actions, { needs: (n) => [undefined, 'attrs', 'name', 'self'].includes(n) });
  assert.equal(avatar('Call yourself Robi.')[0].frame, 'acts.change.call');
});

test('a diagram of a kind about a topic: the kind is a k.diagrams kind or one of its words, the topic the rest', () => {
  assert.deepEqual(check(KINDS), []);
  for (const [, , , { kind }] of KINDS) assert.ok(kindOf(kind), kind);
  assert.equal(kindOf('hierarchy'), 'tree');
  assert.equal(kindOf('cycle diagram'), 'cycle');
  assert.equal(kindOf('venn diagram'), 'Venn diagram');
  // "make a chart about sales" stays the general topic frame (chart is no kind of diagram here)
  assert.equal(read('Make a chart about sales.')[0].frame, 'acts.make.topic');
});

test('the arrangements PSys2 sent to another world are read as place/layout by the existing layout frame', () => {
  assert.deepEqual(check(ARRANGED), []);
});

test('the lexicons join their homes: every kind reached, every edge word a w.diagram edge word, every direction an arrangement phrase', () => {
  const L = lexicons();
  for (const w of lex('diagram.kind')) assert.ok(kindOf(w), w);
  for (const k of kinds) assert.ok(lex('diagram.kind').includes(one(k, 'name').toLowerCase()), one(k, 'name'));
  assert.ok(kindWords.length >= kinds.length, 'a word for every kind');
  for (const k of kinds) assert.ok(kindWords.some((w) => one(w, 'means') === one(k, 'name')), `no word for ${one(k, 'name')}`);
  assert.deepEqual(lex('diagram.edge'), L['diagram.edge'].items);
  for (const d of lex('diagram.direction')) assert.ok(['left_right', 'top_down'].includes(layoutOf(d)), d);
  for (const d of ['left to right', 'from left to right', 'top to bottom', 'from top to bottom']) assert.ok(lex('diagram.direction').includes(d), d);
});
