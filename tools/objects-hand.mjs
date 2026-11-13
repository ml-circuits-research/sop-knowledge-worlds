// Hand-written drawings of k.objects, Round 11 item 3: animals whose name is drawn as another thing (crane, kiwi,
// tuna) and more of the common things that had no drawing, chosen by frequency (k.objects/MISSING.md).
//   node tools/objects-hand.mjs        writes the shards named in SHARDS (and only those)
// Each part is one line of the tables below:  <name> <shape> <geometry> | <z> <colours> [key=value ...]
// geometry: "x y w h" for rectangle, square, circle, oval, triangle and arc; "x,y x,y ..." (points) for line and
// polygon, whose box is the bounds of the points. Keys: kind, pointing, opens, above, below, inside, left_of,
// right_of, on, centered. The output is SOP Lang in the format of the other hand-written shards.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg } from './import/lib.mjs';
import { objectsData } from './objects-hand-data.mjs';

const SRC = 'hand-core 1';
const COLOURS = ['black', 'white', 'grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown'];
const BOX = ['rectangle', 'square', 'circle', 'oval', 'triangle', 'arc'], PTS = ['line', 'polygon'];
const KEYS = ['kind', 'pointing', 'opens', 'above', 'below', 'inside', 'left_of', 'right_of', 'on', 'centered'];
const num = (s, where) => { const n = Number(s); if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error(`${where}: ${s} is not a number from 0 to 100`); return n; };
const r1 = (n) => Math.round(n * 10) / 10;

export function parseObject(name, spec) {
  const parts = [];
  for (const raw of spec.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const where = `${name}: ${raw}`;
    const [left, right] = raw.split('|').map((x) => x.trim());
    if (right === undefined) throw new Error(`${where}: no "|"`);
    const [pname, shape, ...geom] = left.split(/\s+/);
    const p = { name: pname, shape, extra: [], colours: [], points: [] };
    if (BOX.includes(shape)) {
      if (geom.length !== 4) throw new Error(`${where}: a box is x y w h`);
      [p.x, p.y, p.w, p.h] = geom.map((g) => num(g, where));
      if ((shape === 'circle' || shape === 'square') && p.w !== p.h) throw new Error(`${where}: a ${shape} has w = h`);
    } else if (PTS.includes(shape)) {
      p.points = geom.map((g) => g.split(',').map((v) => num(v, where)));
      if (p.points.length < 2 || p.points.some((q) => q.length !== 2)) throw new Error(`${where}: points are x,y`);
      const xs = p.points.map((q) => q[0]), ys = p.points.map((q) => q[1]);
      p.x = Math.min(...xs); p.y = Math.min(...ys); p.w = r1(Math.max(...xs) - p.x); p.h = r1(Math.max(...ys) - p.y);
    } else throw new Error(`${where}: shape ${shape}`);
    if (p.x + p.w > 100.001 || p.y + p.h > 100.001) throw new Error(`${where}: the box leaves the frame`);
    const [z, ...rest] = right.split(/\s+/);
    if (!/^\d+$/.test(z)) throw new Error(`${where}: z first`);
    p.z = Number(z);
    for (const t of rest) {
      if (COLOURS.includes(t)) p.colours.push(t);
      else if (/^[a-z_]+=/.test(t)) { const [k, v] = t.split('='); if (!KEYS.includes(k)) throw new Error(`${where}: key ${k}`); p.extra.push([k, v]); }
      else throw new Error(`${where}: ${t}`);
    }
    if (!p.colours.length) throw new Error(`${where}: no colour`);
    if (p.extra.some(([k]) => k === 'pointing') && shape !== 'triangle') throw new Error(`${where}: pointing is for a triangle`);
    if (p.extra.some(([k]) => k === 'opens') && shape !== 'arc') throw new Error(`${where}: opens is for an arc`);
    parts.push(p);
  }
  const names = new Set(parts.map((p) => p.name));
  if (names.size !== parts.length) throw new Error(`${name}: a part name twice`);
  for (const p of parts) for (const [k, v] of p.extra) if (['above', 'below', 'inside', 'left_of', 'right_of', 'on'].includes(k) && !names.has(v)) throw new Error(`${name}.${p.name}: ${k}=${v} is no part`);
  return parts;
}

export function objectWires(name, spec, words = []) {
  const id = `k.objects.${seg(name)}`;
  const parts = parseObject(name, spec);
  const lines = [`# ${name}`, wire(id, 'k.objects.object', [['name', name]], SRC)];
  for (const p of parts) lines.push(wire(`${id}.${p.name}`, 'k.objects.part', [['of', name], ['name', p.name], ...p.extra.filter(([k]) => k === 'kind'), ['shape', p.shape], ['x', p.x], ['y', p.y], ['w', p.w], ['h', p.h], ['z', p.z], ...p.colours.map((c) => ['colour', c]), ...p.extra.filter(([k]) => k !== 'kind')], SRC));
  for (const p of parts) p.points.forEach(([x, y], i) => lines.push(`@${id}.${p.name}.p${i + 1} k.objects.point part=$${id}.${p.name} n=${i + 1} x=${x} y=${y} core.source="${SRC}"`));
  const word = words.length ? wire(`k.objects.word.${seg(name)}`, 'core.word', [...words.map((w) => ['text', w]), ['means', name], ['of', 'k.objects.object.name']], SRC) : null;
  return { lines, word, parts: parts.length };
}

export function handShards(data = objectsData) {
  const files = {};
  for (const [shard, objects] of Object.entries(data)) {
    const body = [], words = [];
    for (const [name, words_, spec] of objects) { const o = objectWires(name, spec, words_); body.push(...o.lines, ''); if (o.word) words.push(o.word); }
    files[`${shard}.sop`] = `${header({ id: `k.objects/shards/${shard}`, about: `${objects.map((o) => o[0]).join(', ')}. Parts with a primitive shape, a box in the 0 to 100 frame of the object (x right, y down), a draw order z and typical colours; points for lines and polygons.`,
      sources: ['hand-core 1 (hand-written in this repository: tools/objects-hand-data.mjs)'], license: 'CC0-1.0', script: 'tools/objects-hand.mjs' })}\n${body.join('\n')}# Words: plural forms and other names.\n${words.join('\n')}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = handShards();
  for (const [f, t] of Object.entries(files)) writeFileSync(join(WORLDS_DIR, 'k.objects', 'shards', f), t);
  console.log(Object.entries(files).map(([f, t]) => `${f}: ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`).join('\n'));
}
