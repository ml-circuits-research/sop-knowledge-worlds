// Shared helpers of the import scripts: values, ids, stable sorting, shard files.
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// A value token: an atom when the text can be one, a quoted string otherwise (spaces, quotes, a leading sign).
export const val = (text) => {
  const t = String(text);
  return /^[^\s"\\$?@#][^\s"\\]*$/.test(t) ? t : JSON.stringify(t);
};

// A text as one segment of an id: ASCII letters, digits, "_" and "-"; everything else becomes "_".
export const seg = (text) => {
  const s = String(text).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  return s === '' ? '_' : s;
};

// A text that is always written as a string, also when it could be an atom (for slots of kind string).
export const text = (t) => ({ string: String(t) });

// A wire as one line: @id type key=value ... (entries: [key, value] pairs; undefined and empty values are skipped).
export const wire = (id, type, entries, source) => {
  const parts = [`@${id}`, type];
  for (const [k, v] of entries) if (v !== undefined && v !== null && v !== '') parts.push(`${k}=${typeof v === 'object' ? JSON.stringify(v.string) : val(v)}`);
  parts.push(`core.source=${JSON.stringify(source)}`);
  return parts.join(' ');
};

export const header = ({ id, about, sources, license, script }) =>
  [`# ${id}: ${about}`, ...sources.map((s) => `# sources: ${s}`), `# license: ${license}`, `# script: ${script}`, ''].join('\n');

// Replaces the .sop files of a shard directory (those whose name starts with `prefix`) by `files` (name -> text).
// The shards `psys2*` belong to tools/import/psys2.mjs, which lays facts next to those of every world: no other
// tool removes them (only a call whose prefix names them).
// `keep`: prefixes of shards of the same directory that another tool writes (k.kinds: arguments, relations-,
// structures are tools/relations-core.mjs' and tools/structures-core.mjs'), never removed by this call.
export function writeShards(dir, files, prefix = '', keep = []) {
  mkdirSync(dir, { recursive: true });
  for (const old of readdirSync(dir)) if (old.endsWith('.sop') && old.startsWith(prefix) && (prefix.startsWith('psys2') || !old.startsWith('psys2')) && !keep.some((k) => old.startsWith(k))) rmSync(join(dir, old));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
}

// Splits a sorted list of groups ({ lines }) into consecutive parts that each stay under the limits.
export function splitParts(groups, { maxWires = 1800, maxBytes = 270000, overhead = 600 } = {}) {
  const size = (g) => g.lines.reduce((n, l) => n + Buffer.byteLength(l) + 1, 0);
  const wires = groups.reduce((n, g) => n + g.lines.length, 0);
  const total = groups.reduce((n, g) => n + size(g), 0);
  const bytes = total + overhead;
  const count = Math.max(1, Math.ceil(wires / maxWires), Math.ceil(bytes / maxBytes));
  const parts = Array.from({ length: count }, () => []);
  let done = 0;
  for (const g of groups) {
    const i = Math.min(count - 1, Math.floor((done / total) * count));
    parts[i].push(g);
    done += size(g);
  }
  return parts.filter((p) => p.length);
}
