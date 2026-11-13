// Draws every scene of k.scenes from the facts alone, as a check that "draw a beach" can be composed: the things a
// scene has (k.scenes.has: count, where, side, on, drawing), the size class of each drawing (k.scenes.thing) and the
// previews of k.objects. A plain composer, not the application's: one band per place (sky or ceiling, far ground
// or wall, a strip for what fills its layer, on water, near ground or floor, foreground), each band one to three
// rows packed from left to right, sizes by the size class, at most three of a thing, nothing random. No two things
// overlap, except a thing and what it is on (a duck on its pond, a cup above its table).
//   node tools/render-scenes.mjs [out-dir]     writes docs/worlds/k.scenes/preview/<scene>.svg and index.html
// Every picture is one file with nothing outside it: the object drawings it uses are copied in once each as a
// <symbol> (without the grey tile of the object previews) and placed with <use>. A picture that refers to other
// files stays empty when a page shows it with <img>.
import { mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fullWorld, scanWorlds, WORLDS_DIR } from './lib/worlds.mjs';
import { fileOf } from './render-svg.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
export const W = 480, MAX = 3;
const PX = { tiny: 20, small: 30, medium: 46, large: 66, huge: 96 };
const GAP = 6, MARGIN = 8, PAD = 6;
const GROUND = { sand: '#f2dc9b', grass: '#8fce6b', snow: '#f4f8fb', earth: '#c9a66b', rock: '#b5ada3', leaves: '#d9a45b', water: '#6fb3e8', floor: '#d9c2a0', tiles: '#d8e6ea', stage: '#b98b5e', sawdust: '#e3c98f', road: '#b9bcc0', paving: '#cfcabf', tarmac: '#a9adb3', platform: '#c4c0b8' };
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

// The bands of a kind of scene from top to bottom: the layers (`where`) each holds, how many rows it may take, how
// much smaller things are drawn in it, the largest side of a thing in it, and whether it lies above the horizon.
const BANDS = [
  { name: 'sky', layers: ['sky', 'ceiling'], rows: 2, scale: 0.8, cap: 52, above: true },
  { name: 'far', layers: ['background', 'wall'], rows: 2, scale: 0.8, cap: 80, above: true },
  { name: 'water', layers: ['water'], rows: 2, scale: 1, cap: 96 },
  { name: 'near', layers: ['ground'], rows: 3, scale: 1, cap: 96 },
  { name: 'front', layers: ['foreground'], rows: 1, scale: 1, cap: 60 },
];
const SIDE = { left: 0, centre: 1, right: 2 };

// A band packed into rows. A column is a thing and, above or on it, what is on it. Returns the rows (lists of
// columns with their widths and heights) after taking away instances or shrinking until they fit.
function pack(columns, maxRows) {
  let scale = 1;
  for (;;) {
    const cols = columns.map((c) => {
      let s = c.s * scale;
      let riders = c.riders.map((r) => ({ ...r, s: Math.min(r.s * scale, c.inside ? s * 0.5 : s * 0.7) }));
      const width = (list) => list.reduce((n, r) => n + r.s, 0) + GAP / 2 * Math.max(0, list.length - 1);
      // What is on water has to fit on the water: one of each thing first.
      if (c.inside && width(riders) > s * 0.9) riders = riders.filter((r, i) => riders.findIndex((q) => q.thing === r.thing) === i);
      // A water that carries much is drawn bigger (up to 150 px), and only then its things smaller.
      if (c.inside && width(riders) > s * 0.9) s = Math.min(150 * scale, width(riders) / 0.9);
      if (c.inside && width(riders) > s * 0.9) { const f = (s * 0.9 - GAP / 2 * (riders.length - 1)) / riders.reduce((n, r) => n + r.s, 0); riders = riders.map((r) => ({ ...r, s: Math.max(12, r.s * f) })); }
      const rw = width(riders);
      const rh = riders.reduce((n, r) => Math.max(n, r.s), 0);
      return { ...c, s, riders, rw, w: Math.max(s, rw), h: c.inside || !riders.length ? s : s * 0.8 + rh };
    });
    const rows = [[]];
    let x = MARGIN;
    for (const c of cols) {
      if (x + c.w > W - MARGIN && rows.at(-1).length) { rows.push([]); x = MARGIN; }
      rows.at(-1).push(c);
      x += c.w + GAP;
    }
    const tooWide = cols.some((c) => c.w > W - 2 * MARGIN);
    if (rows.length <= maxRows && !tooWide) return rows;
    // Too much for the band: first one instance less of the thing drawn most often, then everything smaller.
    const most = columns.reduce((best, c) => (c.of > (best?.of ?? 1) ? c : best), null);
    const riderMost = columns.flatMap((c) => c.riders).reduce((best, r) => (r.of > (best?.of ?? 1) ? r : best), null);
    if (most && !tooWide) {
      const i = columns.findLastIndex((c) => c.thing === most.thing);
      columns = columns.filter((_, k) => k !== i);
      for (const c of columns) if (c.thing === most.thing) c.of -= 1;
    } else if (riderMost) {
      const host = columns.findLast((c) => c.riders.some((r) => r.thing === riderMost.thing));
      const i = host.riders.findLastIndex((r) => r.thing === riderMost.thing);
      host.riders = host.riders.filter((_, k) => k !== i);
      for (const c of columns) for (const r of c.riders) if (r.thing === riderMost.thing) r.of -= 1;
    } else scale *= 0.9;
  }
}

// Where everything goes: { height, horizon, strips, items }. An item is { thing, drawing, x, y, s, band, on } (x, y
// the top left corner, s the side in px; `on` names the thing it is drawn on) or, for a thing that fills its layer,
// { thing, drawing, x: 0, y, s: W, h, fills: true }. Items are in draw order.
export function compose(scene) {
  const drawn = new Map(scene.things.filter((t) => t.drawing).map((t) => [t.thing, t]));
  // What a thing is drawn on: the thing named by `on`, followed up to one that stands free.
  const hostOf = (t) => { let h = t, n = 0; while (h.on && drawn.has(h.on) && n++ < 5) h = drawn.get(h.on); return h === t ? null : h; };
  const free = [...drawn.values()].filter((t) => !hostOf(t));
  const ridersOf = (t) => [...drawn.values()].filter((r) => hostOf(r) === t).sort((a, b) => PX[b.size] - PX[a.size]);
  const items = [], strips = [];
  let y = PAD, horizon = null;
  for (const band of BANDS) {
    const inBand = free.filter((t) => band.layers.includes(t.where));
    if (!band.above && horizon === null) horizon = y;
    // What fills its layer is a strip from side to side, with what is on it in a row over it.
    for (const t of inBand.filter((x) => x.fills)) {
      if (horizon === null) horizon = y;
      const riders = ridersOf(t).flatMap((r) => Array.from({ length: Math.min(r.count, MAX) }, () => ({ thing: r.thing, drawing: r.drawing, s: Math.min(PX[r.size], 60), of: Math.min(r.count, MAX), riders: [] })));
      const rows = riders.length ? pack(riders, 1) : [];
      const h = Math.max(40, (rows[0] ?? []).reduce((n, c) => Math.max(n, c.s), 0) + 14);
      strips.push({ thing: t.thing, drawing: t.drawing, x: 0, y: r1(y), s: W, h: r1(h), fills: true, band: band.name });
      const row = rows[0] ?? [];
      const step = (W - 2 * MARGIN - row.reduce((n, c) => n + c.s, 0)) / (row.length + 1);
      let x = MARGIN + step;
      for (const c of row) { items.push({ thing: c.thing, drawing: c.drawing, x: r1(x), y: r1(y + h - 6 - c.s), s: r1(c.s), band: band.name, on: t.thing }); x += c.s + step; }
      y += h;
    }
    const columns = inBand.filter((x) => !x.fills)
      // Big things first (further back), and within a size those with a usual side on that side.
      .sort((a, b) => PX[b.size] - PX[a.size] || (SIDE[a.side] ?? 1) - (SIDE[b.side] ?? 1))
      .flatMap((t) => {
        const s = Math.min(PX[t.size] * band.scale, band.cap);
        const inside = t.where === 'water' || ridersOf(t).some((r) => r.where === 'water');
        const riders = ridersOf(t).flatMap((r) => Array.from({ length: Math.min(r.count, 2) }, () => ({ thing: r.thing, drawing: r.drawing, s: Math.min(PX[r.size], band.cap), of: Math.min(r.count, 2) })));
        const n = riders.length ? 1 : Math.min(t.count, MAX);
        return Array.from({ length: n }, () => ({ thing: t.thing, drawing: t.drawing, s, of: n, inside, riders }));
      });
    if (!columns.length) continue;
    for (const row of pack(columns, band.rows)) {
      const h = row.reduce((n, c) => Math.max(n, c.h), 0);
      const step = (W - 2 * MARGIN - row.reduce((n, c) => n + c.w, 0)) / (row.length + 1);
      let x = MARGIN + step;
      for (const c of row) {
        // The base line of the row carries every thing; in the sky the things hang from the top of the row.
        const top = band.name === 'sky' ? y + c.h - c.s : y + h - c.s;
        items.push({ thing: c.thing, drawing: c.drawing, x: r1(x + (c.w - c.s) / 2), y: r1(top), s: r1(c.s), band: band.name });
        let rx = x + (c.w - c.rw) / 2;
        for (const r of c.riders) {
          // On water (or in a basin) the thing is inside the drawing; otherwise it stands on its upper edge.
          const ry = c.inside ? top + c.s * 0.52 - r.s * 0.6 : top + c.s * 0.2 - r.s;
          items.push({ thing: r.thing, drawing: r.drawing, x: r1(rx), y: r1(ry), s: r1(r.s), band: band.name, on: c.thing });
          rx += r.s + GAP / 2;
        }
        x += c.w + step;
      }
      // Outdoors the far things stand on the horizon: the ground begins a little above the base of their first row.
      if (band.name === 'far' && horizon === null && scene.kind === 'outdoors') horizon = y + h - 8;
      y += h + GAP;
    }
  }
  if (horizon === null) horizon = y;
  return { height: Math.ceil(y + PAD - GAP), horizon: r1(horizon), strips, items: [...strips, ...items] };
}
export const layout = (scene) => compose(scene).items;

export function renderScene(scene, { previewDir = join(WORLDS_DIR, 'k.objects', 'preview') } = {}) {
  const { height: H, horizon, items } = compose(scene);
  const night = scene.time.includes('night') && !scene.time.includes('day');
  const g = GROUND[scene.ground] ?? '#bdbdbd';
  let back;
  if (scene.kind === 'space') back = `<rect width="${W}" height="${H}" fill="#101430"/>`;
  else if (scene.kind === 'underwater') { const floor = items.find((i) => i.band === 'near')?.y ?? H - 30; back = `<rect width="${W}" height="${H}" fill="#5aa9dd"/><rect y="${floor}" width="${W}" height="${r1(H - floor)}" fill="${g}"/>`; }
  else back = `<rect width="${W}" height="${H}" fill="${scene.kind === 'indoors' ? '#f3ead8' : night ? '#27305c' : '#cfe8fa'}"/><rect y="${horizon}" width="${W}" height="${r1(H - horizon)}" fill="${g}"/>`;
  // Each drawing once, as a symbol, without the tile of its preview.
  const id = (d) => `o-${fileOf(d)}`;
  const symbols = [...new Set(items.map((i) => i.drawing))].map((d) => {
    const svg = readFileSync(join(previewDir, `${fileOf(d)}.svg`), 'utf8');
    const inner = svg.replace(/^[\s\S]*?<svg [^>]*>\s*/, '').replace(/\s*<\/svg>\s*$/, '').replace(/<title>[^<]*<\/title>\s*/, '').replace(/<rect width="100" height="100" fill="#fafafa"\/>\s*/, '');
    if (/href=|url\(/.test(inner)) throw new Error(`the preview of ${d} refers to something outside itself`);
    return `    <symbol id="${id(d)}" viewBox="0 0 100 100">\n  ${inner}\n    </symbol>`;
  }).join('\n');
  const body = items.map((i) => (i.fills
    // The lower middle of the drawing (its surface, without its edges), stretched over the strip.
    ? `  <svg x="0" y="${i.y}" width="${W}" height="${i.h}" viewBox="3 45 94 50" preserveAspectRatio="none"><title>${esc(i.thing)}</title><use href="#${id(i.drawing)}" width="100" height="100"/></svg>`
    : `  <use href="#${id(i.drawing)}" x="${i.x}" y="${i.y}" width="${i.s}" height="${i.s}"><title>${esc(i.thing)}</title></use>`)).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">\n  <title>${esc(scene.name)}</title>\n  ${back}\n  <defs>\n${symbols}\n  </defs>\n${body}\n</svg>\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? join(WORLDS_DIR, 'k.scenes', 'preview');
  mkdirSync(out, { recursive: true });
  for (const f of readdirSync(out)) if (f.endsWith('.svg') || f === 'index.html') rmSync(join(out, f));
  const scenes = readScenes(fullWorld('k.scenes', scanWorlds()));
  for (const s of scenes) writeFileSync(join(out, `${fileOf(s.name)}.svg`), renderScene(s));
  const cells = scenes.map((s) => { const d = s.things.filter((t) => t.drawing).length; return `<figure><img src="${fileOf(s.name)}.svg" width="${W}" height="${compose(s).height}" alt="${esc(s.name)}"><figcaption>${esc(s.name)}: ${d} of ${s.things.length} things have a drawing</figcaption></figure>`; }).join('\n');
  writeFileSync(join(out, 'index.html'), `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="utf-8"><title>k.scenes previews</title>\n<style>body{font:14px system-ui,sans-serif;margin:2rem}figure{display:inline-block;margin:.5rem;text-align:center;vertical-align:top}img{border:1px solid #ddd}</style></head>\n<body>\n<h1>k.scenes previews</h1>\n<p>Composed by tools/render-scenes.mjs from the facts alone: what a scene has, where, how many (at most ${MAX} of a thing are drawn), and the size class of each thing. One band per place, in rows; nothing overlaps but a thing and what it is on. These pictures only show that the facts are enough to compose a scene; placing things well is the work of the application. ${scenes.length} scenes.</p>\n${cells}\n</body>\n</html>\n`);
  console.log(`${scenes.length} scenes drawn to ${out}`);
}
