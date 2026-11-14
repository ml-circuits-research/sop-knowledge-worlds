// Structural descriptions of worlds, for alignment (block "21:05" item 4, ABSTRACTION ROUND): each world schema (w.*)
// and each knowledge world whose things a live world makes or reads says which structures it is ("items in slots
// under constraints", "a whole with parts", "a sequence", "a graph of nodes and links", "things placed in a space",
// "values by category"), and which of its types, keys or acts plays each role of the structure. Two worlds of one
// structure are aligned role by role, so the library computes an analogy (a guest in a seat ~ an event at a time ~ a
// thing in a slot of a layout) instead of a hand-made pair.
// The library's Q61 (its answer to our Q60, block 02:00): per role, the direction (`refers`: the role it points to: a
// slot to its container, the key `assigned` to the slot), the cardinality (`many`) and `required`, with `of` (the role
// whose key a key role is); and the constraints of each structure as facts (`k.kinds.constraint`: capacity, distinct,
// order), each with the worlds where a rule or the facts of the world hold it.
//   node tools/structures-core.mjs     writes docs/worlds/k.kinds/shards/structures.sop
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, writeShards, text } from './import/lib.mjs';

const SRC = 'hand-core 1';

// Per role of each structure: `refers` the role it points to, `of` the role whose key it is (a key role), and `many`:
// for a key role, whether the key holds several values (an item has one slot: assigned many=false); for a role that is
// a thing, whether one thing of the role it refers to (else one world) holds several of it (a container holds many
// slots, a slot many items up to the capacity). `required` = the structure needs it (the first two roles).
export const ROLE_FACTS = {
  assignment: { item: { refers: 'slot', many: true }, slot: { refers: 'container', many: true }, assigned: { of: 'item', refers: 'slot', many: false },
    container: { many: true }, slot_of: { of: 'slot', refers: 'container', many: false }, capacity: { of: 'container', many: false }, order: { of: 'slot', many: false }, constraint: { many: true } },
  'whole with parts': { whole: { many: true }, part: { refers: 'whole', many: true }, part_of: { of: 'part', refers: 'whole', many: false }, part_kind: { of: 'part', many: false },
    position: { of: 'part', many: false }, size: { of: 'part', many: false }, order: { of: 'part', many: false } },
  sequence: { element: { refers: 'sequence', many: true }, position: { of: 'element', many: false }, sequence: { many: true }, element_of: { of: 'element', refers: 'sequence', many: false },
    end: { of: 'element', many: false }, start: { of: 'sequence', many: false }, finish: { of: 'sequence', many: false }, next: { of: 'element', refers: 'element', many: false } },
  graph: { node: { many: true }, link: { refers: 'node', many: true }, from: { of: 'link', refers: 'node', many: false }, to: { of: 'link', refers: 'node', many: false }, label: { of: 'link', many: false } },
  placement: { thing: { refers: 'space', many: true }, position: { of: 'thing', many: false }, space: { many: true }, layer: { of: 'thing', many: false }, size: { of: 'thing', many: false } },
  'values by category': { value: { refers: 'series', many: true }, category: { of: 'value', many: false }, series: { many: true }, value_of: { of: 'value', refers: 'series', many: false },
    unit: { of: 'series', many: false }, order: { of: 'value', many: false } },
};

// The constraints: [structure, name, kind, on (a role), about, worlds where it holds, `by` the rules that make it hold
// there (wire ids of the world schemas; none: the facts hold it, checked by tests/k.kinds.structures.test.mjs)].
export const CONSTRAINTS = [
  ['assignment', 'capacity', 'capacity', 'container', 'a container takes at most as many slots or items as its capacity', ['w.seating'], ['w.seating.room']],
  ['assignment', 'within', 'order', 'assigned', 'the slot an item is given lies inside the bounds of its container', ['w.timeline'], ['w.timeline.inside.before', 'w.timeline.inside.after', 'w.timeline.inside.lasts_after']],
  ['whole with parts', 'one_of_each_kind', 'distinct', 'part_kind', 'a whole has at most one part of each kind', ['w.face'], ['w.face.one']],
  ['sequence', 'ends_after_start', 'order', 'end', 'an element does not end before its position', ['w.timeline'], ['w.timeline.order.ends']],
  ['sequence', 'distinct_positions', 'distinct', 'position', 'no two elements of one sequence share a position', ['k.genres', 'k.procedures', 'k.story'], []],
  ['graph', 'no_self_link', 'distinct', 'link', 'a link joins a node to another node, never to itself', ['k.geo'], []],
];

// The structures: name, about, roles in order (the first two are needed: every world of the structure casts them),
// and what each role is.
export const STRUCTURES = [
  { name: 'assignment', about: 'items in slots under constraints: each item is given one slot of a container; a slot holds a limited number of items', roles: [
    ['item', 'what is assigned'], ['slot', 'where an item goes'], ['assigned', 'the key of an item that names its slot'], ['container', 'what holds the slots'],
    ['slot_of', 'the key of a slot that names its container'], ['capacity', 'how many slots or items a container takes'], ['order', 'the place of a slot among those of its container'], ['constraint', 'a limit or a rule on the assignment']] },
  { name: 'whole with parts', about: 'a whole made of parts: each part belongs to one whole, has a kind, and may have a place and a size in the whole', roles: [
    ['whole', 'the whole'], ['part', 'a part'], ['part_of', 'the key of a part that names its whole'], ['part_kind', 'what kind of part it is (a type or a key)'],
    ['position', 'where the part is in the whole'], ['size', 'how big the part is'], ['order', 'the place of a part among the parts']] },
  { name: 'sequence', about: 'elements in an order (of time, of reading, of steps): each element has a position in its sequence; some have a start and an end', roles: [
    ['element', 'an element'], ['position', 'its place or time in the sequence'], ['sequence', 'what holds the elements'], ['element_of', 'the key of an element that names its sequence'],
    ['end', 'where an element that lasts ends'], ['start', 'where the sequence starts'], ['finish', 'where the sequence ends'], ['next', 'the element that comes after']] },
  { name: 'graph', about: 'nodes and the links between them, each link from one node to another with a label', roles: [
    ['node', 'a node'], ['link', 'a link (a type, a key that names another node, or the act that makes one)'], ['from', 'the node a link starts at'], ['to', 'the node a link goes to'], ['label', 'what kind of link it is']] },
  { name: 'placement', about: 'things placed in a space: each thing has a position, and may have a layer and a size', roles: [
    ['thing', 'a thing placed'], ['position', 'where it is'], ['space', 'the space it is placed in'], ['layer', 'what is drawn above what'], ['size', 'how big it is']] },
  { name: 'values by category', about: 'numbers by category: each value belongs to a series and stands at a category', roles: [
    ['value', 'a number'], ['category', 'where a value stands'], ['series', 'what holds the values'], ['value_of', 'the key of a value that names its series'], ['unit', 'the unit of the values'], ['order', 'the place of a value in its series']] },
];

// How each world is each structure: [world, structure, about, [role, filler, as] ...]. A filler is a type (as type),
// a key written type.key (as key) or an act of k.actions (as act).
const T = 'type', K = 'key', A = 'act';
export const FORMS = [
  ['w.seating', 'assignment', 'guests are given seats; a table holds a number of seats', [
    ['item', 'w.seating.guest', T], ['slot', 'w.seating.seat', T], ['assigned', 'w.seating.guest.seat', K], ['container', 'w.seating.table', T], ['slot_of', 'w.seating.seat.table', K],
    ['capacity', 'w.seating.table.seats', K], ['order', 'w.seating.seat.n', K]]],
  ['w.seating', 'graph', 'guests are linked (next to, apart from, with)', [['node', 'w.seating.guest', T], ['link', 'connect', A]]],
  ['w.seating', 'placement', 'tables stand at a place in the room', [['thing', 'w.seating.table', T], ['position', 'w.seating.table.x', K], ['position', 'w.seating.table.y', K]]],
  ['w.timeline', 'sequence', 'events in order of time on a timeline', [
    ['element', 'w.timeline.event', T], ['position', 'w.timeline.event.at', K], ['sequence', 'w.timeline.timeline', T], ['element_of', 'w.timeline.event.timeline', K],
    ['end', 'w.timeline.event.until', K], ['start', 'w.timeline.timeline.from', K], ['finish', 'w.timeline.timeline.to', K]]],
  ['w.timeline', 'assignment', 'each event is given a time of its timeline; an event stays inside its timeline', [
    ['item', 'w.timeline.event', T], ['slot', 'w.timeline.event.at', K], ['assigned', 'w.timeline.event.at', K], ['container', 'w.timeline.timeline', T], ['constraint', 'w.timeline.timeline.from', K], ['constraint', 'w.timeline.timeline.to', K]]],
  ['w.timeline', 'graph', 'events are linked (leads to, causes)', [['node', 'w.timeline.event', T], ['link', 'connect', A]]],
  ['w.list', 'sequence', 'items in order on a list', [['element', 'w.list.item', T], ['position', 'w.list.item.n', K], ['sequence', 'w.list.list', T], ['element_of', 'w.list.item.list', K]]],
  ['w.face', 'whole with parts', 'a face made of parts of kinds (eyes, nose, mouth), each with a variant, a place and a size', [
    ['whole', 'w.face.face', T], ['part', 'w.face.part', T], ['part_of', 'w.face.part.face', K], ['part_kind', 'w.face.part.variant', K], ['position', 'w.face.part.x', K], ['position', 'w.face.part.y', K], ['size', 'w.face.part.size', K]]],
  ['w.face', 'placement', 'the parts of a face are placed on it', [['thing', 'w.face.part', T], ['position', 'w.face.part.x', K], ['position', 'w.face.part.y', K], ['space', 'w.face.face', T], ['size', 'w.face.part.size', K]]],
  ['w.map', 'placement', 'places and pins on a map view', [['thing', 'w.map.place', T], ['thing', 'w.map.pin', T], ['position', 'w.map.pin.on', K], ['space', 'w.map.view', T], ['layer', 'w.map.view.layer', K]]],
  ['w.document', 'whole with parts', 'a document made of chapters, sections, paragraphs, slides and sentences', [
    ['whole', 'w.document.document', T], ['part', 'w.document.chapter', T], ['part', 'w.document.section', T], ['part', 'w.document.paragraph', T], ['part', 'w.document.slide', T], ['part', 'w.document.sentence', T],
    ['part_of', 'w.document.chapter.document', K], ['part_of', 'w.document.section.chapter', K], ['part_of', 'w.document.paragraph.section', K], ['part_of', 'w.document.slide.document', K], ['part_of', 'w.document.sentence.paragraph', K],
    ['part_kind', 'w.document.chapter.part', K], ['order', 'w.document.chapter.n', K], ['order', 'w.document.sentence.n', K]]],
  ['w.document', 'sequence', 'sentences in the order they are read', [['element', 'w.document.sentence', T], ['position', 'w.document.sentence.n', K], ['sequence', 'w.document.paragraph', T], ['element_of', 'w.document.sentence.paragraph', K]]],
  ['w.chart', 'values by category', 'values of series by category in a chart', [
    ['value', 'w.chart.point', T], ['category', 'w.chart.point.category', K], ['series', 'w.chart.series', T], ['value_of', 'w.chart.point.series', K], ['unit', 'w.chart.chart.unit', K], ['order', 'w.chart.point.n', K]]],
  ['w.chart', 'whole with parts', 'a chart made of series', [['whole', 'w.chart.chart', T], ['part', 'w.chart.series', T], ['part_of', 'w.chart.series.chart', K], ['order', 'w.chart.series.n', K]]],
  // knowledge worlds whose things a live world makes or reads
  ['k.layouts', 'assignment', 'things go in the slots of a named arrangement', [
    ['item', 'k.layouts.slot.holds', K], ['slot', 'k.layouts.slot', T], ['assigned', 'k.layouts.slot.holds', K], ['container', 'k.layouts.layout', T], ['slot_of', 'k.layouts.slot.layout', K],
    ['capacity', 'k.layouts.slot.count', K], ['constraint', 'k.layouts.relation', T]]],
  ['k.layouts', 'graph', 'what joins what: a part of, attaches to, sits on', [['node', 'k.layouts.joins.a', K], ['link', 'k.layouts.joins', T], ['from', 'k.layouts.joins.a', K], ['to', 'k.layouts.joins.b', K], ['label', 'k.layouts.joins.rel', K]]],
  ['k.layouts', 'placement', 'slots of an arrangement and anchors on a drawing have a box', [['thing', 'k.layouts.slot', T], ['thing', 'k.layouts.anchor', T], ['position', 'k.layouts.slot.x', K], ['position', 'k.layouts.slot.y', K], ['size', 'k.layouts.slot.w', K], ['space', 'k.layouts.layout', T]]],
  ['k.objects', 'whole with parts', 'a drawing made of named parts', [['whole', 'k.objects.object', T], ['part', 'k.objects.part', T], ['part_of', 'k.objects.part.of', K], ['part_kind', 'k.objects.part.kind', K]]],
  ['k.objects', 'graph', 'parts of a drawing are above, below, inside, on each other', [['node', 'k.objects.part', T], ['link', 'k.objects.part.above', K], ['link', 'k.objects.part.inside', K], ['link', 'k.objects.part.on', K]]],
  ['k.faces', 'whole with parts', 'a face preset made of a variant for each slot', [['whole', 'k.faces.preset', T], ['part', 'k.faces.variant', T], ['part_kind', 'k.faces.variant.slot', K]]],
  ['k.faces', 'placement', 'the slots of a face have a box and a depth', [['thing', 'k.faces.slot', T], ['position', 'k.faces.slot.x', K], ['position', 'k.faces.slot.y', K], ['size', 'k.faces.slot.w', K], ['layer', 'k.faces.slot.z', K]]],
  ['k.parts', 'whole with parts', 'the usual parts of a thing', [['whole', 'k.parts.usual', T], ['part', 'k.parts.usual.has', K]]],
  ['k.scenes', 'placement', 'the things of a scene, each at its usual place', [['thing', 'k.scenes.has', T], ['position', 'k.scenes.has.where', K], ['space', 'k.scenes.scene', T], ['size', 'k.scenes.thing.size', K]]],
  ['k.scenes', 'whole with parts', 'a scene has things, as many as it has', [['whole', 'k.scenes.scene', T], ['part', 'k.scenes.has', T], ['part_of', 'k.scenes.has.scene', K], ['part_kind', 'k.scenes.has.thing', K]]],
  ['k.time', 'sequence', 'the times of a cycle in order (months, weekdays, seasons, hours)', [['element', 'k.time.ordered', T], ['position', 'k.time.ordered.n', K], ['sequence', 'k.time.cycle', T], ['element_of', 'k.time.ordered.cycle', K], ['next', 'k.time.ordered.next', K], ['start', 'k.time.cycle.first', K], ['finish', 'k.time.cycle.last', K]]],
  ['k.story', 'sequence', 'the elements of a story in the order told', [['element', 'k.story.element', T], ['position', 'k.story.element.n', K]]],
  ['k.story', 'graph', 'constraints between the elements of a story', [['node', 'k.story.element', T], ['link', 'k.story.constraint', T], ['from', 'k.story.constraint.element', K], ['to', 'k.story.constraint.other', K], ['label', 'k.story.constraint.relation', K]]],
  ['k.genres', 'sequence', 'the parts of a genre in order, and the steps of each part', [['element', 'k.genres.part', T], ['position', 'k.genres.part.n', K], ['sequence', 'k.genres.genre', T], ['element_of', 'k.genres.part.genre', K]]],
  ['k.genres', 'whole with parts', 'a genre made of parts with counts', [['whole', 'k.genres.genre', T], ['part', 'k.genres.part', T], ['part_of', 'k.genres.part.genre', K], ['order', 'k.genres.part.n', K]]],
  ['k.procedures', 'sequence', 'the steps of a method in order', [['element', 'k.procedures.step', T], ['position', 'k.procedures.step.n', K], ['sequence', 'k.procedures.method', T], ['element_of', 'k.procedures.step.method', K]]],
  ['k.procedures', 'graph', 'a step comes after other steps', [['node', 'k.procedures.step', T], ['link', 'k.procedures.step.after', K]]],
  ['k.geo', 'graph', 'countries and their neighbours', [['node', 'k.geo.country', T], ['link', 'k.geo.country.neighbour', K]]],
  ['k.geo', 'whole with parts', 'a country has cities; a continent has countries', [['whole', 'k.geo.country', T], ['part', 'k.geo.city', T], ['part_of', 'k.geo.city.country', K]]],
];

const castId = (world, structure, role, filler) => `k.kinds.cast.${world}.${seg(structure)}.${role}.${seg(filler)}`;

export function structuresShard() {
  const lines = [];
  for (const s of STRUCTURES) lines.push(wire(`k.kinds.structure.${seg(s.name)}`, 'k.kinds.structure', [['name', s.name], ['about', text(s.about)], ...s.roles.map((r) => ['role', r[0]]), ...s.roles.slice(0, 2).map((r) => ['needs', r[0]])], SRC));
  for (const s of STRUCTURES) for (const [i, [r, about]] of s.roles.entries()) {
    const f = ROLE_FACTS[s.name][r];
    lines.push(wire(`k.kinds.role.${seg(s.name)}.${r}`, 'k.kinds.role', [['structure', s.name], ['name', r], ['about', text(about)], ['of', f.of], ['refers', f.refers], ['many', String(f.many)], ['required', String(i < 2)]], SRC));
  }
  for (const [structure, name, kind, on, about, worlds, by] of CONSTRAINTS) lines.push(wire(`k.kinds.constraint.${seg(structure)}.${name}`, 'k.kinds.constraint', [['structure', structure], ['name', name], ['kind', kind], ['on', on], ['about', text(about)], ...worlds.map((w) => ['world', w]), ...by.map((b) => ['by', b])], SRC));
  for (const [world, structure, about, cast] of FORMS) {
    lines.push(wire(`k.kinds.form.${world}.${seg(structure)}`, 'k.kinds.form', [['world', world], ['structure', structure], ['about', text(about)]], SRC));
    for (const [role, filler, as] of cast) lines.push(wire(castId(world, structure, role, filler), 'k.kinds.cast', [['world', world], ['structure', structure], ['role', role], ['filler', filler], ['as', as]], SRC));
  }
  return `${header({ id: 'k.kinds/shards/structures', about: `the structures of worlds, for alignment: ${STRUCTURES.length} structures with their roles (direction, cardinality, required) and ${CONSTRAINTS.length} constraints, and how ${new Set(FORMS.map((f) => f[0])).size} worlds are each (${FORMS.length} forms, ${FORMS.reduce((n, f) => n + f[3].length, 0)} roles cast to their types, keys and acts).`,
    sources: ['hand-core 1 (hand-written in this repository: tools/structures-core.mjs)'], license: 'CC0-1.0', script: 'tools/structures-core.mjs' })}\n${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const t = structuresShard();
  writeShards(join(WORLDS_DIR, 'k.kinds', 'shards'), { 'structures.sop': t }, 'structures');
  console.log(`structures.sop: ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`);
}
