// k.kinds `sensitive` (reviewer block 2026-11-15 13:15, PSys2 Q20; real row: the owner got the chip "Add a weapon."
// after a sunny scene): which named things a host leaves out of suggestions and random choices by default.
//   node tools/sensitive-core.mjs     writes docs/worlds/k.kinds/shards/sensitive.sop
// The values are a small closed set taken from the GARM Brand Safety Floor and Suitability Framework (Global Alliance
// for Responsible Media, World Federation of Advertisers, 2020), the categories "Arms & Ammunition" and "Illegal
// Drugs / Tobacco / e-cigarettes / Vaping / Alcohol":
//   weapon   weapons, arms, ammunition and explosive devices
//   drug     drugs of abuse
//   alcohol  alcoholic drinks
//   tobacco  tobacco and what is smoked of it
// Each is a set of WordNet synsets (ROOTS), read from the WordNet hypernym chains already imported in k.words (no raw
// file needed: the input is committed). The rule, chosen so that an everyday tool is not swept in by a wide hypernym:
//   1. only the name's first noun sense counts (WordNet orders senses by frequency): a knife is first an edge tool
//      (knife.n.01), so it is not a weapon, though knife.n.02 is; an axe, a hammer, a saw are tools; a bow is a knot;
//   2. the roots are the narrow synsets of the category, never their wide hypernyms (instrument, device,
//      instrumentality hold weapons and tools alike); a tank (military vehicle) and a shield (protective covering) are
//      not weapons, a slingshot is a plaything;
//   3. alcohol is the drink only (the chain holds both `alcohol` and `beverage`; glycerol, an alcohol of chemistry, is
//      not), tobacco the product only (not a sense of the plant kingdom, noun.plant);
//   4. where a sense carries no `kind_of` chain (k.words lacks it for some), its `is_a` is followed through the first
//      noun sense of each hypernym's word, at most 6 steps;
//   5. WordNet's first sense comes from news and fiction (SemCor): where the everyday sense of a word, the one this
//      catalog draws, differs (a battery is an electric cell, a shell a seashell, a slug a garden animal), the word is
//      listed with that sense in sources/hand-core/sensitive-not.tsv and left out;
//   6. an alcoholic drink and tobacco are checked before drugs (WordNet files both under "drug of abuse").
// One fact per name: `k.kinds.sensitivity name=<word> sensitive=<value> sense=<k.words sense id>`, licence
// WordNet-3.0 (the facts are read off WordNet's chains). The names are the words of k.words, so the key reaches every
// world whose things are named by an English lemma (and the words a user types).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from './lib/worlds.mjs';
import { WORLDS_DIR, scanWorlds, factsOf } from './lib/worlds.mjs';
import { wire, header, seg, writeShards, byText } from './import/lib.mjs';

export const VALUES = ['weapon', 'drug', 'alcohol', 'tobacco'];
// value -> the lemmas (as WordNet's first lemma of the synset, the form k.words writes in is_a and kind_of)
export const ROOTS = {
  weapon: ['weapon', 'weaponry', 'armament', 'weapon system', 'explosive device', 'ammunition', 'explosive', 'firearm'],
  drug: ['drug of abuse', 'hard drug', 'soft drug', 'narcotic'],
  alcohol: ['alcohol'],
  tobacco: ['tobacco'],
};
export const NOT_TSV = join(REPO, 'sources', 'hand-core', 'sensitive-not.tsv');
export const readNot = (text = readFileSync(NOT_TSV, 'utf8')) => new Map(text.split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t').map((x) => x.trim())));
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);

// word -> its first noun sense { id, is_a, kind_of, supersense }
export function firstNounSenses(worlds = scanWorlds()) {
  const out = new Map();
  for (const w of factsOf('k.words', 'k.words.sense', worlds)) {
    if (w.attrs.pos?.[0] !== 'noun' || w.attrs.n?.[0] !== '1') continue;
    out.set(tok(w.attrs.word[0]), { id: w.id, is_a: (w.attrs.is_a ?? []).map(tok), kind_of: (w.attrs.kind_of ?? []).map(tok), supersense: w.attrs.supersense?.[0] });
  }
  return out;
}

// The chain above a sense: its kind_of, or, without one, its is_a followed through first senses (rule 4).
function chain(sense, senses, depth = 0, seen = new Set()) {
  const up = new Set([...sense.is_a, ...sense.kind_of]);
  if (sense.kind_of.length || depth >= 6) return up;
  for (const h of sense.is_a) {
    const s = senses.get(h);
    if (!s || seen.has(h)) continue;
    seen.add(h);
    for (const x of chain(s, senses, depth + 1, seen)) up.add(x);
  }
  return up;
}

// The value of one first noun sense, or null.
export function sensitivityOf(word, senses) {
  const s = senses.get(word);
  if (!s) return null;
  const up = chain(s, senses);
  up.add(word); // the word's own synset counts (alcohol, tobacco)
  const has = (v) => ROOTS[v].some((r) => up.has(r));
  if (has('weapon')) return 'weapon';
  if (has('alcohol') && up.has('beverage')) return 'alcohol';
  if (has('tobacco') && s.supersense !== 'noun.plant') return 'tobacco';
  if (has('drug')) return 'drug';
  return null;
}

export function sensitiveShard(worlds = scanWorlds(), not = readNot()) {
  const senses = firstNounSenses(worlds);
  const rows = [...senses.keys()].filter((w) => !not.has(w)).map((w) => [w, sensitivityOf(w, senses)]).filter(([, v]) => v).sort((a, b) => byText(a[0], b[0]));
  const lines = rows.map(([w, v]) => wire(`k.kinds.sensitivity.${seg(w)}`, 'k.kinds.sensitivity', [['name', w], ['sensitive', v], ['sense', senses.get(w).id]], 'wordnet 3.1'));
  const count = (v) => rows.filter((r) => r[1] === v).length;
  return {
    'sensitive.sop': `${header({
      id: 'k.kinds/shards/sensitive',
      about: `the ${rows.length} words of k.words whose first noun sense is a weapon (${count('weapon')}), a drug (${count('drug')}), an alcoholic drink (${count('alcohol')}) or tobacco (${count('tobacco')}): hosts leave them out of suggestions and random choices by default (the categories of the GARM Brand Safety Floor; the rule in tools/sensitive-core.mjs)`,
      sources: ['wordnet 3.1 (the hypernym chains of the first noun sense of each word, as imported in k.words; the words whose everyday sense differs, sources/hand-core/sensitive-not.tsv, are left out)'],
      license: 'WordNet-3.0', script: 'tools/sensitive-core.mjs',
    })}\n${lines.join('\n')}\n`,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = sensitiveShard();
  writeShards(join(WORLDS_DIR, 'k.kinds', 'shards'), files, 'sensitive');
  console.log(files['sensitive.sop'].split('\n')[0]);
}
