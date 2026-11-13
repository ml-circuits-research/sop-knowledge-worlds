// Draws every scene of k.scenes from the facts alone, as a check that "draw a beach" can be composed: the things a
// scene has (k.scenes.has: count, where, side, on, drawing), the size class of each drawing (k.scenes.thing) and the
// previews of k.objects. A plain composer, not the application's: layers by `where`, sizes by class, at most five
// of a thing, places from a fixed sequence (no randomness).
//   node tools/render-scenes.mjs [out-dir]     writes docs/worlds/k.scenes/preview/<scene>.svg and index.html
// The pictures refer to the object previews (../../k.objects/preview/<name>.svg); `inline: true` copies them in
// instead (for a look with a rasteriser that does not follow links).
import { mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fullWorld, scanWorlds, WORLDS_DIR } from './lib/worlds.mjs';
import { fileOf } from './render-svg.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
export const W = 480, H = 320, MAX = 5;
const PX = { tiny: 16, small: 26, medium: 44, large: 70, huge: 112 };
const GROUND = { sand: '#f2dc9b', grass: '#8fce6b', snow: '#f4f8fb', earth: '#c9a66b', rock: '#b5ada3', leaves: '#d9a45b', water: '#6fb3e8', floor: '#d9c2a0', tiles: '#d8e6ea', stage: '#b98b5e', sawdust: '#e3c98f' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const r1 = (n) => Math.round(n * 10) / 10;

// The scenes with their things, and the size class of every thing that has one.
export function readScenes(world) {
  const size = new Map(world.ofType('k.scenes.thing').map((w) => [one(w, 'name'), one(w, 'size')]));
  const has = new Map();
  for (const w of world.ofType('k.scenes.has')) {
    const s = one(w, 'scene');
    if (!has.has(s)) has.set(s, []);
    has.get(s).push({ thing: one(w, 'thing'), count: Number(one(w, 'count')), where: one(w, 'where'), side: one(w, 'side'), on: one(w, 'on'), fills: one(w, 'fills') === 'true', drawing: one(w, 'drawing') });
  }
  return world.ofType('k.scenes.scene').map((w) => ({ name: one(w, 'name'), kind: one(w, 'kind'), ground: one(w, 'ground'), time: (w.attrs.time ?? []).map(tok), things: has.get(one(w, 'name')) ?? [] }))
    .map((s) => ({ ...s, things: s.things.map((t) => ({ ...t, size: size.get(t.thing) ?? size.get(t.drawing) ?? 'medium' })) }));
}

// Where every drawn instance goes: [{ thing, drawing, x, y, s }] (x, y the top left corner, s the side in px), in draw order.
export function layout(scene) {
  const out = [];
  const placed = new Map(); // thing -> its first instance
  const frac = (k, salt) => { const v = (k + 1) * 0.6180339887 + salt * 0.37; return v - Math.floor(v); };
  const sideX = { left: [20, 150], centre: [180, 300], right: [330, 460] };
  const band = { sky: [10, 95], ceiling: [4, 40], background: [150, 178], wall: [60, 135], ground: [205, 288], water: [182, 210], foreground: [296, 316] };
  if (scene.kind === 'underwater') Object.assign(band, { sky: [0, 30], water: [70, 250], background: [120, 200], ground: [270, 300] });
  if (scene.kind === 'space') Object.assign(band, { sky: [30, 290], background: [30, 290], foreground: [296, 316] });
  const layers = ['sky', 'ceiling', 'background', 'wall', 'water', 'ground', 'foreground'];
  // A thing on something that has no drawing in the scene stands free in its own layer.
  const drawn = new Set(scene.things.filter((t) => t.drawing).map((t) => t.thing));
  const hosted = (t) => t.on && drawn.has(t.on);
  const free = scene.things.filter((t) => t.drawing && !hosted(t));
  let n = 0;
  for (const layer of layers) {
    const inLayer = free.filter((t) => t.where === layer).sort((a, b) => PX[b.size] - PX[a.size]);
    const total = inLayer.filter((x) => !x.fills).reduce((k, t) => k + Math.min(t.count, MAX), 0);
    let i = 0;
    for (const t of inLayer.filter((x) => x.fills)) {
      // A thing that fills its layer: a strip from side to side (only its lower half is shown: the surface).
      const [y0, y1] = layer === 'background' ? [150, 200] : band[layer];
      const inst = { thing: t.thing, drawing: t.drawing, x: 0, y: y0, s: W, h: y1 - y0, fills: true };
      out.push(inst);
      placed.set(t.thing, inst);
    }
    for (const t of inLayer.filter((x) => !x.fills)) {
      const far = layer === 'background' || (layer === 'wall');
      let s = PX[t.size] * (far ? 0.75 : 1);
      if (layer === 'sky' || layer === 'ceiling') s = Math.min(s, t.size === 'huge' ? 56 : 40);
      if (scene.kind === 'space') s = Math.min(s, 60);
      for (let c = 0; c < Math.min(t.count, MAX); c++, i++, n++) {
        const [x0, x1] = sideX[t.side] ?? [8, W - 8];
        const fx = sideX[t.side] ? frac(c, n) : (i + 0.5) / total * 0.94 + (frac(i, 3) - 0.5) * 0.06;
        const cx = x0 + fx * (x1 - x0);
        const [y0, y1] = band[layer];
        // In a standing layer the base line of a thing is in the band (bigger things further back); in the sky the centre is.
        const depth = layer === 'ground' ? (1 - s / PX.huge) * 0.7 + frac(i, 7) * 0.3 : frac(i, 5);
        const base = y0 + depth * (y1 - y0);
        const y = ['sky', 'ceiling', 'wall', 'water'].includes(layer) || scene.kind === 'space' ? base - s / 2 : base - s;
        const inst = { thing: t.thing, drawing: t.drawing, x: r1(Math.max(0, Math.min(W - s, cx - s / 2))), y: r1(Math.max(0, y)), s: r1(s) };
        out.push(inst);
        if (!placed.has(t.thing)) placed.set(t.thing, inst);
      }
    }
  }
  // Things on another thing of the scene: on or near the first instance of it, smaller ones in front.
  const riders = scene.things.filter((t) => t.drawing && hosted(t)).sort((a, b) => PX[b.size] - PX[a.size]);
  const used = new Map();
  for (const t of riders) {
    const host = placed.get(t.on);
    if (!host) continue; // what it is on is itself on something that is not drawn
    const hh = host.h ?? host.s;
    const s = Math.min(PX[t.size], Math.max(host.fills ? PX[t.size] * 0.6 : 0, Math.min(host.s, hh) * 0.45));
    for (let c = 0; c < Math.min(t.count, MAX); c++) {
      const k = used.get(t.on) ?? 0;
      used.set(t.on, k + 1);
      const fx = frac(k, 1), fy = frac(k, 2);
      const inst = host.fills
        ? { thing: t.thing, drawing: t.drawing, x: r1(host.x + (0.04 + fx * 0.92) * (host.s - s)), y: r1(host.y + hh * (0.2 + fy * 0.5) - s * 0.7), s: r1(s) }
        : { thing: t.thing, drawing: t.drawing, x: r1(host.x + fx * (host.s - s)), y: r1(host.y + (0.15 + fy * 0.5) * (host.s - s)), s: r1(s) };
      out.push(inst);
      if (!placed.has(t.thing)) placed.set(t.thing, inst);
    }
  }
  return out;
}

export function renderScene(scene, { inline = false, previewDir = join(WORLDS_DIR, 'k.objects', 'preview') } = {}) {
  const night = scene.time.includes('night') && !scene.time.includes('day');
  const g = GROUND[scene.ground] ?? '#bdbdbd';
  let back;
  if (scene.kind === 'space') back = `<rect width="${W}" height="${H}" fill="#101430"/>`;
  else if (scene.kind === 'underwater') back = `<rect width="${W}" height="${H}" fill="#5aa9dd"/><rect y="270" width="${W}" height="50" fill="${g}"/>`;
  else if (scene.kind === 'indoors') back = `<rect width="${W}" height="${H}" fill="#f3ead8"/><rect y="200" width="${W}" height="120" fill="${g}"/>`;
  else back = `<rect width="${W}" height="${H}" fill="${night ? '#27305c' : '#cfe8fa'}"/><rect y="170" width="${W}" height="150" fill="${g}"/>`;
  const body = layout(scene).map((i) => {
    // The lower 55 of the 100 units of the drawing, stretched over the strip.
    if (i.fills && !inline) return `  <svg x="0" y="${i.y}" width="${W}" height="${i.h}" viewBox="0 45 100 55" preserveAspectRatio="none"><image href="../../k.objects/preview/${fileOf(i.drawing)}.svg" width="100" height="100"/><title>${esc(i.thing)}</title></svg>`;
    if (i.fills) return readFileSync(join(previewDir, `${fileOf(i.drawing)}.svg`), 'utf8').replace(/<rect width="100" height="100" fill="#fafafa"\/>/, '').replace(/<svg [^>]*>/, `<svg x="0" y="${i.y}" width="${W}" height="${i.h}" viewBox="0 45 100 55" preserveAspectRatio="none">`);
    if (!inline) return `  <image href="../../k.objects/preview/${fileOf(i.drawing)}.svg" x="${i.x}" y="${i.y}" width="${i.s}" height="${i.s}"><title>${esc(i.thing)}</title></image>`;
    const svg = readFileSync(join(previewDir, `${fileOf(i.drawing)}.svg`), 'utf8').replace(/<rect width="100" height="100" fill="#fafafa"\/>/, '').replace(/<svg [^>]*>/, `<svg x="${i.x}" y="${i.y}" width="${i.s}" height="${i.s}" viewBox="0 0 100 100">`);
    return svg;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">\n  <title>${esc(scene.name)}</title>\n  ${back}\n${body}\n</svg>\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const inline = args.includes('--inline');
  const out = args.find((a) => !a.startsWith('--')) ?? join(WORLDS_DIR, 'k.scenes', 'preview');
  mkdirSync(out, { recursive: true });
  for (const f of readdirSync(out)) if (f.endsWith('.svg') || f === 'index.html') rmSync(join(out, f));
  const scenes = readScenes(fullWorld('k.scenes', scanWorlds()));
  for (const s of scenes) writeFileSync(join(out, `${fileOf(s.name)}.svg`), renderScene(s, { inline }));
  const cells = scenes.map((s) => { const d = s.things.filter((t) => t.drawing).length; return `<figure><img src="${fileOf(s.name)}.svg" width="${W}" height="${H}" loading="lazy" alt="${esc(s.name)}"><figcaption>${esc(s.name)}: ${d} of ${s.things.length} things have a drawing</figcaption></figure>`; }).join('\n');
  writeFileSync(join(out, 'index.html'), `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="utf-8"><title>k.scenes previews</title>\n<style>body{font:14px system-ui,sans-serif;margin:2rem}figure{display:inline-block;margin:.5rem;text-align:center;vertical-align:top}img{border:1px solid #ddd}</style></head>\n<body>\n<h1>k.scenes previews</h1>\n<p>Composed by tools/render-scenes.mjs from the facts alone: what a scene has, where, how many (at most ${MAX} of a thing are drawn), and the size class of each thing. ${scenes.length} scenes.</p>\n${cells}\n</body>\n</html>\n`);
  console.log(`${scenes.length} scenes drawn to ${out}`);
}
