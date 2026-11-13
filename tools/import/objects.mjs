// Shared by the importers of drawable objects (noto-emoji, openmoji, mulberry): which names are already taken, and
// drawings -> k.objects shards. A name belongs to the first source that has it, in this order: hand-written
// objects, then Noto Emoji, then OpenMoji, then Mulberry.
import { readFileSync, readdirSync, existsSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { wire, text, header } from './lib.mjs';
import { svgToParts } from './svg-parts.mjs';

export const PREFIXES = ['noto-', 'openmoji-', 'mulberry-'];
const NAME = / k\.objects\.object name=("[^"]*"|\S+)/g;

// The object names in the shards that come before `prefix` in the order above (lower case, for comparing).
export function takenNames(dir, prefix) {
  const later = PREFIXES.slice(PREFIXES.indexOf(prefix));
  const taken = new Set();
  if (!existsSync(dir)) return taken;
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith('.sop') || later.some((p) => f.startsWith(p))) continue;
    for (const m of readFileSync(join(dir, f), 'utf8').matchAll(NAME)) taken.add((m[1].startsWith('"') ? JSON.parse(m[1]) : m[1]).toLowerCase());
  }
  return taken;
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

// Details by rule (the outline styles of OpenMoji and Mulberry): a part that is only a stroke (a line or an arc), and a
// black filled part with the same box as a filled part of another colour (the outline under a fill). A row of
// part-names.tsv for the part replaces the rule.
const STROKES = new Set(['line', 'arc']);
const sameBox = (a, b, t = 2) => Math.abs(a.x - b.x) <= t && Math.abs(a.y - b.y) <= t && Math.abs(a.w - b.w) <= t && Math.abs(a.h - b.h) <= t;
export const detailByRule = (parts) => parts.map((p, i) => STROKES.has(p.shape)
  || (p.colour === 'black' && parts.some((q, j) => j !== i && !STROKES.has(q.shape) && q.colour !== 'black' && sameBox(p, q))));

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// entries: [{ uid (id segment), name, keywords, group (shard key), svg (text) }] in the order wanted.
// source: { prefix, drawings: 'id version', names: 'id version' (may equal drawings), sources: [header lines], license, script, about }
export function objectShards(entries, source, { partNames = '', convert = {}, details = false, perShard = 8, maxWires = 1900, maxBytes = 280000 } = {}) {
  const named = readPartNames(partNames);
  const stats = { objects: 0, parts: 0, points: 0, words: 0, named: 0, detail: 0, shards: 0, noParts: 0 };
  const objects = [];
  for (const e of entries) {
    const parts = svgToParts(e.svg, convert);
    if (!parts.length) { stats.noParts++; continue; }
    const uid = `k.objects.${e.uid}`;
    const names = named.get(e.name) ?? new Map();
    const lines = [wire(uid, 'k.objects.object', [['name', e.name]], source.drawings) + (source.names !== source.drawings ? ` core.source=${JSON.stringify(source.names)}` : '')];
    const byRule = details ? detailByRule(parts) : [];
    parts.forEach((p, i) => {
      const given = names.get(i + 1) ?? (byRule[i] ? { kind: 'detail' } : {});
      if (given.kind === 'detail') stats.detail++;
      lines.push(wire(`${uid}.p${i + 1}`, 'k.objects.part', [
        ['of', e.name], ['name', given.name ?? `part${i + 1}`], ['kind', given.kind], ['named', given.name ? 'model' : undefined],
        ['shape', p.shape], ['x', p.x], ['y', p.y], ['w', p.w], ['h', p.h], ['z', i + 1], ['colour', p.colour], ['rgb', text(p.rgb)],
      ], source.drawings));
      if (given.name) stats.named++;
      (p.points ?? []).forEach(([x, y], k) => lines.push(`@${uid}.p${i + 1}.${k + 1} k.objects.point part=$${uid}.p${i + 1} n=${k + 1} x=${x} y=${y} core.source=${JSON.stringify(source.drawings)}`));
      stats.points += p.points?.length ?? 0;
    });
    stats.parts += parts.length;
    const words = [...new Set(e.keywords.map((k) => k.trim()).filter((k) => k && k !== e.name))];
    if (words.length) { lines.push(wire(`${uid}.word`, 'core.word', [...words.map((k) => ['text', k]), ['means', e.name], ['of', 'k.objects.object.name']], source.names)); stats.words++; }
    objects.push({ ...e, lines, bytes: lines.reduce((n, l) => n + Buffer.byteLength(l) + 1, 0) });
    stats.objects++;
  }
  const files = {};
  const byGroup = new Map();
  for (const o of objects) { if (!byGroup.has(o.group)) byGroup.set(o.group, []); byGroup.get(o.group).push(o); }
  for (const [group, list] of byGroup) {
    const chunks = [];
    let cur = null;
    for (const o of list) {
      if (!cur || cur.objects.length >= perShard || cur.wires + o.lines.length > maxWires || cur.bytes + o.bytes > maxBytes) { cur = { objects: [], wires: 0, bytes: 0 }; chunks.push(cur); }
      cur.objects.push(o); cur.wires += o.lines.length; cur.bytes += o.bytes;
    }
    chunks.forEach((c, i) => {
      const name = `${source.prefix}${slug(group)}-${String(i + 1).padStart(2, '0')}`;
      files[`${name}.sop`] = `${header({
        id: `k.objects/shards/${name}`,
        about: `${c.objects.map((o) => o.name).join(', ')} (${group}). ${source.about}`,
        sources: source.sources, license: source.license, script: source.script,
      })}\n${c.objects.map((o) => `# ${o.name}\n${o.lines.join('\n')}`).join('\n\n')}\n`;
      stats.shards++;
    });
  }
  return { files, stats };
}

// Replaces the shards of one source (its prefix) in a directory.
export function writeObjectShards(dir, prefix, files) {
  mkdirSync(dir, { recursive: true });
  for (const old of readdirSync(dir)) if (old.startsWith(prefix) && old.endsWith('.sop')) rmSync(join(dir, old));
  for (const [name, t] of Object.entries(files)) writeFileSync(join(dir, name), t);
}
