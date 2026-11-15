// Frames for an arrangement in the shape of something (block 09:50 item F, the owner's real case: "a diagram in the
// shape of a house" drew one circle), in w.lang.en's frame format: "make a diagram in the shape of a house", "a
// house-shaped diagram", "a diagram in heart form", "arrange the boxes in the shape of a star", "put the nodes in a
// heart shape". The role `arrangement` of make, place and group (k.actions) takes the name of an outline of k.layouts
// (tools/outlines-core.mjs: the shapes of k.shapes and the drawings traced); the lexicons are derived from the
// outline shards, so a new outline reaches the frames; `npm run build` reruns this tool after the outlines.
//   node tools/lang-en-shape-frames.mjs     writes docs/worlds/w.lang.en/shards/shape-frames.sop
// tests/k.layouts.outlines.test.mjs reads the requests back.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, text } from './import/lib.mjs';
import { frameLines, rolesOf } from './lang-en-role-frames.mjs';

const SRC = 'hand-core 1';
const tok = (t) => (t.startsWith('"') ? JSON.parse(t) : t);

// the names of the outlines of k.layouts (read by pattern from the outline shards)
export function outlineNames() {
  const d = join(WORLDS_DIR, 'k.layouts', 'shards');
  return [...new Set(readdirSync(d).filter((f) => f.startsWith('outlines-') && f.endsWith('.sop'))
    .flatMap((f) => [...readFileSync(join(d, f), 'utf8').matchAll(/ k\.layouts\.outline name=("[^"]*"|\S+)/g)].map((m) => tok(m[1]).toLowerCase())))].sort();
}
export function lexicons() {
  const names = outlineNames();
  return {
    'outline.shape': { doc: 'Shapes a thing can be laid out in the shape of: the names of the outlines of k.layouts (k.layouts.outline); derived by tools/lang-en-shape-frames.mjs.', items: names },
    'outline.shaped': { doc: 'The outlines said as an adjective ("house-shaped", "star shaped"); derived by tools/lang-en-shape-frames.mjs.', items: [...new Set(names.flatMap((n) => [`${n}-shaped`, `${n} shaped`]))].sort() },
  };
}

const lead = ['lead'], det = ['det'];
const verb = (act) => ['verb', act];
const role = (r, takes = 'words', more = {}) => ['role', r, takes, more];
const word = (words, optional = false, act = undefined) => ['word', words, optional, act];
// the markers of the role arrangement in k.actions, and the ways a request says "looks like"
const MARK = ['in the shape of', 'shaped like', 'in the form of', 'in the outline of', 'that looks like', 'looking like', 'like'];
const ARRANGE = ['arrange', 'rearrange', 'lay out', 'lay', 'set out', 'put', 'place', 'organise', 'organize', 'line up', 'order', 'move'];
const SHAPE = role('arrangement', 'lexicon', { lexicon: 'outline.shape' }), SHAPED = role('arrangement', 'lexicon', { lexicon: 'outline.shaped' });
const FORM = ['form', 'shape', 'outline'];
// [name, act, mode, priority, example, parts, about]
export const FRAMES = [
  ['shape.make.of', 'make', undefined, 17, 'Make a diagram in the shape of a house.', [lead, verb('make'), det, role('kind', 'words', { max: 3 }), word(MARK), det, SHAPE], 'a new thing laid out in the shape of an outline'],
  ['shape.make.shaped', 'make', undefined, 17, 'Make a house-shaped diagram.', [lead, verb('make'), det, SHAPED, role('kind', 'words', { max: 3 })], 'a new thing laid out in the shape of an outline, said as an adjective'],
  ['shape.make.form', 'make', undefined, 17, 'Draw a diagram in heart form.', [lead, verb('make'), det, role('kind', 'words', { max: 3 }), word(['in', 'as']), det, SHAPE, word(FORM)], 'a new thing in the form of an outline ("in heart form", "as a star shape")'],
  ['shape.make.bare', 'make', undefined, 5, 'A diagram in the shape of a house.', [det, role('kind', 'words', { max: 3 }), word(MARK.filter((m) => m !== 'like')), det, SHAPE], 'a new thing in the shape of an outline, without a verb'],
  ['shape.place.of', 'place', 'layout', 17, 'Arrange the boxes in the shape of a star.', [lead, word(ARRANGE, false, 'place'), det, role('thing'), word(['out', 'up'], true), word(MARK), det, SHAPE], 'things already there laid out in the shape of an outline'],
  ['shape.place.form', 'place', 'layout', 17, 'Put the nodes in a heart shape.', [lead, word(ARRANGE, false, 'place'), det, role('thing'), word(['out', 'up'], true), word(['in', 'into', 'as']), det, SHAPE, word(FORM)], 'things already there laid out in the form of an outline'],
  ['shape.place.shaped', 'place', 'layout', 16, 'Lay the boxes out star-shaped.', [lead, word(ARRANGE, false, 'place'), det, role('thing'), word(['out', 'up'], true), SHAPED], 'things already there laid out in the shape of an outline, said as an adjective'],
  ['shape.group.of', 'group', undefined, 17, 'Group the dots in the shape of a heart.', [lead, verb('group'), det, role('thing'), word(['together', 'all together'], true), word(MARK), det, SHAPE], 'things grouped in the shape of an outline'],
];

export function shapeFrameShard() {
  const lex = Object.entries(lexicons()).map(([name, { doc, items }]) => wire(`w.lang.en.lex.${name}`, 'w.lang.en.lex', [['name', name], ['doc', text(doc)], ...items.map((i) => ['item', text(i)])], SRC));
  const frames = FRAMES.flatMap(([name, act, mode, priority, example, parts, about]) => [`# ${about}`, ...frameLines(name, { act, mode, set: 'acts', priority, needs: 'layout', roles: rolesOf(parts), example }, parts, {}, SRC)]);
  return `${header({ id: 'w.lang.en/shards/shape-frames', about: `frames for an arrangement in the shape of something (block 09:50 item F): ${FRAMES.length} frames (make or place with the role arrangement: in the shape of, shaped like, X-shaped, in X form), ${lex.length} lexicons derived from the outlines of k.layouts.`,
    sources: ['hand-core 1 (written in this repository: tools/lang-en-shape-frames.mjs; the lexicons derived from k.layouts outlines)'], license: 'CC0-1.0', script: 'tools/lang-en-shape-frames.mjs' })}\n# Lexicons\n${lex.join('\n')}\n\n${frames.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const t = shapeFrameShard();
  writeFileSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'shape-frames.sop'), t);
  console.log(`shape-frames.sop: ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`);
}
