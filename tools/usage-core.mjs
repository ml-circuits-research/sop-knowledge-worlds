// k.attributes.usage (Round 10, item 6): the temporal and social aspects of the things of k.scenes: when a thing is
// usually used or seen (season, time of day, weather) and by whom (an age of k.people.kind, a role of
// k.people.role). So that a host can fill a winter night scene, or give the doctor a stethoscope, by lookup.
//   node tools/usage-core.mjs     writes docs/worlds/k.attributes/shards/usage.sop
// The values are the rows of sources/hand-core/usage.tsv, labelled by a language model (named=model), each only where
// it is plain; most things have none and get no fact. The values are those of the worlds they join: `season`,
// `time` and `weather` are the values of k.scenes.scene (season, time, weather), so a thing fits a scene that has
// the same value; `age` the values of k.people.kind.age; `used_by` names a k.people.role. A role that already lists
// the thing in its own `uses` (k.people.role) is not repeated here: one fact in one place, and a host that asks
// who uses a thing reads both (`k.people.role` by `uses`, this type by `used_by`).
// Q37: for a name with several senses (star), `sense` says which one is meant (sources/hand-core/senses.tsv).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds } from './lib/worlds.mjs';
import { parse } from './sopworld/sopworld.mjs';
import { wire, header, seg, writeShards, byText } from './import/lib.mjs';
import { readSenses } from './lib/senses.mjs';

const SRC = 'hand-core 1';
export const USAGE_TSV = join(REPO, 'sources', 'hand-core', 'usage.tsv');
export const KEYS = ['season', 'time', 'weather', 'age', 'used_by'];
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const list = (s) => (s ?? '').split(',').map((x) => x.trim()).filter(Boolean);

export function readUsage(text = readFileSync(USAGE_TSV, 'utf8')) {
  const [head, ...rows] = text.split('\n').filter((l) => l.trim());
  if (head !== ['name', ...KEYS].join('\t')) throw new Error(`usage.tsv: header ${head}`);
  return rows.map((l) => { const [name, ...cells] = l.split('\t'); return { name, ...Object.fromEntries(KEYS.map((k, i) => [k, list(cells[i])])) }; });
}

// role -> the things it lists in k.people.role.uses.
export function roleUses(worlds = scanWorlds()) {
  const out = new Map();
  for (const w of worlds.filter((x) => x.id === 'k.people')) for (const s of w.shards) for (const f of parse(s.text)) if (f.type === 'k.people.role') {
    out.set(tok(f.attrs.name[0]), new Set((f.attrs.uses ?? []).map(tok)));
  }
  return out;
}

export function usageShards(rows = readUsage(), uses = roleUses(), senses = readSenses().usage) {
  const facts = rows.map((r) => ({ ...r, used_by: r.used_by.filter((role) => !uses.get(role)?.has(r.name)) }))
    .filter((r) => KEYS.some((k) => r[k].length)).sort((a, b) => byText(a.name, b.name));
  const lines = facts.map((r) => wire(`k.attributes.usage.${seg(r.name)}`, 'k.attributes.usage', [['name', r.name], ['sense', senses.get(r.name)], ...KEYS.flatMap((k) => r[k].map((v) => [k, v])), ['named', 'model']], SRC));
  return { 'usage.sop': `${header({ id: 'k.attributes/shards/usage', about: `when ${facts.length} things of k.scenes are usually used or seen (season, time of day, weather: the values of k.scenes.scene) and by whom (an age of k.people.kind, a role of k.people.role that does not already list the thing in its uses), each only where it is plain.`,
    sources: ['hand-core 1 (labelled by a language model, named=model: sources/hand-core/usage.tsv)'], license: 'CC0-1.0', script: 'tools/usage-core.mjs' })}\n${lines.join('\n')}\n` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = readUsage();
  const files = usageShards(rows);
  writeShards(join(WORLDS_DIR, 'k.attributes', 'shards'), files, 'usage');
  const n = (k) => rows.filter((r) => r[k].length).length;
  console.log(`${rows.length} rows; ${KEYS.map((k) => `${k} ${n(k)}`).join(', ')}; ${parse(files['usage.sop']).length} facts`);
}
