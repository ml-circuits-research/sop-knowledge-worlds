// DiceBear avatar styles (the JSON definitions of github.com/dicebear/styles) -> k.faces shards: the slots of each
// style, its variants and their parts. Only styles under CC0 or CC BY are read (STYLES below; the licence of each is
// in the `meta` block of its definition and is checked here). Deterministic.
//   node tools/import/dicebear.mjs [--raw sources/dicebear/raw/styles] [--features sources/dicebear/features.tsv]
//                                  [--out docs/worlds/k.faces/shards]
// How to fetch: sources/dicebear/SOURCE.md.
// A definition is a canvas (width, height, elements) and components; a component has variants, a variant has SVG
// elements; an element of type "component" places another component (with a transform). Here:
//   - every component becomes a slot of the style (named with the slot names of the hand-written core where the
//     component is that place of a face: brows -> eyebrows, facialHair -> beard, clothes -> shoulders, hair ->
//     hair_front, ...), drawn in the order in which the definition draws it;
//   - every variant becomes a k.faces.variant named "<style> <variant>"; its elements are put where the definition
//     places the component, converted by tools/import/svg-parts.mjs (curves to polygons, a point budget) to the 0 to
//     100 frame of the face, and written as k.faces.part and k.faces.point wires;
//   - a fill or stroke that the definition takes from a colour list (skin, hair, clothing) becomes `tint` (skin,
//     hair, clothes) with the first colour of that list as `rgb`; any other colour of a list becomes its first colour;
//   - elements drawn on the canvas itself (a head that is not a component) become the slot `head` (or `base`) with
//     one variant;
//   - the converter drops holes, masks and clips, so a shape drawn with a hole or a mask for the face would be
//     painted over the face: a variant with a filled part that holds the middle of the head and whose box is more
//     than 60% of the frame is left out and counted (`covering`), except in the slots head, base and hair_back;
//   - the box of a slot is the bounds of the parts of its variants; a component with a `probability` is optional;
//   - the features (shape, size, length, feel, age, kind) come from sources/dicebear/features.tsv, written by a
//     language model that looked at the previews (named=model); `hairLength` tags of the definition give `length`.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svgToParts, colourName } from './svg-parts.mjs';
import { wire, header, seg, writeShards, splitParts } from './lib.mjs';

export const VERSION = '67f54a0';
export const SOURCE = `dicebear-styles ${VERSION}`;
// The styles read, with the licence the import expects (the import stops if the definition says otherwise).
export const STYLES = {
  cutouts: 'CC0 1.0', 'pixel-art': 'CC0 1.0', miniavs: 'CC BY 4.0', personas: 'CC BY 4.0', micah: 'CC BY 4.0', 'toon-head': 'CC BY 4.0', 'big-smile': 'CC BY 4.0',
};
const SPDX = { 'CC0 1.0': 'CC0-1.0', 'CC BY 4.0': 'CC-BY-4.0' };
const SLOT_NAMES = { brows: 'eyebrows', eyebrows: 'eyebrows', cheeks: 'cheeks', blush: 'cheeks', freckles: 'cheeks', eyes: 'eyes', hair: 'hair_front', rearHair: 'hair_back', head: 'head', mouth: 'mouth', nose: 'nose',
  beard: 'beard', facialHair: 'beard', mustache: 'moustache', glasses: 'glasses', hat: 'hat', earrings: 'earrings', ears: 'ears', clothes: 'shoulders', body: 'shoulders' };
const TINTS = { skin: 'skin', base: 'skin', paperFace: 'skin', hair: 'hair', paperHair: 'hair', facialHair: 'hair', clothing: 'clothes', clothes: 'clothes', shirt: 'clothes', body: 'clothes' };
const snake = (t) => t.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
const words = (t) => t.replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/([0-9])([A-Za-z])/g, '$1 $2').toLowerCase();
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const marker = (i) => `#${(i + 1).toString(16).padStart(2, '0')}fd03`;

// features.tsv: style, slot, variant, then key=value columns (feel and age may repeat).
export function readFeatures(text) {
  const out = new Map();
  for (const line of text.split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [style, slot, variant, ...pairs] = line.split('\t').map((x) => x.trim());
    out.set(`${style}\t${slot}\t${variant}`, pairs.filter(Boolean).map((p) => { const i = p.indexOf('='); return [p.slice(0, i), p.slice(i + 1)]; }));
  }
  return out;
}

// One style definition -> { slots, variants: [{ slot, name, parts, tags }], stats }.
export function convertStyle(style, def, { convert = {} } = {}) {
  const roles = Object.keys(def.colors ?? {});
  const paint = (v) => (v && typeof v === 'object' ? (v.type === 'color' ? marker(roles.indexOf(v.name)) : 'none') : String(v));
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  // An element as SVG text, without the components it places; `use` is replaced by the element it refers to.
  const ids = new Map();
  const collect = (els) => { for (const e of els ?? []) { if (e.attributes?.id) ids.set(e.attributes.id, e); collect(e.children); } };
  const serial = (e, depth = 0) => {
    if (e.type === 'component' || depth > 8) return '';
    const attrs = { ...(e.attributes ?? {}) };
    if (e.name === 'use') {
      const target = ids.get(String(attrs.href ?? attrs['xlink:href'] ?? '').replace(/^#/, ''));
      if (!target) return '';
      delete attrs.href; delete attrs['xlink:href']; delete attrs['clip-path'];
      return `<g ${Object.entries(attrs).map(([k, v]) => `${k}="${esc(paint(v))}"`).join(' ')}>${serial({ ...target, attributes: { ...target.attributes, id: undefined } }, depth + 1)}</g>`;
    }
    delete attrs['clip-path']; delete attrs.mask; delete attrs.filter;
    const text = Object.entries(attrs).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}="${esc(k === 'fill' || k === 'stroke' ? paint(v) : v)}"`).join(' ');
    return `<${e.name} ${text}>${(e.children ?? []).map((c) => serial(c, depth + 1)).join('')}</${e.name}>`;
  };
  // Where the definition places each component (the chain of transforms down to it), in drawing order.
  const placed = new Map();
  const base = [];
  const walk = (els, chain, top) => {
    for (const e of els ?? []) {
      const t = e.attributes?.transform ? [...chain, e.attributes.transform] : chain;
      if (e.type === 'component') {
        if (placed.has(e.name) || !def.components[e.name]) continue;
        placed.set(e.name, t);
        for (const v of Object.values(def.components[e.name].variants)) walk(v.elements, t, false);
      } else if (top && e.name !== 'defs' && !JSON.stringify(e).includes('"type":"component"')) base.push({ order: placed.size, text: serial(e), chain });
      else if (e.children) walk(e.children, t, top);
    }
  };
  collect(def.canvas.elements);
  walk(def.canvas.elements, [], true);
  const rootAttrs = Object.entries(def.attributes ?? {}).filter(([k]) => k === 'fill' || k === 'stroke').map(([k, v]) => `${k}="${esc(paint(v))}"`).join(' ');
  const svgOf = (chain, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${def.canvas.width} ${def.canvas.height}" ${rootAttrs}>${chain.map((t) => `<g transform="${esc(t)}">`).join('')}${body}${chain.map(() => '</g>').join('')}</svg>`;
  const partsOf = (svg) => svgToParts(svg, { maxParts: 14, maxPoints: 32, budget: 150, ...convert }).map((p) => {
    const i = roles.findIndex((_, k) => marker(k) === p.rgb.toLowerCase());
    if (i < 0) return { ...p, rgb: p.rgb.toUpperCase() };
    const value = def.colors[roles[i]].values?.[0] ?? '#000000';
    const rgb = /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : '#000000';
    return { ...p, rgb, colour: colourName(hexToRgb(rgb)), tint: TINTS[roles[i]] };
  });
  const used = new Set();
  const slotName = (component) => { let n = SLOT_NAMES[component] ?? snake(component); if (used.has(n)) n = snake(component); if (used.has(n)) n = `${n}_2`; used.add(n); return n; };
  const slots = [], variants = [];
  const stats = { components: 0, variants: 0, empty: 0, covering: 0, parts: 0, points: 0 };
  const order = [...placed.keys()];
  const baseAt = (i) => base.filter((b) => b.order === i);
  const addBase = (i) => {
    const pieces = baseAt(i);
    if (!pieces.length) return;
    const parts = partsOf(svgOf([], pieces.map((b) => `${b.chain.map((t) => `<g transform="${esc(t)}">`).join('')}${b.text}${b.chain.map(() => '</g>').join('')}`).join('')));
    if (!parts.length) return;
    const name = slotName(def.components.head ? 'base' : 'head');
    slots.push({ name, optional: false });
    variants.push({ slot: name, name: `${style} base`, variant: 'base', parts, tags: [] });
  };
  for (let i = 0; i <= order.length; i++) {
    addBase(i);
    if (i === order.length) break;
    const component = order[i], c = def.components[component];
    const name = slotName(component);
    stats.components++;
    let any = false;
    for (const [vname, v] of Object.entries(c.variants)) {
      ids.clear(); collect(v.elements);
      const parts = partsOf(svgOf(placed.get(component), v.elements.map((e) => serial(e)).join('')));
      if (!parts.length) { stats.empty++; continue; }
      any = true;
      variants.push({ slot: name, name: `${style} ${words(vname)}`, variant: vname, parts, tags: v.tags ?? [] });
    }
    if (any) slots.push({ name, optional: c.probability !== undefined && c.probability < 100 });
  }
  // Shapes that would cover the face (their hole or mask was dropped) are left out.
  const headSlot = variants.filter((v) => v.slot === 'head').flatMap((v) => v.parts);
  if (headSlot.length) {
    const cx = (Math.min(...headSlot.map((p) => p.x)) + Math.max(...headSlot.map((p) => p.x + p.w))) / 2, cy = (Math.min(...headSlot.map((p) => p.y)) + Math.max(...headSlot.map((p) => p.y + p.h))) / 2;
    const holds = (p) => {
      if (p.shape !== 'polygon') return p.shape !== 'line' && p.shape !== 'arc' && cx > p.x && cx < p.x + p.w && cy > p.y && cy < p.y + p.h;
      let inside = false;
      for (let i = 0, j = p.points.length - 1; i < p.points.length; j = i++) {
        const [xi, yi] = p.points[i], [xj, yj] = p.points[j];
        if ((yi > cy) !== (yj > cy) && cx < ((xj - xi) * (cy - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    };
    for (let i = variants.length - 1; i >= 0; i--) if (!['head', 'base', 'hair_back'].includes(variants[i].slot) && variants[i].parts.some((p) => p.w * p.h >= 6000 && holds(p))) { variants.splice(i, 1); stats.covering++; }
  }
  for (let i = slots.length - 1; i >= 0; i--) if (!variants.some((v) => v.slot === slots[i].name)) slots.splice(i, 1);
  // The box of a slot: the bounds of the parts of its variants. The draw order: the order above.
  slots.forEach((s, z) => {
    const ps = variants.filter((v) => v.slot === s.name).flatMap((v) => v.parts);
    const x0 = Math.floor(Math.min(...ps.map((p) => p.x))), y0 = Math.floor(Math.min(...ps.map((p) => p.y)));
    const x1 = Math.ceil(Math.max(...ps.map((p) => p.x + p.w))), y1 = Math.ceil(Math.max(...ps.map((p) => p.y + p.h)));
    Object.assign(s, { x: x0, y: y0, w: Math.min(100, x1) - x0, h: Math.min(100, y1) - y0, z });
  });
  stats.variants = variants.length;
  stats.parts = variants.reduce((n, v) => n + v.parts.length, 0);
  stats.points = variants.reduce((n, v) => n + v.parts.reduce((m, p) => m + (p.points?.length ?? 0), 0), 0);
  return { slots, variants, stats };
}

// definitions: { style: parsed JSON }; features: the text of features.tsv.
export function importDicebear({ definitions, features = '', styles = Object.keys(STYLES) }) {
  const feats = readFeatures(features);
  const files = {}, stats = {};
  for (const style of styles) {
    const def = definitions[style];
    if (!def) continue;
    const license = def.meta?.license?.name;
    if (license !== STYLES[style] || !SPDX[license]) throw new Error(`${style}: the definition says "${license}", expected "${STYLES[style]}"`);
    const { slots, variants, stats: s } = convertStyle(style, def);
    const src = `dicebear-${style} ${VERSION}`;
    const credit = `${src} (DiceBear style "${style}", ${license}: ${def.meta.license.text.replace(/[„”]/g, '"')})`;
    const head = (id, about) => header({ id: `k.faces/shards/${id}`, about, sources: [credit], license: SPDX[license], script: 'tools/import/dicebear.mjs' });
    const sid = seg(style);
    files[`${style}-slots.sop`] = `${head(`${style}-slots`, `the slots of the DiceBear style \`${style}\`: the box that the variants of each slot fill in the 0 to 100 frame of the face, and the draw order.`)}\n${
      slots.map((sl) => wire(`k.faces.${sid}.slot.${sl.name}`, 'k.faces.slot', [['style', style], ['name', sl.name], ['x', sl.x], ['y', sl.y], ['w', sl.w], ['h', sl.h], ['z', sl.z], ['optional', sl.optional ? 'true' : undefined]], src)).join('\n')}\n`;
    s.bySlot = {};
    for (const sl of slots) {
      const groups = variants.filter((v) => v.slot === sl.name).map((v) => {
        const id = `k.faces.${sid}.${sl.name}.${seg(v.variant)}`;
        const f = feats.get(`${style}\t${sl.name}\t${v.variant}`) ?? [];
        const length = v.tags.map((t) => /^hairLength:(short|medium|long)$/.exec(t)?.[1]).find(Boolean);
        const pairs = f.some(([k]) => k === 'length') || !length ? f : [...f, ['length', length]];
        const order = ['shape', 'size', 'length', 'feel', 'age', 'kind'];
        const lines = [`# ${sl.name}: ${v.name}`, wire(id, 'k.faces.variant', [['slot', sl.name], ['name', v.name], ['style', style], ...order.flatMap((k) => pairs.filter(([key]) => key === k)), ['named', f.length ? 'model' : undefined]], src)];
        v.parts.forEach((p, i) => {
          lines.push(wire(`${id}.p${i + 1}`, 'k.faces.part', [['slot', sl.name], ['of', v.name], ['name', `part${i + 1}`], ['shape', p.shape], ['x', p.x], ['y', p.y], ['w', p.w], ['h', p.h], ['z', i + 1], ['colour', p.colour], ['rgb', { string: p.rgb }], ['tint', p.tint]], src));
          (p.points ?? []).forEach(([x, y], k) => lines.push(`@${id}.p${i + 1}.${k + 1} k.faces.point part=$${id}.p${i + 1} n=${k + 1} x=${x} y=${y} core.source=${JSON.stringify(src)}`));
        });
        return { lines: [...lines, ''] };
      });
      s.bySlot[sl.name] = groups.length;
      const parts = splitParts(groups);
      parts.forEach((part, i) => {
        const name = `${style}-${sl.name.replace(/_/g, '-')}${parts.length > 1 ? `-${String(i + 1).padStart(2, '0')}` : ''}`;
        files[`${name}.sop`] = `${head(name, `the variants of the slot \`${sl.name}\` in the DiceBear style \`${style}\`: features, and parts converted from the drawings (a primitive shape, a box in the frame of the face, a draw order, a colour name and the exact colour; points for polygons and lines).`)}\n${part.flatMap((g) => g.lines).join('\n').trimEnd()}\n`;
      });
    }
    stats[style] = { license: SPDX[license], ...s };
  }
  return { files, stats };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? dflt : process.argv[i + 1]; };
  const raw = arg('raw', join(repo, 'sources/dicebear/raw/styles'));
  const featuresFile = arg('features', join(repo, 'sources/dicebear/features.tsv'));
  const out = arg('out', join(repo, 'docs/worlds/k.faces/shards'));
  const only = arg('styles', null)?.split(',') ?? Object.keys(STYLES);
  const definitions = Object.fromEntries(only.map((s) => [s, JSON.parse(readFileSync(join(raw, 'src', `${s}.json`), 'utf8'))]));
  const { files, stats } = importDicebear({ definitions, features: existsSync(featuresFile) ? readFileSync(featuresFile, 'utf8') : '', styles: only });
  for (const style of only) writeShards(out, Object.fromEntries(Object.entries(files).filter(([f]) => f.startsWith(`${style}-`))), `${style}-`);
  console.log(JSON.stringify(stats));
}
