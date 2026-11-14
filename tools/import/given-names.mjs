// Given names (Q62): Wikidata's given-name items with a sex class (CC0), as fetched by PSys2's machine into psys2
// `data/external/given-names/given-names.tsv` (commit 0a24284f, 2026-11-14: 3,000 items, the most borne first).
//   node tools/import/given-names.mjs     reads sources/given-names/raw/given-names.tsv, writes docs/worlds/k.people/shards/given-names-<letter>.sop
// One fact per name (`k.people.given_name`): `name` the English label as spelled; `sex` female, male, or both for an
// item of the unisex class (Q3409032; Q12308941 male, Q11879590 female); `holders` the number of Wikidata humans whose
// given name (P735) is the item; `band` computed from `holders` by threshold (BANDS), so the two never disagree;
// `wikidata` the item. A label borne by two items (Anna: Q666578 and Q22713652, other scripts of one name) is one
// fact: the holders are added, the sexes and items kept. Shards by first letter (a shard answers "is this word a given
// name" for the words of one letter). The holder count leans to notable people and well-covered countries: it is a
// band of how often a name is met in the record, not a population frequency.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wire, header, seg, writeShards, byText } from './lib.mjs';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..', '..');
export const RAW = join(ROOT, 'sources', 'given-names', 'raw', 'given-names.tsv');
export const SRC = 'wikidata-given-names 2026-11-14';
// the band of a name by its Wikidata holders (John has 147,086; the 3,000th name about 20)
export const BANDS = [[10000, 'very common'], [1000, 'common'], [100, 'frequent'], [0, 'rare']];
export const bandOf = (n) => BANDS.find(([min]) => n >= min)[1];

export function givenNames(text = readFileSync(RAW, 'utf8')) {
  const lines = text.trim().split('\n');
  if (lines[0] !== 'name\tsex\tusage\tqid') throw new Error(`unexpected header: ${lines[0]}`);
  const by = new Map();
  for (const l of lines.slice(1)) {
    const [name, sex, usage, qid] = l.split('\t');
    if (!['male', 'female', 'unisex'].includes(sex) || !/^\d+$/.test(usage) || !/^Q\d+$/.test(qid)) throw new Error(`bad row: ${l}`);
    if (!by.has(name)) by.set(name, { name, sex: new Set(), holders: 0, wikidata: [] });
    const r = by.get(name);
    for (const s of sex === 'unisex' ? ['female', 'male'] : [sex]) r.sex.add(s);
    r.holders += Number(usage);
    r.wikidata.push(qid);
  }
  // a label with no Latin letter is no English label (ג'וי for Joy, Q4539731): left out
  const latin = (n) => /[A-Za-z]/.test(n.normalize('NFKD'));
  const rows = [...by.values()].filter((r) => latin(r.name)).map((r) => ({ ...r, sex: ['female', 'male'].filter((s) => r.sex.has(s)), wikidata: r.wikidata.sort(byText), band: bandOf(r.holders) }));
  rows.sort((a, b) => byText(a.name, b.name));
  return { rows, read: lines.length - 1 };
}

// The letter of a name for its shard: the first letter without its accent (Émile: e); a name that starts with no
// Latin letter (ʿAbd al-Laṭīf) goes with its first letter that is one.
const letterOf = (name) => name.normalize('NFKD').replace(/[^A-Za-z]/g, '')[0].toLowerCase();

// The wire id: the name as an id segment; where two names give one segment (José, Jose) the one that is not plain
// ASCII takes its first Wikidata item as well (k.people.given_name.Jose_Q12345), so no two facts share an id.
function idsOf(rows) {
  const n = new Map();
  for (const r of rows) n.set(seg(r.name), (n.get(seg(r.name)) ?? 0) + 1);
  return new Map(rows.map((r) => [r.name, n.get(seg(r.name)) > 1 && seg(r.name) !== r.name ? `${seg(r.name)}_${r.wikidata[0]}` : seg(r.name)]));
}

export function shards({ rows, read } = givenNames()) {
  const files = {}, ids = idsOf(rows);
  for (const l of [...new Set(rows.map((r) => letterOf(r.name)))].sort(byText)) {
    const these = rows.filter((r) => letterOf(r.name) === l);
    const lines = these.map((r) => wire(`k.people.given_name.${ids.get(r.name)}`, 'k.people.given_name',
      [['name', r.name], ...r.sex.map((s) => ['sex', s]), ['holders', String(r.holders)], ['band', r.band], ...r.wikidata.map((q) => ['wikidata', q])], SRC));
    files[`given-names-${l}.sop`] = `${header({ id: `k.people/shards/given-names-${l}`, about: `${these.length} given names starting with ${l.toUpperCase()} (of ${rows.length} from ${read} Wikidata items), each with its sexes, the Wikidata humans who bear it, a band and its Wikidata items.`,
      sources: ['wikidata-given-names 2026-11-14 (Wikidata given-name items with a sex class and their P735 holders, CC0; fetched by PSys2 into data/external/given-names, commit 0a24284f)'], license: 'CC0-1.0', script: 'tools/import/given-names.mjs' })}\n${lines.join('\n')}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const g = givenNames();
  const files = shards(g);
  writeShards(join(ROOT, 'docs', 'worlds', 'k.people', 'shards'), files, 'given-names-');
  const bytes = Object.values(files).reduce((n, t) => n + Buffer.byteLength(t), 0);
  const bands = {};
  for (const r of g.rows) bands[r.band] = (bands[r.band] ?? 0) + 1;
  const ids = new Set(idsOf(g.rows).values());
  console.log(`read ${g.read} items; ${g.rows.length} names (labels of two items merged, labels with no Latin letter left out; ${ids.size} distinct ids) in ${Object.keys(files).length} shards, ${bytes} bytes; bands ${JSON.stringify(bands)}; both sexes ${g.rows.filter((r) => r.sex.length === 2).length}`);
}
