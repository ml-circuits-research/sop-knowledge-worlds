// Noto Emoji SVGs + Unicode CLDR English names -> k.objects shards: drawable objects in bulk. Each SVG element becomes
// one part (see svg-parts.mjs); parts are named part1..partN in draw order unless sources/noto-emoji/part-names.tsv
// names them (R2.7: `named=model`). Deterministic.
//   node tools/import/noto-emoji.mjs [--svg sources/noto-emoji/raw/repo/2D/svg] [--cldr sources/cldr/raw]
//                                    [--names sources/noto-emoji/part-names.tsv] [--out docs/worlds/k.objects/shards]
//                                    [--limit N]   (default: sources/noto-emoji/limit.txt; 0 means all)
// How to fetch the raw files: sources/noto-emoji/SOURCE.md and sources/cldr/SOURCE.md.
import { readFileSync, existsSync, readdirSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seg, wire, text, header } from './lib.mjs';
import { svgToParts } from './svg-parts.mjs';
import { takenNames } from './objects.mjs';

export const NOTO = 'noto-emoji 99701e0';
export const CLDR = 'cldr 48';
export const PREFIX = 'noto-';
const GROUPS = new Set(['Animals & Nature', 'Food & Drink', 'Travel & Places', 'Activities', 'Objects']);
// Not things: clock faces for every half hour, card suits and other signs inside the kept groups.
const NOT_THINGS = /o’clock|o'clock|-thirty$| suit$|^joker$|^mahjong red dragon$|^flower playing cards$|^sparkles$|^no /;

// emoji-test.txt -> [{ code (file name part), emoji, group, subgroup }] for the fully-qualified emoji of the kept groups.
export function readEmojiList(testText) {
  const out = [];
  let group = '', subgroup = '';
  for (const line of testText.split('\n')) {
    let m = /^# group: (.+)$/.exec(line);
    if (m) { group = m[1].trim(); continue; }
    m = /^# subgroup: (.+)$/.exec(line);
    if (m) { subgroup = m[1].trim(); continue; }
    m = /^([0-9A-F ]+?)\s*;\s*fully-qualified\s*#\s*(\S+)/.exec(line);
    if (!m || !GROUPS.has(group)) continue;
    const points = m[1].trim().split(' ');
    out.push({ code: points.filter((p) => p !== 'FE0F').map((p) => p.toLowerCase()).join('_'), emoji: m[2], group, subgroup });
  }
  return out;
}

// part-names.tsv: object <tab> part number <tab> name <tab> kind (lines starting with # are comments).
export function readPartNames(tsv) {
  const names = new Map();
  for (const line of (tsv ?? '').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [object, n, name, kind] = line.split('\t').map((x) => x.trim());
    if (!names.has(object)) names.set(object, new Map());
    names.get(object).set(Number(n), { name: name || undefined, kind: kind || undefined });
  }
  return names;
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// input: { list: emoji-test text, annotations: parsed CLDR annotations.json, svg: (code) => text or null,
//          partNames: tsv text, taken: names that hand-written objects already have }
export function importNoto({ list, annotations, svg, partNames, taken = new Set() }, { limit = 0, perShard = 8, maxWires = 1900, maxBytes = 280000 } = {}) {
  const ann = annotations.annotations.annotations;
  const named = readPartNames(partNames);
  const stats = { listed: 0, objects: 0, parts: 0, points: 0, words: 0, named: 0, shards: 0, skipped: { notThing: 0, noName: 0, noSvg: 0, noParts: 0, handWritten: [] } };
  let entries = [];
  const seen = new Set();
  for (const e of readEmojiList(list)) {
    stats.listed++;
    const a = ann[e.emoji] ?? ann[e.emoji.replace(/️/g, '')];
    const name = a?.tts?.[0];
    if (!name) { stats.skipped.noName++; continue; }
    if (NOT_THINGS.test(name)) { stats.skipped.notThing++; continue; }
    if (taken.has(name.toLowerCase())) { stats.skipped.handWritten.push(name); continue; }
    if (seen.has(name)) continue;
    seen.add(name);
    entries.push({ ...e, name, keywords: (a.default ?? []).filter((k) => k !== name) });
  }
  if (limit && entries.length > limit) {
    const total = entries.length;
    entries = entries.filter((_, i) => Math.floor(((i + 1) * limit) / total) > Math.floor((i * limit) / total));
  }
  const objects = [];
  for (const e of entries) {
    const source = svg(e.code);
    if (!source) { stats.skipped.noSvg++; continue; }
    const parts = svgToParts(source);
    if (!parts.length) { stats.skipped.noParts++; continue; }
    const uid = `k.objects.u${e.code}`;
    const names = named.get(e.name) ?? new Map();
    const lines = [wire(uid, 'k.objects.object', [['name', e.name]], NOTO) + ` core.source=${JSON.stringify(CLDR)}`];
    parts.forEach((p, i) => {
      const given = names.get(i + 1) ?? {};
      lines.push(wire(`${uid}.p${i + 1}`, 'k.objects.part', [
        ['of', e.name], ['name', given.name ?? `part${i + 1}`], ['kind', given.kind], ['named', given.name ? 'model' : undefined],
        ['shape', p.shape], ['x', p.x], ['y', p.y], ['w', p.w], ['h', p.h], ['z', i + 1], ['colour', p.colour], ['rgb', text(p.rgb)],
      ], NOTO));
      if (given.name) stats.named++;
      (p.points ?? []).forEach(([x, y], k) => lines.push(wire(`${uid}.p${i + 1}.${k + 1}`, 'k.objects.point', [['part', `$${uid}.p${i + 1}`], ['n', k + 1], ['x', x], ['y', y]], NOTO).replace('part="$', 'part=$').replace(`" n=${k + 1} `, ` n=${k + 1} `)));
      stats.points += p.points?.length ?? 0;
    });
    stats.parts += parts.length;
    const words = [...new Set(e.keywords)];
    if (words.length) { lines.push(wire(`${uid}.word`, 'core.word', [...words.map((k) => ['text', k]), ['means', e.name], ['of', 'k.objects.object.name']], CLDR)); stats.words++; }
    objects.push({ ...e, lines, bytes: lines.reduce((n, l) => n + Buffer.byteLength(l) + 1, 0) });
    stats.objects++;
  }
  // Shards: the objects of one subgroup in the order of the emoji list, at most 8 per shard and inside the size gate.
  const files = {};
  const bySub = new Map();
  for (const o of objects) { if (!bySub.has(o.subgroup)) bySub.set(o.subgroup, []); bySub.get(o.subgroup).push(o); }
  for (const [subgroup, list2] of bySub) {
    const chunks = [];
    let cur = null;
    for (const o of list2) {
      if (!cur || cur.objects.length >= perShard || cur.wires + o.lines.length > maxWires || cur.bytes + o.bytes > maxBytes) { cur = { objects: [], wires: 0, bytes: 0 }; chunks.push(cur); }
      cur.objects.push(o); cur.wires += o.lines.length; cur.bytes += o.bytes;
    }
    chunks.forEach((c, i) => {
      const name = `${PREFIX}${slug(subgroup)}-${String(i + 1).padStart(2, '0')}`;
      files[`${name}.sop`] = `${header({
        id: `k.objects/shards/${name}`,
        about: `${c.objects.map((o) => o.name).join(', ')} (${c.objects[0].group}, ${subgroup}). Parts converted from the Noto Emoji drawings: a primitive shape, a box in the 0 to 100 frame, a draw order z, a colour name and the exact colour; points for polygons and lines.`,
        sources: ['noto-emoji 99701e0 (Noto Emoji, the SVG drawings, Apache-2.0)', 'cldr 48 (Unicode CLDR English names and keywords, Unicode-3.0)'],
        license: 'Apache-2.0 AND Unicode-3.0',
        script: 'tools/import/noto-emoji.mjs',
      })}\n${c.objects.map((o) => `# ${o.name}\n${o.lines.join('\n')}`).join('\n\n')}\n`;
      stats.shards++;
    });
  }
  return { files, stats };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? dflt : process.argv[i + 1]; };
  const svgDir = arg('svg', join(repo, 'sources/noto-emoji/raw/repo/2D/svg'));
  const cldr = arg('cldr', join(repo, 'sources/cldr/raw'));
  const namesFile = arg('names', join(repo, 'sources/noto-emoji/part-names.tsv'));
  const out = arg('out', join(repo, 'docs/worlds/k.objects/shards'));
  const limitFile = join(repo, 'sources/noto-emoji/limit.txt'); // how many objects the published build takes (0: all)
  // Names that hand-written objects already have (they win).
  mkdirSync(out, { recursive: true });
  const taken = new Set([...takenNames(out, PREFIX)]);
  const { files, stats } = importNoto({
    list: readFileSync(join(cldr, 'emoji-test.txt'), 'utf8'),
    annotations: JSON.parse(readFileSync(join(cldr, 'annotations.json'), 'utf8')),
    svg: (code) => { const p = join(svgDir, `emoji_u${code}.svg`); return existsSync(p) ? readFileSync(p, 'latin1') : null; },
    partNames: existsSync(namesFile) ? readFileSync(namesFile, 'utf8') : '',
    taken,
  }, { limit: Number(arg('limit', existsSync(limitFile) ? readFileSync(limitFile, 'utf8').trim() : 0)) });
  for (const old of readdirSync(out)) if (old.startsWith(PREFIX) && old.endsWith('.sop')) rmSync(join(out, old));
  for (const [name, t] of Object.entries(files)) writeFileSync(join(out, name), t);
  console.log(JSON.stringify(stats));
}
