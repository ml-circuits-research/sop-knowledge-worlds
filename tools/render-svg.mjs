// Test renderer: draws a k.objects object from the world's facts alone (parts, boxes, shapes, z, colours, points)
// as a plain SVG. No dependencies besides the pinned sopworld.
//   node tools/render-svg.mjs [out-dir]     writes <object>.svg for every object, and index.html, to
//                                           docs/worlds/k.objects/preview/ (or out-dir)
import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fullWorld, WORLDS_DIR } from './lib/worlds.mjs';

export const SHAPES = ['rectangle', 'square', 'circle', 'oval', 'triangle', 'line', 'arc', 'polygon'];
const one = (wire, key) => wire.attrs[key]?.[0];
const num = (wire, key) => Number(one(wire, key));
const f = (n) => String(Math.round(n * 100) / 100);

// The parts of an object, in draw order (z, then the order they were told), with their points.
export function partsOf(world, object) {
  const points = new Map();
  for (const p of world.ofType('k.objects.point')) {
    const of = one(p, 'of').slice(1);
    if (!points.has(of)) points.set(of, []);
    points.get(of).push({ n: num(p, 'n'), x: num(p, 'x'), y: num(p, 'y') });
  }
  return world.ofType('k.objects.part')
    .filter((p) => one(p, 'of') === object)
    .map((p, i) => ({
      id: p.id, name: one(p, 'name'), shape: one(p, 'shape'), x: num(p, 'x'), y: num(p, 'y'), w: num(p, 'w'), h: num(p, 'h'),
      z: num(p, 'z'), colour: one(p, 'colour'), pointing: one(p, 'pointing') ?? 'up', opens: one(p, 'opens') ?? 'up',
      points: (points.get(p.id) ?? []).sort((a, b) => a.n - b.n), order: i, attrs: p.attrs,
    }))
    .sort((a, b) => a.z - b.z || a.order - b.order);
}

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
  const fill = `fill="${p.colour}" stroke="#333" stroke-width="0.8"`;
  const stroke = `fill="none" stroke="${p.colour}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  const title = `<title>${p.name}</title>`;
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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">\n  <title>${object}</title>\n  <rect width="100" height="100" fill="#fafafa"/>\n${body}\n</svg>\n`;
}

export const objectsOf = (world) => world.ofType('k.objects.object').map((o) => one(o, 'name')).sort();

export function renderAll(world) {
  const files = {};
  const names = objectsOf(world);
  for (const name of names) files[`${name}.svg`] = renderObject(world, name);
  const cells = names.map((n) => `<figure><img src="${n}.svg" alt="${n}" width="160" height="160"><figcaption>${n}</figcaption></figure>`).join('\n');
  files['index.html'] = `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="utf-8"><title>k.objects previews</title>\n<style>body{font:14px system-ui,sans-serif;margin:2rem}figure{display:inline-block;margin:.5rem;text-align:center}img{border:1px solid #ddd}</style></head>\n<body>\n<h1>k.objects previews</h1>\n<p>Drawn by tools/render-svg.mjs from the facts alone.</p>\n${cells}\n</body>\n</html>\n`;
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = process.argv[2] ?? join(WORLDS_DIR, 'k.objects', 'preview');
  mkdirSync(out, { recursive: true });
  for (const old of readdirSync(out)) rmSync(join(out, old));
  const files = renderAll(fullWorld('k.objects'));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(out, name), text);
  console.log(`${Object.keys(files).length - 1} objects drawn to ${out}`);
}
