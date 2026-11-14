// w.lang.en, what this repository adds to the hand-over (Round 12, holes and joins):
//   node tools/lang-en-core.mjs     writes docs/worlds/w.lang.en/shards/core-plurals.sop
// Irregular plurals of the nouns of k.words, from WordNet 3.1's noun.exc (sources/wordnet/raw/wordnet31): a plural is
// kept when its singular is a noun of k.words and the plural -> singular rules of the set `lemma` of w.lang.en do not
// give the singular back (mice, feet, criteria; not "anus", which WordNet lists as its own plural and the rules read).
// Deterministic.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './sopworld/sopworld.mjs';
import { WORLDS_DIR, REPO, scanWorlds } from './lib/worlds.mjs';
import { header, wire, seg } from './import/lib.mjs';
import { inflect } from './lib/lang-en.mjs';

const RAW = join(REPO, 'sources/wordnet/raw/wordnet31/noun.exc');
const OUT = join(WORLDS_DIR, 'w.lang.en/shards/core-plurals.sop');
// WordNet lists plurals that are words of their own (cola is no plural of colon for a reader; dive, crying, soles):
// left out. And it lists the classical or foreign plural first (antennae, aquaria, bani for ban): those are read
// (plural -> singular) but not written (`read_only=yes`); a writer forms the plural by the rules, except for the
// everyday irregulars of WRITTEN.
const DROP = new Set(['cola', 'crying', 'dive', 'gas', 'signore', 'soles']);
const WRITTEN = new Set(['child', 'grandchild', 'foot', 'tooth', 'goose', 'man', 'mouse', 'louse', 'woodlouse', 'ox', 'knife', 'wife', 'life', 'housewife', 'midwife',
  'potato', 'tomato', 'hero', 'echo', 'volcano', 'mosquito', 'tornado', 'torpedo', 'veto', 'domino', 'cargo', 'crisis', 'analysis', 'thesis', 'hypothesis', 'diagnosis', 'oasis',
  'emphasis', 'paralysis', 'prognosis', 'phenomenon', 'quiz', 'matrix', 'vertebra', 'nucleus', 'stimulus', 'penny', 'flamingo', 'mango', 'motto', 'halo', 'grotto', 'fez']);
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);

export function pluralsShard(excText, worlds = scanWorlds()) {
  const lang = worlds.find((w) => w.id === 'w.lang.en');
  const wires = lang.shards.filter((s) => !/\/core-/.test(s.id)).flatMap((s) => parse(s.text));
  const of = (t) => wires.filter((w) => w.type === `w.lang.en.${t}`);
  const facts = { inflect: of('inflect'), irregular: of('irregular'), exceptions: of('noun.exception') };
  const have = new Set(of('irregular').map((w) => tok(w.attrs.singular[0])));
  const nouns = new Set();
  for (const s of worlds.find((w) => w.id === 'k.words').shards) for (const m of s.text.matchAll(/ k\.words\.sense word=([^\s"]+) pos=noun /g)) nouns.add(m[1]);
  const rows = new Map();
  for (const line of excText.split('\n')) {
    const [plural, singular] = line.trim().split(/\s+/);
    if (!plural || !singular || !/^[a-z]+$/.test(plural) || !/^[a-z]+$/.test(singular) || !nouns.has(singular) || have.has(singular)) continue;
    if (inflect(facts, plural, 'singular', 'lemma') === singular) continue; // the rules read it already
    if (DROP.has(plural)) continue;
    if (!rows.has(singular)) rows.set(singular, plural); // the first plural WordNet lists for a singular
  }
  const lines = [...rows].sort(([a], [b]) => (a < b ? -1 : 1)).map(([singular, plural]) => wire(`w.lang.en.irregular.wordnet.${seg(singular)}`, 'w.lang.en.irregular', [['singular', singular], ['plural', plural], ['read_only', WRITTEN.has(singular) ? undefined : 'yes']], 'wordnet 3.1'));
  return `${header({ id: 'w.lang.en/shards/core-plurals', about: `${lines.length} irregular plurals of the nouns of k.words that the morphology rules do not read (WordNet's noun exceptions: mice, feet, criteria; the classical and foreign ones read only)`, sources: ['wordnet 3.1 (noun.exc, the noun exception list of Princeton WordNet 3.1)'], license: 'WordNet-3.0', script: 'tools/lang-en-core.mjs' })}\n${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!existsSync(RAW)) { console.error(`${RAW} is missing: see sources/wordnet/SOURCE.md`); process.exit(1); }
  const text = pluralsShard(readFileSync(RAW, 'utf8'));
  writeFileSync(OUT, text);
  console.log(`core-plurals.sop: ${text.split('\n').filter((l) => l.startsWith('@')).length} wires`);
}
