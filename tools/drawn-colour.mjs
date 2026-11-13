// The colours a thing is drawn in (reviewer's answer to Q29): for every drawable thing of k.objects the main fill
// colours of its drawing, computed from the parts as they are drawn, as k.attributes.drawn facts. This says how
// the thing is drawn, not what colour it usually is (that is k.attributes.thing.colour): two facts, never mixed.
//   node tools/drawn-colour.mjs        writes docs/worlds/k.attributes/shards/drawn-*.sop
// How it is computed: the drawing is sampled on a grid of 60 x 60 places in its frame; at each place the topmost
// filled part (rectangle, square, circle, oval, triangle, polygon; lines and arcs are strokes and do not count)
// gives its colour: the exact `rgb` of an imported part, or the value of the first colour name of a hand-written
// part. Each colour is mapped to the nearest colour name of k.values.colour (distance in CIE Lab): `drawn_shade`
// is that name; `drawn_colour` is the basic colour of that name, or of the nearest name that has one (one of the eleven basic
// colours, the values of k.attributes.thing.colour). A colour is kept when it covers at least a fifth of the
// filled places; at most three, the largest first; the largest is always kept.
import { join } from 'node:path';
import { WORLDS_DIR, fullWorld } from './lib/worlds.mjs';
import { wire, header, seg, writeShards, byText } from './import/lib.mjs';
import { partsOf } from './render-svg.mjs';
import { lab } from './import/svg-parts.mjs';
import { factsByType } from './aspects-report.mjs';

const tok = (t) => (t !== undefined && t.startsWith('"') ? JSON.parse(t) : t);
const GRID = 60, SHARE = 0.2, MOST = 3;

const triangle = ({ x, y, w, h, pointing }) => ({
  up: [[x + w / 2, y], [x + w, y + h], [x, y + h]], down: [[x, y], [x + w, y], [x + w / 2, y + h]],
  left: [[x, y + h / 2], [x + w, y], [x + w, y + h]], right: [[x + w, y + h / 2], [x, y], [x, y + h]],
}[pointing]);
const inPolygon = (pts, x, y) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const hit = (p, x, y) => {
  if (x < p.x || x > p.x + p.w || y < p.y || y > p.y + p.h) return false;
  switch (p.shape) {
    case 'rectangle': case 'square': return true;
    case 'circle': case 'oval': { const dx = (x - p.x - p.w / 2) / (p.w / 2 || 1), dy = (y - p.y - p.h / 2) / (p.h / 2 || 1); return dx * dx + dy * dy <= 1; }
    case 'triangle': return inPolygon(triangle(p), x, y);
    case 'polygon': return inPolygon(p.poly, x, y);
    default: return false;
  }
};

// The colour names of k.values with their value: { name, rgb, lab, basic }.
export function valueColours() {
  const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  return factsByType(['k.values.colour']).get('k.values.colour').map((w) => {
    const rgb = rgbOf(tok(w.attrs.rgb?.[0] ?? w.attrs.rgb_about[0]));
    return { name: tok(w.attrs.name[0]), rgb, lab: lab(rgb), basic: tok(w.attrs.basic?.[0]) };
  }).sort((a, b) => byText(a.name, b.name));
}
// The nearest colour of a list to an "#RRGGBB" value.
const nearest = (list, hexValue) => {
  const p = lab([1, 3, 5].map((i) => parseInt(hexValue.slice(i, i + 2), 16)));
  let best = null, bestD = Infinity;
  for (const c of list) { const d = (p[0] - c.lab[0]) ** 2 + (p[1] - c.lab[1]) ** 2 + (p[2] - c.lab[2]) ** 2; if (d < bestD) { bestD = d; best = c; } }
  return best;
};
const hexOf = (rgb) => `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;

// The shares of the colours of one object, as exact values: [["#RRGGBB", share of the filled places] ...].
export function colourShares(parts, colours) {
  const valueOf = (p) => tok(p.attrs.rgb?.[0]) ?? hexOf(colours.find((c) => c.name === tok(p.attrs.colour[0])).rgb);
  const filled = parts.filter((p) => p.shape !== 'line' && p.shape !== 'arc').map((p) => ({ ...p, name: valueOf(p), poly: p.points.map((q) => [q.x, q.y]) })).reverse();
  const count = new Map();
  let all = 0;
  for (let i = 0; i < GRID; i += 1) for (let j = 0; j < GRID; j += 1) {
    const x = ((i + 0.5) * 100) / GRID, y = ((j + 0.5) * 100) / GRID;
    const top = filled.find((p) => hit(p, x, y));
    if (!top) continue;
    all += 1;
    count.set(top.name, (count.get(top.name) ?? 0) + 1);
  }
  return [...count.entries()].map(([c, n]) => [c, n / all]).sort((a, b) => b[1] - a[1] || byText(a[0], b[0]));
}
// The main names of the shares, after each exact value is mapped by `nameOf`.
export function mainColours(shares, nameOf) {
  const sum = new Map();
  for (const [value, s] of shares) { const n = nameOf(value); sum.set(n, (sum.get(n) ?? 0) + s); }
  return [...sum.entries()].sort((a, b) => b[1] - a[1] || byText(a[0], b[0])).filter(([, s], i) => i === 0 || s >= SHARE).slice(0, MOST).map(([c]) => c);
}

const SHARDS = [
  ['hand', (s) => s.startsWith('hand-core'), 'CC0-1.0', 'hand-written drawings'],
  ['mulberry', (s) => s.startsWith('mulberry'), 'CC-BY-SA-4.0', 'Mulberry Symbols drawings'],
  ['noto', (s) => s.startsWith('noto-emoji'), 'Apache-2.0 AND Unicode-3.0', 'Noto Emoji drawings'],
  ['openmoji', (s) => s.startsWith('openmoji'), 'CC-BY-SA-4.0', 'OpenMoji drawings'],
];

export function drawnShards(world = fullWorld('k.objects')) {
  const colours = valueColours(), withBasic = colours.filter((c) => c.basic);
  const memo = new Map();
  const names = (value) => { if (!memo.has(value)) memo.set(value, { shade: nearest(colours, value).name, basic: nearest(colours, value).basic ?? nearest(withBasic, value).basic }); return memo.get(value); };
  const rows = [];
  for (const o of world.ofType('k.objects.object')) {
    const name = tok(o.attrs.name[0]);
    const sources = o.attrs['core.source'].map(tok);
    const shares = colourShares(partsOf(world, name), colours);
    if (!shares.length) continue;
    rows.push({ name, sources, colours: mainColours(shares, (v) => names(v).basic), shades: mainColours(shares, (v) => names(v).shade) });
  }
  rows.sort((a, b) => byText(a.name, b.name));
  const files = {};
  for (const [key, mine, license, about] of SHARDS) {
    const list = rows.filter((r) => r.sources.some(mine));
    if (!list.length) continue;
    const versions = [...new Set(list.flatMap((r) => r.sources))].sort(byText);
    const lines = list.map((r) => {
      const w = wire(`k.attributes.drawn.${seg(r.name)}`, 'k.attributes.drawn', [['name', r.name], ...r.colours.map((c) => ['drawn_colour', c]), ...r.shades.map((c) => ['drawn_shade', c])], r.sources[0]);
      return r.sources.slice(1).reduce((l, s) => `${l} core.source=${JSON.stringify(s)}`, w);
    });
    files[`drawn-${key}.sop`] = `${header({ id: `k.attributes/shards/drawn-${key}`, about: `the main colours in which ${list.length} things are drawn (${about} of k.objects), the largest first: how the thing is drawn, not its usual colour.`,
      sources: [`${versions.join(', ')} (computed from the parts of the drawings in k.objects)`], license, script: 'tools/drawn-colour.mjs' })}\n${lines.join('\n')}\n`;
  }
  return { files, rows };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { files, rows } = drawnShards();
  writeShards(join(WORLDS_DIR, 'k.attributes', 'shards'), files, 'drawn-');
  const n = new Map();
  for (const r of rows) n.set(r.colours.length, (n.get(r.colours.length) ?? 0) + 1);
  console.log(`${rows.length} things; colours per thing: ${[...n.entries()].sort().map(([k, v]) => `${k}: ${v}`).join(', ')}`);
}
