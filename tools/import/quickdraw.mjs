// Quick, Draw! simplified drawings -> k.objects.skeleton facts: for a category, where people usually put the n-th
// stroke (a box in the 0 to 100 frame), matched to a part of the object when one overlaps. NOT RUN in this
// repository's network (the files are on Google Cloud Storage): a machine with an open network downloads
// <category>.ndjson files and runs this script. Deterministic.
//   node tools/import/quickdraw.mjs [--in sources/quickdraw/raw] [--out docs/worlds/k.objects/shards] [--max 2000]
// It prints, per category, whether the skeleton is usable. How to fetch: sources/quickdraw/SOURCE.md.
import { createReadStream, readdirSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { byText, seg, wire, header, writeShards } from './lib.mjs';

export const SOURCE = 'quickdraw 2017';
export const PREFIX = 'quickdraw-';
const r1 = (v) => Math.round(Math.max(0, Math.min(100, v)) * 10) / 10;
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// One drawing ([[xs], [ys]] per stroke) -> the box of each stroke in the 0 to 100 frame of the whole drawing.
export function strokeBoxes(drawing) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [xs, ys] of drawing) { for (const x of xs) { if (x < x0) x0 = x; if (x > x1) x1 = x; } for (const y of ys) { if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  const size = Math.max(x1 - x0, y1 - y0);
  if (!(size > 0)) return null;
  const s = 100 / size, ox = (100 - (x1 - x0) * s) / 2, oy = (100 - (y1 - y0) * s) / 2;
  return drawing.map(([xs, ys]) => {
    const a = Math.min(...xs), b = Math.max(...xs), c = Math.min(...ys), d = Math.max(...ys);
    return { x: (a - x0) * s + ox, y: (c - y0) * s + oy, w: (b - a) * s, h: (d - c) * s };
  });
}

// drawings: the recognised drawings of one category. The skeleton rests on those with the most common number of
// strokes; stroke n of the skeleton is the median box of their n-th strokes.
export function skeletonOf(drawings) {
  const boxes = drawings.map(strokeBoxes).filter((b) => b && b.length >= 1 && b.length <= 16);
  if (!boxes.length) return null;
  const counts = new Map();
  for (const b of boxes) counts.set(b.length, (counts.get(b.length) ?? 0) + 1);
  const k = [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a) || a - b)[0];
  const used = boxes.filter((b) => b.length === k);
  const strokes = [];
  for (let i = 0; i < k; i++) {
    const m = Object.fromEntries(['x', 'y', 'w', 'h'].map((key) => [key, median(used.map((b) => b[i][key]))]));
    // Spread: the median distance of a drawing's stroke centre from the skeleton's.
    const spread = median(used.map((b) => Math.hypot(b[i].x + b[i].w / 2 - m.x - m.w / 2, b[i].y + b[i].h / 2 - m.y - m.h / 2)));
    strokes.push({ ...m, spread });
  }
  const share = used.length / boxes.length;
  const spread = strokes.reduce((n, s) => n + s.spread, 0) / k;
  return { strokes, drawings: used.length, of: boxes.length, share, spread, usable: used.length >= 20 && share >= 0.15 && spread <= 15 };
}

// The part of an object whose box overlaps a stroke box most (at least 0.3 of their union), or undefined.
export function matchPart(box, parts = []) {
  let best, bestScore = 0.3;
  for (const p of parts) {
    const w = Math.min(box.x + box.w, p.x + p.w) - Math.max(box.x, p.x), h = Math.min(box.y + box.h, p.y + p.h) - Math.max(box.y, p.y);
    if (w <= 0 || h <= 0) continue;
    const score = (w * h) / (box.w * box.h + p.w * p.h - w * h);
    if (score > bestScore) { bestScore = score; best = p.name; }
  }
  return best;
}

// categories: Map name -> drawings; partsOf: (name) => [{ name, x, y, w, h }] of the object in k.objects, if any.
export function importQuickdraw(categories, { partsOf = () => [] } = {}) {
  const report = [];
  const lines = [];
  for (const name of [...categories.keys()].sort(byText)) {
    const sk = skeletonOf(categories.get(name));
    if (!sk) { report.push({ name, usable: false, drawings: 0 }); continue; }
    report.push({ name, usable: sk.usable, drawings: sk.drawings, of: sk.of, strokes: sk.strokes.length, share: Math.round(sk.share * 100) / 100, spread: r1(sk.spread) });
    if (!sk.usable) continue;
    sk.strokes.forEach((s, i) => {
      const box = { x: r1(s.x), y: r1(s.y), w: r1(Math.min(s.w, 100 - s.x)), h: r1(Math.min(s.h, 100 - s.y)) };
      lines.push(wire(`k.objects.sk.${seg(name)}.${i + 1}`, 'k.objects.skeleton', [
        ['of', name], ['n', i + 1], ['x', box.x], ['y', box.y], ['w', box.w], ['h', box.h],
        ['part', matchPart(box, partsOf(name))], ['drawings', sk.drawings], ['spread', r1(s.spread)],
      ], SOURCE));
    });
  }
  // Shards of at most 1,800 wires, in the order of the names.
  const files = {};
  for (let i = 0, n = 1; i < lines.length; i += 1800, n++) {
    const name = `${PREFIX}${String(n).padStart(2, '0')}`;
    files[`${name}.sop`] = `${header({
      id: `k.objects/shards/${name}`,
      about: 'sketch skeletons: the usual box of each stroke of a quick drawing of an object, in drawing order.',
      sources: ['quickdraw 2017 (Quick, Draw! dataset, simplified drawings, CC-BY-4.0)'],
      license: 'CC-BY-4.0', script: 'tools/import/quickdraw.mjs',
    })}\n${lines.slice(i, i + 1800).join('\n')}\n`;
  }
  return { files, report };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? dflt : process.argv[i + 1]; };
  const input = arg('in', join(repo, 'sources/quickdraw/raw'));
  const out = arg('out', join(repo, 'docs/worlds/k.objects/shards'));
  const max = Number(arg('max', 2000));
  if (!existsSync(input)) { console.error(`not found: ${input}\nSee sources/quickdraw/SOURCE.md for how to fetch the files.`); process.exit(1); }
  const categories = new Map();
  for (const f of readdirSync(input).filter((x) => x.endsWith('.ndjson')).sort(byText)) {
    const drawings = [];
    for await (const line of createInterface({ input: createReadStream(join(input, f)), crlfDelay: Infinity })) {
      if (drawings.length >= max) break;
      if (!line.trim()) continue;
      const d = JSON.parse(line);
      if (d.recognized) drawings.push(d.drawing);
    }
    categories.set(f.slice(0, -7), drawings);
  }
  // The parts of the objects already in k.objects, to name the strokes where a part matches.
  const { fullWorld } = await import('../lib/worlds.mjs');
  const { partsOf } = await import('../render-svg.mjs');
  const world = fullWorld('k.objects');
  const { files, report } = importQuickdraw(categories, { partsOf: (name) => partsOf(world, name).filter((p) => !/^part\d+$/.test(p.name)) });
  writeShards(out, files, PREFIX);
  for (const r of report) console.log(`${r.usable ? 'usable  ' : 'unusable'} ${r.name}: ${r.drawings} of ${r.of ?? 0} drawings with ${r.strokes ?? 0} strokes, share ${r.share ?? 0}, spread ${r.spread ?? '-'}`);
  console.log(`${report.filter((r) => r.usable).length} of ${report.length} categories give a usable skeleton`);
}
