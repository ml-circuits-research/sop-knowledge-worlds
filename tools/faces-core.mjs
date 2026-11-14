// The hand-written core of k.faces (R6.2): the slots of the style `plain`, at least six variants per slot (ten for
// hair, eyes and mouth) drawn with primitive shapes, the colour lists, the presets and the expressions.
//   node tools/faces-core.mjs        writes docs/worlds/k.faces/shards/{slots,colours,presets,plain-<slot>,plain-canon}.sop
// The drawings are chosen by hand in the face frame (0 to 100, x right, y down), each slot's around its anchor (the
// eye centred on DRAWN.eye_x, eye_y, ...); curved outlines (the top of a head of hair, a ring of a pair of glasses)
// are sampled from an ellipse by `ell`. The parts are then placed by the proportion canon of the style (Q47): the
// canon is written as facts (plain-canon.sop, k.faces.canon), read back from that text, and each slot's drawings are
// moved and scaled from their anchor to where the canon puts it. The canon of `plain` is the one the drawings
// follow, so the parts land where the hand put them, byte for byte (tests/k.faces.canon.test.mjs). Deterministic.
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, writeShards } from './import/lib.mjs';
import { parse } from './sopworld/sopworld.mjs';

const SRC = 'hand-core 1';
export const STYLE = 'plain';
const r1 = (n) => Math.round(n * 10) / 10;

// Points on an ellipse from angle a0 to a1 (degrees; 0 is to the right, 90 is down, so 180 to 360 is the top half).
const ell = (cx, cy, rx, ry, a0 = 0, a1 = 360, n = 12) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [r1(cx + rx * Math.cos(a)), r1(cy + ry * Math.sin(a))];
});
// A closed ring as a line (an outline that is not filled).
const ring = (cx, cy, rx, ry = rx, n = 16) => ell(cx, cy, rx, ry, 0, 360, n);

// name, box, draw order, mirror, optional
export const SLOTS = [
  ['hair_back', [6, 2, 88, 90], 0, false, true],
  ['shoulders', [6, 82, 88, 18], 1, false, false],
  ['neck', [36, 68, 28, 22], 2, false, false],
  ['ears', [12, 38, 16, 24], 3, true, false],
  ['head', [22, 12, 56, 68], 4, false, false],
  ['cheeks', [24, 50, 14, 14], 5, true, true],
  ['beard', [22, 50, 56, 48], 6, false, true],
  ['mouth', [36, 59, 28, 16], 7, false, false],
  ['moustache', [35, 52, 30, 11], 8, false, true],
  ['nose', [42, 41, 16, 20], 9, false, false],
  ['eyes', [29, 35, 17, 14], 10, true, false],
  ['eyebrows', [27, 25, 19, 11], 11, true, false],
  ['glasses', [22, 31, 56, 22], 12, false, true],
  ['hair_front', [16, 4, 68, 48], 13, false, true],
  ['earrings', [12, 55, 15, 18], 14, true, true],
  ['hat', [4, 0, 92, 36], 15, false, true],
];

// Fixed colours of parts that no face colour fills.
const LIP = { rgb: '#B5483F' }, INSIDE = { rgb: '#6E1F24' }, TONGUE = { rgb: '#E8788A' }, WHITE = { rgb: '#FFFFFF' }, PUPIL = { rgb: '#1A1A1A' };
const BLUSH = { rgb: '#F2A0A0' }, METAL = { rgb: '#9AA4AE' }, GOLD = { rgb: '#E8B923' }, FRAME = { rgb: '#2A2A2A' }, DARK = { rgb: '#3A3A3A' };
const skin = { tint: 'skin' }, skinShade = { tint: 'skin_shade' }, hair = { tint: 'hair' }, hairShade = { tint: 'hair_shade' }, eyes = { tint: 'eyes' };
const clothes = { tint: 'clothes' }, clothesShade = { tint: 'clothes_shade' };

// The top of a head of hair: the upper half of an ellipse a little larger than the head, closed by a hairline
// (points from the right temple to the left one).
const cap = (hairline) => [...ell(50, 42, 30, 30, 180, 360, 12), ...hairline];
const beardOuter = (chin) => [[76, 54], [74, 66], [66, 78], [50, chin], [34, 78], [26, 66], [24, 54]];

// The outline of clothes on the shoulders, from the lower left corner over the neck to the lower right corner.
const BODY = [[8, 100], [10, 93], [26, 87], [40, 84], [60, 84], [74, 87], [90, 93], [92, 100]];

// slot -> [name, features, parts]; a part is [name, shape, geometry, z, colour names, options].
export const VARIANTS = {
  head: [
    ['round', { shape: 'round' }, [['face', 'oval', [23, 17, 54, 60], 1, 'pink brown', skin]]],
    ['oval', { shape: 'oval' }, [['face', 'oval', [25, 13, 50, 66], 1, 'pink brown', skin]]],
    ['long', { shape: 'long', feel: ['narrow'] }, [['face', 'oval', [27, 12, 46, 68], 1, 'pink brown', skin]]],
    ['square', { shape: 'square', feel: ['wide'] }, [['face', 'poly', [[28, 15], [72, 15], [78, 23], [78, 60], [68, 77], [32, 77], [22, 60], [22, 23]], 1, 'pink brown', skin]]],
    ['heart', { shape: 'heart' }, [['face', 'poly', [...ell(50, 40, 27, 25, 180, 360, 10), [75, 52], [66, 68], [56, 77], [50, 79], [44, 77], [34, 68], [25, 52]], 1, 'pink brown', skin]]],
    ['wide', { shape: 'round', size: 'large', feel: ['wide'] }, [['face', 'oval', [22, 19, 56, 58], 1, 'pink brown', skin]]],
    ['box', { shape: 'square', kind: 'box' }, [
      ['face', 'rect', [24, 14, 52, 62], 1, 'grey', skin],
      ['left_bolt', 'circle', [26, 16, 4], 2, 'grey', { ...skinShade, kind: 'bolt' }], ['right_bolt', 'circle', [70, 16, 4], 2, 'grey', { ...skinShade, kind: 'bolt' }],
    ]],
  ],
  ears: [
    ['round', { shape: 'round', size: 'medium' }, [['ear', 'circle', [15, 42, 13], 1, 'pink brown', skin], ['fold', 'arc', [18, 45, 5, 7, 'right'], 2, 'brown', skinShade]]],
    ['small', { size: 'small' }, [['ear', 'circle', [18, 44, 10], 1, 'pink brown', skin]]],
    ['large', { size: 'large' }, [['ear', 'oval', [12, 39, 16, 22], 1, 'pink brown', skin], ['fold', 'arc', [15, 44, 6, 12, 'right'], 2, 'brown', skinShade]]],
    ['pointed', { kind: 'pointed' }, [['ear', 'poly', [[28, 44], [13, 39], [18, 52], [28, 58]], 1, 'pink brown', skin]]],
    ['long', { shape: 'long' }, [['ear', 'oval', [16, 39, 12, 23], 1, 'pink brown', skin], ['fold', 'line', [[21, 44], [20, 56]], 2, 'brown', skinShade]]],
    ['square', { shape: 'square', kind: 'robot' }, [['ear', 'rect', [15, 43, 12, 12], 1, 'grey', skin], ['bolt', 'circle', [16, 46, 6], 2, 'grey', METAL]]],
  ],
  neck: [
    ['medium', { size: 'medium' }, [['neck', 'rect', [42, 70, 16, 18], 1, 'pink brown', skin]]],
    ['thin', { feel: ['thin', 'narrow'] }, [['neck', 'rect', [45, 70, 10, 18], 1, 'pink brown', skin]]],
    ['thick', { feel: ['thick', 'wide'] }, [['neck', 'rect', [38, 70, 24, 18], 1, 'pink brown', skin]]],
    ['tapered', { feel: ['wide'], kind: 'tapered' }, [['neck', 'poly', [[42, 70], [58, 70], [63, 88], [37, 88]], 1, 'pink brown', skin]]],
    ['necklace', { kind: 'necklace' }, [['neck', 'rect', [42, 70, 16, 18], 1, 'pink brown', skin], ['chain', 'arc', [42, 80, 16, 6, 'up'], 2, 'yellow', GOLD], ['pendant', 'circle', [48, 85, 4], 3, 'yellow', GOLD]]],
    ['pipe', { feel: ['thin'], kind: 'robot' }, [['neck', 'rect', [45, 70, 10, 18], 1, 'grey', METAL], ['upper_ring', 'line', [[45, 80], [55, 80]], 2, 'black', DARK], ['lower_ring', 'line', [[45, 85], [55, 85]], 2, 'black', DARK]]],
  ],
  shoulders: [
    ['t-shirt', { kind: 't-shirt' }, [['shirt', 'poly', [[8, 100], [10, 93], [26, 87], [40, 84], [60, 84], [74, 87], [90, 93], [92, 100]], 1, 'blue red', clothes], ['neckline', 'arc', [41, 84, 18, 6, 'up'], 2, 'blue', clothesShade]]],
    ['v-neck', { kind: 'v-neck' }, [['shirt', 'poly', [[8, 100], [10, 93], [26, 87], [40, 84], [60, 84], [74, 87], [90, 93], [92, 100]], 1, 'blue red', clothes], ['opening', 'tri', [41, 84, 18, 13, 'down'], 2, 'pink brown', skin]]],
    ['shirt', { kind: 'shirt' }, [
      ['shirt', 'poly', [[8, 100], [10, 93], [26, 87], [40, 84], [60, 84], [74, 87], [90, 93], [92, 100]], 1, 'blue white', clothes],
      ['left_collar', 'poly', [[40, 84], [50, 90], [42, 96], [35, 86]], 3, 'white', WHITE], ['right_collar', 'poly', [[60, 84], [50, 90], [58, 96], [65, 86]], 3, 'white', WHITE],
      ['button', 'circle', [48.5, 94, 3], 3, 'white', WHITE],
    ]],
    ['suit', { kind: 'suit', age: ['adult'] }, [
      ['jacket', 'poly', [[8, 100], [10, 92], [26, 86], [40, 84], [60, 84], [74, 86], [90, 92], [92, 100]], 1, 'black blue', clothes],
      ['shirt_front', 'tri', [40, 84, 20, 16, 'down'], 2, 'white', WHITE],
      ['tie', 'poly', [[47, 88], [53, 88], [52, 100], [48, 100]], 3, 'red', LIP],
      ['left_lapel', 'line', [[40, 84], [48, 100]], 3, 'black', clothesShade], ['right_lapel', 'line', [[60, 84], [52, 100]], 3, 'black', clothesShade],
    ]],
    ['hoodie', { kind: 'hoodie' }, [
      ['hood', 'poly', [[30, 90], [34, 82], [66, 82], [70, 90]], 0, 'grey blue', clothesShade],
      ['body', 'poly', [[8, 100], [10, 93], [26, 87], [40, 85], [60, 85], [74, 87], [90, 93], [92, 100]], 1, 'grey blue', clothes],
      ['left_string', 'line', [[45, 89], [44, 99]], 2, 'white', WHITE], ['right_string', 'line', [[55, 89], [56, 99]], 2, 'white', WHITE],
    ]],
    ['tank top', { kind: 'tank top' }, [
      ['shoulders', 'poly', [[10, 100], [12, 93], [26, 87], [40, 84], [60, 84], [74, 87], [88, 93], [90, 100]], 1, 'pink brown', skin],
      ['top', 'poly', [[30, 100], [33, 86], [38, 86], [42, 93], [58, 93], [62, 86], [67, 86], [70, 100]], 2, 'red blue', clothes],
    ]],
    ['small', { size: 'small', age: ['child'], kind: 't-shirt' }, [['shirt', 'poly', [[18, 100], [20, 93], [32, 88], [42, 86], [58, 86], [68, 88], [80, 93], [82, 100]], 1, 'red blue', clothes], ['neckline', 'arc', [42, 86, 16, 5, 'up'], 2, 'red', clothesShade]]],
    ['metal plate', { kind: 'robot', shape: 'square' }, [['plate', 'rect', [14, 85, 72, 15], 1, 'grey', METAL], ['left_bolt', 'circle', [18, 88, 4], 2, 'black', DARK], ['right_bolt', 'circle', [78, 88, 4], 2, 'black', DARK], ['light', 'circle', [47, 90, 6], 2, 'red', LIP]]],
    // Work clothes and clothes of stories (Round 7).
    ['lab coat', { kind: 'lab coat', age: ['adult'] }, [['coat', 'poly', BODY, 1, 'white', { rgb: '#F7F7F7' }], ['shirt_front', 'tri', [41, 84, 18, 13, 'down'], 2, 'blue red', clothes], ['left_lapel', 'poly', [[40, 84], [49, 97], [43, 100], [35, 87]], 3, 'white', { rgb: '#ECECEC', kind: 'lapel' }], ['right_lapel', 'poly', [[60, 84], [51, 97], [57, 100], [65, 87]], 3, 'white', { rgb: '#ECECEC', kind: 'lapel' }], ['pen', 'line', [[70, 92], [70, 98]], 4, 'blue', { rgb: '#2F5DA8' }]]],
    ['scrubs', { kind: 'scrubs', age: ['adult'] }, [['top', 'poly', BODY, 1, 'green blue', { rgb: '#7EC8C8' }], ['opening', 'tri', [41, 84, 18, 11, 'down'], 2, 'pink brown', skin], ['pocket', 'rect', [62, 92, 10, 7], 3, 'green blue', { rgb: '#63B0B0' }]]],
    ['chef jacket', { kind: 'chef jacket', age: ['adult'] }, [['jacket', 'poly', BODY, 1, 'white', { rgb: '#F7F7F7' }], ['collar', 'poly', [[40, 84], [60, 84], [57, 89], [43, 89]], 2, 'white', { rgb: '#E6E6E6' }], ['flap', 'line', [[56, 89], [56, 100]], 3, 'grey', DARK],
      ['button_1', 'circle', [42, 90.5, 3], 3, 'black', { ...DARK, kind: 'button' }], ['button_2', 'circle', [50, 90.5, 3], 3, 'black', { ...DARK, kind: 'button' }], ['button_3', 'circle', [42, 95.5, 3], 3, 'black', { ...DARK, kind: 'button' }], ['button_4', 'circle', [50, 95.5, 3], 3, 'black', { ...DARK, kind: 'button' }]]],
    ['apron', { kind: 'apron' }, [['shirt', 'poly', BODY, 1, 'blue red', clothes], ['left_strap', 'line', [[40, 91], [37, 85]], 2, 'white', { rgb: '#F4F1E8', kind: 'strap' }], ['right_strap', 'line', [[60, 91], [63, 85]], 2, 'white', { rgb: '#F4F1E8', kind: 'strap' }], ['bib', 'poly', [[36, 100], [39, 90], [61, 90], [64, 100]], 3, 'white', { rgb: '#F4F1E8' }]]],
    ['overalls', { kind: 'overalls' }, [['shirt', 'poly', BODY, 1, 'red blue', clothes], ['left_strap', 'poly', [[29, 86.5], [35, 85.5], [43, 92], [38, 92]], 2, 'blue', { rgb: '#3F6FB5', kind: 'strap' }], ['right_strap', 'poly', [[71, 86.5], [65, 85.5], [57, 92], [62, 92]], 2, 'blue', { rgb: '#3F6FB5', kind: 'strap' }], ['bib', 'rect', [37, 91, 26, 9], 3, 'blue', { rgb: '#3F6FB5' }],
      ['left_button', 'circle', [38.5, 91.5, 3], 4, 'yellow', { ...GOLD, kind: 'button' }], ['right_button', 'circle', [58.5, 91.5, 3], 4, 'yellow', { ...GOLD, kind: 'button' }]]],
    ['safety vest', { kind: 'safety vest', age: ['adult'] }, [['shirt', 'poly', BODY, 1, 'blue red', clothes], ['left_panel', 'poly', [[24, 88], [40, 84], [47, 100], [20, 100]], 2, 'orange', { rgb: '#FF7A1A', kind: 'panel' }], ['right_panel', 'poly', [[76, 88], [60, 84], [53, 100], [80, 100]], 2, 'orange', { rgb: '#FF7A1A', kind: 'panel' }],
      ['left_stripe', 'poly', [[21, 93], [45, 93], [46, 96], [20.5, 96]], 3, 'yellow', { rgb: '#F5F1B8', kind: 'stripe' }], ['right_stripe', 'poly', [[55, 93], [79, 93], [79.5, 96], [54, 96]], 3, 'yellow', { rgb: '#F5F1B8', kind: 'stripe' }]]],
    ['uniform', { kind: 'uniform', age: ['adult'] }, [['jacket', 'poly', BODY, 1, 'blue green', clothes], ['shirt_front', 'tri', [42, 84, 16, 10, 'down'], 2, 'white', WHITE], ['tie', 'poly', [[48, 85.5], [52, 85.5], [53, 96], [50, 99], [47, 96]], 3, 'black', DARK],
      ['left_epaulette', 'rect', [15, 89, 10, 3], 3, 'yellow', { ...GOLD, kind: 'epaulette' }], ['right_epaulette', 'rect', [75, 89, 10, 3], 3, 'yellow', { ...GOLD, kind: 'epaulette' }], ['badge', 'circle', [63, 91, 5], 3, 'yellow', GOLD]]],
    ['fire jacket', { kind: 'fire jacket', age: ['adult'] }, [['jacket', 'poly', BODY, 1, 'brown yellow', { rgb: '#B8923E' }], ['collar', 'rect', [40, 84, 20, 4], 2, 'black', DARK], ['upper_stripe', 'rect', [12, 93, 76, 2.5], 3, 'yellow', { rgb: '#F4E04D', kind: 'stripe' }], ['lower_stripe', 'rect', [10, 96.5, 80, 2.5], 3, 'grey', { rgb: '#DADADA', kind: 'stripe' }]]],
    ['sailor collar', { kind: 'sailor collar' }, [['shirt', 'poly', BODY, 1, 'white', { rgb: '#F7F7F7' }], ['collar', 'poly', [[33, 85.5], [40, 84], [50, 95], [60, 84], [67, 85.5], [71, 92], [50, 100], [29, 92]], 2, 'blue', { rgb: '#24427A' }], ['opening', 'tri', [42, 84, 16, 9, 'down'], 3, 'pink brown', skin]]],
    ['space suit', { kind: 'space suit' }, [['suit', 'poly', BODY, 1, 'white', { rgb: '#ECEFF1' }], ['neck_ring', 'oval', [33, 82, 34, 8], 2, 'grey', METAL], ['panel', 'rect', [42, 92, 14, 6], 3, 'blue', { rgb: '#2F5DA8' }], ['patch', 'rect', [66, 91, 8, 5], 3, 'red', { rgb: '#D32F2F' }]]],
    ['robe', { kind: 'robe', age: ['adult'] }, [['robe', 'poly', BODY, 1, 'black', FRAME], ['left_band', 'rect', [45.5, 85, 4, 13], 2, 'white', { ...WHITE, kind: 'band' }], ['right_band', 'rect', [50.5, 85, 4, 13], 2, 'white', { ...WHITE, kind: 'band' }]]],
    ['cloak', { kind: 'cloak' }, [['collar', 'poly', [[34, 88], [39, 82], [61, 82], [66, 88]], 0, 'purple blue', { rgb: '#3A2F7E' }], ['cloak', 'poly', BODY, 1, 'purple blue', { rgb: '#4B3F9E' }], ['clasp', 'circle', [47, 90, 6], 2, 'yellow', GOLD]]],
    ['cape', { kind: 'cape' }, [['suit', 'poly', BODY, 1, 'blue red', clothes], ['left_cape', 'poly', [[8, 100], [10, 93], [26, 87], [35, 85], [30, 100]], 2, 'red', { rgb: '#C62828', kind: 'cape' }], ['right_cape', 'poly', [[92, 100], [90, 93], [74, 87], [65, 85], [70, 100]], 2, 'red', { rgb: '#C62828', kind: 'cape' }], ['emblem', 'poly', [[50, 88], [57, 94], [50, 100], [43, 94]], 3, 'yellow', GOLD]]],
    ['fur coat', { kind: 'fur-trimmed coat' }, [['coat', 'poly', BODY, 1, 'red', { rgb: '#C62828' }], ['front_trim', 'rect', [46.5, 93, 7, 7], 2, 'white', { rgb: '#F7F7F7' }], ['fur_collar', 'poly', [[25, 89], [36, 84], [64, 84], [75, 89], [63, 95], [37, 95]], 3, 'white', { rgb: '#F7F7F7' }]]],
    ['football shirt', { kind: 'football shirt' }, [['shirt', 'poly', BODY, 1, 'red blue', clothes], ['left_stripe', 'rect', [27, 88, 6, 12], 2, 'white', { ...WHITE, kind: 'stripe' }], ['middle_stripe', 'rect', [47, 85, 6, 15], 2, 'white', { ...WHITE, kind: 'stripe' }], ['right_stripe', 'rect', [67, 88, 6, 12], 2, 'white', { ...WHITE, kind: 'stripe' }], ['neckline', 'arc', [41, 84, 18, 6, 'up'], 3, 'white', WHITE]]],
    ['bow tie', { kind: 'waistcoat and bow tie', age: ['adult'] }, [['shirt', 'poly', BODY, 1, 'white', WHITE], ['left_front', 'poly', [[8, 100], [10, 93], [26, 87], [38, 84.5], [45, 100]], 2, 'black', { ...FRAME, kind: 'front' }], ['right_front', 'poly', [[92, 100], [90, 93], [74, 87], [62, 84.5], [55, 100]], 2, 'black', { ...FRAME, kind: 'front' }],
      ['left_wing', 'tri', [40, 90, 10, 7, 'right'], 3, 'black red', { ...FRAME, kind: 'wing' }], ['right_wing', 'tri', [50, 90, 10, 7, 'left'], 3, 'black red', { ...FRAME, kind: 'wing' }], ['knot', 'circle', [48, 91.5, 4], 4, 'black red', FRAME]]],
    ['boiler suit', { kind: 'boiler suit', age: ['adult'] }, [['suit', 'poly', BODY, 1, 'grey blue', { rgb: '#5F7388' }], ['left_collar', 'poly', [[40, 84], [50, 89], [44, 93], [35, 86]], 2, 'grey blue', { rgb: '#4E6074', kind: 'collar' }], ['right_collar', 'poly', [[60, 84], [50, 89], [56, 93], [65, 86]], 2, 'grey blue', { rgb: '#4E6074', kind: 'collar' }], ['zip', 'line', [[50, 89], [50, 100]], 3, 'grey', METAL], ['pocket', 'rect', [61, 93, 9, 6], 3, 'grey blue', { rgb: '#4E6074' }]]],
  ],
  hair_back: [
    ['long straight', { length: 'long', feel: ['straight'] }, [['hair', 'poly', [...ell(50, 42, 34, 36, 180, 360, 12), [86, 88], [14, 88]], 1, 'brown black', hair]]],
    ['long wavy', { length: 'long', feel: ['wavy'] }, [['hair', 'poly', [...ell(50, 42, 34, 36, 180, 360, 12), [88, 52], [83, 60], [89, 68], [83, 76], [88, 86], [12, 86], [17, 76], [11, 68], [17, 60], [12, 52]], 1, 'brown black', hair]]],
    ['long curly', { length: 'long', feel: ['curly'] }, [
      ['top', 'oval', [14, 6, 72, 60], 1, 'brown black', hair],
      ...[[8, 34], [7, 48], [9, 62], [12, 75]].map(([x, y], i) => [`left_curl_${i + 1}`, 'circle', [x, y, 16], 2, 'brown black', { ...hair, kind: 'curl' }]),
      ...[[76, 34], [77, 48], [75, 62], [72, 75]].map(([x, y], i) => [`right_curl_${i + 1}`, 'circle', [x, y, 16], 2, 'brown black', { ...hair, kind: 'curl' }]),
    ]],
    ['bob', { length: 'medium', feel: ['straight'], kind: 'bob' }, [['hair', 'poly', [...ell(50, 42, 33, 35, 180, 360, 12), [84, 66], [78, 72], [22, 72], [16, 66]], 1, 'brown black', hair]]],
    ['ponytail', { length: 'long', kind: 'ponytail' }, [['tail', 'poly', [[72, 22], [86, 26], [92, 50], [88, 76], [80, 84], [82, 60], [78, 40]], 1, 'brown black', hair], ['band', 'circle', [73, 20, 7], 2, 'red', LIP]]],
    ['pigtails', { length: 'medium', kind: 'pigtails', age: ['child'] }, [
      ['left_tail', 'oval', [7, 44, 13, 34], 1, 'brown black', { ...hair, kind: 'tail' }], ['right_tail', 'oval', [80, 44, 13, 34], 1, 'brown black', { ...hair, kind: 'tail' }],
      ['left_band', 'circle', [11, 41, 6], 2, 'red', { ...LIP, kind: 'band' }], ['right_band', 'circle', [83, 41, 6], 2, 'red', { ...LIP, kind: 'band' }],
    ]],
    ['bun', { kind: 'bun', length: 'long' }, [['bun', 'circle', [39, 2, 22], 1, 'brown black', hair]]],
    ['afro', { feel: ['curly'], size: 'large', kind: 'afro' }, [['hair', 'circle', [8, 2, 84], 1, 'brown black', hair]]],
  ],
  hair_front: [
    ['short', { length: 'short', feel: ['straight'] }, [['hair', 'poly', cap([[79, 38], [74, 29], [62, 24], [50, 23], [38, 24], [26, 29], [21, 38]]), 1, 'brown black', hair]]],
    ['fringe', { length: 'short', feel: ['straight'], kind: 'fringe' }, [['hair', 'poly', cap([[80, 44], [76, 31], [24, 31], [20, 44]]), 1, 'brown black', hair], ['strand_1', 'line', [[38, 22], [38, 30]], 2, 'black', { ...hairShade, kind: 'strand' }], ['strand_2', 'line', [[50, 21], [50, 30]], 2, 'black', { ...hairShade, kind: 'strand' }], ['strand_3', 'line', [[62, 22], [62, 30]], 2, 'black', { ...hairShade, kind: 'strand' }]]],
    ['side parting', { length: 'short', feel: ['straight'], kind: 'side parting' }, [['hair', 'poly', cap([[80, 44], [75, 34], [60, 30], [44, 24], [36, 18], [30, 26], [21, 40]]), 1, 'brown black', hair], ['parting', 'line', [[36, 14], [36, 19]], 2, 'black', hairShade]]],
    ['curly', { length: 'short', feel: ['curly'] }, [
      ...ell(50, 40, 25, 22, 180, 360, 8).map(([x, y], i) => [`curl_${i + 1}`, 'circle', [r1(x - 7), r1(y - 7), 14], 1, 'brown black', { ...hair, kind: 'curl' }]),
      ['top', 'oval', [28, 12, 44, 16], 0, 'brown black', hair],
    ]],
    ['spikes', { length: 'short', kind: 'spikes' }, [['hair', 'poly', [[20, 40], [19, 26], [26, 30], [27, 14], [35, 23], [40, 7], [46, 20], [53, 5], [57, 20], [65, 8], [67, 23], [76, 15], [75, 30], [81, 27], [80, 40], [74, 30], [62, 25], [50, 24], [38, 25], [26, 30]], 1, 'brown black', hair]]],
    ['bald on top', { length: 'short', age: ['old'], kind: 'bald on top' }, [['left_tuft', 'oval', [18, 30, 9, 18], 1, 'grey white', { ...hair, kind: 'tuft' }], ['right_tuft', 'oval', [73, 30, 9, 18], 1, 'grey white', { ...hair, kind: 'tuft' }]]],
    ['receding', { length: 'short', age: ['adult', 'old'], kind: 'receding' }, [['hair', 'poly', cap([[79, 36], [72, 24], [62, 26], [50, 16], [38, 26], [28, 24], [21, 36]]), 1, 'brown black', hair]]],
    ['centre parting', { length: 'medium', feel: ['straight'], kind: 'centre parting' }, [['hair', 'poly', cap([[81, 50], [75, 34], [64, 24], [50, 17], [36, 24], [25, 34], [19, 50]]), 1, 'brown black', hair], ['parting', 'line', [[50, 12], [50, 17]], 2, 'black', hairShade]]],
    ['long sides', { length: 'long', feel: ['straight'] }, [['hair', 'poly', cap([[82, 52], [76, 50], [73, 32], [62, 24], [50, 22], [38, 24], [27, 32], [24, 50], [18, 52]]), 1, 'brown black', hair]]],
    ['wavy', { length: 'medium', feel: ['wavy'] }, [['hair', 'poly', cap([[81, 46], [76, 40], [78, 33], [70, 27], [64, 31], [57, 24], [50, 29], [43, 24], [36, 31], [30, 27], [22, 33], [24, 40], [19, 46]]), 1, 'brown black', hair]]],
    ['mohawk', { length: 'short', kind: 'mohawk' }, [['hair', 'poly', [[43, 24], [41, 12], [45, 5], [50, 4], [55, 5], [59, 12], [57, 24]], 1, 'brown black', hair]]],
    ['tuft', { size: 'small', age: ['child'], kind: 'tuft' }, [['hair', 'poly', [[44, 16], [46, 8], [50, 12], [52, 5], [55, 11], [59, 8], [57, 16]], 1, 'brown black', hair]]],
  ],
  eyebrows: [
    ['straight', { feel: ['flat', 'thin'] }, [['brow', 'line', [[30, 31], [44, 31]], 1, 'brown black', hair]]],
    ['thick', { feel: ['thick', 'flat'] }, [['brow', 'poly', [[29, 29], [45, 29], [45, 33.5], [29, 33.5]], 1, 'brown black', hair]]],
    ['arched', { feel: ['arched', 'thin'] }, [['brow', 'arc', [30, 28, 14, 5, 'down'], 1, 'brown black', hair]]],
    ['thick arched', { feel: ['thick', 'arched'] }, [['brow', 'poly', [[29, 33], [32, 29], [38, 27.5], [44, 29], [45.5, 32], [44, 33], [38, 31], [32, 32.5]], 1, 'brown black', hair]]],
    ['angry', { kind: 'angry', feel: ['flat'] }, [['brow', 'line', [[30, 28], [45, 33.5]], 1, 'brown black', hair]]],
    ['sad', { feel: ['sad'] }, [['brow', 'line', [[30, 34], [45, 28.5]], 1, 'brown black', hair]]],
    ['bushy', { feel: ['bushy', 'thick'], age: ['old'] }, [['brow', 'poly', [[28, 33], [29, 29], [31, 30], [33, 27.5], [35, 29.5], [38, 27], [40, 29.5], [43, 27.5], [44, 30], [46, 29.5], [45.5, 34], [42, 33], [38, 34.5], [33, 33.5]], 1, 'grey black', hair]]],
    ['raised', { feel: ['arched', 'surprised'] }, [['brow', 'arc', [30, 25.5, 14, 5, 'down'], 1, 'brown black', hair]]],
    ['short', { size: 'small', feel: ['thin'] }, [['brow', 'line', [[34, 31.5], [42, 30.5]], 1, 'brown black', hair]]],
  ],
  eyes: [
    ['round', { shape: 'round', size: 'medium', feel: ['open'] }, [['white', 'circle', [32, 37, 10], 1, 'white', WHITE], ['iris', 'circle', [34.5, 39.5, 5], 2, 'blue brown', eyes], ['pupil', 'circle', [36, 41, 2], 3, 'black', PUPIL]]],
    ['dot', { size: 'small', kind: 'dot' }, [['pupil', 'circle', [35, 40, 4], 1, 'black', PUPIL]]],
    ['large', { shape: 'round', size: 'large', feel: ['open'], age: ['child'] }, [['white', 'circle', [30.5, 35.5, 13], 1, 'white', WHITE], ['iris', 'circle', [33.5, 38.5, 7], 2, 'blue brown', eyes], ['pupil', 'circle', [35.5, 40.5, 3], 3, 'black', PUPIL], ['glint', 'circle', [38, 39, 1.6], 4, 'white', WHITE]]],
    ['oval', { shape: 'oval', feel: ['wide', 'open'] }, [['white', 'oval', [30, 38, 14, 8], 1, 'white', WHITE], ['iris', 'circle', [34.5, 39.5, 5], 2, 'blue brown', eyes], ['pupil', 'circle', [36, 41, 2], 3, 'black', PUPIL]]],
    ['narrow', { feel: ['narrow'] }, [['white', 'poly', [[30, 42], [34, 40], [40, 40], [44, 42], [40, 44], [34, 44]], 1, 'white', WHITE], ['iris', 'circle', [35, 40, 4], 2, 'blue brown', eyes], ['pupil', 'circle', [36.2, 41.2, 1.6], 3, 'black', PUPIL]]],
    ['closed', { feel: ['closed'] }, [['lid', 'arc', [31, 41, 12, 3, 'up'], 1, 'black', PUPIL]]],
    ['happy', { feel: ['closed', 'smiling'] }, [['lid', 'arc', [31, 39, 12, 4, 'down'], 1, 'black', PUPIL]]],
    ['surprised', { shape: 'round', size: 'large', feel: ['surprised', 'open'] }, [['white', 'circle', [30.5, 35.5, 13], 1, 'white', WHITE], ['iris', 'circle', [35, 40, 4], 2, 'blue brown', eyes], ['pupil', 'circle', [36.2, 41.2, 1.6], 3, 'black', PUPIL]]],
    ['sleepy', { feel: ['closed'], kind: 'half closed' }, [['white', 'oval', [30, 38, 14, 8], 1, 'white', WHITE], ['iris', 'circle', [34.5, 40, 5], 2, 'blue brown', eyes], ['pupil', 'circle', [36, 41.5, 2], 3, 'black', PUPIL], ['lid', 'rect', [29.5, 36.5, 15, 5.5], 4, 'pink brown', skin], ['lid_edge', 'line', [[30, 42], [44, 42]], 5, 'black', PUPIL]]],
    ['lashes', { shape: 'round', feel: ['open'], kind: 'lashes' }, [['white', 'circle', [32, 38, 10], 1, 'white', WHITE], ['iris', 'circle', [34.5, 40.5, 5], 2, 'blue brown', eyes], ['pupil', 'circle', [36, 42, 2], 3, 'black', PUPIL],
      ['lash_1', 'line', [[32, 39.5], [30, 36.5]], 4, 'black', { ...PUPIL, kind: 'lash' }], ['lash_2', 'line', [[35, 38], [34, 35.5]], 4, 'black', { ...PUPIL, kind: 'lash' }], ['lash_3', 'line', [[39, 38], [40, 35.5]], 4, 'black', { ...PUPIL, kind: 'lash' }]]],
    ['square', { shape: 'square', kind: 'robot' }, [['socket', 'square', [31.5, 36.5, 11], 1, 'black', DARK], ['light', 'square', [33.5, 38.5, 7], 2, 'yellow blue', eyes]]],
    ['downcast', { feel: ['open'], kind: 'looking down' }, [['white', 'oval', [30, 38, 14, 8], 1, 'white', WHITE], ['iris', 'circle', [34.5, 41, 5], 2, 'blue brown', eyes], ['pupil', 'circle', [36, 43, 2], 3, 'black', PUPIL], ['lid', 'rect', [29.5, 36.5, 15, 3.5], 4, 'pink brown', skin], ['lid_edge', 'line', [[30, 40], [44, 40]], 5, 'black', PUPIL]]],
    ['looking up', { feel: ['open'], kind: 'looking up' }, [['white', 'oval', [30, 37, 14, 9], 1, 'white', WHITE], ['iris', 'circle', [34.5, 37.5, 5], 2, 'blue brown', eyes], ['pupil', 'circle', [36, 38.5, 2], 3, 'black', PUPIL]]],
    // k.motion (glances): the iris toward the outer side of its eye, or toward the nose. The slot is mirrored, so a
    // glance to one side is one of them for the eye on the viewer's left and the other as `one_eye`.
    ['looking out', { feel: ['open'], kind: 'looking aside' }, [['white', 'oval', [30, 38, 14, 8], 1, 'white', WHITE], ['iris', 'circle', [31.5, 39.5, 5], 2, 'blue brown', eyes], ['pupil', 'circle', [32.5, 41, 2], 3, 'black', PUPIL]]],
    ['looking in', { feel: ['open'], kind: 'looking aside' }, [['white', 'oval', [30, 38, 14, 8], 1, 'white', WHITE], ['iris', 'circle', [37.5, 39.5, 5], 2, 'blue brown', eyes], ['pupil', 'circle', [39.5, 41, 2], 3, 'black', PUPIL]]],
  ],
  nose: [
    ['small', { size: 'small' }, [['nose', 'arc', [47, 52, 6, 3, 'up'], 1, 'brown', skinShade]]],
    ['medium', { size: 'medium' }, [['nose', 'line', [[50, 44], [46.5, 55], [52, 55]], 1, 'brown', skinShade]]],
    ['long', { length: 'long', size: 'large' }, [['nose', 'line', [[50, 42], [45.5, 59], [53, 59]], 1, 'brown', skinShade]]],
    ['wide', { feel: ['wide'] }, [['nose', 'arc', [44, 52, 12, 5, 'up'], 1, 'brown', skinShade], ['left_nostril', 'circle', [46, 53, 1.6], 2, 'brown', { ...skinShade, kind: 'nostril' }], ['right_nostril', 'circle', [52.4, 53, 1.6], 2, 'brown', { ...skinShade, kind: 'nostril' }]]],
    ['button', { shape: 'round', size: 'small', kind: 'button' }, [['nose', 'circle', [47, 50, 6], 1, 'pink brown', skinShade]]],
    ['pointed', { kind: 'pointed' }, [['nose', 'tri', [46, 46, 8, 11, 'up'], 1, 'pink brown', skinShade]]],
    ['round', { shape: 'round', size: 'large' }, [['nose', 'oval', [44, 47, 12, 10], 1, 'pink brown', skinShade]]],
    ['bolt', { shape: 'square', kind: 'robot' }, [['nose', 'square', [47, 50, 6], 1, 'grey', METAL]]],
  ],
  mouth: [
    ['smile', { feel: ['smiling', 'closed'] }, [['lips', 'arc', [41, 63, 18, 6, 'up'], 1, 'red', LIP]]],
    ['big smile', { feel: ['smiling', 'open'], size: 'large' }, [['inside', 'poly', [[38, 62], [62, 62], ...ell(50, 62, 12, 11, 0, 180, 8).slice(1, -1)], 1, 'red', INSIDE], ['teeth', 'rect', [41, 62, 18, 3.5], 2, 'white', WHITE]]],
    ['neutral', { feel: ['flat', 'closed'] }, [['lips', 'line', [[43, 66], [57, 66]], 1, 'red', LIP]]],
    ['sad', { feel: ['sad', 'closed'] }, [['lips', 'arc', [42, 65, 16, 5, 'down'], 1, 'red', LIP]]],
    ['open', { feel: ['open', 'surprised'], shape: 'round', size: 'small' }, [['inside', 'oval', [46, 62, 8, 10], 1, 'red', INSIDE]]],
    ['talking', { feel: ['open'] }, [['inside', 'oval', [43, 62, 14, 9], 1, 'red', INSIDE], ['tongue', 'oval', [46, 67, 8, 4], 2, 'pink', TONGUE]]],
    ['small', { size: 'small', feel: ['closed'] }, [['lips', 'line', [[47, 66], [53, 66]], 1, 'red', LIP]]],
    ['wide', { feel: ['wide', 'flat', 'closed'] }, [['lips', 'line', [[39, 66], [61, 66]], 1, 'red', LIP]]],
    ['smirk', { kind: 'smirk', feel: ['closed'] }, [['lips', 'line', [[43, 67], [53, 67], [59, 63]], 1, 'red', LIP]]],
    ['full lips', { feel: ['thick', 'closed'], kind: 'full lips' }, [['upper_lip', 'poly', [[41, 66], [46, 62.5], [50, 64], [54, 62.5], [59, 66]], 1, 'red', { ...LIP, kind: 'lip' }], ['lower_lip', 'poly', [[41, 66], [59, 66], [55, 70.5], [50, 71.5], [45, 70.5]], 1, 'red', { ...LIP, kind: 'lip' }]]],
    ['grin', { feel: ['smiling', 'open', 'wide'], kind: 'grin' }, [['teeth', 'poly', [[39, 62], [61, 62], [58, 69], [50, 71], [42, 69]], 1, 'white', WHITE], ['gap_1', 'line', [[45, 62.5], [45, 69.5]], 2, 'grey', { ...METAL, kind: 'gap' }], ['gap_2', 'line', [[50, 62.5], [50, 70.5]], 2, 'grey', { ...METAL, kind: 'gap' }], ['gap_3', 'line', [[55, 62.5], [55, 69.5]], 2, 'grey', { ...METAL, kind: 'gap' }]]],
    ['tongue out', { feel: ['smiling'], kind: 'tongue out' }, [['lips', 'arc', [41, 63, 18, 5, 'up'], 2, 'red', LIP], ['tongue', 'oval', [47, 66, 8, 8], 1, 'pink', TONGUE]]],
    ['frown', { feel: ['sad', 'open'] }, [['inside', 'poly', [[40, 71], [60, 71], ...ell(50, 71, 10, 8, 180, 360, 8).slice(1, -1).reverse()], 1, 'red', INSIDE]]],
    ['grille', { shape: 'square', kind: 'robot' }, [['plate', 'rect', [40, 62, 20, 9], 1, 'grey', METAL], ['slot_1', 'line', [[44, 63.5], [44, 69.5]], 2, 'black', { ...DARK, kind: 'slot' }], ['slot_2', 'line', [[48, 63.5], [48, 69.5]], 2, 'black', { ...DARK, kind: 'slot' }], ['slot_3', 'line', [[52, 63.5], [52, 69.5]], 2, 'black', { ...DARK, kind: 'slot' }], ['slot_4', 'line', [[56, 63.5], [56, 69.5]], 2, 'black', { ...DARK, kind: 'slot' }]]],
    ['gritted', { feel: ['open', 'wide'], kind: 'gritted teeth' }, [['teeth', 'rect', [40, 63, 20, 7], 1, 'white', WHITE], ['bite', 'line', [[40, 66.5], [60, 66.5]], 2, 'grey', METAL], ['gap_1', 'line', [[45, 63], [45, 70]], 2, 'grey', { ...METAL, kind: 'gap' }], ['gap_2', 'line', [[50, 63], [50, 70]], 2, 'grey', { ...METAL, kind: 'gap' }], ['gap_3', 'line', [[55, 63], [55, 70]], 2, 'grey', { ...METAL, kind: 'gap' }]]],
    // k.motion (visemes): the mouth while a sound is made: half open (e, i), lips pressed (m, b, p), the upper teeth
    // on the lower lip (f, v), the tip of the tongue behind the upper teeth (t, d, n, l).
    ['half open', { feel: ['open'], kind: 'half open' }, [['inside', 'oval', [43, 63.5, 14, 5], 1, 'red', INSIDE], ['teeth', 'rect', [45, 63.5, 10, 1.5], 2, 'white', WHITE]]],
    ['pressed', { feel: ['closed', 'thick'], kind: 'pressed lips' }, [['lips', 'poly', [[42, 65.4], [50, 64.8], [58, 65.4], [58, 66.6], [50, 67.2], [42, 66.6]], 1, 'red', LIP]]],
    ['lip bite', { feel: ['closed'], kind: 'teeth on lip' }, [['lower_lip', 'poly', [[43, 66], [57, 66], [55, 68.5], [45, 68.5]], 1, 'red', { ...LIP, kind: 'lip' }], ['teeth', 'rect', [44.5, 63.5, 11, 3], 2, 'white', WHITE]]],
    ['tongue tip', { feel: ['open'], kind: 'tongue tip' }, [['inside', 'oval', [44, 62.5, 12, 7], 1, 'red', INSIDE], ['teeth', 'rect', [45.5, 62.5, 9, 1.8], 2, 'white', WHITE], ['tongue', 'oval', [46, 64.5, 8, 3.5], 3, 'pink', TONGUE]]],
  ],
  cheeks: [
    ['blush', { kind: 'blush', shape: 'oval' }, [['blush', 'oval', [26, 54, 10, 6], 1, 'pink', BLUSH]]],
    ['round blush', { kind: 'blush', shape: 'round' }, [['blush', 'circle', [26.5, 52.5, 9], 1, 'pink', BLUSH]]],
    ['freckles', { kind: 'freckles' }, [['freckle_1', 'circle', [27, 54, 1.6], 1, 'brown', { ...skinShade, kind: 'freckle' }], ['freckle_2', 'circle', [31, 56, 1.6], 1, 'brown', { ...skinShade, kind: 'freckle' }], ['freckle_3', 'circle', [34, 53, 1.6], 1, 'brown', { ...skinShade, kind: 'freckle' }], ['freckle_4', 'circle', [29.5, 51.5, 1.6], 1, 'brown', { ...skinShade, kind: 'freckle' }]]],
    ['dimple', { kind: 'dimple' }, [['dimple', 'arc', [33, 58, 3, 6, 'left'], 1, 'brown', skinShade]]],
    ['wrinkles', { kind: 'wrinkles', age: ['old'] }, [['upper_line', 'line', [[27, 53], [33, 55]], 1, 'brown', { ...skinShade, kind: 'wrinkle' }], ['lower_line', 'line', [[30, 58], [36, 63]], 1, 'brown', { ...skinShade, kind: 'wrinkle' }]]],
    ['scar', { kind: 'scar' }, [['cut', 'line', [[27, 52], [35, 60]], 1, 'brown', skinShade], ['stitch_1', 'line', [[28, 56], [31, 53]], 2, 'brown', { ...skinShade, kind: 'stitch' }], ['stitch_2', 'line', [[31, 59], [34, 56]], 2, 'brown', { ...skinShade, kind: 'stitch' }]]],
    ['mole', { kind: 'mole', size: 'small' }, [['mole', 'circle', [31, 58, 2.4], 1, 'brown', PUPIL]]],
    ['tear', { kind: 'tear' }, [['tear', 'poly', [[31, 51], [33.5, 56.5], [31, 60], [28.5, 56.5]], 1, 'blue', { rgb: '#6EC1FF' }]]],
  ],
  beard: [
    ['full', { length: 'medium', feel: ['thick'], kind: 'full beard' }, [['beard', 'poly', [...beardOuter(86), [30, 52], [35, 58], [50, 56], [65, 58], [70, 52]], 1, 'brown black', hair]]],
    ['short', { length: 'short', kind: 'full beard' }, [['beard', 'poly', [[76, 54], [73, 66], [64, 76], [50, 80], [36, 76], [27, 66], [24, 54], [30, 52], [35, 58], [50, 56], [65, 58], [70, 52]], 1, 'brown black', hair]]],
    ['chinstrap', { feel: ['thin'], kind: 'chinstrap' }, [['beard', 'poly', [...beardOuter(84), [28, 54], [31, 65], [38, 74], [50, 78], [62, 74], [69, 65], [72, 54]], 1, 'brown black', hair]]],
    ['goatee', { size: 'small', kind: 'goatee' }, [['beard', 'poly', [[41, 72], [50, 74], [59, 72], [58, 82], [50, 86], [42, 82]], 1, 'brown black', hair]]],
    ['long', { length: 'long', age: ['old'], feel: ['bushy'], kind: 'long beard' }, [['beard', 'poly', [[76, 54], [75, 68], [70, 82], [60, 92], [50, 97], [40, 92], [30, 82], [25, 68], [24, 54], [30, 52], [35, 58], [50, 56], [65, 58], [70, 52]], 1, 'grey white', hair]]],
    ['soul patch', { size: 'small', kind: 'soul patch' }, [['beard', 'tri', [46.5, 73.5, 7, 7, 'down'], 1, 'brown black', hair]]],
    ['sideburns', { kind: 'sideburns' }, [['left_sideburn', 'poly', [[23, 50], [28, 50], [30, 66], [26, 66]], 1, 'brown black', { ...hair, kind: 'sideburn' }], ['right_sideburn', 'poly', [[77, 50], [72, 50], [70, 66], [74, 66]], 1, 'brown black', { ...hair, kind: 'sideburn' }]]],
    ['stubble', { length: 'short', feel: ['thin'], kind: 'stubble' }, [['shadow', 'poly', [[75, 56], [72, 66], [64, 75], [50, 79], [36, 75], [28, 66], [25, 56], [32, 58], [36, 60], [50, 57], [64, 60], [68, 58]], 1, 'grey brown', skinShade]]],
  ],
  moustache: [
    ['thin', { feel: ['thin'] }, [['moustache', 'line', [[41, 58.5], [50, 57.5], [59, 58.5]], 1, 'brown black', hair]]],
    ['thick', { feel: ['thick'] }, [['moustache', 'poly', [[38, 56.5], [50, 54.5], [62, 56.5], [62, 60.5], [50, 58.5], [38, 60.5]], 1, 'brown black', hair]]],
    ['handlebar', { kind: 'handlebar' }, [['moustache', 'poly', [[37, 53.5], [41, 57], [50, 55.5], [59, 57], [63, 53.5], [64.5, 58], [59, 61.5], [50, 59], [41, 61.5], [35.5, 58]], 1, 'brown black', hair]]],
    ['walrus', { feel: ['thick', 'bushy'], size: 'large', kind: 'walrus' }, [['moustache', 'poly', [[40, 54.5], [50, 53.5], [60, 54.5], [64.5, 62.5], [56, 60.5], [50, 59.5], [44, 60.5], [35.5, 62.5]], 1, 'brown black', hair]]],
    ['pencil', { feel: ['thin'], size: 'small', kind: 'pencil' }, [['left_half', 'line', [[41, 58.5], [48, 57.5]], 1, 'brown black', { ...hair, kind: 'half' }], ['right_half', 'line', [[52, 57.5], [59, 58.5]], 1, 'brown black', { ...hair, kind: 'half' }]]],
    ['chevron', { feel: ['thick'], kind: 'chevron' }, [['moustache', 'poly', [[50, 54], [62, 60.5], [50, 58.5], [38, 60.5]], 1, 'brown black', hair]]],
  ],
  glasses: [
    ['round', { shape: 'round' }, [['left_rim', 'line', ring(37, 42, 8), 1, 'black', { ...FRAME, kind: 'rim' }], ['right_rim', 'line', ring(63, 42, 8), 1, 'black', { ...FRAME, kind: 'rim' }], ['bridge', 'line', [[45, 42], [55, 42]], 1, 'black', FRAME], ['left_arm', 'line', [[29, 42], [23, 40]], 1, 'black', { ...FRAME, kind: 'arm' }], ['right_arm', 'line', [[71, 42], [77, 40]], 1, 'black', { ...FRAME, kind: 'arm' }]]],
    ['square', { shape: 'square' }, [['left_rim', 'line', [[28, 36], [46, 36], [46, 48], [28, 48], [28, 36]], 1, 'black', { ...FRAME, kind: 'rim' }], ['right_rim', 'line', [[54, 36], [72, 36], [72, 48], [54, 48], [54, 36]], 1, 'black', { ...FRAME, kind: 'rim' }], ['bridge', 'line', [[46, 41], [54, 41]], 1, 'black', FRAME], ['left_arm', 'line', [[28, 40], [23, 39]], 1, 'black', { ...FRAME, kind: 'arm' }], ['right_arm', 'line', [[72, 40], [77, 39]], 1, 'black', { ...FRAME, kind: 'arm' }]]],
    ['small round', { shape: 'round', size: 'small', age: ['old'] }, [['left_rim', 'line', ring(37, 43, 5.5), 1, 'yellow', { ...GOLD, kind: 'rim' }], ['right_rim', 'line', ring(63, 43, 5.5), 1, 'yellow', { ...GOLD, kind: 'rim' }], ['bridge', 'arc', [42.5, 41, 15, 3, 'down'], 1, 'yellow', GOLD]]],
    ['large', { shape: 'round', size: 'large' }, [['left_rim', 'line', ring(36.5, 42, 9.5), 1, 'red', { ...LIP, kind: 'rim' }], ['right_rim', 'line', ring(63.5, 42, 9.5), 1, 'red', { ...LIP, kind: 'rim' }], ['bridge', 'line', [[46, 41], [54, 41]], 1, 'red', LIP]]],
    ['sunglasses', { kind: 'sunglasses' }, [['left_lens', 'oval', [28, 36, 18, 12], 1, 'black', { ...FRAME, kind: 'lens' }], ['right_lens', 'oval', [54, 36, 18, 12], 1, 'black', { ...FRAME, kind: 'lens' }], ['bridge', 'line', [[46, 40], [54, 40]], 1, 'black', FRAME], ['left_arm', 'line', [[28, 40], [23, 39]], 1, 'black', { ...FRAME, kind: 'arm' }], ['right_arm', 'line', [[72, 40], [77, 39]], 1, 'black', { ...FRAME, kind: 'arm' }]]],
    ['cat-eye', { kind: 'cat-eye' }, [['left_rim', 'line', [[25, 34], [45, 37], [44, 46], [38, 49], [31, 47], [28, 41], [25, 34]], 1, 'purple', { rgb: '#7B3FA0', kind: 'rim' }], ['right_rim', 'line', [[75, 34], [55, 37], [56, 46], [62, 49], [69, 47], [72, 41], [75, 34]], 1, 'purple', { rgb: '#7B3FA0', kind: 'rim' }], ['bridge', 'line', [[45, 40], [55, 40]], 1, 'purple', { rgb: '#7B3FA0' }]]],
    ['monocle', { kind: 'monocle', shape: 'round' }, [['rim', 'line', ring(63, 42, 8), 1, 'yellow', GOLD], ['chain', 'line', [[71, 43], [74, 48], [73, 53]], 1, 'yellow', GOLD]]],
    ['visor', { kind: 'visor', feel: ['wide'] }, [['visor', 'rect', [26, 37, 48, 10], 1, 'blue', { rgb: '#3A6EA5' }], ['shine', 'line', [[30, 39.5], [44, 39.5]], 2, 'white', WHITE]]],
  ],
  hat: [
    ['cap', { kind: 'cap' }, [['crown', 'poly', [...ell(50, 26, 30, 22, 180, 360, 10)], 1, 'blue red', { rgb: '#2F5DA8' }], ['brim', 'poly', [[20, 24], [88, 24], [94, 29], [92, 31], [20, 30]], 2, 'blue red', { rgb: '#234A8A' }], ['button', 'circle', [48, 2.5, 4], 3, 'blue', { rgb: '#234A8A' }]]],
    ['beanie', { kind: 'beanie' }, [['crown', 'poly', [...ell(50, 26, 30, 20, 180, 360, 10)], 1, 'red green', { rgb: '#C0392B' }], ['band', 'rect', [19, 22, 62, 9], 2, 'red white', { rgb: '#E8E0D0' }], ['pompom', 'circle', [44, 0, 12], 3, 'white', { rgb: '#E8E0D0' }]]],
    ['top hat', { kind: 'top hat', age: ['adult'] }, [['crown', 'rect', [32, 0, 36, 24], 1, 'black', FRAME], ['band', 'rect', [32, 17, 36, 6], 2, 'red', LIP], ['brim', 'rect', [18, 23, 64, 5], 3, 'black', FRAME]]],
    ['crown', { kind: 'crown' }, [['crown', 'poly', [[26, 27], [24, 8], [35, 18], [42, 4], [50, 16], [58, 4], [65, 18], [76, 8], [74, 27]], 1, 'yellow', GOLD], ['left_jewel', 'circle', [33, 20, 4], 2, 'red', { ...LIP, kind: 'jewel' }], ['middle_jewel', 'circle', [48, 19, 4], 2, 'blue', { rgb: '#2F5DA8', kind: 'jewel' }], ['right_jewel', 'circle', [63, 20, 4], 2, 'red', { ...LIP, kind: 'jewel' }]]],
    ['cowboy hat', { kind: 'cowboy hat', feel: ['wide'] }, [['brim', 'oval', [6, 17, 88, 14], 1, 'brown', { rgb: '#8B5A2B' }], ['crown', 'poly', [[29, 23], [33, 5], [42, 3], [50, 7], [58, 3], [67, 5], [71, 23]], 2, 'brown', { rgb: '#A0692F' }], ['band', 'poly', [[30, 19], [70, 19], [71, 23], [29, 23]], 3, 'black', FRAME]]],
    ['party hat', { kind: 'party hat', age: ['child'] }, [['cone', 'tri', [35, 3, 30, 25, 'up'], 1, 'purple yellow', { rgb: '#8E44AD' }], ['stripe', 'line', [[42, 18], [58, 18]], 2, 'yellow', GOLD], ['pompom', 'circle', [46, 0, 8], 3, 'yellow', GOLD]]],
    ['bow', { kind: 'bow', age: ['child'] }, [['left_loop', 'tri', [34, 6, 15, 14, 'right'], 1, 'red pink', { ...LIP, kind: 'loop' }], ['right_loop', 'tri', [51, 6, 15, 14, 'left'], 1, 'red pink', { ...LIP, kind: 'loop' }], ['knot', 'circle', [46.5, 9.5, 7], 2, 'red pink', LIP]]],
    ['antenna', { kind: 'antenna' }, [['rod', 'line', [[50, 15], [50, 5]], 1, 'grey', METAL], ['ball', 'circle', [46.5, 0, 7], 2, 'red', LIP]]],
    ['sun hat', { kind: 'sun hat', feel: ['wide'] }, [['brim', 'oval', [4, 15, 92, 16], 1, 'yellow', { rgb: '#E9D08A' }], ['crown', 'poly', [...ell(50, 22, 22, 18, 180, 360, 10)], 2, 'yellow', { rgb: '#F1DDA0' }], ['ribbon', 'rect', [28.5, 16, 43, 5], 3, 'pink red', { rgb: '#D9698C' }]]],
    // Work hats and hats of stories (Round 7): so that a job shows on the face.
    ['chef hat', { kind: 'chef hat', age: ['adult'] }, [['left_puff', 'circle', [26, 3, 20], 1, 'white', { rgb: '#F4F4F4', kind: 'puff' }], ['right_puff', 'circle', [54, 3, 20], 1, 'white', { rgb: '#F4F4F4', kind: 'puff' }], ['middle_puff', 'circle', [38, 0, 24], 2, 'white', { rgb: '#F4F4F4', kind: 'puff' }], ['band', 'rect', [30, 17, 40, 12], 3, 'white', { rgb: '#EDEDED' }]]],
    ['hard hat', { kind: 'hard hat', age: ['adult'] }, [['shell', 'poly', [...ell(50, 26, 27, 23, 180, 360, 10)], 1, 'yellow', { rgb: '#F2C200' }], ['ridge', 'rect', [46.5, 3, 7, 22], 2, 'yellow', { rgb: '#D9A900' }], ['brim', 'poly', [[20, 24], [80, 24], [88, 30], [12, 30]], 3, 'yellow', { rgb: '#D9A900' }]]],
    ['fire helmet', { kind: 'fire helmet', age: ['adult'] }, [['shell', 'poly', [...ell(50, 27, 27, 24, 180, 360, 10)], 1, 'red', { rgb: '#C62828' }], ['crest', 'rect', [47, 3, 6, 10], 2, 'red', { rgb: '#8E1B1B' }], ['brim', 'poly', [[18, 25], [82, 25], [92, 32], [8, 32]], 3, 'red', { rgb: '#8E1B1B' }], ['badge', 'poly', [[44, 13], [56, 13], [56, 20], [50, 24], [44, 20]], 4, 'yellow', GOLD]]],
    ['police cap', { kind: 'police cap', age: ['adult'] }, [['crown', 'poly', [[23, 22], [19, 9], [34, 3], [66, 3], [81, 9], [77, 22]], 1, 'blue black', { rgb: '#1F2F55' }], ['band', 'rect', [23, 19, 54, 6], 2, 'black', FRAME], ['peak', 'poly', [[24, 25], [76, 25], [83, 31], [17, 31]], 3, 'black', FRAME], ['badge', 'circle', [46, 8, 8], 4, 'grey', METAL]]],
    ['pilot cap', { kind: 'pilot cap', age: ['adult'] }, [['crown', 'poly', [[23, 22], [19, 9], [34, 3], [66, 3], [81, 9], [77, 22]], 1, 'white', { rgb: '#F2F2F2' }], ['band', 'rect', [23, 19, 54, 6], 2, 'blue black', { rgb: '#1F2F55' }], ['peak', 'poly', [[24, 25], [76, 25], [83, 31], [17, 31]], 3, 'black', FRAME], ['wings', 'oval', [39, 9, 22, 7], 4, 'yellow', GOLD]]],
    ['nurse cap', { kind: 'nurse cap', age: ['adult'] }, [['cap', 'poly', [[30, 27], [27, 11], [50, 5], [73, 11], [70, 27]], 1, 'white', { rgb: '#F7F7F7' }], ['cross_post', 'rect', [47.5, 10, 5, 13], 2, 'red', { rgb: '#D32F2F' }], ['cross_bar', 'rect', [43.5, 14, 13, 5], 2, 'red', { rgb: '#D32F2F' }]]],
    ['sailor cap', { kind: 'sailor cap' }, [['top', 'oval', [20, 5, 60, 16], 1, 'white', { rgb: '#F7F7F7' }], ['band', 'rect', [26, 16, 48, 11], 2, 'white', { rgb: '#F7F7F7' }], ['stripe', 'rect', [26, 21, 48, 3], 3, 'blue', { rgb: '#24427A' }]]],
    ['military helmet', { kind: 'military helmet', age: ['adult'] }, [['shell', 'poly', [...ell(50, 29, 30, 25, 180, 360, 10)], 1, 'green', { rgb: '#5B6B3A' }], ['rim', 'rect', [19, 27, 62, 4], 2, 'green', { rgb: '#48562D' }]]],
    ['space helmet', { kind: 'space helmet' }, [['shell', 'poly', [...ell(50, 34, 37, 32, 180, 360, 12)], 1, 'white', { rgb: '#ECEFF1' }], ['stripe', 'rect', [46, 3, 8, 26], 2, 'red', { rgb: '#D32F2F' }], ['rim', 'rect', [14, 29, 72, 5], 3, 'grey', METAL]]],
    ['knight helmet', { kind: 'knight helmet', age: ['adult'] }, [['shell', 'poly', [...ell(50, 31, 29, 24, 180, 360, 10)], 1, 'grey', METAL], ['plume', 'poly', [[50, 8], [56, 1], [70, 1], [82, 9], [70, 7], [60, 10]], 2, 'red', { rgb: '#C62828' }], ['ridge', 'line', [[50, 8], [50, 28]], 3, 'grey', { rgb: '#6E7780' }], ['rim', 'rect', [21, 28, 58, 5], 3, 'grey', { rgb: '#6E7780' }]]],
    ['pirate hat', { kind: 'pirate hat', feel: ['wide'] }, [['hat', 'poly', [[12, 29], [22, 14], [38, 4], [50, 2], [62, 4], [78, 14], [88, 29], [70, 24], [50, 22], [30, 24]], 1, 'black', FRAME], ['bone_1', 'line', [[42, 19], [58, 13]], 2, 'white', { ...WHITE, kind: 'bone' }], ['bone_2', 'line', [[42, 13], [58, 19]], 2, 'white', { ...WHITE, kind: 'bone' }], ['skull', 'circle', [46, 7, 8], 3, 'white', WHITE]]],
    ['witch hat', { kind: 'witch hat', feel: ['wide'] }, [['cone', 'tri', [33, 0, 34, 26, 'up'], 1, 'black', FRAME], ['brim', 'oval', [8, 22, 84, 10], 2, 'black', FRAME], ['band', 'rect', [36, 19, 28, 4], 3, 'purple', { rgb: '#7B3FA0' }], ['buckle', 'square', [47, 18, 6], 4, 'yellow', GOLD]]],
    ['wizard hat', { kind: 'wizard hat' }, [['cone', 'tri', [30, 0, 40, 28, 'up'], 1, 'blue', { rgb: '#2F3F9E' }], ['band', 'rect', [28, 25, 44, 5], 2, 'blue', { rgb: '#22307A' }], ['star', 'poly', [[50, 9], [52, 13.5], [57, 13.5], [53, 16.5], [54.5, 21], [50, 18.5], [45.5, 21], [47, 16.5], [43, 13.5], [48, 13.5]], 3, 'yellow', GOLD]]],
    ['Santa hat', { kind: 'Santa hat' }, [['hat', 'poly', [[24, 25], [30, 10], [44, 3], [60, 4], [74, 11], [84, 22], [76, 25]], 1, 'red', { rgb: '#C62828' }], ['trim', 'rect', [20, 22, 60, 9], 2, 'white', { rgb: '#F7F7F7' }], ['pompom', 'circle', [79, 17, 11], 3, 'white', { rgb: '#F7F7F7' }]]],
    ['beret', { kind: 'beret' }, [['stalk', 'line', [[54, 6], [56, 2]], 1, 'black', FRAME], ['beret', 'oval', [18, 5, 66, 21], 2, 'red black', { rgb: '#7A1F2B' }], ['band', 'rect', [26, 22, 48, 4], 3, 'black', FRAME]]],
    ['fedora', { kind: 'fedora', age: ['adult'] }, [['brim', 'oval', [10, 20, 80, 10], 1, 'grey', { rgb: '#5E5E5E' }], ['crown', 'poly', [[30, 25], [32, 6], [44, 3], [50, 6], [56, 3], [68, 6], [70, 25]], 2, 'grey', { rgb: '#757575' }], ['band', 'poly', [[30.5, 19], [69.5, 19], [70, 25], [30, 25]], 3, 'black', FRAME]]],
    ['swimming cap', { kind: 'swimming cap' }, [['cap', 'poly', [...ell(50, 36, 29, 30, 180, 360, 12)], 1, 'blue', { rgb: '#1E88E5' }], ['stripe', 'rect', [48, 6.5, 4, 22], 2, 'white', WHITE]]],
    ['judge wig', { kind: 'wig', age: ['adult'] }, [['wig', 'poly', [...ell(50, 36, 33, 32, 180, 360, 12)], 1, 'white grey', { rgb: '#EDEAE0' }], ['curl_row_1', 'line', [[32, 14], [68, 14]], 2, 'grey', { rgb: '#B8B4A8', kind: 'curl_row' }], ['curl_row_2', 'line', [[24, 22], [76, 22]], 2, 'grey', { rgb: '#B8B4A8', kind: 'curl_row' }], ['curl_row_3', 'line', [[20, 30], [80, 30]], 2, 'grey', { rgb: '#B8B4A8', kind: 'curl_row' }]]],
    ['headscarf', { kind: 'headscarf' }, [['scarf', 'poly', [...ell(50, 36, 30, 30, 180, 360, 12)], 1, 'red blue', { rgb: '#D9534F' }], ['knot', 'circle', [64, 3, 9], 2, 'red blue', { rgb: '#B9403C' }], ['dot_1', 'circle', [36, 18, 4], 3, 'white', { ...WHITE, kind: 'dot' }], ['dot_2', 'circle', [50, 12, 4], 3, 'white', { ...WHITE, kind: 'dot' }], ['dot_3', 'circle', [58, 24, 4], 3, 'white', { ...WHITE, kind: 'dot' }]]],
    ['flower wreath', { kind: 'flower wreath' }, [['twig', 'line', [[24, 26], [34, 16], [50, 12], [66, 16], [76, 26]], 1, 'green', { rgb: '#4C9A4A' }], ['flower_1', 'circle', [20, 20, 10], 2, 'pink', { rgb: '#F48FB1', kind: 'flower' }], ['flower_2', 'circle', [31, 11, 10], 2, 'yellow', { rgb: '#FFD54F', kind: 'flower' }], ['flower_3', 'circle', [45, 7, 10], 2, 'pink', { rgb: '#F48FB1', kind: 'flower' }], ['flower_4', 'circle', [59, 11, 10], 2, 'yellow', { rgb: '#FFD54F', kind: 'flower' }], ['flower_5', 'circle', [70, 20, 10], 2, 'pink', { rgb: '#F48FB1', kind: 'flower' }]]],
  ],
  earrings: [
    ['stud', { kind: 'stud', size: 'small' }, [['stud', 'circle', [19, 56, 4], 1, 'yellow', GOLD]]],
    ['hoop', { kind: 'hoop' }, [['hoop', 'line', ring(21, 61, 4, 4, 12), 1, 'yellow', GOLD]]],
    ['drop', { kind: 'drop' }, [['wire', 'line', [[21, 56], [21, 62]], 1, 'yellow', GOLD], ['stone', 'circle', [18.5, 62, 5], 2, 'blue', { rgb: '#2F7FD0' }]]],
    ['pearl', { kind: 'pearl' }, [['pearl', 'circle', [18.5, 56, 5], 1, 'white', { rgb: '#F6F2EA' }]]],
    ['large hoop', { kind: 'hoop', size: 'large' }, [['hoop', 'line', ring(20.5, 63.5, 6, 6, 14), 1, 'yellow', GOLD]]],
    ['star', { kind: 'star' }, [['star', 'poly', [[21, 56], [22.4, 59.2], [25, 59.5], [23, 61.8], [23.8, 65], [21, 63.2], [18.2, 65], [19, 61.8], [17, 59.5], [19.6, 59.2]], 1, 'yellow', GOLD]]],
    ['bolt', { kind: 'robot', shape: 'square' }, [['bolt', 'square', [18, 57, 6], 1, 'grey', METAL]]],
  ],
};

// of, name, rgb, shade, natural
export const COLOURS = [
  ['skin', 'pale', '#FBE3D0', '#DDB59B', true], ['skin', 'light', '#F3CFB3', '#D3A482', true], ['skin', 'tan', '#E0AC86', '#B98660', true], ['skin', 'olive', '#C99A6B', '#A2764B', true],
  ['skin', 'brown', '#9A6A44', '#75492A', true], ['skin', 'dark brown', '#6B452B', '#472A17', true],
  ['skin', 'metal grey', '#B8C0C8', '#87919B', false], ['skin', 'green', '#9CCB7A', '#6A9B4C', false], ['skin', 'blue', '#8FB8E8', '#5C89C0', false], ['skin', 'yellow', '#FFD84A', '#D9AA1E', false], ['skin', 'white', '#FAFAFA', '#C9C9C9', false],
  ['hair', 'black', '#2B2B2B', '#555555', true], ['hair', 'dark brown', '#4A2F1E', '#2C1A0F', true], ['hair', 'brown', '#7A4B2A', '#553016', true], ['hair', 'auburn', '#9A4A2A', '#702E15', true],
  ['hair', 'red', '#C8562A', '#963A15', true], ['hair', 'blond', '#E8C46A', '#BE973A', true], ['hair', 'grey', '#A9A9A9', '#7C7C7C', true], ['hair', 'white', '#F0F0F0', '#C2C2C2', true],
  ['hair', 'blue', '#3F7FD8', '#285AA4', false], ['hair', 'pink', '#F07AB0', '#C24E86', false], ['hair', 'green', '#4CAF50', '#2E7D32', false], ['hair', 'purple', '#8E5BD0', '#653AA2', false], ['hair', 'orange', '#F28C28', '#C46612', false],
  ['eyes', 'dark brown', '#3B2414', '#22140A', true], ['eyes', 'brown', '#6B4226', '#472A16', true], ['eyes', 'hazel', '#8E6B3E', '#684B26', true], ['eyes', 'amber', '#C58A2B', '#966516', true],
  ['eyes', 'green', '#4E8B4A', '#34652F', true], ['eyes', 'blue', '#4A84C4', '#2F5F96', true], ['eyes', 'grey', '#7D8A96', '#59646E', true],
  ['eyes', 'red', '#D03030', '#9C1C1C', false], ['eyes', 'yellow', '#FFD400', '#C9A400', false], ['eyes', 'black', '#1A1A1A', '#000000', false],
  ['clothes', 'red', '#D64541', '#A62E2B', false], ['clothes', 'blue', '#3B6FB6', '#27508A', false], ['clothes', 'green', '#3F9B5B', '#2A7240', false], ['clothes', 'yellow', '#F2C037', '#C4961C', false],
  ['clothes', 'orange', '#EE8A2E', '#C06716', false], ['clothes', 'purple', '#7E57C2', '#5B3A98', false], ['clothes', 'pink', '#EC87B0', '#C05C88', false], ['clothes', 'black', '#2F2F2F', '#565656', false],
  ['clothes', 'white', '#F5F5F5', '#C6C6C6', false], ['clothes', 'grey', '#8A8F98', '#646970', false], ['clothes', 'brown', '#8B5E3C', '#644024', false],
];

// name -> variants by slot, and colours
export const PRESETS = [
  ['baby', { head: 'round', ears: 'small', neck: 'thin', eyes: 'dot', nose: 'button', mouth: 'small', cheeks: 'round blush', shoulders: 'small' }, ['light', 'blond', 'blue', 'white']],
  ['child', { head: 'round', ears: 'small', neck: 'thin', hair_front: 'tuft', eyebrows: 'short', eyes: 'large', nose: 'button', mouth: 'smile', cheeks: 'round blush', shoulders: 'small' }, ['light', 'brown', 'blue', 'red']],
  ['girl', { head: 'round', ears: 'small', neck: 'thin', hair_back: 'pigtails', hair_front: 'fringe', eyebrows: 'arched', eyes: 'lashes', nose: 'small', mouth: 'big smile', cheeks: 'freckles', hat: 'bow', shoulders: 'small' }, ['pale', 'red', 'green', 'yellow']],
  ['boy', { head: 'round', ears: 'round', neck: 'thin', hair_front: 'spikes', eyebrows: 'straight', eyes: 'round', nose: 'small', mouth: 'grin', hat: 'cap', shoulders: 't-shirt' }, ['tan', 'dark brown', 'brown', 'green']],
  ['woman', { head: 'oval', ears: 'small', neck: 'medium', hair_back: 'long straight', hair_front: 'centre parting', eyebrows: 'arched', eyes: 'lashes', nose: 'medium', mouth: 'full lips', earrings: 'hoop', shoulders: 'v-neck' }, ['olive', 'dark brown', 'brown', 'purple']],
  ['man', { head: 'square', ears: 'round', neck: 'thick', hair_front: 'short', eyebrows: 'thick', eyes: 'oval', nose: 'medium', mouth: 'neutral', beard: 'stubble', shoulders: 'shirt' }, ['light', 'brown', 'blue', 'blue']],
  ['old woman', { head: 'oval', ears: 'round', neck: 'necklace', hair_back: 'bun', hair_front: 'wavy', eyebrows: 'arched', eyes: 'oval', nose: 'medium', mouth: 'smile', cheeks: 'wrinkles', glasses: 'small round', earrings: 'pearl', shoulders: 'shirt' }, ['pale', 'white', 'grey', 'pink']],
  ['old man', { head: 'long', ears: 'large', neck: 'thin', hair_front: 'bald on top', eyebrows: 'bushy', eyes: 'narrow', nose: 'long', mouth: 'neutral', cheeks: 'wrinkles', moustache: 'walrus', shoulders: 'suit' }, ['light', 'grey', 'grey', 'brown']],
  ['bearded man', { head: 'oval', ears: 'round', neck: 'thick', hair_front: 'side parting', eyebrows: 'thick', eyes: 'round', nose: 'wide', mouth: 'smile', beard: 'full', moustache: 'thick', glasses: 'square', shoulders: 'hoodie' }, ['brown', 'black', 'dark brown', 'grey']],
  ['woman with curly hair', { head: 'heart', ears: 'small', neck: 'medium', hair_back: 'afro', hair_front: 'curly', eyebrows: 'thick arched', eyes: 'oval', nose: 'wide', mouth: 'big smile', earrings: 'large hoop', shoulders: 'tank top' }, ['dark brown', 'black', 'dark brown', 'orange']],
  ['robot', { head: 'box', ears: 'square', neck: 'pipe', eyes: 'square', nose: 'bolt', mouth: 'grille', hat: 'antenna', earrings: 'bolt', shoulders: 'metal plate' }, ['metal grey', 'black', 'yellow', 'grey']],
  ['alien', { head: 'heart', ears: 'pointed', neck: 'thin', eyebrows: 'raised', eyes: 'surprised', nose: 'small', mouth: 'small', shoulders: 'v-neck' }, ['green', 'green', 'black', 'purple']],
  ['clown', { head: 'wide', ears: 'large', neck: 'medium', hair_back: 'long curly', eyebrows: 'raised', eyes: 'large', nose: 'round', mouth: 'big smile', cheeks: 'round blush', hat: 'party hat', shoulders: 't-shirt' }, ['white', 'orange', 'blue', 'yellow']],
  ['queen', { head: 'oval', ears: 'small', neck: 'necklace', hair_back: 'long wavy', hair_front: 'long sides', eyebrows: 'arched', eyes: 'lashes', nose: 'pointed', mouth: 'smirk', cheeks: 'blush', hat: 'crown', earrings: 'drop', shoulders: 'v-neck' }, ['pale', 'blond', 'blue', 'red']],
];

// name -> the keys it switches
export const EXPRESSIONS = [
  ['happy', { mouth: 'big smile', eyebrows: 'arched', eyes: 'happy' }],
  ['sad', { mouth: 'sad', eyebrows: 'sad' }],
  ['angry', { mouth: 'frown', eyebrows: 'angry', eyes: 'narrow' }],
  ['surprised', { mouth: 'open', eyebrows: 'raised', eyes: 'surprised' }],
  ['sleepy', { mouth: 'small', eyebrows: 'straight', eyes: 'sleepy' }],
  ['wink', { mouth: 'smile', one_eye: 'closed' }],
  ['talking', { mouth: 'talking', mouth_alt: 'neutral' }],
];

const SHAPE = { rect: 'rectangle', square: 'square', circle: 'circle', oval: 'oval', tri: 'triangle', arc: 'arc', line: 'line', poly: 'polygon' };
function variantLines(slot, box, [name, f, parts]) {
  const id = `k.faces.${STYLE}.${slot}.${seg(name)}`;
  const lines = [wire(id, 'k.faces.variant', [['slot', slot], ['name', name], ['style', STYLE], ['shape', f.shape], ['size', f.size], ['length', f.length],
    ...(f.feel ?? []).map((v) => ['feel', v]), ...(f.age ?? []).map((v) => ['age', v]), ['kind', f.kind]], SRC)];
  const points = [];
  for (const [pname, shape, g, z, cols, o = {}] of parts) {
    let x, y, w, h;
    if (shape === 'line' || shape === 'poly') {
      const xs = g.map((p) => p[0]), ys = g.map((p) => p[1]);
      x = Math.min(...xs); y = Math.min(...ys); w = r1(Math.max(...xs) - x); h = r1(Math.max(...ys) - y);
      g.forEach((p, i) => points.push(`@${id}.${pname}.p${i + 1} k.faces.point part=$${id}.${pname} n=${i + 1} x=${r1(p[0])} y=${r1(p[1])} core.source=${JSON.stringify(SRC)}`));
    } else if (shape === 'circle' || shape === 'square') { [x, y, w] = g; h = w; } else { [x, y, w, h] = g; }
    if (x < box[0] - 0.01 || y < box[1] - 0.01 || x + w > box[0] + box[2] + 0.01 || y + h > box[1] + box[3] + 0.01) throw new Error(`${slot} ${name}.${pname}: outside the box of its slot (${x}, ${y}, ${w}, ${h})`);
    lines.push(wire(`${id}.${pname}`, 'k.faces.part', [['slot', slot], ['of', name], ['name', pname], ['kind', o.kind], ['shape', SHAPE[shape]], ['x', r1(x)], ['y', r1(y)], ['w', r1(w)], ['h', r1(h)], ['z', z],
      ...cols.split(' ').map((c) => ['colour', c]), ['rgb', o.rgb ? { string: o.rgb } : undefined], ['tint', o.tint],
      ['pointing', shape === 'tri' ? g[4] : undefined], ['opens', shape === 'arc' ? g[4] : undefined]], SRC));
  }
  return [`# ${slot}: ${name}`, ...lines, ...points].join('\n');
}

// The proportion canon of a style (Q47): lines and sizes as fractions of the head box (0 at its top or left, 1 at its
// bottom or right), and sizes in eye widths. `plain` is the canon its drawings follow (read off DRAWN, to four
// decimals); the classical canons of a child, an adult and an old person are the experiment of tools/faces-canon.mjs.
export const CANON = { style: STYLE, name: 'plain', eye_line: 0.4412, nose_line: 0.6324, mouth_line: 0.7941, eye_width: 0.1786, eye_gap: 1.6, brow_above: 1.1,
  about: 'The canon of the style plain: big eyes high in the head (the eye line at 0.44 of the head\'s height), 1.6 eye widths between the eyes, the brows 1.1 eye widths above the eye line, the bottom of the nose at 0.63 and the mouth at 0.79 of the height, leaving a long space under the nose; the ears between the brow line and the nose line.' };
const CANON_KEYS = ['eye_line', 'nose_line', 'mouth_line', 'eye_width', 'eye_gap', 'brow_above'];
// Where the hand drew each slot's drawings: the anchors the canon moves (the eye centred on eye_x, eye_y and
// eye_width wide; the brow line; the top and bottom of the nose; the mouth line; the inner rim of a lens; the ear's
// side). The beard is drawn down to the chin, the bottom of the head box.
export const DRAWN = { eye_x: 37, eye_y: 42, eye_width: 10, brow_y: 31, nose_top: 44, nose_y: 55, mouth_y: 66, rim_x: 37, ear_x: 28 };
const headBox = (slots) => { const [, [x, y, w, h]] = slots.find(([n]) => n === 'head'); return { x, y, w, h }; };

// The canon as facts (one k.faces.canon wire), and read back from such a text.
export function canonShard(canon = CANON) {
  return `${header({ id: `k.faces/shards/${STYLE}-canon`, about: `the proportion canon of the style \`${STYLE}\`: where its eyes, brows, nose, mouth and ears go, as fractions of the box of the slot head (0 at its top or left, 1 at its bottom or right) and sizes in eye widths. tools/faces-core.mjs places the parts of the style by these facts.`, sources: ['hand-core 1 (hand-written in this repository)'], license: 'CC0-1.0', script: 'tools/faces-core.mjs' })}\n${
    wire(`k.faces.${STYLE}.canon.${seg(canon.name)}`, 'k.faces.canon', [['style', canon.style ?? STYLE], ['name', canon.name], ...CANON_KEYS.map((k) => [k, canon[k]]), ['about', { string: canon.about }]], SRC)}\n`;
}
export function readCanon(text, style = STYLE) {
  const f = parse(text).find((x) => x.type === 'k.faces.canon' && x.attrs.style?.[0] === style);
  if (!f) throw new Error(`no k.faces.canon of the style ${style}`);
  return Object.fromEntries([['name', f.attrs.name[0]], ...CANON_KEYS.map((k) => [k, Number(f.attrs[k][0])])]);
}

// The map of each slot: x' = ax + (x - fx) * sx, y' = ay + (y - fy) * sy (fx, fy: the drawn anchor; ax, ay: the
// canon's place for it).
export function slotMaps(canon, head) {
  const Y = (f) => head.y + f * head.h;
  const ew = canon.eye_width * head.w;
  const eyeX = head.x + head.w / 2 - (canon.eye_gap * ew) / 2 - ew / 2;
  const eyeY = Y(canon.eye_line), noseY = Y(canon.nose_line), mouthY = Y(canon.mouth_line);
  const browY = eyeY - canon.brow_above * ew;
  const s = ew / DRAWN.eye_width, mx = head.x + head.w / 2;
  const line = (f0, t0, f1, t1) => ({ fy: f0, ay: t0, sy: (t1 - t0) / (f1 - f0) });
  const same = { fx: 0, ax: 0, sx: 1, fy: 0, ay: 0, sy: 1 };
  const mid = (sx = 1) => ({ fx: mx, ax: mx, sx });
  return {
    head: same, hair_back: same, hair_front: same, hat: same, neck: same, shoulders: same,
    eyes: { fx: DRAWN.eye_x, ax: eyeX, sx: s, fy: DRAWN.eye_y, ay: eyeY, sy: s },
    eyebrows: { fx: DRAWN.eye_x, ax: eyeX, sx: s, fy: DRAWN.brow_y, ay: browY, sy: s },
    glasses: { ...mid((mx - eyeX) / (mx - DRAWN.rim_x)), fy: DRAWN.eye_y, ay: eyeY, sy: s },
    nose: { ...mid(), ...line(DRAWN.nose_top, eyeY + (DRAWN.nose_top - DRAWN.eye_y) * s, DRAWN.nose_y, noseY) },
    mouth: { ...mid(), fy: DRAWN.mouth_y, ay: mouthY, sy: 1 },
    moustache: { ...mid(), ...line(DRAWN.nose_y, noseY, DRAWN.mouth_y, mouthY) },
    beard: { ...mid(), ...line(DRAWN.mouth_y, mouthY, head.y + head.h, Y(1)) },
    cheeks: { fx: DRAWN.eye_x, ax: eyeX, sx: 1, ...line(DRAWN.eye_y, eyeY, DRAWN.mouth_y, mouthY) },
    ears: { fx: DRAWN.ear_x, ax: DRAWN.ear_x, sx: 1, ...line(DRAWN.brow_y, browY, DRAWN.nose_y, noseY) },
    earrings: { fx: DRAWN.ear_x, ax: DRAWN.ear_x, sx: 1, ...line(DRAWN.brow_y, browY, DRAWN.nose_y, noseY) },
  };
}

// The slots and variants with every position moved by the map of its slot. Positions are rounded to a tenth (as the
// shards write them); a slot's box is rounded outwards, to within 0.01 (as the parts are checked against it).
export function placeByCanon(canon, slots = SLOTS, variants = VARIANTS) {
  const maps = slotMaps(canon, headBox(slots));
  const X = (m, x) => m.ax + (x - m.fx) * m.sx, Y = (m, y) => m.ay + (y - m.fy) * m.sy;
  const fl = (n) => Math.floor(n * 10 + 0.1) / 10, ce = (n) => Math.ceil(n * 10 - 0.1) / 10;
  const placedSlots = slots.map(([name, [x, y, w, h], ...rest]) => {
    const m = maps[name];
    const [x0, y0] = [fl(X(m, x)), fl(Y(m, y))];
    return [name, [x0, y0, r1(ce(X(m, x + w)) - x0), r1(ce(Y(m, y + h)) - y0)], ...rest];
  });
  const placed = {};
  for (const [slot, list] of Object.entries(variants)) {
    const m = maps[slot];
    placed[slot] = list.map(([name, f, parts]) => [name, f, parts.map(([pname, shape, g, ...rest]) => {
      let g2;
      if (shape === 'line' || shape === 'poly') g2 = g.map(([x, y]) => [r1(X(m, x)), r1(Y(m, y))]);
      else if (shape === 'circle' || shape === 'square') {
        const sc = Math.min(m.sx, m.sy), [x, y, d] = g;
        g2 = [r1(X(m, x + d / 2) - (d * sc) / 2), r1(Y(m, y + d / 2) - (d * sc) / 2), r1(d * sc)];
      } else g2 = [r1(X(m, g[0])), r1(Y(m, g[1])), r1(g[2] * m.sx), r1(g[3] * m.sy), ...g.slice(4)];
      return [pname, shape, g2, ...rest];
    })]);
  }
  return { slots: placedSlots, variants: placed };
}

// The shards of the style. `canon`: the canon to place the drawings by (written as plain-canon.sop and read back
// from it); `canon: null` writes the drawings where they were drawn (for the test that the canon reproduces them).
export function coreShards({ slots: drawnSlots = SLOTS, variants: drawnVariants = VARIANTS, canon = CANON } = {}) {
  const canonText = canon ? canonShard(canon) : null;
  const { slots, variants } = canon ? placeByCanon(readCanon(canonText), drawnSlots, drawnVariants) : { slots: drawnSlots, variants: drawnVariants };
  const head = (id, about) => header({ id: `k.faces/shards/${id}`, about, sources: ['hand-core 1 (hand-written in this repository)'], license: 'CC0-1.0', script: 'tools/faces-core.mjs' });
  const files = {};
  files['slots.sop'] = `${head('slots', `the slots of the style \`${STYLE}\`: where each part of a face goes (a box in the 0 to 100 frame of the face, x right, y down) and in which order the slots are drawn. A slot with mirror=true holds the side on the viewer's left.`)}\n${
    slots.map(([name, [x, y, w, h], z, mirror, optional]) => wire(`k.faces.${STYLE}.slot.${name}`, 'k.faces.slot', [['style', STYLE], ['name', name], ['x', x], ['y', y], ['w', w], ['h', h], ['z', z], ['mirror', mirror ? 'true' : undefined], ['optional', optional ? 'true' : undefined]], SRC)).join('\n')}\n`;
  files['colours.sop'] = `${head('colours', 'named colours for skin, hair, eyes and clothes, each with a darker shade for lines; natural=true for the colours people have.')}\n${
    COLOURS.map(([of, name, rgb, shade, natural]) => wire(`k.faces.colours.${of}.${seg(name)}`, 'k.faces.colour', [['of', of], ['name', name], ['rgb', { string: rgb }], ['shade', { string: shade }], ['natural', String(natural)]], SRC)).join('\n')}\n`;
  files['presets.sop'] = `${head('presets', `named faces of the style \`${STYLE}\` (one variant per slot, and the four colours) and the expressions (the variants of mouth, eyebrows and eyes a face switches to).`)}\n${
    PRESETS.map(([name, slots, [skinName, hairName, eyesName, clothesName]]) => wire(`k.faces.${STYLE}.preset.${seg(name)}`, 'k.faces.preset', [['name', name], ['style', STYLE], ...SLOTS.map(([s]) => [s, slots[s]]), ['skin', skinName], ['hair_colour', hairName], ['eye_colour', eyesName], ['clothes', clothesName]], SRC)).join('\n')}\n\n${
    EXPRESSIONS.map(([name, keys]) => wire(`k.faces.${STYLE}.expression.${seg(name)}`, 'k.faces.expression', [['name', name], ['style', STYLE], ...Object.entries(keys)], SRC)).join('\n')}\n`;
  for (const [slot, box, , mirror] of slots) {
    files[`${STYLE}-${slot.replace(/_/g, '-')}.sop`] = `${head(`${STYLE}-${slot.replace(/_/g, '-')}`, `the variants of the slot \`${slot}\` in the style \`${STYLE}\`${mirror ? ' (the side on the viewer\'s left; the other side is its mirror image)' : ''}: features, and parts with a primitive shape, a box in the frame of the face, a draw order and colours; points for lines and polygons.`)}\n${
      variants[slot].map((v) => variantLines(slot, box, v)).join('\n\n')}\n`;
  }
  if (canonText) files[`${STYLE}-canon.sop`] = canonText;
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = coreShards();
  writeShards(join(WORLDS_DIR, 'k.faces', 'shards'), files, `${STYLE}-`);
  writeShards(join(WORLDS_DIR, 'k.faces', 'shards'), Object.fromEntries(['slots.sop', 'colours.sop', 'presets.sop'].map((f) => [f, files[f]])), 'zzz-none-');
  console.log(`${Object.keys(files).length} shards, ${Object.values(VARIANTS).reduce((n, v) => n + v.length, 0)} variants`);
}
