// Animal sounds from WordNet (reviewer block 2026-11-15 03:20, item 1; PSys2 Q15: "what sound does a cow make").
// WordNet names, in the gloss of a sound, the animal that makes it: "moo: the sound made by a cow or bull", "hoot:
// utter the characteristic sound of owls", "caw: utter a cry, characteristic of crows, rooks, or ravens". This tool
// reads those glosses and writes, for every animal of k.animals that a gloss names, the sound as a value of the
// typed key `k.animals.animal.sound` (declared join to k.words.sense by word), in its own shard under WordNet's
// licence: `docs/worlds/k.animals/shards/sounds.sop`. The wires merge with the animal's other wires (as psys2.sop).
//
// Which glosses: noun synsets of noun.event (the lexicographer file of moo, bark, roar) and verb synsets of
// verb.communication and verb.perception (moo, hoot, buzz), whose definition speaks of a sound (sound, cry, call,
// noise, utter, characteristic of, ...). Which animal: a word of the definition (singular or plural) whose first
// noun sense under `animal` is the WordNet sense of an animal of k.animals, or a kind below it (a hen is a chicken,
// a bull is cattle). An example sentence counts only where the definition says "animal" ("bellow: make a loud noise,
// as of animal; 'The bull bellowed'"). Left out: a gloss that compares ("a loud laugh that sounds like a horse
// neighing", "a noise resembling the bark of a dog": a sound like the animal's, not the animal's), a call made to an
// animal ("call to stop the hunt, as of hunting dogs"), and non-sound verbs ("crawl about like ants").
// Which words: the first lemma of the synset, and every other lemma whose own first sense of that part of speech is
// this synset (whinny, oink: yes; low, click, quest: no, their first sense is another).
//   node tools/animal-sounds.mjs           writes the shard, prints the counts and the animals with no sound
//   node tools/animal-sounds.mjs --report  prints only
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, byText } from './import/lib.mjs';
import { readData, readIndex, shortGloss } from './import/wordnet.mjs';

export const SOURCE = 'wordnet 3.1';
export const SHARD = 'sounds.sop';
const DICT = join(REPO, 'sources/wordnet/raw/wordnet31');
const ANIMAL_ROOT = '00015568';
const NOUN_FILES = ['11', '10'], VERB_FILES = ['32', '39'];
const SOUNDISH = /\b(sound|sounds|cry|cries|call|noise|noises|utter|utterance|characteristic|bark|barking|bray|braying|squawk|chirp|chirping|song|sing|whistle|squeal|hiss|roar|howl|clucking|buzzing|purring|growling)\b/;
// A definition that compares a sound with the animal's (it is not the animal's own), or a call made to animals; the
// parentheses that only widen a sound ("the cry of a goose (or any sound resembling this)") are cut first.
const WIDENS = /\((or any sound resembling this|or an imitation of it)\)/g;
const COMPARES = /\b(like that of|resembling|suggestive of|sounds like|imitation)\b|\bcall to\b/;
// The words after which a word of an animal ends its phrase ("a cat in heat", "a cow or bull"; not "a sharp swift blow").
const ENDS = new Set(['or', 'and', 'in', 'on', 'after', 'as', 'with', 'when', 'is', 'are', 'was', 'were', 'to', 'of', 'that', 'repeats', 'its', 'his', 'her', 'their', 'calling', 'have', 'has']);
// Irregular plurals of the glosses (noun.exc has them too; these are the ones the sound glosses use).
// A word for any sound is not the sound of an animal ("cry: utter a characteristic sound; 'The cat was crying'").
const GENERIC = new Set(['cry', 'sound', 'noise', 'call', 'utter', 'utterance']);
const PLURALS = { geese: 'goose', mice: 'mouse', wolves: 'wolf', bovines: 'bovine', calves: 'calf', oxen: 'ox', sheep: 'sheep', cattle: 'cattle' };

const animalNames = (dir = join(WORLDS_DIR, 'k.animals', 'shards')) => {
  const names = new Set();
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sop') && x !== SHARD).sort())
    for (const m of readFileSync(join(dir, f), 'utf8').matchAll(/^@\S+ k\.animals\.animal name=("[^"]*"|\S+)/gm)) names.add(m[1].startsWith('"') ? JSON.parse(m[1]) : m[1]);
  return [...names].sort(byText);
};
// The sounds already told on an animal (the hand table and the PSys2 shard), to say which WordNet confirms.
const toldSounds = (dir = join(WORLDS_DIR, 'k.animals', 'shards')) => {
  const told = new Map();
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sop') && x !== SHARD).sort())
    for (const line of readFileSync(join(dir, f), 'utf8').split('\n')) {
      const m = line.match(/^@\S+ k\.animals\.animal name=("[^"]*"|\S+)/);
      if (!m) continue;
      const name = m[1].startsWith('"') ? JSON.parse(m[1]) : m[1];
      for (const s of line.matchAll(/ sound=(\S+)/g)) { if (!told.has(name)) told.set(name, new Set()); told.get(name).add(s[1]); }
    }
  return told;
};

// The rank of a word in the frequency lists (FrequencyWords, then wordfreq after it): which lemmas are kept, in which order.
const frequencyRanks = () => {
  const rank = new Map();
  readFileSync(join(REPO, 'sources/frequency-words/raw/en_50k.txt'), 'utf8').split('\n').forEach((l, i) => { const w = l.split(' ')[0]; if (w && !rank.has(w)) rank.set(w, i + 1); });
  readFileSync(join(REPO, 'sources/wordfreq/raw/en-top50k.tsv'), 'utf8').split('\n').slice(1).forEach((l) => { const [r, w] = l.split('\t'); if (w && !rank.has(w)) rank.set(w, 100000 + Number(r)); });
  return rank;
};

export function animalSounds({ dict = DICT, names = animalNames(), told = toldSounds(), ranks = frequencyRanks() } = {}) {
  const read = (f) => readFileSync(join(dict, f), 'latin1');
  const noun = readData(read('data.noun')), verb = readData(read('data.verb'));
  const nounIndex = readIndex(read('index.noun')), verbIndex = readIndex(read('index.verb'));
  const lexOf = new Map();
  for (const [f, tag] of [['data.noun', 'n'], ['data.verb', 'v']]) for (const line of read(f).split('\n')) if (/^\d{8} /.test(line)) lexOf.set(`${tag}${line.slice(0, 8)}`, line.slice(9, 11));
  const ups = (offset) => noun.get(offset)?.pointers.filter(([sym, , pos]) => (sym === '@' || sym === '@i') && pos === 'n').map(([, off]) => off) ?? [];
  const under = (offset, root, depth = 30, seen = new Set()) => offset === root || (depth > 0 && !seen.has(offset) && (seen.add(offset), ups(offset).some((o) => under(o, root, depth - 1, seen))));
  const animalSense = (word) => (nounIndex.get(word.toLowerCase().replace(/ /g, '_')) ?? []).find((o) => under(o, ANIMAL_ROOT));
  // the animals of k.animals by WordNet sense
  const byOffset = new Map();
  for (const name of names) { const o = animalSense(name); if (o) { if (!byOffset.has(o)) byOffset.set(o, []); byOffset.get(o).push(name); } }
  // the animal a word of a gloss names (singular or plural)
  const singular = (w) => [w, PLURALS[w], w.replace(/ies$/, 'y'), w.replace(/ves$/, 'f'), w.replace(/es$/, ''), w.replace(/s$/, '')].filter(Boolean);
  const mentioned = (text) => {
    const toks = text.toLowerCase().replace(/[^a-z' -]/g, ' ').split(/\s+/).filter(Boolean);
    const out = new Map();
    for (let i = 0; i < toks.length; i++) {
      for (const n of [2, 1]) {
        if (i + n > toks.length) continue;
        const next = toks[i + n];
        if (next !== undefined && !ENDS.has(next)) continue;
        const span = toks.slice(i, i + n).join(' ');
        const hit = singular(span).map((w) => [w, animalSense(w)]).find(([, o]) => o);
        if (hit) { out.set(hit[1], hit[0]); i += n - 1; break; }
      }
    }
    return out;
  };
  // the k.animals animals a mention is (its own sense, or a sense one or two steps above it: a hen is a chicken)
  const animalsOf = (offset) => {
    const found = [];
    const walk = (o, d) => { for (const n of byOffset.get(o) ?? []) found.push([n, d]); if (d < 2) for (const u of ups(o)) walk(u, d + 1); };
    walk(offset, 0);
    const best = Math.min(...found.map(([, d]) => d));
    return found.filter(([, d]) => d === best).map(([n]) => n);
  };
  const facts = new Map(); // animal -> Map(sound -> { pos, gloss, via })
  const left = [];
  for (const [pos, data, index, files, tag] of [['noun', noun, nounIndex, NOUN_FILES, 'n'], ['verb', verb, verbIndex, VERB_FILES, 'v']]) {
    for (const [offset, s] of [...data].sort(([a], [b]) => byText(a, b))) {
      if (!files.includes(lexOf.get(`${tag}${offset}`))) continue;
      const def = shortGloss(s.gloss).toLowerCase().replace(WIDENS, '').trim();
      if (!SOUNDISH.test(def)) continue;
      if (lexOf.get(`${tag}${offset}`) === '10' && !/\bas of an? \w+/.test(def)) continue; // noun.communication: only "(as of a frog)"
      if (COMPARES.test(def)) { if ([...mentioned(def)].length) left.push(`${s.words[0]} (${pos}): compares: ${def}`); continue; }
      let mentions = mentioned(def.replace(/\b(sound|noise|cry|call|song|bark|roar|whistle|hiss|chirp|squeal|squawk|bray|howl)\b/g, ' '));
      // the lemmas whose first sense of this part of speech is this synset and that a frequency list has (the first
      // lemma always; no phrase, no -ing form, no word for any sound)
      const words = s.words.map((w) => w.toLowerCase()).filter((w, i) => i === 0 || (!w.includes('_') && !w.endsWith('ing') && ranks.has(w) && (index.get(w) ?? [])[0] === offset)).map((w) => w.replace(/_/g, ' ')).filter((w) => !GENERIC.has(w));
      if (!words.length) continue;
      // an example sentence counts where the definition names no animal: only an example whose animal makes the sound
      // with a form of the synset's own word ("bees were buzzing around the hive", "Elephants are trumpeting")
      if (!mentions.size) {
        const forms = new RegExp(`\\b(${words.map((w) => w.replace(/e$/, '')).join('|')})\\w*`);
        for (const ex of s.gloss.match(/"[^"]*"/g) ?? []) if (forms.test(ex.toLowerCase())) for (const [o, w] of mentioned(ex.replace(/"/g, '').toLowerCase().replace(forms, ' is'))) mentions.set(o, w);
      }
      if (!mentions.size) continue;
      for (const [o, word] of mentions) for (const animal of animalsOf(o)) {
        if (!facts.has(animal)) facts.set(animal, new Map());
        const via = word === animal || singular(animal).includes(word) ? undefined : word;
        for (const w of words) { const had = facts.get(animal).get(w); if (!had || (had.via && !via)) facts.get(animal).set(w, { pos, gloss: `${s.words[0].replace(/_/g, ' ')} (${pos}): ${def}`, via }); }
      }
    }
  }
  const lines = [], confirmed = [], added = [];
  for (const animal of [...facts.keys()].sort(byText)) {
    // the sounds a gloss says of the animal itself first, then those of a kind of it (howl: of a hound); the nouns of
    // noun.event ("the sound made by a dog") before the verbs; then by frequency
    const f = facts.get(animal);
    const sounds = [...f.keys()].sort((a, b) => (f.get(a).via ? 1 : 0) - (f.get(b).via ? 1 : 0) || (f.get(a).pos === 'noun' ? 0 : 1) - (f.get(b).pos === 'noun' ? 0 : 1) || (ranks.get(a) ?? 1e9) - (ranks.get(b) ?? 1e9) || byText(a, b));
    lines.push(`# ${animal}: ${[...new Set([...facts.get(animal).values()].map((x) => x.gloss + (x.via ? ` [${x.via}]` : '')))].join('; ')}`);
    lines.push(wire(`k.animals.sound.${seg(animal)}`, 'k.animals.animal', [['name', animal], ...sounds.map((s) => ['sound', s])], SOURCE));
    for (const s of sounds) (told.get(animal)?.has(s) ? confirmed : added).push(`${animal} ${s}`);
  }
  const silent = names.filter((n) => !facts.has(n) && !told.has(n));
  return { lines, confirmed, added, left, silent, animals: facts.size, unknown: names.filter((n) => !animalSense(n)) };
}

export function soundShard(result = animalSounds()) {
  return `${header({ id: 'k.animals/shards/sounds', about: `the sounds of ${result.animals} animals as WordNet's glosses name them ("moo: the sound made by a cow or bull"): one wire per animal with its sounds (the key sound, joined to k.words by word); the wires merge with the animal's other wires. Each wire follows a comment with the glosses it rests on (in brackets the word of the gloss where it names a kind of the animal: hen for chicken). Written by tools/animal-sounds.mjs, which says which glosses count.`,
    sources: ['wordnet 3.1 (Princeton WordNet 3.1, the glosses of noun.event, verb.communication and verb.perception)'], license: 'WordNet-3.0', script: 'tools/animal-sounds.mjs' })}\n${result.lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = animalSounds();
  if (!process.argv.includes('--report')) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(join(WORLDS_DIR, 'k.animals', 'shards', SHARD), soundShard(r));
  }
  console.log(`animals with a WordNet sound: ${r.animals}; pairs confirming a told sound: ${r.confirmed.length}; new pairs: ${r.added.length}`);
  console.log(`new: ${r.added.join(', ')}`);
  console.log(`left out (compares): ${r.left.join(' | ')}`);
  console.log(`animals with no sound at all (${r.silent.length}): ${r.silent.join(', ')}`);
  console.log(`names with no WordNet animal sense (${r.unknown.length}): ${r.unknown.join(', ')}`);
}
