// Test renderer: draws a k.objects object from the world's facts alone (parts, boxes, shapes, z, colours, points)
// as a plain SVG. No dependencies besides the pinned sopworld.
//   node tools/render-svg.mjs [out-dir]     writes <object>.svg for every object, and index.html, to
//                                           docs/worlds/k.objects/preview/ (or out-dir)
//   node tools/render-svg.mjs --label <out-dir> [object ...]   labelling pictures: parts outlined and numbered
import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fullWorld, WORLDS_DIR } from './lib/worlds.mjs';

export const SHAPES = ['rectangle', 'square', 'circle', 'oval', 'triangle', 'line', 'arc', 'polygon'];
const tok = (t) => (t !== undefined && t.startsWith('"') ? JSON.parse(t) : t);
const one = (wire, key) => tok(wire.attrs[key]?.[0]);
const num = (wire, key) => Number(one(wire, key));
const f = (n) => String(Math.round(n * 100) / 100);
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
// The file name of an object's picture: its name with every run of other characters as "_".
export const fileOf = (name) => name.replace(/[^A-Za-z0-9-]+/g, '_');

// The parts of every object, read once per world.
const indexes = new WeakMap();
function indexOf(world) {
  if (indexes.has(world)) return indexes.get(world);
  const points = new Map();
  for (const p of world.ofType('k.objects.point')) {
    const of = wire0(p, 'part').slice(1);
    if (!points.has(of)) points.set(of, []);
    points.get(of).push({ n: num(p, 'n'), x: num(p, 'x'), y: num(p, 'y') });
  }
  const parts = new Map();
  world.ofType('k.objects.part').forEach((p, i) => {
    const object = one(p, 'of');
    if (!parts.has(object)) parts.set(object, []);
    parts.get(object).push({
      id: p.id, name: one(p, 'name'), shape: one(p, 'shape'), x: num(p, 'x'), y: num(p, 'y'), w: num(p, 'w'), h: num(p, 'h'),
      z: num(p, 'z'), colour: one(p, 'rgb') ?? one(p, 'colour'), exact: one(p, 'rgb') !== undefined, pointing: one(p, 'pointing') ?? 'up', opens: one(p, 'opens') ?? 'up',
      points: (points.get(p.id) ?? []).sort((a, b) => a.n - b.n), order: i, attrs: p.attrs,
    });
  });
  for (const list of parts.values()) list.sort((a, b) => a.z - b.z || a.order - b.order);
  indexes.set(world, parts);
  return parts;
}
const wire0 = (wire, key) => wire.attrs[key][0];

// The parts of an object, in draw order (z, then the order they were told), with their points.
export const partsOf = (world, object) => indexOf(world).get(object) ?? [];

const triangle = ({ x, y, w, h, pointing }) => ({
  up: [[x + w / 2, y], [x + w, y + h], [x, y + h]],
  down: [[x, y], [x + w, y], [x + w / 2, y + h]],
  left: [[x, y + h / 2], [x + w, y], [x + w, y + h]],
  right: [[x + w, y + h / 2], [x, y], [x, y + h]],
}[pointing]);

// An arc is half an ellipse that fills its box, open on the side `opens` names (a smile opens up).
const arc = ({ x, y, w, h, opens }) => ({
  up: `M${f(x)} ${f(y)} A${f(w / 2)} ${f(h)} 0 0 0 ${f(x + w)} ${f(y)}`,
  down: `M${f(x)} ${f(y + h)} A${f(w / 2)} ${f(h)} 0 0 1 ${f(x + w)} ${f(y + h)}`,
  left: `M${f(x)} ${f(y)} A${f(w)} ${f(h / 2)} 0 0 1 ${f(x)} ${f(y + h)}`,
  right: `M${f(x + w)} ${f(y)} A${f(w)} ${f(h / 2)} 0 0 0 ${f(x + w)} ${f(y + h)}`,
}[opens]);

const pts = (list) => list.map((p) => (Array.isArray(p) ? `${f(p[0])},${f(p[1])}` : `${f(p.x)},${f(p.y)}`)).join(' ');

export function renderPart(p) {
  // A part with an exact colour (rgb) is drawn flat; a part with a colour name only gets a thin outline.
  const fill = p.exact ? `fill="${p.colour}"` : `fill="${p.colour}" stroke="#333" stroke-width="0.8"`;
  const stroke = `fill="none" stroke="${p.colour}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  const title = `<title>${esc(p.name)}</title>`;
  switch (p.shape) {
    case 'rectangle': case 'square':
      return `<rect x="${f(p.x)}" y="${f(p.y)}" width="${f(p.w)}" height="${f(p.h)}" ${fill}>${title}</rect>`;
    case 'circle': case 'oval':
      return `<ellipse cx="${f(p.x + p.w / 2)}" cy="${f(p.y + p.h / 2)}" rx="${f(p.w / 2)}" ry="${f(p.h / 2)}" ${fill}>${title}</ellipse>`;
    case 'triangle':
      return `<polygon points="${pts(triangle(p))}" ${fill}>${title}</polygon>`;
    case 'polygon':
      return `<polygon points="${pts(p.points)}" ${fill}>${title}</polygon>`;
    case 'line':
      return `<polyline points="${pts(p.points)}" ${stroke}>${title}</polyline>`;
    case 'arc':
      return `<path d="${arc(p)}" ${stroke}>${title}</path>`;
    default:
      throw new Error(`${p.id}: unknown shape ${p.shape}`);
  }
}

export function renderObject(world, object) {
  const parts = partsOf(world, object);
  if (!parts.length) throw new Error(`${object}: no parts`);
  const body = parts.map((p) => `  ${renderPart(p)}`).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">\n  <title>${esc(object)}</title>\n  <rect width="100" height="100" fill="#fafafa"/>\n${body}\n</svg>\n`;
}

// A labelling picture: the object at 320 px, every part outlined and numbered in draw order (1 is drawn first), with
// the part names underneath when they are more than partN.
const outlineOf = (p) => {
  const st = 'fill="none" stroke="#e0007a" stroke-width="0.5"';
  switch (p.shape) {
    case 'rectangle': case 'square': return `<rect x="${f(p.x)}" y="${f(p.y)}" width="${f(p.w)}" height="${f(p.h)}" ${st}/>`;
    case 'circle': case 'oval': return `<ellipse cx="${f(p.x + p.w / 2)}" cy="${f(p.y + p.h / 2)}" rx="${f(p.w / 2)}" ry="${f(p.h / 2)}" ${st}/>`;
    case 'triangle': return `<polygon points="${pts(triangle(p))}" ${st}/>`;
    case 'polygon': return `<polygon points="${pts(p.points)}" ${st}/>`;
    case 'line': return `<polyline points="${pts(p.points)}" ${st}/>`;
    default: return `<path d="${arc(p)}" ${st}/>`;
  }
};
// Where the number of a part goes: a point of the part that later parts do not cover, if there is one.
function labelSpot(p, later) {
  const boxHit = (q, x, y) => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h;
  const cands = [[p.x + p.w / 2, p.y + p.h / 2]];
  if (p.points.length) {
    const cx = p.points.reduce((n, q) => n + q.x, 0) / p.points.length, cy = p.points.reduce((n, q) => n + q.y, 0) / p.points.length;
    cands.unshift([cx, cy]);
    for (const q of p.points) cands.push([q.x + (cx - q.x) * 0.3, q.y + (cy - q.y) * 0.3]);
  } else for (const [dx, dy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) cands.push([p.x + p.w * dx, p.y + p.h * dy]);
  return cands.find(([x, y]) => !later.some((q) => boxHit(q, x, y))) ?? cands[0];
}
export function renderLabelled(world, object) {
  const parts = partsOf(world, object);
  if (!parts.length) throw new Error(`${object}: no parts`);
  const body = parts.map((p) => `  ${renderPart(p)}`).join('\n');
  const outlines = parts.map((p) => `  ${outlineOf(p)}`).join('\n');
  const numbers = parts.map((p, i) => {
    const [x, y] = labelSpot(p, parts.slice(i + 1));
    return `  <text x="${f(Math.max(2, Math.min(96, x)))}" y="${f(Math.max(4, Math.min(99, y + 1.5)))}" font-size="4.5" font-family="sans-serif" font-weight="bold" text-anchor="middle" stroke="#fff" stroke-width="1.2" paint-order="stroke" fill="#000">${i + 1}</text>`;
  }).join('\n');
  const names = parts.map((p, i) => (/^part\d+$/.test(p.name) ? null : `${i + 1} ${p.name}`)).filter(Boolean);
  const rows = [];
  for (let i = 0; i < names.length; i += 4) rows.push(names.slice(i, i + 4).join('   '));
  const legend = rows.map((r, i) => `  <text x="1" y="${f(104 + i * 4)}" font-size="3" font-family="sans-serif">${esc(r)}</text>`).join('\n');
  const height = 100 + (rows.length ? rows.length * 4 + 2 : 0);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 ${height}" width="320" height="${f(height * 3.2)}">\n  <title>${esc(object)}</title>\n  <rect width="100" height="${height}" fill="#fafafa"/>\n${body}\n${outlines}\n${numbers}\n${legend}\n</svg>\n`;
}

export const objectsOf = (world) => world.ofType('k.objects.object').map((o) => one(o, 'name')).sort();

// Twelve imported objects whose labelled pictures are kept with the previews.
export const LABEL_EXAMPLES = ['dog face', 'frog', 'baby chick', 'mouse face', 'taxi', 'hut', 'saxophone', 'teddy bear', 'hot dog', 'hammer', 'office building', 'full moon face'];

export function renderAll(world) {
  const files = {};
  const names = objectsOf(world);
  for (const name of names) files[`${fileOf(name)}.svg`] = renderObject(world, name);
  for (const name of LABEL_EXAMPLES) if (names.includes(name)) files[`label-${fileOf(name)}.svg`] = renderLabelled(world, name);
  const cells = names.map((n) => `<figure><img src="${fileOf(n)}.svg" alt="${esc(n)}" width="160" height="160" loading="lazy"><figcaption>${esc(n)}</figcaption></figure>`).join('\n');
  const labelled = LABEL_EXAMPLES.filter((n) => names.includes(n)).map((n) => `<figure><img src="label-${fileOf(n)}.svg" alt="${esc(n)}, parts numbered" width="320" loading="lazy"><figcaption>${esc(n)}</figcaption></figure>`).join('\n');
  files['index.html'] = `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="utf-8"><title>k.objects previews</title>\n<style>body{font:14px system-ui,sans-serif;margin:2rem}figure{display:inline-block;margin:.5rem;text-align:center;vertical-align:top}img{border:1px solid #ddd}</style></head>\n<body>\n<h1>k.objects previews</h1>\n<p>Drawn by tools/render-svg.mjs from the facts alone. ${names.length} objects.</p>\n${cells}\n${labelled ? `<h2>Parts, numbered in draw order</h2>\n${labelled}\n` : ''}</body>\n</html>\n`;
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const world = fullWorld('k.objects');
  if (args[0] === '--label') {
    // node tools/render-svg.mjs --label <out-dir> [object name ...]: labelling pictures (all objects when none is named).
    const out = args[1];
    mkdirSync(out, { recursive: true });
    const names = args.length > 2 ? args.slice(2) : objectsOf(world);
    for (const name of names) writeFileSync(join(out, `${fileOf(name)}.svg`), renderLabelled(world, name));
    console.log(`${names.length} labelling pictures written to ${out}`);
  } else {
    const out = args[0] ?? join(WORLDS_DIR, 'k.objects', 'preview');
    mkdirSync(out, { recursive: true });
    for (const old of readdirSync(out)) rmSync(join(out, old));
    const files = renderAll(world);
    for (const [name, text] of Object.entries(files)) writeFileSync(join(out, name), text);
    console.log(`${objectsOf(world).length} objects drawn to ${out}`);
  }
}
