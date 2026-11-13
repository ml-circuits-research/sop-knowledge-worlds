// Draws k.faces faces from the world's facts alone, with the part renderer of k.objects (tools/render-svg.mjs).
//   node tools/render-faces.mjs [out-dir]   writes to docs/worlds/k.faces/preview/ (or out-dir): every variant alone
//                                           (variant-<style>-<slot>-<name>.svg), every preset (preset-<name>.svg),
//                                           the expressions on one preset (expression-<name>.svg), 40 seeded random
//                                           faces of the style `plain` (random-NN.svg), 12 of every other style
//                                           (random-<style>-NN.svg), index.html and faces.json
//                                           (the list docs/gallery.html shows)
// A face is: one variant for some slots of one style, and four colours. The parts of the variants are drawn slot by
// slot in the draw order of the slots; a slot with mirror=true is drawn twice, the second time mirrored at x = 50.
import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fullWorld, scanWorlds, readHeader, WORLDS_DIR } from './lib/worlds.mjs';
import { renderPart, fileOf } from './render-svg.mjs';

const tok = (t) => (t !== undefined && t.startsWith('"') ? JSON.parse(t) : t);
const one = (wire, key) => tok(wire.attrs[key]?.[0]);
const many = (wire, key) => (wire.attrs[key] ?? []).map(tok);
const num = (wire, key) => Number(one(wire, key));
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const f = (n) => String(Math.round(n * 100) / 100);
export const FEATURES = ['shape', 'size', 'length', 'feel', 'age', 'kind'];
export const COLOUR_KEYS = { skin: 'skin', hair_colour: 'hair', eye_colour: 'eyes', clothes: 'clothes' };
export const DEFAULT_COLOURS = { skin: 'light', hair: 'brown', eyes: 'blue', clothes: 'blue' };

const indexes = new WeakMap();
export function indexOf(world) {
  if (indexes.has(world)) return indexes.get(world);
  const points = new Map();
  for (const p of world.ofType('k.faces.point')) {
    const id = p.attrs.part[0].slice(1);
    if (!points.has(id)) points.set(id, []);
    points.get(id).push({ n: num(p, 'n'), x: num(p, 'x'), y: num(p, 'y') });
  }
  const parts = new Map(); // "slot\tvariant name" -> parts in draw order
  world.ofType('k.faces.part').forEach((p, i) => {
    const key = `${one(p, 'slot')}\t${one(p, 'of')}`;
    if (!parts.has(key)) parts.set(key, []);
    parts.get(key).push({ id: p.id, name: one(p, 'name'), kind: one(p, 'kind'), shape: one(p, 'shape'), x: num(p, 'x'), y: num(p, 'y'), w: num(p, 'w'), h: num(p, 'h'), z: num(p, 'z'),
      colourName: one(p, 'colour'), rgb: one(p, 'rgb'), tint: one(p, 'tint'), pointing: one(p, 'pointing') ?? 'up', opens: one(p, 'opens') ?? 'up',
      points: (points.get(p.id) ?? []).sort((a, b) => a.n - b.n), order: i });
  });
  for (const list of parts.values()) list.sort((a, b) => a.z - b.z || a.order - b.order);
  const slots = new Map(); // style -> slots in draw order
  for (const s of world.ofType('k.faces.slot')) {
    const style = one(s, 'style');
    if (!slots.has(style)) slots.set(style, []);
    slots.get(style).push({ style, name: one(s, 'name'), x: num(s, 'x'), y: num(s, 'y'), w: num(s, 'w'), h: num(s, 'h'), z: num(s, 'z'), mirror: one(s, 'mirror') === 'true', optional: one(s, 'optional') === 'true' });
  }
  for (const list of slots.values()) list.sort((a, b) => a.z - b.z || (a.name < b.name ? -1 : 1));
  const variants = world.ofType('k.faces.variant').map((v) => ({ id: v.id, slot: one(v, 'slot'), name: one(v, 'name'), style: one(v, 'style'), source: one(v, 'core.source'), named: one(v, 'named'),
    features: Object.fromEntries(FEATURES.map((k) => [k, many(v, k)]).filter(([, vs]) => vs.length)) }));
  const colours = new Map(world.ofType('k.faces.colour').map((c) => [`${one(c, 'of')}\t${one(c, 'name')}`, { of: one(c, 'of'), name: one(c, 'name'), rgb: one(c, 'rgb'), shade: one(c, 'shade'), natural: one(c, 'natural') === 'true' }]));
  const presets = world.ofType('k.faces.preset').map((p) => ({ name: one(p, 'name'), style: one(p, 'style'), attrs: p.attrs }));
  const expressions = world.ofType('k.faces.expression').map((e) => ({ name: one(e, 'name'), style: one(e, 'style'), attrs: e.attrs }));
  const idx = { parts, slots, variants, colours, presets, expressions };
  indexes.set(world, idx);
  return idx;
}

// The part mirrored at x = 50.
export function mirrored(p) {
  const swap = { left: 'right', right: 'left', up: 'up', down: 'down' };
  return { ...p, name: `${p.name} (mirrored)`, x: 100 - p.x - p.w, pointing: swap[p.pointing], opens: swap[p.opens], points: p.points.map((q) => ({ ...q, x: 100 - q.x })) };
}

// The colour a part is drawn with: the face colour its tint names, else its own.
function coloured(idx, p, colours) {
  let colour = p.rgb ?? p.colourName;
  if (p.tint) {
    const [of, shade] = p.tint.endsWith('_shade') ? [p.tint.slice(0, -6), true] : [p.tint, false];
    const c = idx.colours.get(`${of}\t${colours[of]}`);
    if (!c) throw new Error(`no ${of} colour ${colours[of]}`);
    colour = shade ? c.shade : c.rgb;
  }
  return { ...p, colour, exact: false };
}

// face: { style, pick: { slot: variant name }, colours: { skin, hair, eyes, clothes }, oneEye: variant name }
// -> the parts to draw, in order.
export function composeFace(world, { style, pick, colours = DEFAULT_COLOURS, oneEye }) {
  const idx = indexOf(world);
  const out = [];
  for (const slot of idx.slots.get(style) ?? []) {
    const name = pick[slot.name];
    if (name === undefined) continue;
    const parts = idx.parts.get(`${slot.name}\t${name}`);
    if (!parts) throw new Error(`${style}: no variant ${name} of ${slot.name}`);
    for (const p of parts) out.push(coloured(idx, p, colours));
    if (slot.mirror) {
      const other = slot.name === 'eyes' && oneEye ? idx.parts.get(`eyes\t${oneEye}`) : parts;
      if (!other) throw new Error(`${style}: no variant ${oneEye} of eyes`);
      for (const p of other) out.push(mirrored(coloured(idx, p, colours)));
    }
  }
  return out;
}

const svg = (title, body, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">\n  <title>${esc(title)}</title>\n  <rect width="100" height="100" fill="#fafafa"/>\n${extra}${body}\n</svg>\n`;
export const renderFace = (world, face, title = 'face') => svg(title, composeFace(world, face).map((p) => `  ${renderPart(p)}`).join('\n'));

// A preset as a face; an expression switches some of its variants.
export function presetFace(world, name, expression) {
  const idx = indexOf(world);
  const p = idx.presets.find((x) => x.name === name);
  if (!p) throw new Error(`no preset ${name}`);
  const pick = {};
  for (const slot of idx.slots.get(p.style)) if (p.attrs[slot.name]) pick[slot.name] = tok(p.attrs[slot.name][0]);
  const colours = Object.fromEntries(Object.entries(COLOUR_KEYS).map(([key, of]) => [of, tok(p.attrs[key][0])]));
  const face = { style: p.style, pick, colours };
  if (expression) {
    const e = idx.expressions.find((x) => x.name === expression && x.style === p.style);
    if (!e) throw new Error(`no expression ${expression}`);
    for (const key of ['mouth', 'eyebrows', 'eyes']) if (e.attrs[key]) face.pick[key] = tok(e.attrs[key][0]);
    if (e.attrs.one_eye) face.oneEye = tok(e.attrs.one_eye[0]);
  }
  return face;
}

// One variant alone, in the frame of the face, with the box of its slot dashed.
export function renderVariant(world, v) {
  const idx = indexOf(world);
  const slot = idx.slots.get(v.style).find((s) => s.name === v.slot);
  const box = (s, x) => `  <rect x="${f(x)}" y="${f(s.y)}" width="${f(s.w)}" height="${f(s.h)}" fill="none" stroke="#999" stroke-width="0.4" stroke-dasharray="1.5 1.5"/>\n`;
  const parts = composeFace(world, { style: v.style, pick: { [v.slot]: v.name } });
  return svg(`${v.slot}: ${v.name}`, parts.map((p) => `  ${renderPart(p)}`).join('\n'), box(slot, slot.x) + (slot.mirror ? box(slot, 100 - slot.x - slot.w) : ''));
}

// Seeded random faces (mulberry32): one variant for every slot that is not optional, each optional slot with a
// chance, natural colours.
export function randomFace(world, seed, style = 'plain') {
  const idx = indexOf(world);
  let a = seed >>> 0;
  const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const choose = (list) => list[Math.floor(rnd() * list.length)];
  const chance = { hair_front: 0.85, hair_back: 0.45, cheeks: 0.35, beard: 0.25, moustache: 0.2, glasses: 0.3, hat: 0.2, earrings: 0.25 };
  const pick = {};
  for (const slot of idx.slots.get(style)) {
    const vs = idx.variants.filter((v) => v.style === style && v.slot === slot.name);
    if (!vs.length) continue;
    if (slot.optional && rnd() >= (chance[slot.name] ?? 0.3)) continue;
    pick[slot.name] = choose(vs).name;
  }
  const natural = (of) => [...idx.colours.values()].filter((c) => c.of === of && c.natural).map((c) => c.name);
  const colours = { skin: choose(natural('skin')), hair: choose(natural('hair')), eyes: choose(natural('eyes')), clothes: choose([...idx.colours.values()].filter((c) => c.of === 'clothes').map((c) => c.name)) };
  return { style, pick, colours };
}

export const RANDOM_FACES = 40;
export const RANDOM_FACES_OTHER = 12; // of every other style
export const EXPRESSION_PRESET = 'woman';
export const variantFile = (v) => `variant-${fileOf(v.style)}-${fileOf(v.slot)}-${fileOf(v.name)}.svg`;

export function renderAll(world) {
  const idx = indexOf(world);
  const files = {};
  const variants = [...idx.variants].sort((a, b) => (a.style + a.slot + a.name < b.style + b.slot + b.name ? -1 : 1));
  for (const v of variants) files[variantFile(v)] = renderVariant(world, v);
  for (const p of idx.presets) files[`preset-${fileOf(p.name)}.svg`] = renderFace(world, presetFace(world, p.name), p.name);
  for (const e of idx.expressions) files[`expression-${fileOf(e.name)}.svg`] = renderFace(world, presetFace(world, EXPRESSION_PRESET, e.name), `${EXPRESSION_PRESET}, ${e.name}`);
  const randoms = [];
  for (let i = 1; i <= RANDOM_FACES; i++) {
    const face = randomFace(world, i);
    const name = `random-${String(i).padStart(2, '0')}.svg`;
    files[name] = renderFace(world, face, `random face ${i}`);
    randoms.push({ file: name, seed: i, ...face });
  }
  const styles = [...new Set(variants.map((v) => v.style))];
  const others = styles.filter((s) => s !== 'plain');
  const otherRandoms = [];
  for (const style of others) for (let i = 1; i <= RANDOM_FACES_OTHER; i++) {
    const name = `random-${fileOf(style)}-${String(i).padStart(2, '0')}.svg`;
    files[name] = renderFace(world, randomFace(world, i, style), `random face ${i} of the style ${style}`);
    otherRandoms.push({ file: name, seed: i, style });
  }
  const fig = (file, caption, size = 160) => `<figure><img src="${file}" alt="${esc(caption)}" width="${size}" height="${size}" loading="lazy"><figcaption>${esc(caption)}</figcaption></figure>`;
  const sections = styles.map((style) => `<h2>Variants of the style ${esc(style)}</h2>\n${variants.filter((v) => v.style === style).map((v) => fig(variantFile(v), `${v.slot}: ${v.name}`, 120)).join('\n')}`).join('\n');
  files['index.html'] = `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="utf-8"><title>k.faces previews</title>\n<style>body{font:14px system-ui,sans-serif;margin:2rem}figure{display:inline-block;margin:.5rem;text-align:center;vertical-align:top}img{border:1px solid #ddd}</style></head>\n<body>\n<h1>k.faces previews</h1>\n<p>Drawn by tools/render-faces.mjs from the facts alone. ${variants.length} variants, ${idx.presets.length} presets.</p>\n`
    + `<h2>Presets</h2>\n${idx.presets.map((p) => fig(`preset-${fileOf(p.name)}.svg`, p.name)).join('\n')}\n<h2>Expressions (on the preset ${esc(EXPRESSION_PRESET)})</h2>\n${idx.expressions.map((e) => fig(`expression-${fileOf(e.name)}.svg`, e.name)).join('\n')}\n`
    + `<h2>${RANDOM_FACES} random faces (seeds 1 to ${RANDOM_FACES})</h2>\n${randoms.map((r) => fig(r.file, `seed ${r.seed}`)).join('\n')}\n${others.map((style) => `<h2>${RANDOM_FACES_OTHER} random faces of the style ${esc(style)}</h2>\n${otherRandoms.filter((r) => r.style === style).map((r) => fig(r.file, `seed ${r.seed}`)).join('\n')}`).join('\n')}\n${sections}\n</body>\n</html>\n`;
  // The licence of a style: that of its shards.
  const licence = new Map();
  for (const shard of scanWorlds().find((w) => w.id === 'k.faces')?.shards ?? []) {
    const m = / k\.faces\.variant slot=\S+ name=(?:"[^"]*"|\S+) style=("[^"]*"|\S+)/.exec(shard.text);
    if (m) licence.set(tok(m[1]), readHeader(shard.text).license?.[0] ?? '');
  }
  const list = {
    variants: variants.map((v) => ({ style: v.style, slot: v.slot, name: v.name, file: variantFile(v), source: v.source, license: licence.get(v.style) ?? '', ...(v.named ? { named: v.named } : {}), features: v.features })),
    presets: idx.presets.map((p) => ({ name: p.name, style: p.style, file: `preset-${fileOf(p.name)}.svg` })),
    expressions: idx.expressions.map((e) => ({ name: e.name, style: e.style, file: `expression-${fileOf(e.name)}.svg` })),
    random: [...randoms.map((r) => ({ file: r.file, seed: r.seed, style: 'plain' })), ...otherRandoms],
  };
  files['faces.json'] = `${JSON.stringify(list, null, 1)}\n`;
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const world = fullWorld('k.faces');
  const out = process.argv[2] ?? join(WORLDS_DIR, 'k.faces', 'preview');
  mkdirSync(out, { recursive: true });
  for (const old of readdirSync(out)) rmSync(join(out, old));
  const files = renderAll(world);
  for (const [name, text] of Object.entries(files)) writeFileSync(join(out, name), text);
  console.log(`${Object.keys(files).length} files written to ${out}`);
}

// R6.4. The variants of a slot whose features match a description, best first: `wanted` is { key: value or values }
// over the feature keys (shape, size, length, feel, age, kind). Each wanted value is one sopworld query; a variant
// is ranked by how many of them it answers (ties by name). Variants that match nothing are left out.
export function findVariants(world, slot, wanted, style = 'plain') {
  const hits = new Map();
  for (const [key, values] of Object.entries(wanted)) for (const value of [].concat(values)) {
    const a = world.query({ type: 'k.faces.variant', where: { slot, style, [key]: /^[^\s"]+$/.test(value) ? value : JSON.stringify(value) }, seek: 'name', mode: 'list' });
    for (const name of a.values ?? []) { const n = tok(name); hits.set(n, [...(hits.get(n) ?? []), `${key}=${value}`]); }
  }
  return [...hits].map(([name, matched]) => ({ name, matched })).sort((a, b) => b.matched.length - a.matched.length || (a.name < b.name ? -1 : 1));
}

// What differs between two presets: the keys (slots and colours) where they do not have the same value.
export function presetDifference(world, a, b) {
  const idx = indexOf(world);
  const [pa, pb] = [a, b].map((n) => { const p = idx.presets.find((x) => x.name === n); if (!p) throw new Error(`no preset ${n}`); return p; });
  const keys = [...new Set([...Object.keys(pa.attrs), ...Object.keys(pb.attrs)])].filter((k) => k !== 'name' && k !== 'core.source').sort();
  return keys.map((key) => ({ key, [a]: tok(pa.attrs[key]?.[0]) ?? null, [b]: tok(pb.attrs[key]?.[0]) ?? null })).filter((d) => d[a] !== d[b]);
}
