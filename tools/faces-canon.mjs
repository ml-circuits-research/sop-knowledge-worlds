// k.faces block "10:35" (experiment): the parts of the style `plain` placed by the proportion canon of a face
// instead of by hand-chosen positions. A canon gives lines as fractions of the head box (0 at its top or left, 1 at
// its bottom or right): the eyes on the eye line, the space between the eyes one eye wide, the brows one eye width
// above the eyes, the bottom of the nose halfway between the eyes and the chin, the mouth a third of the way from the
// nose to the chin, the ears between the brow line and the nose line. Each slot keeps its drawings (the hand-drawn
// parts, read as drawn around the slot's own anchor) and is moved and scaled from where the hand put it to where the
// canon puts it, so changing the head box or the canon moves eyes, brows, nose, mouth, ears and glasses together.
//   node tools/faces-canon.mjs <out-dir> [--canon adult|child|old|fitted]   writes the plain-* shards placed by the canon to out-dir
//   node tools/faces-canon.mjs --sheet <worlds-root> <out.png>   the contact sheet of the same faces (presets, the
//                                           expressions on the woman, 20 random faces) drawn from that tree of worlds
import { join } from 'node:path';
import { SLOTS, VARIANTS } from './faces-core.mjs';

// The box of the head slot: the frame of the canon.
export const HEAD = { x: 22, y: 12, w: 56, h: 68 };
// name -> lines (fractions of the head box) and sizes; `about` says the rule in words.
export const CANONS = [
  { name: 'adult', eye_line: 0.5, nose_line: 0.75, mouth_line: 0.833, eye_width: 0.2, eye_gap: 1, brow_above: 1,
    about: 'The eyes on the middle line of the head, one eye width apart; the brows one eye width above the eyes; the bottom of the nose halfway between the eyes and the chin; the mouth a third of the way from the nose to the chin; the ears between the brow line and the nose line.' },
  { name: 'child', eye_line: 0.56, nose_line: 0.78, mouth_line: 0.853, eye_width: 0.22, eye_gap: 1, brow_above: 0.9,
    about: 'A larger skull: the eyes below the middle line of the head and larger; the nose and mouth closer to the chin.' },
  { name: 'old', eye_line: 0.5, nose_line: 0.77, mouth_line: 0.85, eye_width: 0.19, eye_gap: 1, brow_above: 1,
    about: 'As an adult, with a longer nose and ears and the mouth lower.' },
];
// Where the hand put the same things in the style plain (the anchors the drawings were drawn around).
export const DRAWN = { eye_x: 37, eye_y: 42, eye_width: 10, brow_y: 31, nose_top: 44, nose_y: 55, mouth_y: 66, rim_x: 37 };

// The canon the hand-drawn style already follows, read off DRAWN: placing by it changes nothing (a test checks
// that the shards come out byte for byte), so the maps are exact and only the canon's numbers differ.
export const FITTED = { name: 'plain as drawn', eye_line: (DRAWN.eye_y - HEAD.y) / HEAD.h, nose_line: (DRAWN.nose_y - HEAD.y) / HEAD.h, mouth_line: (DRAWN.mouth_y - HEAD.y) / HEAD.h,
  eye_width: DRAWN.eye_width / HEAD.w, eye_gap: (2 * (50 - DRAWN.eye_x) - DRAWN.eye_width) / DRAWN.eye_width, brow_above: (DRAWN.eye_y - DRAWN.brow_y) / DRAWN.eye_width };

// The map of each slot: x' = ax + (x - fx) * sx, y' = ay + (y - fy) * sy (fx, fy: the drawn anchor).
export function slotMaps(canon, head = HEAD) {
  const Y = (f) => head.y + f * head.h;
  const ew = canon.eye_width * head.w;
  const eyeX = 50 - (canon.eye_gap * ew) / 2 - ew / 2;
  const eyeY = Y(canon.eye_line), noseY = Y(canon.nose_line), mouthY = Y(canon.mouth_line);
  const browY = eyeY - canon.brow_above * ew;
  const s = ew / DRAWN.eye_width;
  const line = (f0, t0, f1, t1) => ({ fy: f0, ay: t0, sy: (t1 - t0) / (f1 - f0) });
  const same = { fx: 0, ax: 0, sx: 1, fy: 0, ay: 0, sy: 1 };
  const mid = (sx = 1) => ({ fx: 50, ax: 50, sx });
  return {
    head: same, hair_back: same, hair_front: same, hat: same, neck: same, shoulders: same,
    eyes: { fx: DRAWN.eye_x, ax: eyeX, sx: s, fy: DRAWN.eye_y, ay: eyeY, sy: s },
    eyebrows: { fx: DRAWN.eye_x, ax: eyeX, sx: s, fy: DRAWN.brow_y, ay: browY, sy: s },
    glasses: { ...mid((50 - eyeX) / (50 - DRAWN.rim_x)), fy: DRAWN.eye_y, ay: eyeY, sy: s },
    nose: { ...mid(), ...line(DRAWN.nose_top, eyeY + (DRAWN.nose_top - DRAWN.eye_y) * s, DRAWN.nose_y, noseY) },
    mouth: { ...mid(), fy: DRAWN.mouth_y, ay: mouthY, sy: 1 },
    moustache: { ...mid(), ...line(DRAWN.nose_y, noseY, DRAWN.mouth_y, mouthY) },
    beard: { ...mid(), ...line(DRAWN.mouth_y, mouthY, 80, Y(1)) },
    cheeks: { fx: DRAWN.eye_x, ax: eyeX, sx: 1, ...line(DRAWN.eye_y, eyeY, DRAWN.mouth_y, mouthY) },
    ears: { fx: 28, ax: 28, sx: 1, ...line(DRAWN.brow_y, browY, DRAWN.nose_y, noseY) },
    earrings: { fx: 28, ax: 28, sx: 1, ...line(DRAWN.brow_y, browY, DRAWN.nose_y, noseY) },
  };
}

const r1 = (n) => Math.round(n * 10) / 10;
// The slots and variants of faces-core with every position moved by the map of its slot.
export function canonTables(canon) {
  const maps = slotMaps(canon);
  const X = (m, x) => m.ax + (x - m.fx) * m.sx, Y = (m, y) => m.ay + (y - m.fy) * m.sy;
  const slots = SLOTS.map(([name, [x, y, w, h], ...rest]) => {
    const m = maps[name];
    // Rounded outwards, so that the parts (rounded to a tenth) stay inside.
    const fl = (n) => Math.floor(n * 10 + 1e-6) / 10, ce = (n) => Math.ceil(n * 10 - 1e-6) / 10;
    const [x0, y0] = [fl(X(m, x)), fl(Y(m, y))];
    return [name, [x0, y0, r1(ce(X(m, x + w)) - x0), r1(ce(Y(m, y + h)) - y0)], ...rest];
  });
  const variants = {};
  for (const [slot, list] of Object.entries(VARIANTS)) {
    const m = maps[slot];
    variants[slot] = list.map(([name, f, parts]) => [name, f, parts.map(([pname, shape, g, ...rest]) => {
      let g2;
      if (shape === 'line' || shape === 'poly') g2 = g.map(([x, y]) => [r1(X(m, x)), r1(Y(m, y))]);
      else if (shape === 'circle' || shape === 'square') {
        const s = Math.min(m.sx, m.sy), [x, y, d] = g;
        g2 = [r1(X(m, x + d / 2) - (d * s) / 2), r1(Y(m, y + d / 2) - (d * s) / 2), r1(d * s)];
      } else g2 = [r1(X(m, g[0])), r1(Y(m, g[1])), r1(g[2] * m.sx), r1(g[3] * m.sy), ...g.slice(4)];
      return [pname, shape, g2, ...rest];
    })]);
  }
  return { slots, variants };
}

// The canons as facts (k.faces.canon), for the shard `canon`.
import { wire, header } from './import/lib.mjs';
export function canonShard() {
  const SRC = 'hand-core 1';
  return `${header({ id: 'k.faces/shards/canon', about: 'the proportion canon of a face for a child, an adult and an old person: lines and sizes as fractions of the head box (0 at its top or left, 1 at its bottom or right); the style plain is placed by the adult canon (tools/faces-canon.mjs).', sources: ['hand-core 1 (hand-written in this repository)'], license: 'CC0-1.0', script: 'tools/faces-canon.mjs' })}\n${
    CANONS.map((c) => wire(`k.faces.canon.${c.name}`, 'k.faces.canon', [['name', c.name], ['eye_line', c.eye_line], ['nose_line', c.nose_line], ['mouth_line', c.mouth_line], ['eye_width', c.eye_width], ['eye_gap', c.eye_gap], ['brow_above', c.brow_above], ['about', { string: c.about }]], SRC)).join('\n')}\n`;
}

export const SHEET_RANDOM = 20;
export async function sheet(root, out) {
  const { scanWorlds, fullWorld } = await import('./lib/worlds.mjs');
  const rf = await import('./render-faces.mjs');
  const { writeSheet } = await import('./motion-strip.mjs');
  const world = fullWorld('k.faces', scanWorlds(root));
  const idx = rf.indexOf(world);
  const frames = [
    ...idx.presets.map((p) => ({ caption: p.name, face: rf.presetFace(world, p.name) })),
    ...idx.expressions.map((e) => ({ caption: `woman, ${e.name}`, face: rf.presetFace(world, rf.EXPRESSION_PRESET, e.name) })),
    ...Array.from({ length: SHEET_RANDOM }, (_, i) => ({ caption: `random ${i + 1}`, face: rf.randomFace(world, i + 1) })),
  ];
  return writeSheet(world, frames, out, { cols: 9, size: 150 });
}

if (import.meta.url === `file://${process.argv[1]}` && process.argv[2] === '--sheet') {
  console.log(await sheet(process.argv[3], process.argv[4]));
} else if (import.meta.url === `file://${process.argv[1]}`) {
  const { writeShards } = await import('./import/lib.mjs');
  const { coreShards } = await import('./faces-core.mjs');
  const [out, ...rest] = process.argv.slice(2);
  const name = rest.includes('--canon') ? rest[rest.indexOf('--canon') + 1] : 'adult';
  const files = coreShards(canonTables(name === 'fitted' ? FITTED : CANONS.find((c) => c.name === name)));
  files['canon.sop'] = canonShard();
  writeShards(out, files, 'zzz-none-');
  console.log(`${Object.keys(files).length} shards placed by the canon ${name} -> ${out}`);
}
