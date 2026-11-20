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

// name, box, draw order, optional. `back` is drawn behind the body (a cape), `neckwear` and `hands` over everything.
export const SLOTS = [
  ['back', [28, 28, 44, 54], -1, true],
  ['body', [24, 24, 52, 70], 0, false],
  ['bottom', [33, 56, 34, 36], 1, true],
  ['shoes', [35, 80, 30, 16], 2, true],
  ['top', [24, 29, 52, 54], 3, true],
  ['coat', [22, 28, 56, 54], 4, true],
  ['neckwear', [40, 26, 20, 28], 5, true],
  ['hands', [24, 48, 52, 12], 6, true],
];

// The skeleton of a figure: each limb turns about its joint (in the frame of the figure, as drawn standing with the
// arms down), a forearm or a shin with the upper arm or the thigh it hangs from. A part of a variant moves with the bone
// it names; a part with no bone (the torso, a skirt) stays where it is drawn.
// name, parent, joint, level (1 from the body, 2 from the bone before)
export const BONES = [
  ['left_upper_arm', undefined, [42, 34], 1], ['left_forearm', 'left_upper_arm', [37, 44.5], 2],
  ['right_upper_arm', undefined, [58, 34], 1], ['right_forearm', 'right_upper_arm', [63, 44.5], 2],
  ['left_thigh', undefined, [45, 62], 1], ['left_shin', 'left_thigh', [45, 76], 2],
  ['right_thigh', undefined, [55, 62], 1], ['right_shin', 'right_thigh', [55, 76], 2],
];
// Where a hand is when the arms hang down (the centre of the circle drawn for it).
const HANDS = { left: [31, 54], right: [69, 54] };

// Poses: how far each bone turns from the standing figure, in degrees clockwise on the page (the frame's y goes down: a
// left arm raised over the head turns +160, a right one -160). A figure looks to the right of the page (a person who
// faces left is mirrored whole), so a kick, a wave or a held thing is on the right side. [name, about, turns]
export const POSES = [
  ['standing', 'standing upright with the arms down', {}],
  ['arms up', 'both arms raised over the head', { left_upper_arm: 135, right_upper_arm: -135 }],
  ['waving', 'one hand raised beside the head, waving', { right_upper_arm: -115, right_forearm: -45 }],
  ['pointing', 'one arm stretched out to the side, pointing', { right_upper_arm: -80, right_forearm: -5 }],
  ['holding', 'one arm bent forward, the hand holding something', { right_upper_arm: -40, right_forearm: -50 }],
  ['reaching up', 'one arm stretched straight up', { right_upper_arm: -150 }],
  ['hands on hips', 'both hands on the hips, elbows out', { left_upper_arm: 40, left_forearm: -100, right_upper_arm: -40, right_forearm: 100 }],
  ['clapping', 'both hands together in front of the chest', { left_upper_arm: -15, left_forearm: -100, right_upper_arm: 15, right_forearm: 100 }],
  ['sitting', 'sitting, the thighs forward and the shins down', { left_thigh: -80, left_shin: 80, right_thigh: -80, right_shin: 80, left_upper_arm: -10, left_forearm: -45, right_upper_arm: -10, right_forearm: -18 }],
  ['cross legged', 'sitting on the ground with the legs crossed', { left_thigh: 65, left_shin: -128, right_thigh: -65, right_shin: 128, left_upper_arm: 15, left_forearm: -50, right_upper_arm: -15, right_forearm: 50 }],
  ['kicking', 'one leg swung forward in a kick, the arms out for balance', { right_thigh: -65, right_shin: -5, left_upper_arm: 35, right_upper_arm: -25 }],
  ['running', 'running: one knee up, the arms swinging', { right_thigh: -45, right_shin: 70, left_thigh: 20, left_shin: 35, right_upper_arm: -45, right_forearm: -60, left_upper_arm: 30, left_forearm: -25 }],
  ['walking', 'walking: one leg forward, the arms swinging a little', { right_thigh: -18, right_shin: 8, left_thigh: 14, left_shin: 12, right_upper_arm: 15, left_upper_arm: -15 }],
  ['jumping', 'jumping: the arms up and the knees bent', { left_upper_arm: 150, right_upper_arm: -150, left_thigh: 20, left_shin: -40, right_thigh: -20, right_shin: 40 }],
  ['dancing', 'dancing: one arm up, one knee raised', { left_upper_arm: 130, left_forearm: 20, right_upper_arm: -45, right_forearm: -40, right_thigh: -30, right_shin: 40 }],
];
const POSE_WORDS = {
  standing: 'stand, stands, standing up, standing still, upright', 'arms up': 'arms raised, hands up, raising arms, arms in the air, hands in the air, raised arms',
  waving: 'wave, waves, waving hello, waving goodbye', pointing: 'point, points', holding: 'hold, holds, carrying, carry, carries',
  'reaching up': 'reach up, reaching', 'hands on hips': 'hands on her hips, hands on his hips, arms akimbo', clapping: 'clap, claps, clapping hands',
  sitting: 'sit, sits, sat, seated, sitting down, sat down', 'cross legged': 'cross-legged, sitting cross legged, sitting cross-legged, legs crossed',
  kicking: 'kick, kicks, kicking a ball', running: 'run, runs', walking: 'walk, walks', jumping: 'jump, jumps, leaping, leap', dancing: 'dance, dances',
};
// The figure's point p carried by the turns of a pose along the bone it moves with (its parents first).
const rad = (a) => (a * Math.PI) / 180;
const turnAbout = ([x, y], [cx, cy], a) => { const c = Math.cos(rad(a)), s = Math.sin(rad(a)); return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]; };
export function posed(point, bone, turns) {
  const chain = [];
  for (let b = BONES.find((x) => x[0] === bone); b; b = BONES.find((x) => x[0] === b[1])) chain.unshift(b);
  let p = point;
  for (const [name, , joint] of chain.reverse()) p = turnAbout(p, joint, turns[name] ?? 0);
  return p.map(r1);
}

const skin = { tint: 'skin' }, clothes = { tint: 'clothes' }, clothesShade = { tint: 'clothes_shade' };
// Colours an untinted garment offers (basic colour names; its rgb is how it is drawn unless one of them is chosen).
const TROUSERS = 'blue black brown grey green red white';
const DENIM = 'blue black grey';
const SHOE = 'brown black red white blue';
const COAT = 'brown black blue green grey red';
const mirrorX = (pts) => pts.map(([x, y]) => [r1(100 - x), y]).reverse();
const mirrorBox = ([x, y, w, h]) => [r1(100 - x - w), y, w, h];
const flipBone = (b) => b && b.replace(/^left_/, 'R_').replace(/^right_/, 'left_').replace(/^R_/, 'right_');
const flipName = (n) => n.replace(/^left_/, 'R_').replace(/^right_/, 'left_').replace(/^R_/, 'right_');
// A limb segment from a to b, hw wide on each side: a quadrilateral.
function quad([ax, ay], [bx, by], hw, hwb = hw) {
  const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy), px = -dy / l, py = dx / l;
  return [[ax + px * hw, ay + py * hw], [bx + px * hwb, by + py * hwb], [bx - px * hwb, by - py * hwb], [ax - px * hw, ay - py * hw]].map(([x, y]) => [r1(x), r1(y)]);
}
// The joints of the left side (the right side mirrors them).
const SHOULDER = [42, 34], ELBOW = [37, 44.5], WRIST = [32.5, 53.5], HIP = [45, 62], KNEE = [45, 76], ANKLE = [45, 89.5];
// Both sides of a part list given for the left side: a polygon or line mirrors its points, a box its place; the bone
// and the name swap sides.
function pair(parts) {
  const out = [];
  for (const [name, shape, g, z, cols, o = {}] of parts) {
    out.push([name, shape, g, z, cols, o]);
    const mg = shape === 'poly' || shape === 'line' ? mirrorX(g) : shape === 'circle' ? [r1(100 - g[0] - g[2]), g[1], g[2]] : mirrorBox(g);
    out.push([flipName(name), shape, mg, z, cols, { ...o, bone: flipBone(o.bone) }]);
  }
  return out;
}
const circleAt = ([x, y], r) => [r1(x - r), r1(y - r), r1(2 * r)];
// A sleeve over the upper arm (short: to above the elbow) and, for a long one, over the forearm too.
const sleeves = (length, colour, o, hw = 2.9) => pair([
  ['left_sleeve', 'poly', quad(SHOULDER, length === 'short' ? [38.6, 41.2] : ELBOW, hw + 0.6, hw), 1, colour, { ...o, bone: 'left_upper_arm' }],
  ...(length === 'long' ? [['left_cuff', 'poly', quad(ELBOW, WRIST, hw - 0.2, hw - 0.5), 1, colour, { ...o, bone: 'left_forearm' }],
    ['left_elbow', 'circle', circleAt(ELBOW, hw - 0.1), 1, colour, { ...o, bone: 'left_forearm' }]] : []),
]);
const thighs = (y1, colour, o) => pair([['left_leg', 'poly', [[40, 60], [50, 60], [49.2, Math.min(y1, 76.5)], [40.8, Math.min(y1, 76.5)]], 1, colour, { ...o, bone: 'left_thigh' }],
  ...(y1 > 76 ? [['left_knee', 'circle', circleAt(KNEE, 4.2), 1, colour, { ...o, bone: 'left_shin' }], ['left_shin', 'poly', [[40.8, 75.5], [49.2, 75.5], [49, y1], [41, y1]], 1, colour, { ...o, bone: 'left_shin' }]] : [])]);
const torsoTop = (bottom = 62) => [[40, 31], [46, 31], [50, 34], [54, 31], [60, 31], [61, 36], [60, bottom], [40, bottom], [39, 36]];

// slot -> [name, features, parts]; a part is [name, shape, geometry, z, colour names, options (tint, rgb, bone)].
export const VARIANTS = {
  back: [
    ['cape', { length: 'long', kind: 'cape' }, [['cape', 'poly', [[39, 30], [61, 30], [70, 80], [30, 80]], 1, 'red blue black purple green', { rgb: '#B22234' }],
      ['lining', 'poly', [[41, 31], [59, 31], [66, 79], [34, 79]], 2, 'red blue black purple green', { rgb: '#7A1520' }]]],
    ['cloak', { length: 'long', feel: ['thick'], kind: 'cloak' }, [['cloak', 'poly', [[38, 29], [62, 29], [71, 82], [29, 82]], 1, 'brown black grey green purple', { rgb: '#4B3B5C' }]]],
  ],
  body: [
    ['bare', { kind: 'body' }, [
      ['neck', 'rect', [46, 26, 8, 8], 1, 'pink brown', skin],
      ['torso', 'rect', [40, 32, 20, 30], 1, 'pink brown', skin],
      ...pair([
        ['left_upper_arm', 'poly', quad(SHOULDER, ELBOW, 2.4, 2.2), 1, 'pink brown', { ...skin, bone: 'left_upper_arm' }],
        ['left_shoulder', 'circle', circleAt(SHOULDER, 2.6), 1, 'pink brown', { ...skin, bone: 'left_upper_arm' }],
        ['left_forearm', 'poly', quad(ELBOW, WRIST, 2.2, 2.0), 1, 'pink brown', { ...skin, bone: 'left_forearm' }],
        ['left_elbow', 'circle', circleAt(ELBOW, 2.2), 1, 'pink brown', { ...skin, bone: 'left_forearm' }],
        ['left_hand', 'circle', circleAt(HANDS.left, 3), 2, 'pink brown', { ...skin, bone: 'left_forearm' }],
        ['left_thigh', 'poly', [[41, 61], [49, 61], [48.6, 76.5], [41.4, 76.5]], 1, 'pink brown', { ...skin, bone: 'left_thigh' }],
        ['left_knee', 'circle', circleAt(KNEE, 3.6), 1, 'pink brown', { ...skin, bone: 'left_shin' }],
        ['left_shin', 'poly', [[41.4, 75.5], [48.6, 75.5], [48, 90], [42, 90]], 1, 'pink brown', { ...skin, bone: 'left_shin' }],
      ]),
    ]],
  ],
  top: [
    ['t-shirt', { length: 'short', kind: 't-shirt' }, [['shirt', 'poly', torsoTop(), 1, 'red', clothes], ...sleeves('short', 'red', clothes),
      ['collar', 'line', [[46, 31], [50, 35], [54, 31]], 2, 'red', clothesShade]]],
    ['shirt', { length: 'long', kind: 'shirt' }, [['shirt', 'poly', torsoTop(), 1, 'blue', clothes], ...sleeves('long', 'blue', clothes),
      ['buttons', 'line', [[50, 34], [50, 61]], 2, 'blue', clothesShade]]],
    ['jumper', { length: 'long', feel: ['thick'], kind: 'jumper' }, [['jumper', 'poly', torsoTop(63), 1, 'green', clothes], ...sleeves('long', 'green', clothes, 3.2),
      ['hem', 'line', [[40, 60], [60, 60]], 2, 'green', clothesShade]]],
    ['tank top', { length: 'short', feel: ['thin'], kind: 'tank top' }, [['top', 'poly', [[42, 31], [45, 31], [50, 36], [55, 31], [58, 31], [60, 40], [60, 62], [40, 62], [40, 40]], 1, 'yellow', clothes]]],
    ['dress', { length: 'long', kind: 'dress' }, [['dress', 'poly', [[40, 31], [46, 31], [50, 34], [54, 31], [60, 31], [61, 43], [60, 56], [68, 80], [32, 80], [40, 56], [39, 43]], 1, 'purple', clothes],
      ...sleeves('short', 'purple', clothes), ['waist', 'line', [[40, 56], [60, 56]], 2, 'purple', clothesShade]]],
  ],
  bottom: [
    ['trousers', { length: 'long', kind: 'trousers' }, [['waist', 'rect', [40, 58, 20, 4], 1, TROUSERS, { rgb: '#2F3E5C' }], ...thighs(88, TROUSERS, { rgb: '#2F3E5C' })]],
    ['jeans', { length: 'long', kind: 'jeans' }, [['waist', 'rect', [40, 58, 20, 4], 1, DENIM, { rgb: '#4A6FA5' }], ...thighs(88, DENIM, { rgb: '#4A6FA5' }),
      ['seam', 'line', [[50, 62], [50, 66]], 2, 'blue', { rgb: '#2E4A75' }]]],
    ['shorts', { length: 'short', kind: 'shorts' }, [['waist', 'rect', [40, 58, 20, 4], 1, TROUSERS, { rgb: '#6B5B3E' }], ...thighs(72, TROUSERS, { rgb: '#6B5B3E' })]],
    ['skirt', { length: 'medium', kind: 'skirt' }, [['skirt', 'poly', [[40, 58], [60, 58], [66, 76], [34, 76]], 1, 'blue red black green grey purple pink', { rgb: '#3A4F8A' }]]],
  ],
  shoes: [
    ['shoes', { kind: 'shoes' }, pair([['left_shoe', 'oval', [39, 88, 12, 5], 1, SHOE, { rgb: '#3A2A20', bone: 'left_shin' }]])],
    ['boots', { length: 'long', kind: 'boots' }, pair([['left_boot', 'poly', [[41, 81], [48.4, 81], [49, 89], [51, 93], [39, 93], [40.6, 89]], 1, SHOE, { rgb: '#4A3426', bone: 'left_shin' }]])],
    ['trainers', { kind: 'trainers' }, pair([['left_shoe', 'oval', [39, 88, 12, 5], 1, 'white grey black blue', { rgb: '#F2F2F2', bone: 'left_shin' }],
      ['left_stripe', 'line', [[41, 90], [49, 90]], 2, 'red blue', { rgb: '#D64541', bone: 'left_shin' }]])],
    ['sandals', { kind: 'sandals' }, pair([['left_sole', 'oval', [39.5, 90, 11, 3.5], 1, 'brown black', { rgb: '#8B5A2B', bone: 'left_shin' }],
      ['left_strap', 'line', [[42, 89.5], [45, 87.5], [48, 89.5]], 2, 'brown black', { rgb: '#6B4423', bone: 'left_shin' }]])],
  ],
  coat: [
    ['jacket', { length: 'short', kind: 'jacket' }, [...pair([['left_side', 'poly', [[39, 30], [49, 30], [49, 64], [39, 64], [38.6, 36]], 1, COAT, { rgb: '#7A5230' }]]),
      ...sleeves('long', COAT, { rgb: '#7A5230' }, 3.4)]],
    ['coat', { length: 'long', feel: ['thick'], kind: 'coat' }, [...pair([['left_side', 'poly', [[39, 30], [49, 30], [49, 80], [36, 80], [38.6, 36]], 1, COAT, { rgb: '#5B4636' }]]),
      ...sleeves('long', COAT, { rgb: '#5B4636' }, 3.6)]],
    ['suit jacket', { length: 'short', kind: 'suit' }, [...pair([['left_side', 'poly', [[39, 30], [48, 30], [50, 46], [49.6, 64], [39, 64], [38.6, 36]], 1, 'black grey blue brown', { rgb: '#2B2F3A' }],
      ['left_lapel', 'poly', [[44, 30], [48, 30], [50, 46], [45, 38]], 2, 'black grey blue brown', { rgb: '#1E2129' }]]),
      ...sleeves('long', 'black grey blue brown', { rgb: '#2B2F3A' }, 3.3), ['tie', 'poly', [[49, 31], [51, 31], [52, 46], [50, 49], [48, 46]], 3, 'red blue green black', { rgb: '#A31F34' }]]],
  ],
  neckwear: [
    ['scarf', { length: 'long', feel: ['thick'], kind: 'scarf' }, [['wrap', 'rect', [42, 28.5, 16, 5.5], 1, 'red blue green yellow purple', { rgb: '#C0392B' }],
      ['tail', 'poly', [[51, 32], [56, 32], [57.5, 48], [52.5, 48]], 2, 'red blue green yellow purple', { rgb: '#A93226' }]]],
    ['tie', { length: 'long', kind: 'tie' }, [['knot', 'poly', [[48.5, 31], [51.5, 31], [51, 34], [49, 34]], 1, 'red blue green black', { rgb: '#1F4E9A' }],
      ['blade', 'poly', [[49, 34], [51, 34], [52.5, 50], [50, 53], [47.5, 50]], 1, 'red blue green black', { rgb: '#1F4E9A' }]]],
    ['bow tie', { length: 'short', kind: 'bow tie' }, [['left_wing', 'poly', [[44, 30], [50, 32.5], [44, 35]], 1, 'red black blue', { rgb: '#B71C1C' }],
      ['right_wing', 'poly', [[56, 30], [50, 32.5], [56, 35]], 1, 'red black blue', { rgb: '#B71C1C' }], ['knot', 'circle', [48.8, 31.3, 2.4], 2, 'red black blue', { rgb: '#7F0000' }]]],
  ],
  hands: [
    ['gloves', { kind: 'gloves' }, pair([['left_glove', 'circle', circleAt(HANDS.left, 3.6), 1, 'black brown white red blue', { rgb: '#3B3B3B', bone: 'left_forearm' }]])],
    ['mittens', { feel: ['thick'], kind: 'mittens' }, pair([['left_mitten', 'oval', [26.8, 49.5, 8.4, 9], 1, 'red blue green white', { rgb: '#C62828', bone: 'left_forearm' }]])],
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
      ...cols.split(' ').map((c) => ['colour', c]), ['rgb', o.rgb ? { string: o.rgb } : undefined], ['tint', o.tint], ['bone', o.bone]], SRC));
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
  files['figure-poses.sop'] = `${head('figure-poses', `the skeleton of the style \`${STYLE}\` (the joints its limbs turn about, in the frame of the figure, and the bone each hangs from) and its poses: how far each bone turns from the standing figure (degrees clockwise on the page), and where the holding hand is in that pose (a figure looks to the right of the page).`)}\n${
    BONES.map(([name, parent, [x, y], level]) => wire(`k.faces.${STYLE}.bone.${name}`, 'k.faces.bone', [['style', STYLE], ['name', name], ['parent', parent], ['x', x], ['y', y], ['level', level]], SRC)).join('\n')}\n${
    POSES.map(([name, about, turns]) => { const [hx, hy] = posed(HANDS.right, 'right_forearm', turns);
      return [wire(`k.faces.${STYLE}.pose.${seg(name)}`, 'k.faces.pose', [['name', name], ['style', STYLE], ['about', { string: about }], ['holds', 'right_hand'], ['hold_x', hx], ['hold_y', hy]], SRC),
        ...Object.entries(turns).map(([bone, angle]) => wire(`k.faces.${STYLE}.pose.${seg(name)}.${bone}`, 'k.faces.turn', [['pose', name], ['style', STYLE], ['bone', bone], ['angle', angle]], SRC))].join('\n'); }).join('\n')}\n${
    POSES.map(([name]) => wire(`k.faces.word.pose.${seg(name)}`, 'core.word', [['text', name], ...(POSE_WORDS[name] ?? '').split(',').map((w) => w.trim()).filter(Boolean).map((w) => ['text', w]), ['means', name], ['of', 'k.faces.pose.name']], SRC)).join('\n')}\n`;
  for (const [slot, box] of SLOTS) {
    files[`${STYLE}-${slot}.sop`] = `${head(`${STYLE}-${slot}`, `the variants of the slot \`${slot}\` in the style \`${STYLE}\`: features, and parts with a primitive shape, a box in the frame of the figure, a draw order and colours; points for lines and polygons.`)}\n${
      VARIANTS[slot].map((v) => variantLines(slot, box, v)).join('\n\n')}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = figureShards();
  writeShards(join(WORLDS_DIR, 'k.faces', 'shards'), files, `${STYLE}-`);
  console.log(`${Object.keys(files).length} shards, ${Object.values(VARIANTS).reduce((n, v) => n + v.length, 0)} variants, ${PRESETS.length} outfits, ${BONES.length} bones, ${POSES.length} poses`);
}
