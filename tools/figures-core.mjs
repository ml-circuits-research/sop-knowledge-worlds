// The style `figure` of k.faces: a whole person drawn as a body with clothes on it, the way the style `plain` draws a
// face. Its frame is the frame of the drawing `person` of k.objects (0 to 100, x right, y down; the boxes of
// k.wearables.place are in the same frame), so a figure is drawn over that drawing and replaces its stick body
// (k.faces.frame hides). The slots are layers: the bare body (skin), then what is worn on the legs, on the feet, on the
// upper body (a dress reaches down over the legs) and over everything (a jacket, a coat). The variants are the clothes
// people name (k.wearables.wearable figure=...); a tinted part takes the colour of the figure (`clothes` for the top,
// `skin` for the body), an untinted one keeps its own colour or one of the colours it offers. The presets are outfits
// for an age and a sex (k.people.kind age, sex): a host picks among those that fit, so two people of one kind need not
// look alike.
//   node tools/figures-core.mjs        writes docs/worlds/k.faces/shards/figure-*.sop
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, writeShards } from './import/lib.mjs';

const SRC = 'hand-core 1';
export const STYLE = 'figure';
const r1 = (n) => Math.round(n * 10) / 10;

// name, box, draw order, optional
export const SLOTS = [
  ['body', [26, 24, 48, 70], 0, false],
  ['bottom', [33, 56, 34, 36], 1, true],
  ['shoes', [35, 80, 30, 16], 2, true],
  ['top', [26, 29, 48, 54], 3, true],
  ['coat', [24, 28, 52, 54], 4, true],
];

const skin = { tint: 'skin' }, clothes = { tint: 'clothes' }, clothesShade = { tint: 'clothes_shade' };
// Colours an untinted garment offers (basic colour names; its rgb is how it is drawn unless one of them is chosen).
const TROUSERS = 'blue black brown grey green red white';
const DENIM = 'blue black grey';
const SHOE = 'brown black red white blue';
const COAT = 'brown black blue green grey red';
const mirrorX = (pts) => pts.map(([x, y]) => [r1(100 - x), y]).reverse();

// The sleeves and the torso of a top, from the left shoulder round to the right one: short sleeves end at the elbow,
// long ones at the wrist.
const LEFT_SHORT = [[39, 31], [33, 42], [38, 45], [40, 42]];
const LEFT_LONG = [[39, 31], [29, 53], [34, 56], [40, 42]];
const torso = (left, bottom = 62) => [...left.slice(0, 1), ...left.slice(1), [40, bottom], [60, bottom], ...mirrorX(left).slice(0, -1), [61, 31]];
const legs = (y1) => [[[40, 60], [50, 60], [49, y1], [41, y1]], [[50, 60], [60, 60], [59, y1], [51, y1]]];

// slot -> [name, features, parts]; a part is [name, shape, geometry, z, colour names, options].
export const VARIANTS = {
  body: [
    ['bare', { kind: 'body' }, [
      ['neck', 'rect', [46, 26, 8, 8], 1, 'pink brown', skin],
      ['torso', 'rect', [40, 32, 20, 30], 1, 'pink brown', skin],
      ['left_arm', 'poly', [[41, 33], [44, 36], [34, 55], [30, 53]], 1, 'pink brown', skin],
      ['right_arm', 'poly', mirrorX([[41, 33], [44, 36], [34, 55], [30, 53]]), 1, 'pink brown', skin],
      ['left_hand', 'circle', [28, 51, 6], 2, 'pink brown', skin],
      ['right_hand', 'circle', [66, 51, 6], 2, 'pink brown', skin],
      ['left_leg', 'poly', [[41, 61], [49, 61], [48, 90], [42, 90]], 1, 'pink brown', skin],
      ['right_leg', 'poly', mirrorX([[41, 61], [49, 61], [48, 90], [42, 90]]), 1, 'pink brown', skin],
    ]],
  ],
  top: [
    ['t-shirt', { length: 'short', kind: 't-shirt' }, [['shirt', 'poly', torso(LEFT_SHORT), 1, 'red', clothes], ['collar', 'line', [[46, 31], [50, 35], [54, 31]], 2, 'red', clothesShade]]],
    ['shirt', { length: 'long', kind: 'shirt' }, [['shirt', 'poly', torso(LEFT_LONG), 1, 'blue', clothes], ['buttons', 'line', [[50, 34], [50, 61]], 2, 'blue', clothesShade]]],
    ['jumper', { length: 'long', feel: ['thick'], kind: 'jumper' }, [['jumper', 'poly', torso(LEFT_LONG, 63), 1, 'green', clothes], ['hem', 'line', [[40, 60], [60, 60]], 2, 'green', clothesShade]]],
    ['tank top', { length: 'short', feel: ['thin'], kind: 'tank top' }, [['top', 'poly', [[42, 31], [45, 31], [50, 36], [55, 31], [58, 31], [60, 40], [60, 62], [40, 62], [40, 40]], 1, 'yellow', clothes]]],
    ['dress', { length: 'long', kind: 'dress' }, [['dress', 'poly', [[39, 31], [34, 40], [39, 43], [40, 56], [32, 80], [68, 80], [60, 56], [61, 43], [66, 40], [61, 31]], 1, 'purple', clothes],
      ['waist', 'line', [[40, 56], [60, 56]], 2, 'purple', clothesShade]]],
  ],
  bottom: [
    ['trousers', { length: 'long', kind: 'trousers' }, [['waist', 'rect', [40, 58, 20, 4], 1, TROUSERS, { rgb: '#2F3E5C' }],
      ['left_leg', 'poly', legs(88)[0], 1, TROUSERS, { rgb: '#2F3E5C' }], ['right_leg', 'poly', legs(88)[1], 1, TROUSERS, { rgb: '#2F3E5C' }]]],
    ['jeans', { length: 'long', kind: 'jeans' }, [['waist', 'rect', [40, 58, 20, 4], 1, DENIM, { rgb: '#4A6FA5' }],
      ['left_leg', 'poly', legs(88)[0], 1, DENIM, { rgb: '#4A6FA5' }], ['right_leg', 'poly', legs(88)[1], 1, DENIM, { rgb: '#4A6FA5' }],
      ['seam', 'line', [[50, 62], [50, 70]], 2, 'blue', { rgb: '#2E4A75' }]]],
    ['shorts', { length: 'short', kind: 'shorts' }, [['waist', 'rect', [40, 58, 20, 4], 1, TROUSERS, { rgb: '#6B5B3E' }],
      ['left_leg', 'poly', legs(72)[0], 1, TROUSERS, { rgb: '#6B5B3E' }], ['right_leg', 'poly', legs(72)[1], 1, TROUSERS, { rgb: '#6B5B3E' }]]],
    ['skirt', { length: 'medium', kind: 'skirt' }, [['skirt', 'poly', [[40, 58], [60, 58], [66, 76], [34, 76]], 1, 'blue red black green grey purple pink', { rgb: '#3A4F8A' }]]],
  ],
  shoes: [
    ['shoes', { kind: 'shoes' }, [['left_shoe', 'oval', [37, 88, 12, 5], 1, SHOE, { rgb: '#3A2A20' }], ['right_shoe', 'oval', [51, 88, 12, 5], 1, SHOE, { rgb: '#3A2A20' }]]],
    ['boots', { length: 'long', kind: 'boots' }, [
      ['left_boot', 'poly', [[41, 81], [48, 81], [49, 89], [50, 93], [38, 93], [40, 89]], 1, SHOE, { rgb: '#4A3426' }],
      ['right_boot', 'poly', mirrorX([[41, 81], [48, 81], [49, 89], [50, 93], [38, 93], [40, 89]]), 1, SHOE, { rgb: '#4A3426' }]]],
    ['trainers', { kind: 'trainers' }, [['left_shoe', 'oval', [37, 88, 12, 5], 1, 'white grey black blue', { rgb: '#F2F2F2' }], ['right_shoe', 'oval', [51, 88, 12, 5], 1, 'white grey black blue', { rgb: '#F2F2F2' }],
      ['left_stripe', 'line', [[39, 90], [47, 90]], 2, 'red blue', { rgb: '#D64541' }], ['right_stripe', 'line', [[53, 90], [61, 90]], 2, 'red blue', { rgb: '#D64541' }]]],
  ],
  coat: [
    ['jacket', { length: 'short', kind: 'jacket' }, [
      ['left_side', 'poly', [[39, 30], [49, 30], [49, 64], [39, 64], [40, 43], [34, 56], [28, 53]], 1, COAT, { rgb: '#7A5230' }],
      ['right_side', 'poly', mirrorX([[39, 30], [49, 30], [49, 64], [39, 64], [40, 43], [34, 56], [28, 53]]), 1, COAT, { rgb: '#7A5230' }]]],
    ['coat', { length: 'long', feel: ['thick'], kind: 'coat' }, [
      ['left_side', 'poly', [[39, 30], [49, 30], [49, 80], [36, 80], [40, 43], [34, 56], [28, 53]], 1, COAT, { rgb: '#5B4636' }],
      ['right_side', 'poly', mirrorX([[39, 30], [49, 30], [49, 80], [36, 80], [40, 43], [34, 56], [28, 53]]), 1, COAT, { rgb: '#5B4636' }]]],
  ],
};

// Outfits: [name, ages, sexes, variants by slot, clothes colour].
export const PRESETS = [
  ['baby clothes', ['baby'], ['female', 'male'], { body: 'bare', top: 't-shirt', bottom: 'shorts' }, 'yellow'],
  ['boy clothes', ['child'], ['male'], { body: 'bare', top: 't-shirt', bottom: 'shorts', shoes: 'trainers' }, 'green'],
  ['boy in jeans', ['child'], ['male'], { body: 'bare', top: 'jumper', bottom: 'jeans', shoes: 'trainers' }, 'red'],
  ['girl clothes', ['child'], ['female'], { body: 'bare', top: 'dress', shoes: 'shoes' }, 'pink'],
  ['girl in a skirt', ['child'], ['female'], { body: 'bare', top: 't-shirt', bottom: 'skirt', shoes: 'trainers' }, 'yellow'],
  ['man clothes', ['adult'], ['male'], { body: 'bare', top: 'shirt', bottom: 'trousers', shoes: 'shoes' }, 'blue'],
  ['man in a jacket', ['adult'], ['male'], { body: 'bare', top: 't-shirt', bottom: 'jeans', shoes: 'boots', coat: 'jacket' }, 'grey'],
  ['woman clothes', ['adult'], ['female'], { body: 'bare', top: 'dress', shoes: 'shoes' }, 'purple'],
  ['woman in jeans', ['adult'], ['female'], { body: 'bare', top: 'shirt', bottom: 'jeans', shoes: 'trainers' }, 'orange'],
  ['old man clothes', ['old'], ['male'], { body: 'bare', top: 'shirt', bottom: 'trousers', shoes: 'shoes', coat: 'coat' }, 'white'],
  ['old woman clothes', ['old'], ['female'], { body: 'bare', top: 'jumper', bottom: 'skirt', shoes: 'shoes' }, 'pink'],
];

const SHAPE = { rect: 'rectangle', circle: 'circle', oval: 'oval', line: 'line', poly: 'polygon' };
function variantLines(slot, box, [name, f, parts]) {
  const id = `k.faces.${STYLE}.${slot}.${seg(name)}`;
  const lines = [wire(id, 'k.faces.variant', [['slot', slot], ['name', name], ['style', STYLE], ['length', f.length], ...(f.feel ?? []).map((v) => ['feel', v]), ['kind', f.kind]], SRC)];
  const points = [];
  for (const [pname, shape, g, z, cols, o = {}] of parts) {
    let x, y, w, h;
    if (shape === 'line' || shape === 'poly') {
      const xs = g.map((p) => p[0]), ys = g.map((p) => p[1]);
      x = Math.min(...xs); y = Math.min(...ys); w = r1(Math.max(...xs) - x); h = r1(Math.max(...ys) - y);
      g.forEach((p, i) => points.push(`@${id}.${pname}.p${i + 1} k.faces.point part=$${id}.${pname} n=${i + 1} x=${r1(p[0])} y=${r1(p[1])} core.source=${JSON.stringify(SRC)}`));
    } else if (shape === 'circle') { [x, y, w] = g; h = w; } else { [x, y, w, h] = g; }
    if (x < box[0] - 0.01 || y < box[1] - 0.01 || x + w > box[0] + box[2] + 0.01 || y + h > box[1] + box[3] + 0.01) throw new Error(`${slot} ${name}.${pname}: outside the box of its slot (${x}, ${y}, ${w}, ${h})`);
    lines.push(wire(`${id}.${pname}`, 'k.faces.part', [['slot', slot], ['of', name], ['name', pname], ['shape', SHAPE[shape]], ['x', r1(x)], ['y', r1(y)], ['w', r1(w)], ['h', r1(h)], ['z', z],
      ...cols.split(' ').map((c) => ['colour', c]), ['rgb', o.rgb ? { string: o.rgb } : undefined], ['tint', o.tint]], SRC));
  }
  return [`# ${slot}: ${name}`, ...lines, ...points].join('\n');
}

export function figureShards() {
  const head = (id, about) => header({ id: `k.faces/shards/${id}`, about, sources: ['hand-core 1 (hand-written in this repository)'], license: 'CC0-1.0', script: 'tools/figures-core.mjs' });
  const files = {};
  files['figure-slots.sop'] = `${head('figure-slots', `the slots of the style \`${STYLE}\`: the layers of a whole person (a box in the frame of the drawing person of k.objects, 0 to 100, x right, y down), drawn in their order: the bare body, then what is worn on the legs, on the feet, on the upper body and over everything. The frame (k.faces.frame) says on which drawing the style is drawn and which of its parts it replaces.`)}\n${
    SLOTS.map(([name, [x, y, w, h], z, optional]) => wire(`k.faces.${STYLE}.slot.${name}`, 'k.faces.slot', [['style', STYLE], ['name', name], ['x', x], ['y', y], ['w', w], ['h', h], ['z', z], ['optional', optional ? 'true' : undefined]], SRC)).join('\n')}\n${
    wire(`k.faces.${STYLE}.canon.${STYLE}`, 'k.faces.canon', [['style', STYLE], ['name', STYLE], ['about', { string: 'The style figure draws a whole person, not a face: it states no face proportions. Its frame is the frame of the drawing person of k.objects.' }]], SRC)}\n${
    wire(`k.faces.${STYLE}.frame.person`, 'k.faces.frame', [['style', STYLE], ['drawing', 'person'], ...['body', 'left_arm', 'right_arm', 'left_leg', 'right_leg'].map((p) => ['hides', p]),
      ['about', { string: 'A figure is drawn in the frame of the drawing person and replaces its stick body, arms and legs.' }]], SRC)}\n`;
  files['figure-presets.sop'] = `${head('figure-presets', `outfits of the style \`${STYLE}\`: one variant per slot it fills, the colour of the clothes (and default skin, hair and eye colours, which the face of a person sets), with the ages and sexes they suit (k.people.kind age, sex).`)}\n${
    PRESETS.map(([name, ages, sexes, slots, colour]) => wire(`k.faces.${STYLE}.preset.${seg(name)}`, 'k.faces.preset', [['name', name], ['style', STYLE], ['kind', 'human'], ...ages.map((a) => ['age', a]), ...sexes.map((s) => ['sex', s]),
      ...SLOTS.map(([s]) => [s, slots[s]]), ['skin', 'light'], ['hair_colour', 'brown'], ['eye_colour', 'brown'], ['clothes', colour]], SRC)).join('\n')}\n`;
  for (const [slot, box] of SLOTS) {
    files[`${STYLE}-${slot}.sop`] = `${head(`${STYLE}-${slot}`, `the variants of the slot \`${slot}\` in the style \`${STYLE}\`: features, and parts with a primitive shape, a box in the frame of the figure, a draw order and colours; points for lines and polygons.`)}\n${
      VARIANTS[slot].map((v) => variantLines(slot, box, v)).join('\n\n')}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = figureShards();
  writeShards(join(WORLDS_DIR, 'k.faces', 'shards'), files, `${STYLE}-`);
  console.log(`${Object.keys(files).length} shards, ${Object.values(VARIANTS).reduce((n, v) => n + v.length, 0)} variants, ${PRESETS.length} outfits`);
}
