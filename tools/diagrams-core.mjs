// k.diagrams (block "04:40", owner 19:41: "a random diagram draws circles; arrangements not understood"): the kinds of
// diagram as knowledge: structure, layout, arrangement, shape conventions, and which knowledge of the catalog fills
// each. Hand-written here (hand-core 1, CC0), with the published works each rests on.
//   node tools/diagrams-core.mjs     writes docs/worlds/k.diagrams/shards/diagrams.sop
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, text } from './import/lib.mjs';

const SRC = 'hand-core 1';
export const SHARD = join(WORLDS_DIR, 'k.diagrams', 'shards', 'diagrams.sop');

export const SOURCES = [
  ['gilbreth1921', 'Gilbreth, F. B. and Gilbreth, L. M. (1921). Process charts. Transactions of the American Society of Mechanical Engineers 43, 1029-1050.', 1921],
  ['iso5807', 'ISO 5807:1985. Information processing: documentation symbols and conventions for data, program and system flowcharts, program network charts and system resources charts. International Organization for Standardization.', 1985],
  ['venn1880', 'Venn, J. (1880). On the diagrammatic and mechanical representation of propositions and reasonings. The London, Edinburgh, and Dublin Philosophical Magazine and Journal of Science 10(59), 1-18.', 1880],
  ['buzan1974', 'Buzan, T. (1974). Use Your Head. London: BBC Books.', 1974],
  ['priestley1765', 'Priestley, J. (1765). A Chart of Biography. London.', 1765],
  ['mccallum1855', 'McCallum, D. C. (1855). Diagram representing a plan of organization of the New York and Erie Railroad. New York.', 1855],
  ['reingold1981', 'Reingold, E. M. and Tilford, J. S. (1981). Tidier drawings of trees. IEEE Transactions on Software Engineering SE-7(2), 223-228.', 1981],
  ['sugiyama1981', 'Sugiyama, K., Tagawa, S. and Toda, M. (1981). Methods for visual understanding of hierarchical system structures. IEEE Transactions on Systems, Man, and Cybernetics 11(2), 109-125.', 1981],
  ['fruchterman1991', 'Fruchterman, T. M. J. and Reingold, E. M. (1991). Graph drawing by force-directed placement. Software: Practice and Experience 21(11), 1129-1164.', 1991],
  ['novak1984', 'Novak, J. D. and Gowin, D. B. (1984). Learning How to Learn. Cambridge University Press.', 1984],
];

// name, form, about, structures, layouts, arrangements (k.layouts), edges, roles, groups, usual for, sources
export const KINDS = [
  ['flowchart', 'flowchart', 'the steps of a process and the decisions between them, joined by arrows from one step to the next; a decision has an arrow for each answer',
    ['graph', 'sequence'], ['top_down', 'left_right'], ['flow', 'column'], 'directed', ['start', 'end', 'process', 'decision', 'data', 'document', 'subprocess', 'connector', 'database'], 'no',
    ['the steps of a method or a recipe', 'how a program decides', 'what to do when something happens'], ['gilbreth1921', 'iso5807', 'sugiyama1981']],
  ['tree', 'tree', 'one thing at the top and the things under it below, each again the top of a smaller tree; a line joins each thing to the one it is under',
    ['whole with parts', 'graph'], ['top_down'], ['tree'], 'undirected', ['root', 'item'], 'no',
    ['kinds and their sub-kinds', 'the parts of a thing and their parts', 'a family tree', 'the places of a country'], ['reingold1981']],
  ['cycle', 'cycle', 'stages that follow each other and come round: an arrow from each stage to the next, and from the last back to the first',
    ['cycle'], ['circular'], ['ring', 'flow'], 'directed', ['stage'], 'no',
    ['a life cycle', 'the water cycle', 'the seasons', 'a process that repeats'], []],
  ['timeline', 'timeline', 'events in order of time along a line, each at its date or place in the order',
    ['sequence'], ['left_right', 'top_down'], ['row', 'column'], 'none', ['event'], 'no',
    ['the events of a story or a life', 'history', 'the months of a year', 'the plan of a project'], ['priestley1765']],
  ['mind map', 'mind_map', 'a topic in the middle and its ideas on branches around it, each idea with branches of its own',
    ['whole with parts'], ['radial'], ['radial'], 'undirected', ['centre', 'branch'], 'no',
    ['what one knows about a topic', 'the aspects of a thing', 'ideas for a story or an essay'], ['buzan1974', 'novak1984']],
  ['Venn diagram', 'venn', 'a circle for each set, the circles overlapping; a thing inside two circles belongs to both sets, a thing outside all of them to none',
    ['whole with parts'], ['overlapping'], [], 'none', ['item'], 'yes',
    ['what two or three things share and what each has alone', 'kinds that overlap', 'sorting things by two features'], ['venn1880']],
  ['org chart', 'org_chart', 'the posts or people of an organisation, each under the one it reports to',
    ['whole with parts', 'graph'], ['top_down'], ['tree'], 'undirected', ['post'], 'no',
    ['who reports to whom in a company or a school', 'the departments of an organisation'], ['mccallum1855']],
  ['network', 'network', 'nodes joined by links, with no top and no order: what is joined to what',
    ['graph'], ['free'], ['scatter'], 'undirected', ['node'], 'no',
    ['countries and their neighbours', 'who knows whom', 'what is joined to what in a machine', 'how ideas relate'], ['fruchterman1991', 'novak1984']],
  ['pipeline', 'pipeline', 'stages a thing passes through one after the other, each stage handing what it makes to the next',
    ['sequence'], ['left_right'], ['flow', 'row'], 'directed', ['stage', 'start', 'end'], 'no',
    ['how a product is made', 'the parts of a genre in order', 'the stages of a project'], []],
  ['comparison table', 'table', 'the things compared in rows, their features in columns, the value of each feature for each thing in its cell',
    ['values by category'], ['grid'], ['grid'], 'none', ['row', 'column', 'cell'], 'no',
    ['comparing animals, countries or products feature by feature', 'pros and cons'], []],
];

// kind, role, shape, about, sources
export const SHAPES = [
  ['flowchart', 'start', 'oval', 'the terminal symbol: where the process starts', ['iso5807']],
  ['flowchart', 'end', 'oval', 'the terminal symbol: where the process ends', ['iso5807']],
  ['flowchart', 'process', 'rectangle', 'a step that does something', ['iso5807']],
  ['flowchart', 'decision', 'diamond', 'a question with an arrow out for each answer (yes, no)', ['iso5807']],
  ['flowchart', 'data', 'parallelogram', 'data put in or given out', ['iso5807']],
  ['flowchart', 'document', 'document', 'a document, a rectangle with a wavy bottom edge', ['iso5807']],
  ['flowchart', 'subprocess', 'double_rectangle', 'a predefined process, told elsewhere: a rectangle with double sides', ['iso5807']],
  ['flowchart', 'connector', 'circle', 'a small circle where a flow line continues elsewhere', ['iso5807']],
  ['flowchart', 'database', 'cylinder', 'direct access storage, a database: a cylinder', ['iso5807']],
  ['tree', 'root', 'rectangle', 'the thing at the top', []],
  ['tree', 'item', 'rectangle', 'a thing under another', []],
  ['cycle', 'stage', 'circle', 'a stage, its arrows going round', []],
  ['timeline', 'event', 'dot', 'a dot on the line at the event\'s time, its label beside it', ['priestley1765']],
  ['mind map', 'centre', 'ellipse', 'the topic in the middle, larger than its branches', ['buzan1974']],
  ['mind map', 'branch', 'rounded_rectangle', 'an idea on a branch', ['buzan1974']],
  ['Venn diagram', 'item', 'dot', 'a thing, inside the circles of the sets it belongs to (the sets are groups drawn as circles)', ['venn1880']],
  ['org chart', 'post', 'rectangle', 'a post or a person, the name and the title in a box', ['mccallum1855']],
  ['network', 'node', 'circle', 'a node, its links as lines', ['fruchterman1991']],
  ['pipeline', 'stage', 'chevron', 'a stage, pointing to the next', []],
  ['pipeline', 'start', 'chevron', 'the first stage', []],
  ['pipeline', 'end', 'chevron', 'the last stage', []],
  ['comparison table', 'row', 'rectangle', 'the header of a row: a thing compared', []],
  ['comparison table', 'column', 'rectangle', 'the header of a column: a feature', []],
  ['comparison table', 'cell', 'rectangle', 'the value of a feature for a thing', []],
];

// kind, type, key, gives, topic, about, by (the k.attributes attribute an order by a rank follows)
export const FILLS = [
  ['flowchart', 'k.procedures.step', 'after', 'edges', 'method', 'the steps of a method of k.procedures, each joined to the steps it comes after'],
  ['flowchart', 'k.procedures.step', 'n', 'order', 'method', 'the steps of a method in their order'],
  ['tree', 'k.kinds.parent', 'is_a', 'edges', 'is_a', 'kinds under their kinds (the up edges of k.kinds: a cow under farm animal and under mammal)'],
  ['tree', 'k.parts.usual', 'has', 'edges', 'name', 'a thing and its usual parts'],
  // block 07:30 item 1 (PSys2 Q17: "a tree of the parts of a car" had no fill): the parts WordNet lists of a thing
  ['tree', 'k.parts.whole', 'has', 'edges', 'name', 'a thing and its own parts as WordNet lists them (a car: accelerator, air bag, bumper, car door ...)'],
  ['tree', 'k.geo.city', 'country', 'edges', 'country', 'a country and its cities'],
  ['cycle', 'k.time.ordered', 'next', 'edges', 'cycle', 'the stages of a cycle of k.time, each joined to the next: the seasons, the months, the life cycle of a frog, the water cycle'],
  ['cycle', 'k.time.ordered', 'n', 'order', 'cycle', 'the stages of a cycle in their order from where it is said to start'],
  ['timeline', 'k.time.ordered', 'n', 'order', 'cycle', 'the times of a cycle in order (months, weekdays)'],
  ['timeline', 'k.story.element', 'n', 'order', null, 'the elements of a story in the order told'],
  // block 07:30 item 2 (PSys2 Q17): ordered sets of k.space as timelines, and everyday procedures as flowcharts
  ['timeline', 'k.space.body', 'order', 'order', 'kind', 'the planets in their order from the Sun, Mercury to Neptune', 'distance'],
  ['timeline', 'k.space.body', 'size_rank', 'order', 'kind', 'the planets from the largest to the smallest, Jupiter to Mercury', 'size'],
  ['flowchart', 'k.procedures.howto_step', 'after', 'edges', 'howto', 'the steps of an everyday procedure (making tea, washing hands, planting a seed), each joined to the steps it comes after; a decision is a question with the answers yes and no'],
  ['flowchart', 'k.procedures.howto_step', 'n', 'order', 'howto', 'the steps of an everyday procedure in their order'],
  ['mind map', 'k.parts.usual', 'has', 'edges', 'name', 'a thing in the middle, its parts on branches'],
  ['mind map', 'k.parts.whole', 'has', 'edges', 'name', 'a thing in the middle, its own parts (as WordNet lists them) on branches'],
  ['mind map', 'k.attributes.aspect', 'name', 'values', null, 'the aspects of a thing (what it is, looks like, does, where it lives) as branches'],
  ['Venn diagram', 'k.kinds.parent', 'is_a', 'members', 'is_a', 'things in the sets of their kinds; a thing of two kinds lies in the overlap'],
  ['network', 'k.geo.country', 'neighbour', 'edges', null, 'countries joined to their neighbours'],
  ['network', 'k.layouts.joins', 'b', 'edges', null, 'what is joined to what (a part of, attaches to, sits on)'],
  ['network', 'k.kinds.relation', 'object', 'edges', null, 'the typed relations of the catalog: a key of a kind of thing joined to the kind of its values'],
  ['pipeline', 'k.genres.part', 'n', 'order', 'genre', 'the parts of a genre in order'],
  ['pipeline', 'k.procedures.step', 'n', 'order', 'method', 'the steps of a method, one after the other'],
  ['pipeline', 'k.procedures.howto_step', 'n', 'order', 'howto', 'the steps of an everyday procedure, one after the other'],
  ['comparison table', 'k.attributes.number', 'name', 'values', null, 'things in rows, their numbers (legs, size, weight, speed) in columns'],
];

export function shardText() {
  const lines = [];
  for (const [name, cite, year] of SOURCES) lines.push(wire(`k.diagrams.source.${name}`, 'k.diagrams.source', [['name', name], ['cite', text(cite)], ['year', year]], SRC));
  for (const [name, form, about, structures, layouts, arranged, edges, roles, groups, usual, sources] of KINDS) lines.push(wire(`k.diagrams.kind.${seg(name)}`, 'k.diagrams.kind', [
    ['name', name], ['form', form], ['about', text(about)], ...structures.map((s) => ['structure', s]), ...layouts.map((l) => ['layout', l]), ...arranged.map((a) => ['arranged', a]),
    ['edges', edges], ...roles.map((r) => ['role', r]), ['groups', groups], ...usual.map((u) => ['usual_for', text(u)]), ...sources.map((s) => ['source', s])], SRC));
  for (const [kind, role, shape, about, sources] of SHAPES) lines.push(wire(`k.diagrams.shape.${seg(kind)}.${role}`, 'k.diagrams.shape', [['kind', kind], ['role', role], ['shape', shape], ['about', text(about)], ...sources.map((s) => ['source', s])], SRC));
  for (const [kind, type, key, gives, topic, about, by] of FILLS) lines.push(wire(`k.diagrams.fill.${seg(kind)}.${seg(type)}.${key}`, 'k.diagrams.fill', [['kind', kind], ['type', type], ['key', key], ['gives', gives], ['topic', topic], ['about', text(about)], ['by', by]], SRC));
  return `${header({ id: 'k.diagrams/shards/diagrams', about: `${KINDS.length} kinds of diagram (structure, layout, arrangement, edges, roles, uses), ${SHAPES.length} shape conventions, ${FILLS.length} ways the catalog's knowledge fills them, and the ${SOURCES.length} works they rest on.`,
    sources: ['hand-core 1 (hand-written in this repository: tools/diagrams-core.mjs; the works cited are the k.diagrams.source facts)'], license: 'CC0-1.0', script: 'tools/diagrams-core.mjs' })}\n${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  mkdirSync(join(WORLDS_DIR, 'k.diagrams', 'shards'), { recursive: true });
  const t = shardText();
  writeFileSync(SHARD, t);
  console.log(`diagrams.sop: ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`);
}
