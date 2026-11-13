// k.values (Round 8, item 3): the words for values: colour names with RGB, ordered scales (size, amount, degree …)
// with their comparatives, shape names, directions and positions, set words, number words and ordinals.
//   node tools/values-core.mjs          writes docs/worlds/k.values/shards/*.sop
// The CSS colour names come from sources/css-colors/raw/index.js (see sources/css-colors/SOURCE.md); when the raw
// file is not there the shard colours-css is left as it is. Everything else is hand-written here.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, text, writeShards } from './import/lib.mjs';

const HAND = 'hand-core 1';
export const CSS = 'css-colors 2.1.1';
export const CSS_RAW = join(REPO, 'sources', 'css-colors', 'raw', 'index.js');
const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
const hex = (rgb) => `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
const word = (id, texts, means, of) => wire(id, 'core.word', [...texts.map((t) => ['text', t]), ['means', means], ['of', of]], HAND);
const shard = (id, about, body, extra = {}) => `${header({ id: `k.values/shards/${id}`, about, sources: extra.sources ?? ['hand-core 1 (hand-written in this repository: tools/values-core.mjs)'], license: extra.license ?? 'CC0-1.0', script: 'tools/values-core.mjs' })}\n${body}\n`;

// ---- Colours ------------------------------------------------------------------------------------------------------
export const BASIC = ['black', 'white', 'grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown'];
// The words a CSS colour keyword is written from (darkolivegreen: dark olive green).
const PIECES = list('dark, light, medium, pale, deep, hot, dim, slate, sea, sky, steel, royal, midnight, forest, lawn, lime, spring, olive, yellow, green, blue, red, violet, orange, pink, purple, gray, grey, white, brown, turquoise, orchid, aquamarine, aqua, goldenrod, cyan, magenta, salmon, coral, khaki, cadet, cornflower, dodger, powder, alice, antique, blanched, almond, floral, ghost, navajo, old, lace, papaya, whip, peach, puff, rosy, saddle, sandy, misty, rose, mint, cream, lemon, chiffon, lavender, blush, indian, rebecca, drab, smoke, gold');
const WHOLE = new Set(list('seashell, honeydew, cornsilk, gainsboro, firebrick, burlywood, goldenrod, aquamarine, turquoise'));
export function keywordWords(name) {
  if (WHOLE.has(name)) return [name];
  const best = Array(name.length + 1).fill(null);
  best[0] = [];
  for (let i = 0; i < name.length; i++) {
    if (!best[i]) continue;
    for (const w of PIECES) if (name.startsWith(w, i)) { const c = [...best[i], w]; if (!best[i + w.length] || c.length < best[i + w.length].length) best[i + w.length] = c; }
  }
  return best[name.length] ?? [name];
}
// A colour whose last word is a basic colour word is a kind of that colour, except these (the name misleads or the
// colour is too near to white to say).
const NOT_BY_NAME = new Set(list('pale violet red, medium violet red, indian red, navajo white, green yellow, light sea green, alice blue'));
// The basic colour of a name that does not end in one, where it is plain (a language model's label).
const BASIC_BY_HAND = { crimson: 'red', firebrick: 'red', tomato: 'red', gold: 'yellow', navy: 'blue', lime: 'green', olive: 'green', chartreuse: 'green', plum: 'purple', violet: 'purple',
  lavender: 'purple', salmon: 'pink', sienna: 'brown', chocolate: 'brown', peru: 'brown', tan: 'brown', burlywood: 'brown', silver: 'grey', gainsboro: 'grey', ivory: 'white', snow: 'white',
  linen: 'white', seashell: 'white', 'white smoke': 'white' };
const CSS_WORDS = { gold: ['golden'], navy: ['navy blue'], aqua: ['aqua blue'], silver: ['silvery'], tan: ['light brown'] };

export function cssColours(raw) {
  const out = [];
  for (const m of raw.matchAll(/^\s*([a-z]+): \[(\d+), (\d+), (\d+)\]/gm)) {
    if (m[1].includes('gray')) continue; // the same colours are listed with "grey"
    const name = keywordWords(m[1]).join(' ');
    const last = name.split(' ').pop();
    const byName = BASIC.includes(last) && !NOT_BY_NAME.has(name) ? last : undefined;
    const words = [...new Set([m[1], ...(m[1].includes('grey') ? [m[1].replace('grey', 'gray'), name.replace('grey', 'gray')] : []), ...(CSS_WORDS[name] ?? [])])].filter((w) => w !== name);
    out.push({ name, css: m[1], rgb: hex([+m[2], +m[3], +m[4]]), basic: byName ?? BASIC_BY_HAND[name], named: !byName && BASIC_BY_HAND[name] ? 'model' : undefined, words });
  }
  return out;
}

// Common colour names that CSS does not have: [name, r, g, b, basic colour or '', other words]. The RGB is a usual one.
export const COMMON_COLOURS = [
  ['cream', 255, 253, 208, '', ''], ['mustard', 255, 219, 88, 'yellow', 'mustard yellow'], ['lemon', 255, 247, 0, 'yellow', 'lemon yellow'], ['amber', 255, 191, 0, '', ''],
  ['apricot', 251, 206, 177, '', ''], ['peach', 255, 218, 185, '', ''], ['scarlet', 255, 36, 0, 'red', ''], ['ruby', 224, 17, 95, 'red', 'ruby red'],
  ['burgundy', 128, 0, 32, 'red', 'wine red'], ['cherry', 222, 49, 99, 'red', 'cherry red'], ['rose', 255, 0, 127, 'pink', 'rose pink'], ['rust', 183, 65, 14, '', 'rusty'],
  ['terracotta', 226, 114, 91, '', ''], ['ochre', 204, 119, 34, '', 'ocher'], ['bronze', 205, 127, 50, 'brown', ''], ['copper', 184, 115, 51, 'brown', ''],
  ['chestnut', 149, 69, 53, 'brown', ''], ['mahogany', 192, 64, 0, 'brown', ''], ['sand', 194, 178, 128, '', 'sandy'], ['mint', 152, 255, 152, 'green', 'mint green'],
  ['emerald', 80, 200, 120, 'green', 'emerald green'], ['jade', 0, 168, 107, 'green', 'jade green'], ['bottle green', 0, 106, 78, 'green', ''], ['baby blue', 137, 207, 240, 'blue', ''],
  ['cobalt', 0, 71, 171, 'blue', 'cobalt blue'], ['sapphire', 15, 82, 186, 'blue', 'sapphire blue'], ['lilac', 200, 162, 200, 'purple', ''], ['mauve', 224, 176, 255, 'purple', ''],
  ['charcoal', 54, 69, 79, 'grey', 'charcoal grey, charcoal gray'],
];

// ---- Scales: [name, about, steps from the least to the most, each "step: other words"] ----------------------------------
export const SCALES = [
  ['size', 'how big a thing is', ['tiny: very small, minute, miniature, mini, teeny, wee', 'small: little', 'medium: medium-sized, middle-sized, normal, average', 'large: big', 'huge: very big, very large, enormous, giant, gigantic, massive, immense']],
  ['length', 'how long a thing is', ['short', 'medium', 'long: lengthy']],
  ['width', 'how wide a thing is', ['narrow: slim', 'medium', 'wide: broad']],
  ['height', 'how tall or high a thing is', ['short: low', 'medium', 'tall: high']],
  ['thickness', 'how thick a thing or a line is', ['thin: fine, slender', 'medium', 'thick: fat, bold']],
  ['amount', 'how much or how many of something', ['none: no, nothing, zero', 'a bit: a little, a little bit, a few, a couple of, not much, not many', 'some: several, a number of', 'a lot: lots, a lot of, lots of, many, much, plenty, plenty of', 'all: everything, the whole']],
  ['degree', 'how strongly a quality holds, said before an adjective', ['slightly: a bit, a little, a little bit, a tad', 'somewhat: moderately', 'quite: fairly, rather, pretty', 'very: really, so', 'extremely: incredibly, super, hugely, enormously']],
  ['brightness', 'how light or dark a colour is', ['dark: deep', 'medium', 'light: pale']],
  ['speed', 'how fast something moves', ['slow', 'medium', 'fast: quick, rapid, speedy']],
  ['weight', 'how heavy a thing is', ['light', 'medium', 'heavy: weighty']],
  ['temperature', 'how hot a thing is', ['cold: freezing, icy, chilly', 'cool', 'warm', 'hot: boiling']],
  ['distance', 'how far away a thing is', ['near: close, nearby', 'far: distant, far away']],
  ['loudness', 'how loud a sound is', ['quiet: soft', 'loud: noisy']],
  // Round 10 item 5: the price class of k.attributes.number.
  ['price', 'how much a thing usually costs to buy', ['cheap: inexpensive, low-priced', 'medium: moderately priced', 'expensive: dear, costly, pricey']],
];
// Comparatives and superlatives: [scale, towards the most (up) or the least (down), comparatives, superlatives].
export const COMPARATIVES = [
  ['size', 'up', 'bigger, larger', 'biggest, largest'], ['size', 'down', 'smaller, littler', 'smallest, littlest'],
  ['length', 'up', 'longer', 'longest'], ['length', 'down', 'shorter', 'shortest'],
  ['width', 'up', 'wider, broader', 'widest, broadest'], ['width', 'down', 'narrower', 'narrowest'],
  ['height', 'up', 'taller, higher', 'tallest, highest'], ['height', 'down', 'shorter, lower', 'shortest, lowest'],
  ['thickness', 'up', 'thicker, fatter, bolder', 'thickest, fattest, boldest'], ['thickness', 'down', 'thinner, finer', 'thinnest, finest'],
  ['amount', 'up', 'more', 'most'], ['amount', 'down', 'less, fewer', 'least, fewest'],
  ['brightness', 'up', 'lighter, paler', 'lightest, palest'], ['brightness', 'down', 'darker, deeper', 'darkest, deepest'],
  ['speed', 'up', 'faster, quicker', 'fastest, quickest'], ['speed', 'down', 'slower', 'slowest'],
  ['weight', 'up', 'heavier', 'heaviest'], ['weight', 'down', 'lighter', 'lightest'],
  ['temperature', 'up', 'warmer, hotter', 'warmest, hottest'], ['temperature', 'down', 'colder, cooler', 'coldest, coolest'],
  ['distance', 'up', 'farther, further', 'farthest, furthest'], ['distance', 'down', 'nearer, closer', 'nearest, closest'],
  ['loudness', 'up', 'louder', 'loudest'], ['loudness', 'down', 'quieter, softer', 'quietest, softest'],
  ['price', 'up', 'dearer, pricier, more expensive', 'dearest, priciest, most expensive'], ['price', 'down', 'cheaper', 'cheapest'],
];

// ---- Shapes: [name, solid, other words] ---------------------------------------------------------------------------
export const SHAPES = [
  ['circle', false, 'circles, round, circular, disc, disk'], ['oval', false, 'ovals, ellipse, ellipses, elliptical'], ['semicircle', false, 'semicircles, half circle, half-circle'],
  ['ring', false, 'rings, hoop'], ['crescent', false, 'crescents, crescent moon'], ['square', false, 'squares'], ['rectangle', false, 'rectangles, rectangular, oblong'],
  ['triangle', false, 'triangles, triangular'], ['diamond', false, 'diamonds, rhombus, lozenge'], ['parallelogram', false, 'parallelograms'], ['trapezoid', false, 'trapezoids, trapezium'],
  ['pentagon', false, 'pentagons'], ['hexagon', false, 'hexagons, hexagonal'], ['octagon', false, 'octagons, octagonal'], ['star', false, 'stars, star-shaped'],
  ['heart', false, 'hearts, heart-shaped'], ['cross', false, 'crosses, plus sign'], ['arrow', false, 'arrows'], ['line', false, 'lines, straight line'],
  ['curve', false, 'curves, curved line'], ['arc', false, 'arcs'], ['zigzag', false, 'zigzags, zig-zag'], ['spiral', false, 'spirals'], ['dot', false, 'dots, point, points, spot'],
  ['cube', true, 'cubes'], ['cuboid', true, 'cuboids, box shape, block'], ['sphere', true, 'spheres, ball shape, globe shape, spherical'], ['cone', true, 'cones, conical'],
  ['cylinder', true, 'cylinders, tube shape, cylindrical'], ['pyramid', true, 'pyramids'],
];

// ---- Directions: [name, axis, x, y, opposite, other words]; x to the right, y downwards, as in k.objects ----------
export const DIRECTIONS = [
  ['left', 'horizontal', -1, 0, 'right', 'leftward, leftwards, to the left'], ['right', 'horizontal', 1, 0, 'left', 'rightward, rightwards, to the right'],
  ['up', 'vertical', 0, -1, 'down', 'upward, upwards'], ['down', 'vertical', 0, 1, 'up', 'downward, downwards'],
  ['forward', 'depth', undefined, undefined, 'backward', 'forwards, ahead, to the front'], ['backward', 'depth', undefined, undefined, 'forward', 'backwards, back, to the back'],
  ['clockwise', 'turn', undefined, undefined, 'anticlockwise', ''], ['anticlockwise', 'turn', undefined, undefined, 'clockwise', 'counterclockwise, counter-clockwise, anti-clockwise'],
  ['inward', 'spread', undefined, undefined, 'outward', 'inwards, towards the middle'], ['outward', 'spread', undefined, undefined, 'inward', 'outwards, away from the middle'],
  ['north', 'compass', 0, -1, 'south', 'northward, northwards'], ['south', 'compass', 0, 1, 'north', 'southward, southwards'],
  ['east', 'compass', 1, 0, 'west', 'eastward, eastwards'], ['west', 'compass', -1, 0, 'east', 'westward, westwards'],
  ['northeast', 'compass', 1, -1, 'southwest', 'north-east'], ['northwest', 'compass', -1, -1, 'southeast', 'north-west'],
  ['southeast', 'compass', 1, 1, 'northwest', 'south-east'], ['southwest', 'compass', -1, 1, 'northeast', 'south-west'],
];
// Positions in a picture: [name, column, row, depth, other words].
export const POSITIONS = [
  ['top', undefined, 'top', undefined, 'upper part, at the top'], ['bottom', undefined, 'bottom', undefined, 'lower part, at the bottom'],
  ['left', 'left', undefined, undefined, 'left side, on the left, left-hand side'], ['right', 'right', undefined, undefined, 'right side, on the right, right-hand side'],
  ['centre', 'centre', 'middle', undefined, 'center, middle, in the middle, in the centre, in the center'],
  ['top left', 'left', 'top', undefined, 'upper left, top left corner, top-left'], ['top right', 'right', 'top', undefined, 'upper right, top right corner, top-right'],
  ['bottom left', 'left', 'bottom', undefined, 'lower left, bottom left corner, bottom-left'], ['bottom right', 'right', 'bottom', undefined, 'lower right, bottom right corner, bottom-right'],
  ['top centre', 'centre', 'top', undefined, 'top center, top middle'], ['bottom centre', 'centre', 'bottom', undefined, 'bottom center, bottom middle'],
  ['front', undefined, undefined, 'front', 'foreground, in front, in the foreground'], ['back', undefined, undefined, 'back', 'background, at the back, in the background'],
];

// ---- Set words: [name, picks, manner, about, other words] ---------------------------------------------------------
// Fills: how a shape is filled in a picture (PSys2 hand-over k.actions-missing.md: the values of `change` that the
// demo listed by hand). [name, about, other words].
export const FILLS = [
  ['solid', 'filled all over with its colour', 'filled, filled in, coloured in, colored in, full'],
  ['outline', 'only the line around it is drawn; the inside is empty', 'outlined, hollow, empty, not filled, line only, lines only'],
  ['striped', 'filled with stripes', 'stripy, stripes, with stripes'],
  ['dotted', 'filled with dots', 'spotted, spotty, polka dot, polka dots, with dots'],
  ['checked', 'filled with squares of two colours', 'checkered, chequered, checks, squares'],
];
export const SET_WORDS = [
  ['all', 'all', undefined, 'every one of the things meant, taken together', 'all of them, all the, everything, every one, the whole lot'],
  ['each', 'all', 'one by one', 'every one of the things meant, taken one at a time', 'every, each one, each of them'],
  ['both', 'two', undefined, 'the two things meant, together', 'both of them, the two'],
  ['either', 'one', undefined, 'one of the two things meant, no matter which', ''],
  ['any', 'one', undefined, 'one of the things meant, no matter which', 'any one, whichever, any of them'],
  ['some', 'some', undefined, 'a few of the things meant, not all', 'some of them, a few of them, several of them'],
  ['most', 'most', undefined, 'more than half of the things meant', 'most of them, the majority'],
  ['half', 'half', undefined, 'one of every two of the things meant', 'half of them, half the'],
  ['none', 'none', undefined, 'not one of the things meant', 'none of them, not any, neither'],
  ['other', 'rest', undefined, 'the things meant that were not named or picked', 'others, the others, the rest, the remaining, everything else, the other ones'],
  ['another', 'one', 'different', 'one more thing, not one already there', 'one more, an extra, an additional'],
  ['random', undefined, 'random', 'chosen by chance, with no rule', 'randomly, at random, any old, surprise me'],
  ['same', undefined, 'same', 'equal to one another, or equal to one named before', 'identical, equal, alike, matching, the same'],
  ['different', undefined, 'different', 'not equal to one another, or not equal to one named before', 'various, varied, distinct, assorted, mixed, differing'],
  ['alternating', 'half', 'alternating', 'one yes, the next no, and so on', 'alternate, every other, every second, in turn'],
  ['first', 'one', 'in order', 'the one at the start of an order', 'the first one'],
  ['last', 'one', 'in order', 'the one at the end of an order', 'final, the last one'],
  ['next', 'one', 'in order', 'the one after the present one', 'following, the next one'],
  ['previous', 'one', 'in order', 'the one before the present one', 'preceding, the one before, the previous one'],
];

// ---- Numbers ------------------------------------------------------------------------------------------------------
const ONES = list('zero, one, two, three, four, five, six, seven, eight, nine, ten, eleven, twelve, thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen');
const TENS = list('twenty, thirty, forty, fifty, sixty, seventy, eighty, ninety');
const ORD_ONES = list('zeroth, first, second, third, fourth, fifth, sixth, seventh, eighth, ninth, tenth, eleventh, twelfth, thirteenth, fourteenth, fifteenth, sixteenth, seventeenth, eighteenth, nineteenth');
const ORD_TENS = list('twentieth, thirtieth, fortieth, fiftieth, sixtieth, seventieth, eightieth, ninetieth');
export function numberWords() {
  const out = [];
  for (let n = 0; n < 100; n++) {
    const t = Math.floor(n / 10), o = n % 10;
    out.push([n < 20 ? ONES[n] : o ? `${TENS[t - 2]}-${ONES[o]}` : TENS[t - 2], 'cardinal', n]);
    if (n > 0) out.push([n < 20 ? ORD_ONES[n] : o ? `${TENS[t - 2]}-${ORD_ONES[o]}` : ORD_TENS[t - 2], 'ordinal', n]);
  }
  out.push(['hundred', 'cardinal', 100], ['thousand', 'cardinal', 1000], ['million', 'cardinal', 1000000], ['billion', 'cardinal', 1000000000],
    ['hundredth', 'ordinal', 100], ['thousandth', 'ordinal', 1000], ['millionth', 'ordinal', 1000000],
    ['once', 'times', 1], ['twice', 'times', 2], ['thrice', 'times', 3],
    ['single', 'multiple', 1], ['double', 'multiple', 2], ['triple', 'multiple', 3], ['quadruple', 'multiple', 4],
    ['pair', 'group', 2], ['couple', 'group', 2], ['trio', 'group', 3], ['half a dozen', 'group', 6], ['dozen', 'group', 12],
    ['half', 'fraction', 0.5], ['third', 'fraction', 1 / 3], ['quarter', 'fraction', 0.25], ['three quarters', 'fraction', 0.75]);
  return out;
}

export function valueShards() {
  const files = {};
  // Colours.
  if (existsSync(CSS_RAW)) {
    const colours = cssColours(readFileSync(CSS_RAW, 'utf8'));
    const lines = colours.map((c) => wire(`k.values.colour.${seg(c.name)}`, 'k.values.colour', [['name', c.name], ['css', c.css], ['rgb', text(c.rgb)], ['basic', c.basic], ['named', c.named]], CSS));
    const words = colours.filter((c) => c.words.length).map((c) => word(`k.values.word.colour.${seg(c.name)}`, c.words, c.name, 'k.values.colour.name'));
    files['colours-css.sop'] = shard('colours-css', `the ${colours.length} colour names of CSS with their RGB value, and the basic colour each is a kind of where its name says it or it is plain.`,
      `${lines.join('\n')}\n\n# Words: the CSS keyword written as one word, and the spelling with "gray".\n${words.join('\n')}`,
      { sources: ['css-colors 2.1.1 (the CSS named colours as listed by the package color-name 2.1.1, MIT: name and RGB)', 'hand-core 1 (the basic colour of a name that does not end in one, named=model; the word facts)'], license: 'MIT' });
  }
  {
    const lines = COMMON_COLOURS.map(([name, r, g, b, basic]) => wire(`k.values.colour.${seg(name)}`, 'k.values.colour', [['name', name], ['rgb_about', text(hex([r, g, b]))], ['basic', basic]], HAND));
    const words = COMMON_COLOURS.filter((c) => c[5]).map((c) => word(`k.values.word.colour.${seg(c[0])}`, list(c[5]), c[0], 'k.values.colour.name'));
    files['colours-common.sop'] = shard('colours-common', `${COMMON_COLOURS.length} common colour names that CSS does not have (${COMMON_COLOURS.slice(0, 8).map((c) => c[0]).join(', ')} ...), each with a usual RGB value (approximate: a name like this has no fixed value).`,
      `${lines.join('\n')}\n\n# Words.\n${words.join('\n')}`);
  }
  // Scales.
  {
    const lines = [], words = [];
    for (const [name, about, steps] of SCALES) {
      lines.push(wire(`k.values.scale.${seg(name)}`, 'k.values.scale', [['name', name], ['about', text(about)], ['steps', steps.length]], HAND));
      steps.forEach((s, i) => {
        const [step, others] = s.split(':').map((x) => x.trim());
        lines.push(wire(`k.values.step.${seg(name)}.${seg(step)}`, 'k.values.step', [['scale', name], ['name', step], ['rank', i + 1]], HAND));
        if (others) words.push(word(`k.values.word.step.${seg(name)}.${seg(step)}`, list(others), step, 'k.values.step.name'));
      });
    }
    const comps = [];
    for (const [scale, way, comparatives, superlatives] of COMPARATIVES) {
      for (const t of list(comparatives)) comps.push(wire(`k.values.comparative.${seg(scale)}.${seg(t)}`, 'k.values.comparative', [['text', t], ['scale', scale], ['way', way], ['degree', 'comparative']], HAND));
      for (const t of list(superlatives)) comps.push(wire(`k.values.comparative.${seg(scale)}.${seg(t)}`, 'k.values.comparative', [['text', t], ['scale', scale], ['way', way], ['degree', 'superlative']], HAND));
    }
    files['scales.sop'] = shard('scales', `${SCALES.length} ordered scales (${SCALES.map((s) => s[0]).join(', ')}): the steps of each from the least to the most, other words for a step, and the comparatives and superlatives that move along a scale (bigger, smallest).`,
      `${lines.join('\n')}\n\n# Words: other words for a step.\n${words.join('\n')}\n\n# Comparatives and superlatives.\n${comps.join('\n')}`);
  }
  // Shapes.
  {
    const lines = SHAPES.map(([name, solid]) => wire(`k.values.shape.${seg(name)}`, 'k.values.shape', [['name', name], ['solid', solid ? 'true' : undefined]], HAND));
    const words = SHAPES.map(([name, , others]) => word(`k.values.word.shape.${seg(name)}`, list(others), name, 'k.values.shape.name'));
    files['shapes.sop'] = shard('shapes', `${SHAPES.length} shape names (${SHAPES.map((s) => s[0]).join(', ')}), flat or solid, with their plurals and adjectives.`, `${lines.join('\n')}\n\n# Words.\n${words.join('\n')}`);
  }
  // Directions and positions.
  {
    const lines = DIRECTIONS.map(([name, axis, x, y, opposite]) => wire(`k.values.direction.${seg(name)}`, 'k.values.direction', [['name', name], ['axis', axis], ['x', x], ['y', y], ['opposite', opposite]], HAND));
    const words = DIRECTIONS.filter((d) => d[5]).map((d) => word(`k.values.word.direction.${seg(d[0])}`, list(d[5]), d[0], 'k.values.direction.name'));
    const pos = POSITIONS.map(([name, column, row, depth]) => wire(`k.values.position.${seg(name)}`, 'k.values.position', [['name', name], ['column', column], ['row', row], ['depth', depth]], HAND));
    const pwords = POSITIONS.map((p) => word(`k.values.word.position.${seg(p[0])}`, list(p[4]), p[0], 'k.values.position.name'));
    files['directions.sop'] = shard('directions', `${DIRECTIONS.length} directions (left, right, up, down, clockwise, north ...) with their opposite and their step in a picture, and ${POSITIONS.length} positions in a picture (top, bottom left, centre, front ...).`,
      `${lines.join('\n')}\n\n# Words.\n${words.join('\n')}\n\n# Positions in a picture.\n${pos.join('\n')}\n\n# Words.\n${pwords.join('\n')}`);
  }
  // Set words.
  {
    const lines = SET_WORDS.map(([name, picks, manner, about]) => wire(`k.values.set_word.${seg(name)}`, 'k.values.set_word', [['name', name], ['picks', picks], ['manner', manner], ['about', text(about)]], HAND));
    const words = SET_WORDS.filter((s) => s[4]).map((s) => word(`k.values.word.set_word.${seg(s[0])}`, list(s[4]), s[0], 'k.values.set_word.name'));
    files['sets.sop'] = shard('sets', `${SET_WORDS.length} set words (${SET_WORDS.map((s) => s[0]).join(', ')}): how many of the things meant each picks, and in what manner.`, `${lines.join('\n')}\n\n# Words.\n${words.join('\n')}`);
  }
  // Fills.
  {
    const lines = FILLS.map(([name, about]) => wire(`k.values.fill.${seg(name)}`, 'k.values.fill', [['name', name], ['about', text(about)]], HAND));
    const words = FILLS.map((f) => word(`k.values.word.fill.${seg(f[0])}`, list(f[2]), f[0], 'k.values.fill.name'));
    files['fills.sop'] = shard('fills', `${FILLS.length} ways a shape is filled in a picture (${FILLS.map((f) => f[0]).join(', ')}) and their other words.`, `${lines.join('\n')}\n\n# Words.\n${words.join('\n')}`);
  }
  // Numbers.
  {
    const nums = numberWords();
    const exact = (v) => Math.round(v * 1000) / 1000 === v;
    const lines = nums.map(([t, kind, value]) => wire(`k.values.number.${kind}.${seg(t)}`, 'k.values.number', [['text', t], ['kind', kind],
      exact(value) ? ['value', value] : ['value_about', Math.round(value * 1000) / 1000]], HAND));
    const words = [word('k.values.word.number.cardinal.one', ['a', 'an'], 'one', 'k.values.number.text'), word('k.values.word.number.cardinal.zero', ['nought', 'nil'], 'zero', 'k.values.number.text'),
      word('k.values.word.number.cardinal.hundred', ['a hundred', 'one hundred'], 'hundred', 'k.values.number.text'), word('k.values.word.number.cardinal.thousand', ['a thousand', 'one thousand'], 'thousand', 'k.values.number.text'),
      word('k.values.word.number.group.dozen', ['a dozen'], 'dozen', 'k.values.number.text'), word('k.values.word.number.group.pair', ['a pair', 'a pair of'], 'pair', 'k.values.number.text'),
      word('k.values.word.number.group.couple', ['a couple', 'a couple of'], 'couple', 'k.values.number.text'), word('k.values.word.number.fraction.half', ['a half', 'one half'], 'half', 'k.values.number.text'),
      word('k.values.word.number.fraction.quarter', ['a quarter', 'one quarter'], 'quarter', 'k.values.number.text'), word('k.values.word.number.fraction.third', ['a third', 'one third'], 'third', 'k.values.number.text')];
    files['numbers.sop'] = shard('numbers', `${nums.length} number words: the cardinals zero to ninety-nine, hundred, thousand, million, billion; the ordinals first to ninety-ninth, hundredth, thousandth, millionth; once, twice, thrice; single, double, triple, quadruple; pair, couple, trio, dozen; half, third, quarter.`,
      `${lines.join('\n')}\n\n# Words.\n${words.join('\n')}`);
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = valueShards();
  const dir = join(WORLDS_DIR, 'k.values', 'shards');
  if (!files['colours-css.sop'] && existsSync(join(dir, 'colours-css.sop'))) files['colours-css.sop'] = readFileSync(join(dir, 'colours-css.sop'), 'utf8');
  writeShards(dir, files);
  console.log(Object.keys(files).join(', '));
}
