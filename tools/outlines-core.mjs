// Outlines as arrangement paths (block 09:50 item F, the owner's real case: "a diagram in the shape of a house" drew one
// circle): the edge of a shape as an ordered closed path of points in the 0 to 100 frame (x right, y down), the first
// point the topmost (then the leftmost), going round clockwise; a host spaces things evenly along it (the layout
// `outline` of k.layouts). Two sources, one rule each:
//  - a flat shape of k.shapes with a clear geometry (circle, triangle, square, star, arrow, cross ...), by its geometry
//    (GEOMETRY below: regular polygons from the number of sides, the rest drawn once in the frame); CC0;
//  - a drawing of k.objects with a clear silhouette (DRAWINGS below: the shapes people ask a diagram in the shape of),
//    traced: its parts (not details, lines or arcs) filled on a 100 x 100 grid, the largest piece kept with its holes
//    filled, its edge traced and simplified (Ramer-Douglas-Peucker, tolerance 1.5 frame units, raised by 0.5 up to 6
//    until at most 40 points remain). A drawing whose largest piece holds less than 90 % of its filled cells (a boat:
//    hull and sail apart), or that covers less than 4 % of the frame, has no outline (listed with the reason by the
//    tool). An outline keeps the licence of the drawing it is traced from (one shard per licence).
// A name that is a shape of k.shapes with a geometry takes the geometry (star, arrow, diamond); others take the drawing.
//   node tools/outlines-core.mjs      writes docs/worlds/k.layouts/shards/outlines-*.sop and prints the refused drawings
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, byText } from './import/lib.mjs';

const DIR = join(WORLDS_DIR, 'k.layouts', 'shards');
const PREFIX = 'outlines-';
const SRC = 'hand-core 1';
// The drawings people ask a diagram or an arrangement in the shape of (iconic silhouettes; the owner named house, star,
// heart, tree, arrow, fish): a name here that derives cleanly gets an outline.
export const DRAWINGS = ['apple', 'banana', 'bell', 'bird', 'bottle', 'butterfly', 'car', 'castle', 'cat', 'church', 'cloud', 'crown', 'cup', 'egg',
  'fish', 'flower', 'ghost', 'heart', 'house', 'key', 'kite', 'leaf', 'lemon', 'light bulb', 'moon', 'mushroom', 'pear', 'rocket', 'shield',
  'snowman', 'sun', 'teapot', 'tree', 'umbrella', 'boat'];
const r1 = (v) => Math.round(v * 10) / 10;
const regular = (n, r = 45, cx = 50, cy = 50, turn = 0) => Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + turn + (2 * Math.PI * i) / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
const ellipse = (rx, ry, n = 24) => Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / n; return [50 + rx * Math.cos(a), 50 + ry * Math.sin(a)]; });
// The geometry of the flat shapes of k.shapes that have a clear one, in the frame (clockwise from the top).
export const GEOMETRY = {
  circle: () => ellipse(45, 45),
  ring: () => ellipse(45, 45),
  oval: () => ellipse(45, 30),
  semicircle: () => [...Array.from({ length: 13 }, (_, i) => { const a = Math.PI + (Math.PI * i) / 12; return [50 + 45 * Math.cos(a), 72 + 45 * Math.sin(a)]; })],
  triangle: () => regular(3, 50, 50, 58),
  square: () => [[10, 10], [90, 10], [90, 90], [10, 90]],
  rectangle: () => [[5, 25], [95, 25], [95, 75], [5, 75]],
  diamond: () => [[50, 5], [80, 50], [50, 95], [20, 50]],
  rhombus: () => [[50, 5], [80, 50], [50, 95], [20, 50]],
  parallelogram: () => [[25, 25], [95, 25], [75, 75], [5, 75]],
  trapezium: () => [[30, 25], [70, 25], [95, 75], [5, 75]],
  pentagon: () => regular(5, 47, 50, 53),
  hexagon: () => regular(6, 45),
  octagon: () => regular(8, 45, 50, 50, Math.PI / 8),
  star: () => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (Math.PI * i) / 5, r = i % 2 ? 19 : 47; return [50 + r * Math.cos(a), 54 + r * Math.sin(a)]; }),
  cross: () => [[35, 5], [65, 5], [65, 35], [95, 35], [95, 65], [65, 65], [65, 95], [35, 95], [35, 65], [5, 65], [5, 35], [35, 35]],
  arrow: () => [[60, 15], [95, 50], [60, 85], [60, 65], [5, 65], [5, 35], [60, 35]],
};

const tok = (t) => (t.startsWith('"') ? JSON.parse(t) : t);
const attr = (line, k) => { const m = line.match(new RegExp(` ${k}=("[^"]*"|\\S+)`)); return m ? tok(m[1]) : undefined; };

// the k.shapes shapes that are flat (by name, from its shards)
function flatShapes() {
  const d = join(WORLDS_DIR, 'k.shapes', 'shards'), out = new Set();
  for (const f of readdirSync(d).filter((x) => x.endsWith('.sop'))) for (const line of readFileSync(join(d, f), 'utf8').split('\n')) if (line.includes(' k.shapes.shape name=') && / kind=flat( |$)/.test(line)) out.add(attr(line, 'name'));
  return out;
}

// the drawings of some names: { name, license, sources, parts: [{ shape, kind, pointing, x, y, w, h, points }] }
export function readDrawings(names) {
  const want = new Set(names), od = join(WORLDS_DIR, 'k.objects', 'shards'), out = new Map();
  for (const f of readdirSync(od).filter((x) => x.endsWith('.sop')).sort()) {
    const text = readFileSync(join(od, f), 'utf8');
    if (![...want].some((n) => text.includes(`k.objects.object name=${/\s/.test(n) ? JSON.stringify(n) : n}`))) continue;
    const license = (text.match(/^# license: (.*)$/m) ?? [])[1];
    const parts = new Map();
    for (const line of text.split('\n')) {
      if (line.includes(' k.objects.object name=')) { const n = attr(line, 'name'); if (want.has(n)) out.set(n, { name: n, license, sources: [...line.matchAll(/ core\.source=("[^"]*")/g)].map((m) => JSON.parse(m[1])), parts: [] }); }
      else if (line.includes(' k.objects.part of=')) { const of = attr(line, 'of'); if (want.has(of)) parts.set(line.slice(1, line.indexOf(' ')), { of, shape: attr(line, 'shape'), kind: attr(line, 'kind'), pointing: attr(line, 'pointing'), x: +attr(line, 'x'), y: +attr(line, 'y'), w: +attr(line, 'w'), h: +attr(line, 'h'), points: [] }); }
      else if (line.includes(' k.objects.point part=$')) { const p = parts.get(attr(line, 'part').slice(1)); if (p) p.points.push([+attr(line, 'n'), +attr(line, 'x'), +attr(line, 'y')]); }
    }
    for (const p of parts.values()) out.get(p.of)?.parts.push(p);
  }
  return out;
}

const N = 100;
const inPoly = (x, y, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
function triangle({ x, y, w, h, pointing = 'up' }) {
  if (pointing === 'down') return [[x, y], [x + w, y], [x + w / 2, y + h]];
  if (pointing === 'left') return [[x, y + h / 2], [x + w, y], [x + w, y + h]];
  if (pointing === 'right') return [[x, y], [x + w, y + h / 2], [x, y + h]];
  return [[x + w / 2, y], [x + w, y + h], [x, y + h]];
}
function raster(parts) {
  const g = new Uint8Array(N * N);
  for (const p of parts) {
    if (p.kind === 'detail' || p.shape === 'line' || p.shape === 'arc') continue;
    const pts = p.shape === 'polygon' ? [...p.points].sort((a, b) => a[0] - b[0]).map(([, x, y]) => [x, y]) : p.shape === 'triangle' ? triangle(p) : null;
    for (let j = Math.max(0, Math.floor(p.y)); j < Math.min(N, Math.ceil(p.y + p.h)); j++) for (let i = Math.max(0, Math.floor(p.x)); i < Math.min(N, Math.ceil(p.x + p.w)); i++) {
      const cx = i + 0.5, cy = j + 0.5;
      let inside;
      if (pts) inside = pts.length >= 3 && inPoly(cx, cy, pts);
      else if (p.shape === 'circle' || p.shape === 'oval') { const rx = p.w / 2, ry = p.h / 2; inside = ((cx - p.x - rx) / rx) ** 2 + ((cy - p.y - ry) / ry) ** 2 <= 1; }
      else inside = cx >= p.x && cx <= p.x + p.w && cy >= p.y && cy <= p.y + p.h;
      if (inside) g[j * N + i] = 1;
    }
  }
  return g;
}
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function largest(g) { // the largest 4-connected piece, its holes filled; its share of the filled cells; its area
  const lab = new Int32Array(N * N), sizes = [0]; let k = 0, total = 0;
  for (let s = 0; s < N * N; s++) {
    if (!g[s]) continue; total++; if (lab[s]) continue;
    k++; let n = 0; const st = [s]; lab[s] = k;
    while (st.length) { const c = st.pop(); n++; const x = c % N, y = (c / N) | 0; for (const [dx, dy] of NB) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= N || Y >= N) continue; const d = Y * N + X; if (g[d] && !lab[d]) { lab[d] = k; st.push(d); } } }
    sizes.push(n);
  }
  if (!k) return null;
  const best = sizes.indexOf(Math.max(...sizes.slice(1)));
  const out = new Uint8Array(N * N); for (let s = 0; s < N * N; s++) if (lab[s] === best) out[s] = 1;
  const outside = new Uint8Array(N * N), st = [];
  for (let i = 0; i < N; i++) for (const s of [i, (N - 1) * N + i, i * N, i * N + N - 1]) if (!out[s] && !outside[s]) { outside[s] = 1; st.push(s); }
  while (st.length) { const c = st.pop(); const x = c % N, y = (c / N) | 0; for (const [dx, dy] of NB) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= N || Y >= N) continue; const d = Y * N + X; if (!out[d] && !outside[d]) { outside[d] = 1; st.push(d); } } }
  let area = 0; for (let s = 0; s < N * N; s++) if (!outside[s]) { out[s] = 1; area++; }
  return { g: out, share: sizes[best] / total, area };
}
function trace(g) { // the edges of the cells, inside on the right, chained into loops; the longest (the outer edge)
  const at = (x, y) => x >= 0 && y >= 0 && x < N && y < N && g[y * N + x] === 1;
  const next = new Map(), add = (a, b) => next.set(`${a[0]},${a[1]}`, b);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (at(x, y)) {
    if (!at(x, y - 1)) add([x, y], [x + 1, y]);
    if (!at(x + 1, y)) add([x + 1, y], [x + 1, y + 1]);
    if (!at(x, y + 1)) add([x + 1, y + 1], [x, y + 1]);
    if (!at(x - 1, y)) add([x, y + 1], [x, y]);
  }
  const seen = new Set(); let best = [];
  for (const k of [...next.keys()].sort(byText)) {
    if (seen.has(k)) continue;
    const loop = []; let cur = k;
    while (cur && !seen.has(cur) && loop.length < 4 * N * N) { seen.add(cur); loop.push(cur.split(',').map(Number)); const n = next.get(cur); cur = n && `${n[0]},${n[1]}`; }
    if (loop.length > best.length) best = loop;
  }
  return best;
}
const dist = ([x, y], [x1, y1], [x2, y2]) => { const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy; if (!L) return Math.hypot(x - x1, y - y1); const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / L)); return Math.hypot(x - x1 - t * dx, y - y1 - t * dy); };
function rdp(pts, eps) { if (pts.length < 3) return pts; let i0 = 0, dm = 0; for (let i = 1; i < pts.length - 1; i++) { const d = dist(pts[i], pts[0], pts.at(-1)); if (d > dm) { dm = d; i0 = i; } } return dm > eps ? [...rdp(pts.slice(0, i0 + 1), eps).slice(0, -1), ...rdp(pts.slice(i0), eps)] : [pts[0], pts.at(-1)]; }
function simplifyLoop(loop, eps) {
  let far = 0, dm = 0; loop.forEach((p, i) => { const d = Math.hypot(p[0] - loop[0][0], p[1] - loop[0][1]); if (d > dm) { dm = d; far = i; } });
  return [...rdp(loop.slice(0, far + 1), eps).slice(0, -1), ...rdp([...loop.slice(far), loop[0]], eps).slice(0, -1)];
}
// clockwise in a frame with y down (positive shoelace sum), from the topmost point (then the leftmost)
export function normalise(pts) {
  const a = pts.reduce((s, [x, y], i) => { const [X, Y] = pts[(i + 1) % pts.length]; return s + (x * Y - X * y); }, 0);
  const cw = a > 0 ? pts : [...pts].reverse();
  let s = 0; cw.forEach((p, i) => { if (p[1] < cw[s][1] - 1e-9 || (Math.abs(p[1] - cw[s][1]) < 1e-9 && p[0] < cw[s][0])) s = i; });
  return [...cw.slice(s), ...cw.slice(0, s)].map(([x, y]) => [r1(x), r1(y)]);
}

export function traceOutline(d, { eps = 1.5, max = 40 } = {}) {
  const c = largest(raster(d.parts));
  if (!c) return { why: 'no filled part' };
  if (c.share < 0.9) return { why: `in several pieces (the largest holds ${Math.round(c.share * 100)} % of the drawing)` };
  if (c.area < 400) return { why: `too small (${c.area} of 10,000 cells)` };
  const loop = trace(c.g);
  let e = eps, pts = simplifyLoop(loop, e);
  while (pts.length > max && e < 6) { e += 0.5; pts = simplifyLoop(loop, e); }
  if (pts.length > max) return { why: `${pts.length} points at a tolerance of ${e}` };
  if (pts.length < 3) return { why: 'degenerate' };
  return { points: normalise(pts), tolerance: e };
}

// { license -> [{ name, from, drawing?, shape?, points, tolerance, sources }] }, and the drawings refused with the reason
export function outlines() {
  const flat = flatShapes(), byLicense = new Map(), refused = [];
  const put = (license, o) => { if (!byLicense.has(license)) byLicense.set(license, []); byLicense.get(license).push(o); };
  for (const [name, geo] of Object.entries(GEOMETRY)) if (flat.has(name)) put('CC0-1.0', { name, from: 'k.shapes.shape', shape: name, points: normalise(geo()), tolerance: 0, sources: [SRC] });
  const taken = new Set([...byLicense.values()].flat().map((o) => o.name));
  const ds = readDrawings(DRAWINGS.filter((n) => !taken.has(n)));
  for (const name of DRAWINGS.filter((n) => !taken.has(n)).sort(byText)) {
    const d = ds.get(name);
    if (!d) { refused.push([name, 'no drawing of that name']); continue; }
    const o = traceOutline(d);
    if (o.why) { refused.push([name, o.why]); continue; }
    put(d.license, { name, from: 'k.objects.object', drawing: name, points: o.points, tolerance: o.tolerance, sources: d.sources });
  }
  return { byLicense, refused };
}

const slug = (l) => l.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function outlineShards({ byLicense } = outlines()) {
  const files = {};
  for (const license of [...byLicense.keys()].sort(byText)) {
    const list = byLicense.get(license).sort((a, b) => byText(a.name, b.name));
    const sources = [...new Set(list.flatMap((o) => o.sources))].sort(byText);
    const lines = list.flatMap((o) => {
      const id = `k.layouts.outline.${seg(o.name)}`, src = o.sources[0], more = o.sources.slice(1).map((s) => ` core.source=${JSON.stringify(s)}`).join('');
      return [`# ${o.name}`, wire(id, 'k.layouts.outline', [['name', o.name], ['from', o.from], ['drawing', o.drawing], ['shape', o.shape], ['points', o.points.length], ['tolerance', o.tolerance]], src) + more,
        ...o.points.map(([x, y], i) => wire(`${id}.${i + 1}`, 'k.layouts.outline_point', [['outline', o.name], ['n', i + 1], ['x', x], ['y', y]], src) + more)];
    });
    const id = `${PREFIX}${slug(license)}`;
    files[`${id}.sop`] = `${header({ id: `k.layouts/shards/${id}`, about: `${list.length} outlines as arrangement paths (block 09:50 item F): ${list.map((o) => o.name).join(', ')}; each an ordered closed path of points in the 0 to 100 frame, clockwise from the topmost point, ${license === 'CC0-1.0' ? 'the shapes of k.shapes by their geometry and the hand-written drawings traced' : 'traced from the drawings of k.objects under this licence'}. Derived by tools/outlines-core.mjs.`,
      sources: sources.map((s) => `${s} (${s === SRC ? 'the geometry of the shapes, and the drawings it traces' : 'the drawings traced'})`), license, script: 'tools/outlines-core.mjs' })}\n${lines.join('\n')}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const o = outlines(), files = outlineShards(o);
  for (const old of readdirSync(DIR)) if (old.startsWith(PREFIX) && old.endsWith('.sop')) rmSync(join(DIR, old));
  for (const [n, t] of Object.entries(files)) { writeFileSync(join(DIR, n), t); console.log(n, t.split('\n').filter((l) => l.startsWith('@')).length, 'wires', Buffer.byteLength(t), 'bytes'); }
  for (const [n, why] of o.refused) console.log(`no outline: ${n}: ${why}`);
}
