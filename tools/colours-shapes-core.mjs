// The hand-written cores of k.colours and k.shapes (R7.3).
//   node tools/colours-shapes-core.mjs     writes docs/worlds/k.colours/shards/colours.sop and
//                                          docs/worlds/k.shapes/shards/shapes.sop
// A colour: [name, family, tone, temperature, { lighter, darker, complement, kind }, things, other names].
// A mix: [a, b, gives]. A shape: [name, kind, { sides, corners, faces, edges, face, round, equal, symmetric, flat,
// is_a }, things, other names]. Lists are one text with "," between the values.
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, writeShards } from './import/lib.mjs';

const SRC = 'hand-core 1';
const list = (v) => (v ? v.split(',').map((x) => x.trim()).filter(Boolean) : []);
const L = 'light', M = 'medium', D = 'dark', W = 'warm', C = 'cool', N = 'neutral';

export const COLOURS = [
  ['red', 'red', M, W, { lighter: 'pink', darker: 'maroon', complement: 'green' }, 'tomato, strawberry, cherry, fire engine, lady beetle, poppy, rose', 'reds'],
  ['scarlet', 'red', M, W, {}, 'poppy, lady beetle', 'bright red, vermilion'],
  ['crimson', 'red', D, W, {}, 'cherry, rose', 'deep red, ruby red'],
  ['maroon', 'red', D, W, { lighter: 'red' }, 'wine, beetroot', 'dark red, burgundy, wine red'],
  ['orange', 'orange', M, W, { lighter: 'peach', complement: 'blue' }, 'orange, carrot, pumpkin, fox, goldfish, tangerine', 'oranges'],
  ['peach', 'orange', L, W, { darker: 'orange' }, 'peach, shrimp', 'light orange, apricot, salmon'],
  ['amber', 'orange', M, W, {}, 'honey, traffic light', 'yellow-orange'],
  ['yellow', 'yellow', L, W, { lighter: 'cream', darker: 'mustard', complement: 'purple' }, 'sun, banana, lemon, chick, sunflower, cheese, corn, rubber duck', 'yellows'],
  ['cream', 'yellow', L, W, { darker: 'yellow' }, 'butter, milk, wheat', 'pale yellow, ivory, vanilla'],
  ['mustard', 'yellow', D, W, { lighter: 'yellow' }, 'mustard', 'dark yellow, ochre'],
  ['gold', 'yellow', M, W, { kind: 'metallic' }, 'coin, crown, trophy, ring', 'golden'],
  ['green', 'green', M, C, { lighter: 'light green', darker: 'dark green', complement: 'red' }, 'grass, leaf, frog, cucumber, lettuce, peas, crocodile, cactus', 'greens'],
  ['light green', 'green', L, C, { darker: 'green' }, 'lettuce, kiwi, pear', 'pale green, mint green, mint'],
  ['lime', 'green', L, C, {}, 'lime, avocado', 'lime green, yellow-green'],
  ['dark green', 'green', D, C, { lighter: 'green' }, 'evergreen tree, broccoli, cucumber', 'forest green, bottle green, deep green'],
  ['olive', 'green', D, W, {}, 'olive', 'olive green, khaki'],
  ['turquoise', 'blue', M, C, {}, 'sea, water wave', 'blue-green, teal, aqua, cyan'],
  ['blue', 'blue', M, C, { lighter: 'light blue', darker: 'navy', complement: 'orange' }, 'sea, blueberries, jeans', 'blues'],
  ['light blue', 'blue', L, C, { darker: 'blue' }, 'ice, water wave, pond', 'sky blue, pale blue, baby blue'],
  ['navy', 'blue', D, C, { lighter: 'blue' }, 'jeans, suit', 'navy blue, dark blue, midnight blue, indigo'],
  ['purple', 'purple', M, C, { lighter: 'lilac', complement: 'yellow' }, 'grapes, plum, aubergine', 'violet, purples'],
  ['lilac', 'purple', L, C, { darker: 'purple' }, 'violet, iris', 'lavender, light purple, mauve'],
  ['magenta', 'pink', M, W, {}, 'hibiscus, beetroot', 'fuchsia, hot pink, deep pink'],
  ['pink', 'pink', L, W, { darker: 'red' }, 'pig, flamingo, cherry blossom, candy floss, tulip', 'rose pink, light red, pinks'],
  ['brown', 'brown', D, W, { lighter: 'beige' }, 'chocolate, bear, wood, coffee, chestnut, acorn, horse, squirrel, hedgehog', 'browns, chocolate brown'],
  ['beige', 'brown', L, N, { darker: 'brown' }, 'camel, sandcastle, bread, hay', 'light brown, tan, sand, fawn'],
  ['chestnut', 'brown', D, W, {}, 'chestnut, hazelnut, horse, fox', 'reddish brown, auburn, rust'],
  ['black', 'black', D, N, { lighter: 'grey' }, 'tire, spider, bat, raven, black cat, night', 'blacks, jet black, pitch black'],
  ['grey', 'grey', M, N, { lighter: 'light grey', darker: 'dark grey' }, 'elephant, mouse, stone, rock, wolf, rhinoceros, koala, shark', 'gray, greys, grays'],
  ['light grey', 'grey', L, N, { darker: 'grey' }, 'cloud, dove, seal', 'light gray, pale grey, ash grey'],
  ['dark grey', 'grey', D, N, { lighter: 'grey' }, 'rock, nail', 'dark gray, charcoal, slate grey'],
  ['silver', 'grey', L, C, { kind: 'metallic' }, 'spoon, fork, nail', 'silvery'],
  ['white', 'white', L, N, { darker: 'grey' }, 'snowman, milk, cloud, swan, sheep, paper, polar bear, egg, ghost', 'whites, snow white'],
];

export const MIXES = [
  ['red', 'yellow', 'orange'], ['blue', 'yellow', 'green'], ['blue', 'red', 'purple'], ['red', 'white', 'pink'], ['black', 'white', 'grey'],
  ['green', 'red', 'brown'], ['blue', 'orange', 'brown'], ['purple', 'yellow', 'brown'], ['blue', 'white', 'light blue'], ['black', 'blue', 'navy'], ['black', 'red', 'maroon'],
  ['white', 'yellow', 'cream'], ['green', 'white', 'light green'], ['black', 'green', 'dark green'], ['purple', 'white', 'lilac'], ['orange', 'white', 'peach'],
  ['green', 'yellow', 'lime'], ['blue', 'green', 'turquoise'], ['pink', 'purple', 'magenta'], ['brown', 'white', 'beige'], ['grey', 'white', 'light grey'], ['black', 'grey', 'dark grey'],
  ['orange', 'yellow', 'amber'], ['brown', 'red', 'chestnut'], ['black', 'yellow', 'olive'],
];

const T = true;
export const SHAPES = [
  // ---- flat
  ['circle', 'flat', { sides: 0, corners: 0, round: T, symmetric: T }, 'ball, wheel, plate, clock, pizza, button, coin, full moon, sun', 'circles, round, disc, disk, circular'],
  ['oval', 'flat', { sides: 0, corners: 0, round: T, symmetric: T }, 'egg, rugby ball, mirror, lemon, balloon, pond', 'ovals, ellipse, egg-shaped, elliptical'],
  ['semicircle', 'flat', { sides: 1, corners: 2, round: T, symmetric: T }, 'rainbow, igloo, bridge, croissant', 'semicircles, half circle, half-circle, half moon'],
  ['triangle', 'flat', { sides: 3, corners: 3, round: false, symmetric: T }, 'roof, tent, mountain, pyramid, cheese wedge', 'triangles, triangular, three-sided'],
  ['square', 'flat', { sides: 4, corners: 4, round: false, equal: T, symmetric: T, is_a: 'rectangle' }, 'window, dice, picture frame, gift box', 'squares, box shape'],
  ['rectangle', 'flat', { sides: 4, corners: 4, round: false, symmetric: T }, 'door, book, brick, envelope, flag, phone, television, chocolate bar', 'rectangles, rectangular, oblong'],
  ['diamond', 'flat', { sides: 4, corners: 4, round: false, equal: T, symmetric: T }, 'kite, playing cards', 'diamonds, rhombus, lozenge'],
  ['parallelogram', 'flat', { sides: 4, corners: 4, round: false }, '', 'parallelograms, slanted rectangle'],
  ['trapezium', 'flat', { sides: 4, corners: 4, round: false }, 'bucket, lampshade, boat', 'trapezoid, trapeziums, trapezoids'],
  ['pentagon', 'flat', { sides: 5, corners: 5, round: false, equal: T, symmetric: T }, 'house', 'pentagons, five-sided'],
  ['hexagon', 'flat', { sides: 6, corners: 6, round: false, equal: T, symmetric: T }, 'honeycomb, nut, snowflake', 'hexagons, six-sided, hexagonal'],
  ['octagon', 'flat', { sides: 8, corners: 8, round: false, equal: T, symmetric: T }, 'stop sign, umbrella', 'octagons, eight-sided, octagonal'],
  ['polygon', 'flat', { round: false }, '', 'polygons, many-sided shape'],
  ['star', 'flat', { sides: 10, corners: 10, round: false, equal: T, symmetric: T }, 'star, starfish, glowing star', 'stars, five-pointed star, star-shaped'],
  ['heart', 'flat', { round: T, symmetric: T }, 'heart, strawberry', 'hearts, heart-shaped'],
  ['crescent', 'flat', { sides: 0, corners: 2, round: T, symmetric: T }, 'crescent moon, banana, croissant', 'crescents, sickle, moon shape'],
  ['cross', 'flat', { sides: 12, corners: 12, round: false, equal: T, symmetric: T }, 'first aid kit, signpost', 'crosses, plus, plus sign'],
  ['arrow', 'flat', { sides: 7, corners: 7, round: false, symmetric: T }, 'signpost', 'arrows, pointer'],
  ['ring', 'flat', { sides: 0, corners: 0, round: T, symmetric: T }, 'ring, doughnut, tire, bagel, wheel', 'rings, hoop, loop, annulus'],
  ['drop', 'flat', { sides: 0, corners: 1, round: T, symmetric: T }, 'droplet, pear, balloon, light bulb', 'drops, teardrop, tear shape'],
  ['cloud shape', 'flat', { sides: 0, corners: 0, round: T }, 'cloud, sheep, tree, broccoli', 'cloud-shaped, fluffy shape, bumpy outline'],
  // ---- lines
  ['line', 'line', { round: false }, 'pencil, pole, rope, ladder', 'lines, straight line, stroke'],
  ['arc', 'line', { round: T }, 'rainbow, bridge, horseshoe magnet', 'arcs, curve, bow, bend'],
  ['zigzag', 'line', { round: false }, 'saw, stairs, mountain', 'zigzags, zig-zag, jagged line'],
  ['wavy line', 'line', { round: T }, 'water wave, snake, river', 'wave, waves, wavy, squiggle'],
  ['spiral', 'line', { round: T }, 'snail, shell', 'spirals, coil, swirl, whorl'],
  // ---- solids
  ['sphere', 'solid', { faces: 1, edges: 0, corners: 0, round: T, symmetric: T, flat: 'circle' }, 'ball, orange, planet, soccer ball, basketball, melon, coconut', 'spheres, ball shape, globe, orb, spherical'],
  ['hemisphere', 'solid', { faces: 2, edges: 1, corners: 0, round: T, symmetric: T, flat: 'semicircle', face: 'circle' }, 'igloo, bowl', 'hemispheres, half sphere, dome, half ball'],
  ['egg shape', 'solid', { faces: 1, edges: 0, corners: 0, round: T, symmetric: T, flat: 'oval' }, 'egg, lemon, rugby ball, avocado', 'ovoid, egg-shaped solid'],
  ['cube', 'solid', { faces: 6, edges: 12, corners: 8, round: false, equal: T, symmetric: T, flat: 'square', face: 'square', is_a: 'cuboid' }, 'dice, box, gift box', 'cubes, block, cubic'],
  ['cuboid', 'solid', { faces: 6, edges: 12, corners: 8, round: false, symmetric: T, flat: 'rectangle', face: 'rectangle' }, 'brick, book, box, refrigerator, package', 'cuboids, box shape, rectangular block, rectangular prism'],
  ['cylinder', 'solid', { faces: 3, edges: 2, corners: 0, round: T, symmetric: T, flat: 'rectangle', face: 'circle' }, 'drum, candle, log, battery, glass bottle, telescope', 'cylinders, tube, pipe shape, cylindrical, can shape'],
  ['cone', 'solid', { faces: 2, edges: 1, corners: 1, round: T, symmetric: T, flat: 'triangle', face: 'circle' }, 'ice cream, party popper, funnel, volcano, carrot', 'cones, conical, cone-shaped'],
  ['pyramid', 'solid', { faces: 5, edges: 8, corners: 5, round: false, symmetric: T, flat: 'triangle', face: 'triangle, square' }, 'pyramid, tent, roof', 'pyramids, square pyramid'],
  ['prism', 'solid', { faces: 5, edges: 9, corners: 6, round: false, symmetric: T, flat: 'rectangle', face: 'triangle, rectangle' }, 'tent, roof, cheese wedge', 'prisms, triangular prism, wedge'],
  ['torus', 'solid', { faces: 1, edges: 0, corners: 0, round: T, symmetric: T, flat: 'ring' }, 'doughnut, tire, bagel, ring', 'ring shape, doughnut shape, ring doughnut'],
];

export function colourShards() {
  const names = new Set(COLOURS.map((c) => c[0]));
  const lines = COLOURS.map(([name, family, tone, temperature, o, things]) => {
    for (const k of ['lighter', 'darker', 'complement']) if (o[k] && (!names.has(o[k]) || o[k] === name)) throw new Error(`${name}: ${k} ${o[k]} is not another colour`);
    if (!names.has(family)) throw new Error(`${name}: the family ${family} is not a colour`);
    return wire(`k.colours.colour.${seg(name)}`, 'k.colours.colour', [['name', name], ['family', family], ['tone', tone], ['temperature', temperature], ['lighter', o.lighter], ['darker', o.darker], ['complement', o.complement], ['kind', o.kind], ...list(things).map((t) => ['thing', t])], SRC);
  });
  const mixes = MIXES.map(([a, b, gives]) => {
    if (!(a < b)) throw new Error(`mix ${a} + ${b}: the two colours come in the order of the alphabet`);
    for (const c of [a, b, gives]) if (!names.has(c)) throw new Error(`mix ${a} + ${b}: ${c} is not a colour`);
    return wire(`k.colours.mix.${seg(a)}.${seg(b)}`, 'k.colours.mix', [['a', a], ['b', b], ['gives', gives]], SRC);
  });
  const words = COLOURS.map(([name, , , , , , w]) => wire(`k.colours.word.colour.${seg(name)}`, 'core.word', [...list(w).filter((x) => !names.has(x)).map((x) => ['text', x]), ['means', name], ['of', 'k.colours.colour.name']], SRC));
  return { 'colours.sop': `${header({ id: 'k.colours/shards/colours', about: `${COLOURS.length} colours (${COLOURS.map((c) => c[0]).join(', ')}): the family, light or dark, warm or cool, a lighter and a darker colour, the opposite on the colour wheel, things that typically have the colour; ${MIXES.length} pairs of colours and what they mix into; and other names of the colours.`, sources: ['hand-core 1 (hand-written in this repository: tools/colours-shapes-core.mjs)'], license: 'CC0-1.0', script: 'tools/colours-shapes-core.mjs' })}\n${lines.join('\n')}\n\n# What two colours of paint mix into.\n${mixes.join('\n')}\n\n# Words: other names of the colours.\n${words.join('\n')}\n` };
}

export function shapeShards() {
  const names = new Set(SHAPES.map((s) => s[0]));
  const lines = SHAPES.map(([name, kind, o, things]) => {
    for (const v of [o.flat, o.is_a, ...list(o.face)]) if (v && (!names.has(v) || v === name)) throw new Error(`${name}: ${v} is not another shape`);
    return wire(`k.shapes.shape.${seg(name)}`, 'k.shapes.shape', [['name', name], ['kind', kind], ['sides', o.sides], ['corners', o.corners], ['faces', o.faces], ['edges', o.edges], ...list(o.face).map((f) => ['face', f]),
      ['round', String(Boolean(o.round))], ['equal_sides', o.equal ? 'true' : undefined], ['symmetric', o.symmetric ? 'true' : undefined], ['flat', o.flat], ['is_a', o.is_a], ...list(things).map((t) => ['thing', t])], SRC);
  });
  const words = SHAPES.map(([name, , , , w]) => wire(`k.shapes.word.shape.${seg(name)}`, 'core.word', [...list(w).filter((x) => !names.has(x)).map((x) => ['text', x]), ['means', name], ['of', 'k.shapes.shape.name']], SRC));
  return { 'shapes.sop': `${header({ id: 'k.shapes/shards/shapes', about: `${SHAPES.length} shapes (${SHAPES.map((s) => s[0]).join(', ')}): flat, solid or a line; sides and corners, or faces, edges and corners; round or not; things that typically have the shape; and other names of the shapes.`, sources: ['hand-core 1 (hand-written in this repository: tools/colours-shapes-core.mjs)'], license: 'CC0-1.0', script: 'tools/colours-shapes-core.mjs' })}\n${lines.join('\n')}\n\n# Words: other names of the shapes.\n${words.join('\n')}\n` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeShards(join(WORLDS_DIR, 'k.colours', 'shards'), colourShards());
  writeShards(join(WORLDS_DIR, 'k.shapes', 'shards'), shapeShards());
  console.log(`${COLOURS.length} colours, ${MIXES.length} mixes, ${SHAPES.length} shapes`);
}
