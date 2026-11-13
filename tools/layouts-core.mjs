// The hand-written core of k.layouts (Round 7 addendum 2): named arrangements, anchors, what joins what.
//   node tools/layouts-core.mjs     writes docs/worlds/k.layouts/shards/layouts.sop (the arrangements of this file),
//                                   anchors.sop (from sources/hand-core/anchors.tsv and the parts of the
//                                   hand-written k.objects objects) and joins.sop (from sources/hand-core/joins.tsv)
// Deterministic: the same data, tables and k.objects shards give the same files.
// A layout: [name, kind, about, { ordered, usual, words }, slots, relations].
// A slot: [name, count, { pair, optional, holds, arranged, box: [x, y, w, h] }]; a relation: [a, rel, b, among].
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds } from './lib/worlds.mjs';
import { wire, header, seg, text, writeShards } from './import/lib.mjs';

const SRC = 'hand-core 1';
const R = 'repeating', F = 'fixed';
const item = (holds = ['thing']) => ['item', 'many', { holds }];

// The slots of the face are those of k.faces (style plain); their boxes are read from there, see faceSlots().
const FACE_HOLDS = { head: ['head shape'], hair_back: ['long hair'], hair_front: ['hair', 'fringe'], ears: ['ear'], neck: ['neck'], shoulders: ['shoulders', 'clothes'], eyebrows: ['eyebrow'], eyes: ['eye'], nose: ['nose'], mouth: ['mouth'], cheeks: ['blush', 'freckles'], beard: ['beard'], moustache: ['moustache'], glasses: ['glasses', 'sunglasses'], earrings: ['earring'], hat: ['hat', 'cap', 'crown', 'helmet'] };

export const LAYOUTS = [
  ['row', R, 'Things side by side on one line, from left to right.', { ordered: true, usual: ['things of one kind shown side by side', 'people in a queue', 'houses along a street', 'the letters of a word', 'the wagons of a train'], words: ['rows', 'line', 'queue', 'side by side', 'in a row', 'next to each other', 'horizontal', 'lined up'] },
    [item()], [['item', 'left_of', 'item', 'neighbours'], ['item', 'aligned_row', 'item', 'all'], ['item', 'evenly_spaced', 'item', 'neighbours']]],
  ['column', R, 'Things one above the other, from top to bottom.', { ordered: true, usual: ['the lines of a list', 'the floors of a building', 'the lights of a traffic light', 'the steps of a recipe'], words: ['columns', 'one above the other', 'vertical', 'list', 'top to bottom'] },
    [item()], [['item', 'above', 'item', 'neighbours'], ['item', 'aligned_column', 'item', 'all'], ['item', 'evenly_spaced', 'item', 'neighbours']]],
  ['grid', R, 'Things in rows and columns, all cells the same size.', { usual: ['a table of values', 'the windows of a tall building', 'the days of a calendar', 'a chessboard', 'eggs in a box', 'many small pictures'], words: ['grids', 'table', 'matrix', 'rows and columns', 'checkerboard', 'lattice', 'tiles'] },
    [['row', 'many', { holds: ['row of things'], arranged: 'row' }]], [['row', 'above', 'row', 'neighbours'], ['row', 'aligned_column', 'row', 'all'], ['row', 'same_size', 'row', 'all'], ['row', 'evenly_spaced', 'row', 'neighbours']]],
  ['ring', R, 'Things in a circle, around a middle that may be empty.', { ordered: true, usual: ['people holding hands in a circle', 'the numbers of a clock', 'the petals of a flower', 'chairs round a table', 'the stones of a necklace'], words: ['rings', 'circle', 'in a circle', 'round', 'loop', 'wreath', 'around'] },
    [item(), ['centre', 'one', { optional: true, holds: ['thing they stand around'] }]], [['item', 'around', 'centre'], ['item', 'beside', 'item', 'neighbours'], ['item', 'evenly_spaced', 'item', 'neighbours']]],
  ['scatter', R, 'Things spread over an area with no order, not touching.', { usual: ['stars in the sky', 'flowers in a meadow', 'sheep in a field', 'toys on the floor', 'fish in the sea', 'raisins in a cake'], words: ['scattered', 'here and there', 'random', 'spread out', 'sprinkled', 'all over'] },
    [item()], [['item', 'apart', 'item', 'all']]],
  ['corners', F, 'Four things in the four corners, with or without a fifth in the middle.', { usual: ['four things of equal weight', 'the ornaments of a page', 'the players of a board game', 'the five of a die'], words: ['in the corners', 'four corners', 'corner'] },
    [['top_left', 'one', { box: [0, 0, 30, 30] }], ['top_right', 'one', { box: [70, 0, 30, 30] }], ['bottom_left', 'one', { box: [0, 70, 30, 30] }], ['bottom_right', 'one', { box: [70, 70, 30, 30] }], ['centre', 'one', { optional: true, box: [30, 30, 40, 40] }]],
    [['top_left', 'left_of', 'top_right'], ['bottom_left', 'left_of', 'bottom_right'], ['top_left', 'above', 'bottom_left'], ['top_right', 'above', 'bottom_right'], ['top_left', 'aligned_row', 'top_right'], ['bottom_left', 'aligned_row', 'bottom_right'], ['top_left', 'aligned_column', 'bottom_left'], ['top_right', 'aligned_column', 'bottom_right'], ['top_left', 'same_size', 'bottom_right']]],
  ['stack', R, 'Things lying on top of each other, each resting on the one below.', { ordered: true, usual: ['books', 'plates', 'boxes', 'the blocks of a tower', 'pancakes', 'coins'], words: ['stacks', 'pile', 'heap', 'tower', 'on top of each other', 'stacked', 'piled'] },
    [item()], [['item', 'on', 'item', 'neighbours'], ['item', 'aligned_column', 'item', 'all']]],
  ['pyramid', R, 'Rows on top of each other, each shorter than the one below.', { ordered: true, usual: ['tins in a shop', 'acrobats standing on each other', 'oranges on a stall', 'the steps of a podium', 'bricks'], words: ['pyramids', 'triangle of things', 'human pyramid'] },
    [['row', 'many', { holds: ['row of things'], arranged: 'row' }]], [['row', 'on', 'row', 'neighbours'], ['row', 'smaller_than', 'row', 'neighbours'], ['row', 'aligned_column', 'row', 'all']]],
  ['tree', F, 'One thing at the top, its children in a row below it, each child again the top of a smaller tree; lines join parent and child.', { usual: ['a family tree', 'kinds and their sub-kinds', 'who leads whom in a company', 'folders and files', 'the rounds of a tournament'], words: ['trees', 'hierarchy', 'family tree', 'branches', 'organisation chart', 'branching'] },
    [['root', 'one', { holds: ['parent'], box: [40, 0, 20, 20] }], ['child', 'many', { holds: ['child', 'smaller tree'], arranged: 'row', box: [0, 45, 100, 55] }]],
    [['root', 'above', 'child'], ['root', 'aligned_column', 'child'], ['root', 'joined_to', 'child'], ['child', 'left_of', 'child', 'neighbours'], ['child', 'aligned_row', 'child', 'all']]],
  ['flow', R, 'Steps one after the other, an arrow from each step to the next.', { ordered: true, usual: ['the steps of a process', 'a recipe', 'a life cycle', 'cause and effect', 'what happens in a story', 'a timeline'], words: ['flows', 'flowchart', 'flow chart', 'sequence', 'steps', 'process', 'chain', 'timeline', 'one after the other'] },
    [['step', 'many', { holds: ['step', 'box'] }]], [['step', 'left_of', 'step', 'neighbours'], ['step', 'joined_to', 'step', 'neighbours'], ['step', 'aligned_row', 'step', 'all'], ['step', 'evenly_spaced', 'step', 'neighbours']]],
  ['radial', F, 'One thing in the middle and the others around it, each joined to the middle by a line.', { usual: ['a mind map', 'a sun with its rays', 'a wheel with its spokes', 'a main idea with its examples', 'a town with its roads'], words: ['mind map', 'hub and spokes', 'spokes', 'spider diagram', 'star shape', 'rays'] },
    [['centre', 'one', { holds: ['main thing'], box: [35, 35, 30, 30] }], item()], [['item', 'around', 'centre'], ['centre', 'joined_to', 'item'], ['item', 'evenly_spaced', 'item', 'neighbours']]],
  ['nested', R, 'Things inside each other, the biggest outside.', { ordered: true, usual: ['dolls that fit into each other', 'the rings of a target', 'the rings of a tree trunk', 'a box in a box', 'a group and its smaller groups'], words: ['inside each other', 'one inside the other', 'concentric', 'target', 'nesting'] },
    [item()], [['item', 'around', 'item', 'neighbours'], ['item', 'aligned_column', 'item', 'all'], ['item', 'aligned_row', 'item', 'all']]],
  ['border', F, 'One thing in the middle and others all along the edge around it.', { usual: ['a picture in its frame', 'a fence round a field', 'the wall round a town', 'seats round a pitch', 'a title page with ornaments'], words: ['borders', 'frame', 'edging', 'surround', 'all around', 'along the edge'] },
    [['centre', 'one', { holds: ['main thing'], box: [15, 15, 70, 70] }], ['edge', 'many', { holds: ['small thing', 'ornament', 'post'] }]], [['edge', 'around', 'centre'], ['edge', 'evenly_spaced', 'edge', 'neighbours'], ['edge', 'same_size', 'edge', 'all']]],
  ['landscape', F, 'An outdoor view: the sky above the ground, far things on the horizon, water lying in the ground, small things in front.', { usual: ['an outdoor scene', 'a farm', 'a beach', 'a village', 'a view of the countryside'], words: ['landscapes', 'scenery', 'view', 'countryside', 'outdoor scene', 'panorama', 'horizon'] },
    [['sky', 'one', { holds: ['sun', 'moon', 'cloud', 'star', 'bird', 'rainbow', 'plane'], arranged: 'scatter', box: [0, 0, 100, 50] }], ['far', 'many', { optional: true, holds: ['mountain', 'hill', 'forest', 'far house'], arranged: 'row', box: [0, 32, 100, 20] }],
      ['ground', 'one', { holds: ['tree', 'house', 'animal', 'person', 'road', 'fence'], box: [0, 50, 100, 50] }], ['water', 'one', { optional: true, holds: ['pond', 'lake', 'river', 'boat', 'duck'], box: [10, 62, 45, 22] }], ['foreground', 'many', { optional: true, holds: ['flower', 'grass', 'stone', 'small animal'], arranged: 'row', box: [0, 86, 100, 14] }]],
    [['sky', 'above', 'ground'], ['sky', 'above', 'far'], ['far', 'above', 'ground'], ['far', 'behind', 'ground'], ['water', 'inside', 'ground'], ['foreground', 'inside', 'ground'], ['ground', 'behind', 'foreground'], ['water', 'above', 'foreground'], ['sky', 'same_size', 'ground']]],
  ['room', F, 'An indoor view: the floor below the back wall, the ceiling on top, furniture standing on the floor, small things on the furniture.', { usual: ['a kitchen', 'a bedroom', 'a classroom', 'a shop', 'any indoor scene'], words: ['rooms', 'interior', 'indoors', 'inside a house', 'indoor scene'] },
    [['ceiling', 'one', { holds: ['lamp'], box: [0, 0, 100, 10] }], ['back_wall', 'one', { holds: ['window', 'picture', 'clock', 'shelf', 'door'], arranged: 'row', box: [0, 10, 100, 50] }], ['floor', 'one', { holds: ['rug'], box: [0, 60, 100, 40] }],
      ['furniture', 'many', { holds: ['table', 'chair', 'bed', 'sofa', 'cupboard'], arranged: 'row', box: [5, 45, 90, 45] }], ['small_things', 'many', { optional: true, holds: ['cup', 'book', 'lamp', 'toy', 'vase'], box: [10, 40, 80, 15] }]],
    [['ceiling', 'above', 'back_wall'], ['back_wall', 'above', 'floor'], ['back_wall', 'behind', 'furniture'], ['furniture', 'on', 'floor'], ['small_things', 'on', 'furniture'], ['small_things', 'smaller_than', 'furniture']]],
  ['family photo', F, 'A group of people facing the viewer: the tall ones in a row at the back, the small ones in a row in front of them.', { usual: ['a family', 'a sports team', 'a school class', 'a wedding party', 'a band'], words: ['family photos', 'group photo', 'group picture', 'family picture', 'family portrait', 'team photo', 'class photo'] },
    [['back_row', 'many', { holds: ['adult', 'grandparent', 'tall person'], arranged: 'row', box: [10, 10, 80, 60] }], ['front_row', 'many', { holds: ['child', 'sitting person'], arranged: 'row', box: [20, 45, 60, 50] }], ['pet', 'one', { optional: true, holds: ['dog', 'cat'], box: [80, 72, 16, 22] }]],
    [['back_row', 'behind', 'front_row'], ['back_row', 'above', 'front_row'], ['back_row', 'aligned_column', 'front_row'], ['front_row', 'smaller_than', 'back_row'], ['front_row', 'left_of', 'pet'], ['pet', 'smaller_than', 'front_row']]],
  ['face', F, 'A face seen from the front: the eyes in the middle of the head, the eyebrows above them, the nose below, the mouth below the nose, an ear on each side, hair and a hat on top, the neck and shoulders below.', { usual: ['a portrait', 'an avatar', 'a mask', "a doll's head", 'a smiley'], words: ['faces', 'portrait', 'avatar', 'head and shoulders'] },
    'k.faces',
    [['eyes', 'inside', 'head'], ['nose', 'inside', 'head'], ['mouth', 'inside', 'head'], ['eyebrows', 'above', 'eyes'], ['eyes', 'above', 'nose'], ['nose', 'above', 'mouth'], ['nose', 'above', 'moustache'], ['moustache', 'above', 'mouth'], ['eyes', 'above', 'cheeks'], ['ears', 'beside', 'head'], ['ears', 'above', 'earrings'],
      ['glasses', 'around', 'eyes'], ['hair_front', 'above', 'eyebrows'], ['hat', 'above', 'eyes'], ['hat', 'on', 'head'], ['head', 'above', 'neck'], ['neck', 'above', 'shoulders'], ['hair_back', 'behind', 'head'], ['hair_back', 'around', 'head'], ['shoulders', 'behind', 'neck'], ['mouth', 'inside', 'beard'], ['eyes', 'aligned_column', 'eyebrows'], ['nose', 'aligned_column', 'mouth'], ['eyes', 'smaller_than', 'head']]],
];

// The slots of the face: the k.faces slots of style plain, in their draw order, with their boxes.
export function faceSlots() {
  const shard = scanWorlds().find((w) => w.id === 'k.faces').shards.find((s) => /^@\S+ k\.faces\.slot style=plain /m.test(s.text));
  return shard.text.split('\n').filter((l) => / k\.faces\.slot style=plain /.test(l)).map((l) => {
    const get = (k) => new RegExp(` ${k}=(\\S+)`).exec(l)?.[1];
    const name = get('name');
    if (!FACE_HOLDS[name]) throw new Error(`the k.faces slot ${name} has no "holds" in tools/layouts-core.mjs`);
    return [name, 'one', { pair: get('mirror') === 'true', optional: get('optional') === 'true', holds: FACE_HOLDS[name], box: ['x', 'y', 'w', 'h'].map((k) => Number(get(k))) }];
  });
}

export function layoutWires() {
  const lines = [];
  for (const [name, kind, about, o, slotsIn, relations] of LAYOUTS) {
    const slots = slotsIn === 'k.faces' ? faceSlots() : slotsIn;
    lines.push('', `# ${name}`);
    lines.push(wire(`k.layouts.layout.${seg(name)}`, 'k.layouts.layout', [['name', name], ['kind', kind], ['about', text(about)], ['ordered', o.ordered ? 'true' : undefined], ...o.usual.map((u) => ['usual_for', text(u)])], SRC));
    const names = new Set(slots.map((s) => s[0]));
    for (const [slot, count, s = {}] of slots) {
      if (s.arranged && !LAYOUTS.some((l) => l[0] === s.arranged)) throw new Error(`${name}.${slot}: no layout ${s.arranged}`);
      lines.push(wire(`k.layouts.slot.${seg(name)}.${slot}`, 'k.layouts.slot', [['layout', name], ['name', slot], ['count', count], ['pair', s.pair ? 'true' : undefined], ['optional', s.optional ? 'true' : undefined],
        ...(s.holds ?? []).map((h) => ['holds', h]), ['arranged', s.arranged], ...(s.box ? ['x', 'y', 'w', 'h'].map((k, i) => [k, s.box[i]]) : [])], SRC));
    }
    for (const [a, rel, b, among] of relations) {
      if (!names.has(a) || !names.has(b)) throw new Error(`${name}: relation ${a} ${rel} ${b}: no such slot`);
      if ((a === b) !== Boolean(among)) throw new Error(`${name}: relation ${a} ${rel} ${b}: "among" goes with one slot on both sides`);
      lines.push(wire(`k.layouts.relation.${seg(name)}.${a}.${rel}.${b}`, 'k.layouts.relation', [['layout', name], ['a', a], ['rel', rel], ['b', b], ['among', among]], SRC));
    }
  }
  const words = LAYOUTS.map(([name, , , o]) => wire(`k.layouts.word.layout.${seg(name)}`, 'core.word', [['text', name], ...o.words.map((w) => ['text', w]), ['means', name], ['of', 'k.layouts.layout.name']], SRC));
  return { lines: lines.slice(1), words };
}

// The parts of the hand-written k.objects objects: object -> Map(part -> { x, y, w, h }).
export function handParts() {
  const objects = new Map();
  for (const shard of scanWorlds().find((w) => w.id === 'k.objects').shards) {
    if (!/^# script: none \(hand-written\)/m.test(shard.text)) continue;
    for (const line of shard.text.split('\n')) {
      const m = /^@\S+ k\.objects\.part of=("[^"]*"|\S+) name=(\S+) /.exec(line);
      if (!m) continue;
      const object = m[1].startsWith('"') ? JSON.parse(m[1]) : m[1];
      const num = (k) => Number(new RegExp(` ${k}=(\\S+)`).exec(line)[1]);
      if (!objects.has(object)) objects.set(object, new Map());
      objects.get(object).set(m[2], { x: num('x'), y: num('y'), w: num('w'), h: num('h') });
    }
  }
  return objects;
}

const KINDS = ['seat', 'surface', 'top', 'handle', 'hand', 'opening', 'inside', 'water', 'roof', 'hook', 'base'];
// The box of an anchor from the box of its part.
const AT = {
  box: (p) => [p.x, p.y, p.w, p.h], top: (p) => [p.x, p.y, p.w, 0], bottom: (p) => [p.x, p.y + p.h, p.w, 0], left: (p) => [p.x, p.y, 0, p.h], right: (p) => [p.x + p.w, p.y, 0, p.h],
  top_left: (p) => [p.x, p.y, 0, 0], top_right: (p) => [p.x + p.w, p.y, 0, 0], bottom_left: (p) => [p.x, p.y + p.h, 0, 0], bottom_right: (p) => [p.x + p.w, p.y + p.h, 0, 0], top_centre: (p) => [p.x + p.w / 2, p.y, 0, 0], centre: (p) => [p.x + p.w / 2, p.y + p.h / 2, 0, 0],
};
const rows = (t) => t.split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t').map((x) => x.trim()));
const r1 = (n) => Math.round(n * 10) / 10;

// The rows of anchors.tsv with their boxes: { object, name, kind, part, at, holds, box }.
export function readAnchors(tsv, parts = handParts()) {
  const seen = new Set();
  return rows(tsv).map(([object, name, kind, part, at, holds = '']) => {
    const where = `anchors.tsv: ${object} ${name}`;
    if (!KINDS.includes(kind)) throw new Error(`${where}: kind ${kind}`);
    if (!AT[at]) throw new Error(`${where}: at ${at}`);
    if (!parts.has(object)) throw new Error(`${where}: no hand-written object "${object}"`);
    if (!parts.get(object).has(part)) throw new Error(`${where}: the object has no part ${part}`);
    if (seen.has(`${object}\t${name}`)) throw new Error(`${where}: twice`);
    seen.add(`${object}\t${name}`);
    return { object, name, kind, part, at, holds: holds.split(',').map((h) => h.trim()).filter(Boolean), box: AT[at](parts.get(object).get(part)).map(r1) };
  });
}

// The names of all k.objects objects.
export function objectNames() {
  const names = new Set();
  for (const shard of scanWorlds().find((w) => w.id === 'k.objects').shards) for (const m of shard.text.matchAll(/ k\.objects\.object name=("[^"]*"|\S+)/g)) names.add(m[1].startsWith('"') ? JSON.parse(m[1]) : m[1]);
  return names;
}

// The rows of anchor-points.tsv (Round 9): an anchor given as a place in the frame of the drawing, for objects
// whose parts have no names: { object, name, kind, holds, box }.
export function readAnchorPoints(tsv, objects = objectNames(), taken = new Set()) {
  const seen = new Set(taken);
  return rows(tsv).map(([object, name, kind, x, y, w, h, holds = '']) => {
    const where = `anchor-points.tsv: ${object} ${name}`;
    if (!KINDS.includes(kind)) throw new Error(`${where}: kind ${kind}`);
    if (!objects.has(object)) throw new Error(`${where}: no object "${object}"`);
    if (!/^[a-z][a-z_]*$/.test(name ?? '')) throw new Error(`${where}: name`);
    const box = [x, y, w, h].map(Number);
    if (box.some((n) => !Number.isFinite(n) || n < 0) || [x, y, w, h].some((n) => n === '' || n === undefined) || box[0] + box[2] > 100 || box[1] + box[3] > 100) throw new Error(`${where}: the box is not in the frame`);
    if (seen.has(`${object}\t${name}`)) throw new Error(`${where}: twice`);
    seen.add(`${object}\t${name}`);
    const list = holds.split(',').map((v) => v.trim()).filter(Boolean);
    if (!list.length) throw new Error(`${where}: what goes there`);
    return { object, name, kind, holds: list, box };
  });
}

export function anchorWires(anchors) {
  return anchors.map((a) => wire(`k.layouts.anchor.${seg(a.object)}.${a.name}`, 'k.layouts.anchor', [['of', a.object], ['name', a.name], ['kind', a.kind], ['x', a.box[0]], ['y', a.box[1]], ['w', a.box[2]], ['h', a.box[3]], ['part', a.part],
    ...a.holds.map((h) => [a.kind === 'base' ? 'on' : 'holds', h]), ['named', 'model']], SRC));
}

const RELS = ['part_of', 'attaches_to', 'sits_on', 'hangs_from', 'goes_in', 'worn_on', 'grows_on', 'held_in', 'connects'];
const SIDES = ['top', 'bottom', 'side', 'front', 'back', 'end', 'edge', 'corner', 'centre', 'inside', 'around'];
export function readJoins(tsv) {
  const seen = new Set();
  return rows(tsv).map(([a, rel, b, side = '']) => {
    const where = `joins.tsv: ${a} ${rel} ${b}`;
    if (!a || !b || a === b) throw new Error(`${where}: two different kinds are needed`);
    if (!RELS.includes(rel)) throw new Error(`${where}: rel`);
    if (side && !SIDES.includes(side)) throw new Error(`${where}: side ${side}`);
    if (seen.has(`${a}\t${rel}\t${b}`)) throw new Error(`${where}: twice`);
    seen.add(`${a}\t${rel}\t${b}`);
    return { a, rel, b, side };
  });
}
export const joinWires = (joins) => joins.map((j) => wire(`k.layouts.joins.${seg(j.a)}.${j.rel}.${seg(j.b)}`, 'k.layouts.joins', [['a', j.a], ['rel', j.rel], ['b', j.b], ['side', j.side], ['named', 'model']], SRC));

export function layoutShards({ anchorsTsv = readFileSync(join(REPO, 'sources/hand-core/anchors.tsv'), 'utf8'), joinsTsv = readFileSync(join(REPO, 'sources/hand-core/joins.tsv'), 'utf8'),
  pointsTsv = readFileSync(join(REPO, 'sources/hand-core/anchor-points.tsv'), 'utf8') } = {}) {
  const { lines, words } = layoutWires();
  const anchors = readAnchors(anchorsTsv), joins = readJoins(joinsTsv);
  const points = readAnchorPoints(pointsTsv, undefined, new Set(anchors.map((a) => `${a.object}\t${a.name}`)));
  const head = (id, about, source) => header({ id: `k.layouts/shards/${id}`, about, sources: [`hand-core 1 (hand-written in this repository: ${source})`], license: 'CC0-1.0', script: 'tools/layouts-core.mjs' });
  return {
    'layouts.sop': `${head('layouts', `${LAYOUTS.length} named arrangements (${LAYOUTS.map((l) => l[0]).join(', ')}): their places, how the places sit to each other, what is usually arranged so; and other names of the arrangements.`, 'tools/layouts-core.mjs')}\n${lines.join('\n')}\n\n# Words: other names of the arrangements.\n${words.join('\n')}\n`,
    'anchors.sop': `${head('anchors', `${anchors.length} places on ${new Set(anchors.map((a) => a.object)).size} hand-written k.objects objects where another thing sits or attaches (seat, surface, top, handle, hand, opening, inside, water, roof, hook, base), each with its box in the frame of the object and what usually goes there; chosen by a language model from the named parts (named=model) and looked at on the drawings.`, 'sources/hand-core/anchors.tsv')}\n${anchorWires(anchors).join('\n')}\n`,
    'anchors-points.sop': `${head('anchors-points', `${points.length} places on ${new Set(points.map((a) => a.object)).size} k.objects objects where another thing sits or attaches, given as a box, a line or a point in the frame of the drawing because the parts of the drawing have no names (imported drawings: the seat of the swing and the bench, the top of the bed, the back of the horse) or because no part marks the place (the branch of the tree, the feet of the person); chosen by a language model that looked at the drawing (named=model), and each looked at again drawn on its object.`, 'sources/hand-core/anchor-points.tsv')}\n${anchorWires(points).join('\n')}\n`,
    'joins.sop': `${head('joins', `${joins.length} facts on which kind of thing joins which (a roof attaches to a wall, a wheel is part of a car, a hat sits on a head, an arrow connects boxes) and on which side; written by a language model, only where sure (named=model).`, 'sources/hand-core/joins.tsv')}\n${joinWires(joins).join('\n')}\n`,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = layoutShards();
  writeShards(join(WORLDS_DIR, 'k.layouts', 'shards'), files);
  console.log(Object.entries(files).map(([f, t]) => `${f}: ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`).join('\n'));
}
