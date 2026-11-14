// Frames for the diagram edits and requests PSys2 measured (its DIAG-GAP set, psys2 training/eval/diagram-gap-2026-11-15.jsonl;
// reviewer block 2026-11-15 06:00 item 1), in w.lang.en's frame format, with the words of k.diagrams and w.diagram:
//  - layout direction: "make the arrows go left to right", "lay the flow out left to right", "the arrows should go from
//    top to bottom", "flow from left to right": the act place in the mode layout, its direction an arrangement phrase of
//    w.lang.en (shard hand-arrangements) whose diagram layout is left_right or top_down (k.diagrams.kind layout);
//  - edge labels: "call the arrow yes", "label the arrow from A to B no", "write yes on the arrow": the act change of the
//    attribute label (w.diagram.edge label) of an edge, named by a word of w.diagram.edge;
//  - a diagram of a kind about a topic: "make a flowchart of making tea", "a hierarchy of the parts of a car": the act
//    make, its kind a k.diagrams kind or one of its words, its topic the rest.
// The lexicons the frames name are derived here from their homes (k.diagrams kind names and words, w.diagram's words for
// an edge, the arrangement phrases), so they cannot disagree; `npm run build` reruns this tool.
//   node tools/lang-en-diagram-frames.mjs     writes docs/worlds/w.lang.en/shards/diagram-frames.sop
// Deterministic: input the three files named above. tests/w.lang.en.diagram-frames.test.mjs reads every request back.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './sopworld/sopworld.mjs';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, text } from './import/lib.mjs';
import { frameLines, rolesOf } from './lang-en-role-frames.mjs';

const SRC = 'hand-core 1';
// the values of k.attributes.attribute holds whose attributes can order things: a number, a size, a step of a scale
export const ORDERABLE = ['number', 'size', 'class'];
// the words that mark the criterion (block 07:45 item 1): the markers of the criterion of make in k.actions, and the
// participles a request puts before "by" ("sorted by size")
const actRoles = () => read('k.actions', 'shards', 'acts.sop').filter((w) => w.type === 'k.actions.role');
export const orderBy = () => [...vals(actRoles().find((w) => one(w, 'act') === 'make' && one(w, 'name') === 'criterion'), 'marker'),
  ...['sorted', 'ordered', 'arranged', 'ranked', 'listed', 'lined up'].flatMap((p) => [`${p} by`, `${p} according to`])];
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const vals = (w, k) => (w.attrs[k] ?? []).map(tok);
const read = (...p) => parse(readFileSync(join(WORLDS_DIR, ...p), 'utf8'));

// The lexicons, from their homes.
export function lexicons() {
  const kinds = read('k.diagrams', 'shards', 'diagrams.sop').filter((w) => w.type === 'k.diagrams.kind').map((w) => one(w, 'name'));
  const kindWords = read('k.diagrams', 'schema.sop').filter((w) => w.type === 'core.word' && one(w, 'of') === 'k.diagrams.kind.name').flatMap((w) => vals(w, 'text'));
  const edgeWords = read('w.diagram', 'schema.sop').filter((w) => w.type === 'core.word' && one(w, 'means') === 'w.diagram.edge').flatMap((w) => vals(w, 'text')).filter((t) => !t.endsWith('s'));
  const LINEAR = new Set(['left_to_right', 'right_to_left', 'top_to_bottom', 'bottom_to_top']);
  const directions = read('w.lang.en', 'shards', 'hand-arrangements.sop').filter((w) => w.type === 'w.lang.en.arrangement'
    && ['left_right', 'top_down'].includes(one(w, 'diagram_layout'))
    && ((LINEAR.has(one(w, 'direction')) && ['left_of', 'above'].includes(one(w, 'relation'))) || ['aligned_row', 'aligned_column'].includes(one(w, 'relation'))))
    .map((w) => one(w, 'text'));
  // the attributes that can put things in order (block 07:45 item 1): those that hold a number, a size or a step of a
  // scale (k.attributes.attribute holds), by their names and their words (core.word of=k.attributes.attribute.name)
  const attrs = read('k.attributes', 'shards', 'attributes.sop').filter((w) => w.type === 'k.attributes.attribute' && ORDERABLE.includes(one(w, 'holds'))).map((w) => one(w, 'name'));
  const attrWords = read('k.attributes', 'schema.sop').filter((w) => w.type === 'core.word' && one(w, 'of') === 'k.attributes.attribute.name' && attrs.includes(one(w, 'means'))).flatMap((w) => vals(w, 'text'));
  const sorted = (xs) => [...new Set(xs.map((x) => x.toLowerCase()))].sort();
  return {
    'diagram.kind': { doc: 'Kinds of diagram: the names of k.diagrams.kind and their words (core.word of=k.diagrams.kind.name); derived by tools/lang-en-diagram-frames.mjs.', items: sorted([...kinds, ...kindWords]) },
    'diagram.edge': { doc: "Words for an edge of a diagram: w.diagram's words for w.diagram.edge, singular (a reader takes the plural too); derived by tools/lang-en-diagram-frames.mjs.", items: sorted(edgeWords) },
    'diagram.edge.from': { doc: 'Words that begin the two ends of an edge after its noun ("the arrow from A to B", "the line between A and B").', items: ['between', 'from', 'going from', 'leading from', 'that goes from', 'which goes from'] },
    'order.criterion': { doc: 'Attributes that can put things in order, the criterion of make, place and group (k.actions): the names of the k.attributes attributes that hold a number, a size or a step of a scale, and their words (core.word of=k.attributes.attribute.name); derived by tools/lang-en-diagram-frames.mjs.', items: sorted([...attrs, ...attrWords]) },
    'diagram.direction': { doc: 'Directions of a layout: the arrangement phrases (w.lang.en.arrangement) of a row or column in one direction whose diagram layout is left_right or top_down; derived by tools/lang-en-diagram-frames.mjs.', items: sorted(directions) },
  };
}

const lead = ['lead'], det = ['det'];
const verb = (act) => ['verb', act];
const role = (r, takes = 'words', more = {}) => ['role', r, takes, more];
const word = (words, optional = false) => ['word', words, optional];
const OF = ['of', 'about', 'for', 'on', 'showing', 'that shows', 'to show', 'explaining'];
// what may follow the criterion: "sorted by how far they are"
const ORDER_TAIL = ['they are', 'it is', 'each one is', 'they are from the sun', 'first', 'order'];
const LABEL = ['label', 'call', 'name', 'mark', 'title', 'caption', 'tag'];
// [name, act, mode, priority, needs, example, parts, fixed, about]
export const FRAMES = [
  ['acts.place.layout.go', 'place', 'layout', 15, 'layout', 'Make the arrows go left to right.',
    [lead, word(['make', 'have', 'let', 'get']), det, role('thing'), word(['go', 'run', 'point', 'flow', 'read', 'move', 'all go', 'all point'], true), role('rel', 'lexicon', { lexicon: 'diagram.direction' })],
    null, 'layout direction: what goes which way'],
  ['acts.place.layout.should', 'place', 'layout', 14, 'layout', 'The arrows should go from top to bottom.',
    [lead, det, role('thing'), word(['should go', 'should run', 'should flow', 'should point', 'must go', 'need to go', 'needs to go', 'have to go', 'has to go', 'go', 'run', 'flow', 'point', 'goes', 'runs', 'flows', 'points']), role('rel', 'lexicon', { lexicon: 'diagram.direction' })],
    null, 'layout direction said as a wish'],
  ['acts.place.layout.flow', 'place', 'layout', 13, 'layout', 'Flow from left to right.',
    [lead, word(['flow', 'go', 'run', 'read', 'point', 'lay it out', 'lay everything out', 'lay out everything']), role('rel', 'lexicon', { lexicon: 'diagram.direction' })],
    { thing: 'everything' }, 'layout direction of the whole diagram'],
  ['acts.place.layout.dir', 'place', 'layout', 14, 'layout', 'Lay the flow out left to right.',
    [lead, word(['arrange', 'rearrange', 'lay out', 'lay', 'set out', 'draw', 'redraw', 'organise', 'organize', 'order', 'orient', 'put', 'place']), det, role('thing'), word(['out', 'up'], true), role('rel', 'lexicon', { lexicon: 'diagram.direction' })],
    null, 'layout direction with a verb of arranging'],
  ['acts.change.label.edge', 'change', 'set', 15, 'attrs', 'Call the arrow yes.',
    [lead, word(LABEL), det, role('thing', 'lexicon', { lexicon: 'diagram.edge' }), word(['as', 'with'], true), role('value', 'words', { max: 3 })],
    { attribute: 'label' }, 'edge label'],
  ['acts.change.label.edge.ends', 'change', 'set', 16, 'attrs', 'Label the arrow from A to B no.',
    [lead, word(LABEL), det, role('thing', 'lexicon', { lexicon: 'diagram.edge' }), role('link', 'lexicon', { lexicon: 'diagram.edge.from' }), role('ends'), word(['as', 'with'], true), role('value', 'words', { max: 1 })],
    { attribute: 'label' }, 'edge label, the edge named by its ends (the thing is "arrow from a to b")'],
  ['acts.change.label.edge.on', 'change', 'set', 15, 'attrs', 'Write yes on the arrow.',
    [lead, word(['write', 'put', 'type', 'place']), word(['the label', 'a label', 'label', 'the word', 'the text'], true), role('value', 'words', { max: 3 }), word(['on', 'onto', 'next to', 'beside', 'along', 'by']), det, role('thing', 'lexicon', { lexicon: 'diagram.edge' })],
    { attribute: 'label' }, 'edge label, the label said first'],
  ['acts.make.diagram', 'make', undefined, 13, undefined, 'Make a flowchart of making tea.',
    [lead, verb('make'), det, role('thing', 'lexicon', { lexicon: 'diagram.kind' }), word(['of', 'about', 'for', 'on', 'showing', 'that shows', 'to show', 'explaining']), det, role('topic')],
    null, 'a diagram of a kind about a topic'],
  // block 07:45 item 1: the order criterion ("a timeline of the planets by distance"): an attribute that can order things
  ['acts.make.diagram.order', 'make', undefined, 14, undefined, 'Make a timeline of the planets by distance.',
    [lead, verb('make'), det, role('thing', 'lexicon', { lexicon: 'diagram.kind' }), word(OF), det, role('topic'), word(orderBy()), det, role('criterion', 'lexicon', { lexicon: 'order.criterion' }), word(ORDER_TAIL, true)],
    null, 'a diagram of a kind about a topic, in the order of an attribute'],
  ['acts.make.diagram.order.bare', 'make', undefined, 5, undefined, 'A timeline of the planets by distance from the sun.',
    [lead, det, role('thing', 'lexicon', { lexicon: 'diagram.kind' }), word(OF), det, role('topic'), word(orderBy()), det, role('criterion', 'lexicon', { lexicon: 'order.criterion' }), word(ORDER_TAIL, true)],
    null, 'a diagram of a kind about a topic in the order of an attribute, without a verb (priority 5, over the bare kind-about-topic frame)'],
  ['acts.make.diagram.bare', 'make', undefined, 4, undefined, 'A cycle diagram of the four seasons.',
    [lead, det, role('thing', 'lexicon', { lexicon: 'diagram.kind' }), word(['of', 'about', 'for', 'on', 'showing', 'that shows', 'to show', 'explaining']), det, role('topic')],
    null, 'a diagram of a kind about a topic, without a verb (priority 4, under the statement frames of acts.state: "The cycle of a week is week." is a statement)'],
];
// Role maps: the two parts that name the ends of an edge are part of the thing ("arrow" "from" "a to b").
export const ROLE_MAPS = [
  ['change.link.edge', 'change', 'link', 'thing', 'acts.change.label.edge.ends', 'Label the arrow from A to B no: "from" is part of the thing, the arrow from A to B'],
  ['change.ends.edge', 'change', 'ends', 'thing', 'acts.change.label.edge.ends', 'Label the arrow from A to B no: "A to B" is part of the thing'],
];

export function diagramFrameShard() {
  const lex = Object.entries(lexicons()).map(([name, { doc, items }]) => wire(`w.lang.en.lex.${name}`, 'w.lang.en.lex', [['name', name], ['doc', text(doc)], ...items.map((i) => ['item', text(i)])], SRC));
  const frames = FRAMES.flatMap(([name, act, mode, priority, needs, example, parts, fixed, about]) => [`# ${about}`, ...frameLines(name, { act, mode, set: 'acts', priority, needs, roles: rolesOf(parts), example }, parts, fixed ?? {}, SRC)]);
  const maps = ROLE_MAPS.map(([n, act, r, actRole, frame, doc]) => wire(`w.lang.en.role_map.${n}`, 'w.lang.en.role_map', [['name', n], ['act', act], ['role', r], ['act_role', actRole], ['frame', frame], ['doc', text(doc)]], SRC));
  return `${header({ id: 'w.lang.en/shards/diagram-frames', about: `frames for the diagram edits and requests PSys2 measured (DIAG-GAP, reviewer block 06:00 item 1): ${FRAMES.length} frames (layout direction, edge labels, a diagram of a kind about a topic) and the ${Object.keys(lexicons()).length} lexicons they name, derived from k.diagrams (kind names and words), w.diagram (words for an edge) and the arrangement phrases.`,
    sources: ['hand-core 1 (written in this repository: tools/lang-en-diagram-frames.mjs; the lexicons derived from k.diagrams, w.diagram and w.lang.en hand-arrangements)'], license: 'CC0-1.0', script: 'tools/lang-en-diagram-frames.mjs' })}\n# Lexicons (derived).\n${lex.join('\n')}\n\n${frames.join('\n')}\n\n# Role maps of these frames.\n${maps.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const t = diagramFrameShard();
  writeFileSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'diagram-frames.sop'), t);
  console.log(`diagram-frames.sop: ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`);
}
