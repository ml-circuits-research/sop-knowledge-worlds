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
// Reviewer 04:10 item 4: `context=person` on a name that is also a common word or the name of a common thing of the
// catalog (Rose, Hope, Mark, Robin, May): a reader takes the word unless a person context applies (PERSON_CONTEXT
// and readsAsName below), and the vocabulary lists the names shard last for that word (tools/build-catalog.mjs).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wire, header, seg, writeShards, byText } from './lib.mjs';
import { scanWorlds } from '../lib/worlds.mjs';

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

// Which names need a person context (reviewer 04:10 item 4), by rule over the published catalog, no list by hand:
//   - the name, in lower case, is the name of a thing of another world: a drawing, a thing of a scene, an animal, a
//     food, a colour, a month, a unit, a shape (`name=` of a fact; Rose, Robin, Iris, Tea, Amber, May, Kelvin, Line).
//     Not the places of k.geo (a river James, a city David or Charlotte: names of their own, a person's first) nor
//     the worlds that only gather names (k.words, the generated k.kinds, k.attributes and k.diagrams.topic, k.people itself);
//   - or the name, in lower case, is a word of k.words with at least three senses that are no person (WordNet's
//     senses as k.words has them: hope 6, mark 6, grace 5, frank 5, art 3, odd 3): a word that common is read as the
//     word first. Tom (2 senses, a male cat or turkey), Ana (1), Leo (capitalised in WordNet: the constellation) are not.
export const CONTEXT_SENSES = 3;
const CONTEXT_SKIP = new Set(['k.people', 'k.words', 'k.kinds', 'k.attributes', 'k.geo']);
// k.diagrams.topic is generated too: the names of other worlds' things a diagram can draw (a country Chad, a city
// Georgia), gathered, not things of its own
const CONTEXT_SKIP_TYPES = new Set(['k.diagrams.topic']);
export function personContext(rows, worlds = scanWorlds()) {
  const tok = (t) => (t.startsWith('"') ? JSON.parse(t) : t);
  const low = new Set(rows.map((r) => r.name.toLowerCase()));
  const why = new Map(); // lower-case name -> the reason
  for (const w of worlds) {
    if (CONTEXT_SKIP.has(w.id)) continue;
    for (const s of w.shards) for (const m of s.text.matchAll(/^@\S+ (k\.[a-z_.]+) name=("[^"]*"|\S+)/gm)) {
      if (CONTEXT_SKIP_TYPES.has(m[1])) continue;
      const v = tok(m[2]).toLowerCase();
      if (low.has(v) && !why.has(v)) why.set(v, m[1]);
    }
  }
  const senses = new Map();
  for (const s of worlds.find((w) => w.id === 'k.words')?.shards ?? []) for (const m of s.text.matchAll(/^@\S+ k\.words\.sense word=("[^"]*"|\S+) pos=\S+ n=\d+ supersense=(\S+)/gm)) {
    const v = tok(m[1]);
    if (low.has(v) && m[2] !== 'noun.person') senses.set(v, (senses.get(v) ?? 0) + 1);
  }
  for (const [v, n] of senses) if (n >= CONTEXT_SENSES && !why.has(v)) why.set(v, `k.words (${n} senses)`);
  return why;
}

// A reader's rule for a name with context=person, as a reference for hosts (the library reads names its own way):
// the word at position i of a sentence (a list of tokens) is read as the given name only when no determiner or
// possessive stands before it (a rose, my rose) and a person context applies: a capital inside the sentence (I gave
// Rose a book), a person noun before it (my friend Rose), or after it a form of "be" and a person noun (Rose is my
// friend), or a verb of saying or doing that takes a person (Rose said, Rose laughed). `lex` gives the language:
// `determiners` (w.lang.en's closed class), `isPersonNoun(word)` (a first noun sense under noun.person in k.words).
export const PERSON_VERBS = ['said', 'says', 'asked', 'asks', 'told', 'tells', 'laughed', 'laughs', 'smiled', 'smiles', 'replied', 'answered', 'thinks', 'thought', 'wants', 'wanted', 'likes', 'liked', 'lives', 'lived'];
const BE = new Set(['is', 'was', 'are', 'were', "'s"]);
export function readsAsName(tokens, i, { determiners, isPersonNoun, needsContext = true }) {
  const t = tokens[i], prev = tokens[i - 1]?.toLowerCase();
  if (!needsContext) return /^\p{Lu}/u.test(t);
  if (prev && determiners.has(prev)) return false;
  if (i > 0 && /^\p{Lu}/u.test(t) && !/[.!?]$/.test(tokens[i - 1])) return true;
  if (prev && isPersonNoun(prev)) return true;
  const next = tokens.slice(i + 1).map((x) => x.toLowerCase());
  if (BE.has(next[0])) { const noun = next.slice(1).find((x) => !determiners.has(x)); return Boolean(noun && isPersonNoun(noun)); }
  return PERSON_VERBS.includes(next[0]);
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

export function shards({ rows, read } = givenNames(), context = personContext(rows)) {
  const files = {}, ids = idsOf(rows);
  for (const l of [...new Set(rows.map((r) => letterOf(r.name)))].sort(byText)) {
    const these = rows.filter((r) => letterOf(r.name) === l);
    const lines = these.map((r) => wire(`k.people.given_name.${ids.get(r.name)}`, 'k.people.given_name',
      [['name', r.name], ...r.sex.map((s) => ['sex', s]), ['holders', String(r.holders)], ['band', r.band], ...r.wikidata.map((q) => ['wikidata', q]),
        ['context', context.has(r.name.toLowerCase()) ? 'person' : undefined]], SRC) + (context.has(r.name.toLowerCase()) ? ' core.source="hand-core 1"' : ''));
    files[`given-names-${l}.sop`] = `${header({ id: `k.people/shards/given-names-${l}`, about: `${these.length} given names starting with ${l.toUpperCase()} (of ${rows.length} from ${read} Wikidata items), each with its sexes, the Wikidata humans who bear it, a band and its Wikidata items.`,
      sources: ['wikidata-given-names 2026-11-14 (Wikidata given-name items with a sex class and their P735 holders, CC0; fetched by PSys2 into data/external/given-names, commit 0a24284f)', 'hand-core 1 (context=person: by the rule of the import over the names of the catalog and the senses of k.words)'], license: 'CC0-1.0', script: 'tools/import/given-names.mjs' })}\n${lines.join('\n')}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const g = givenNames();
  const context = personContext(g.rows);
  const files = shards(g, context);
  writeShards(join(ROOT, 'docs', 'worlds', 'k.people', 'shards'), files, 'given-names-');
  const bytes = Object.values(files).reduce((n, t) => n + Buffer.byteLength(t), 0);
  const bands = {};
  for (const r of g.rows) bands[r.band] = (bands[r.band] ?? 0) + 1;
  const ids = new Set(idsOf(g.rows).values());
  console.log(`read ${g.read} items; ${g.rows.length} names (labels of two items merged, labels with no Latin letter left out; ${ids.size} distinct ids) in ${Object.keys(files).length} shards, ${bytes} bytes; bands ${JSON.stringify(bands)}; both sexes ${g.rows.filter((r) => r.sex.length === 2).length}; context=person ${g.rows.filter((r) => context.has(r.name.toLowerCase())).length}`);
}
