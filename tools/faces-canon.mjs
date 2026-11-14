// k.faces block "10:35" (experiment): the parts of the style `plain` placed by the proportion canon of a face
// instead of by hand-chosen positions. A canon gives lines as fractions of the head box (0 at its top or left, 1 at
// its bottom or right): the eyes on the eye line, the space between the eyes one eye wide, the brows one eye width
// above the eyes, the bottom of the nose halfway between the eyes and the chin, the mouth a third of the way from the
// nose to the chin, the ears between the brow line and the nose line. Each slot keeps its drawings (the hand-drawn
// parts, read as drawn around the slot's own anchor) and is moved and scaled from where the hand put it to where the
// canon puts it, so changing the head box or the canon moves eyes, brows, nose, mouth, ears and glasses together.
//   node tools/faces-canon.mjs <out-dir> [--canon adult|child|old|fitted]   writes the plain-* shards placed by the canon to out-dir
// (fitted: the published canon of plain, k.faces.canon; the placing itself is tools/faces-core.mjs's, Q47)
//   node tools/faces-canon.mjs --sheet <worlds-root> <out.png>   the contact sheet of the same faces (presets, the
//                                           expressions on the woman, 20 random faces) drawn from that tree of worlds
import { SLOTS, VARIANTS, CANON, DRAWN, placeByCanon, slotMaps as mapsFor } from './faces-core.mjs';

// The box of the head slot: the frame of the canon.
export const HEAD = (() => { const [, [x, y, w, h]] = SLOTS.find(([n]) => n === 'head'); return { x, y, w, h }; })();
// name -> lines (fractions of the head box) and sizes; `about` says the rule in words.
export const CANONS = [
  { name: 'adult', eye_line: 0.5, nose_line: 0.75, mouth_line: 0.833, eye_width: 0.2, eye_gap: 1, brow_above: 1,
    about: 'The eyes on the middle line of the head, one eye width apart; the brows one eye width above the eyes; the bottom of the nose halfway between the eyes and the chin; the mouth a third of the way from the nose to the chin; the ears between the brow line and the nose line.' },
  { name: 'child', eye_line: 0.56, nose_line: 0.78, mouth_line: 0.853, eye_width: 0.22, eye_gap: 1, brow_above: 0.9,
    about: 'A larger skull: the eyes below the middle line of the head and larger; the nose and mouth closer to the chin.' },
  { name: 'old', eye_line: 0.5, nose_line: 0.77, mouth_line: 0.85, eye_width: 0.19, eye_gap: 1, brow_above: 1,
    about: 'As an adult, with a longer nose and ears and the mouth lower.' },
];
export { DRAWN };
// The canon the hand-drawn style already follows is published (Q47): k.faces.canon in plain-canon.sop, CANON of
// tools/faces-core.mjs, which places the parts by it.
export const FITTED = CANON;
export const slotMaps = (canon, head = HEAD) => mapsFor(canon, head);
// The slots and variants of faces-core placed by a canon (the drawings as drawn, moved by the map of each slot).
export const canonTables = (canon) => placeByCanon(canon, SLOTS, VARIANTS);

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
  // the experiment's canon is written as the style's canon of that tree (plain-canon.sop) and placed by it
  const files = coreShards({ canon: name === 'fitted' ? FITTED : { ...CANONS.find((c) => c.name === name), style: 'plain' } });
  writeShards(out, files, 'zzz-none-');
  console.log(`${Object.keys(files).length} shards placed by the canon ${name} -> ${out}`);
}
