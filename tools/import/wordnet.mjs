// WordNet 3.1 -> k.words shards. Noun and verb senses of the words of a frequency list: a short gloss, synonyms,
// is-a (hypernyms), instance-of, part-of (part holonyms), and irregular forms as core.word facts.
// Deterministic: the same input gives byte-identical shards.
//   node tools/import/wordnet.mjs [--dict sources/wordnet/raw/wordnet31] [--freq sources/frequency-words/raw/en_50k.txt]
//                                 [--out docs/worlds/k.words/shards]
// How to fetch the raw files: sources/wordnet/SOURCE.md and sources/frequency-words/SOURCE.md.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { byText, seg, wire, text, header, writeShards, splitParts } from './lib.mjs';

export const SOURCE = 'wordnet 3.1';
export const WORD_LIMIT = 20000;   // the first lines of the frequency list
export const SENSE_LIMIT = 3;      // the most frequent senses of a word per part of speech (WordNet's order)
const POS = { n: 'noun', v: 'verb' };
// Senses that WordNet itself marks as slurs or vulgar are left out (the worlds are also read by children's applications).
const OFFENSIVE = /ethnic slur|\((?:[a-z]+ )?(?:offensive|vulgar|obscene|taboo|derogatory)(?: [a-z]+)?\)|\b(?:offensive|derogatory|disparaging|obscene|vulgar|insulting|contemptuous|pejorative) (?:terms?|names?|words?|slang|expression)\b/i;
const LEMMA = /^[a-z][a-z0-9-]*$/; // what can be an atom and a segment of an id

// A data.<pos> file: synset offset -> { words (as spelt), pointers [symbol, offset, pos], gloss }.
function readData(text) {
  const synsets = new Map();
  for (const line of text.split('\n')) {
    if (!/^\d{8} /.test(line)) continue;
    const bar = line.indexOf(' | ');
    const f = line.slice(0, bar < 0 ? undefined : bar).trim().split(' ');
    const count = parseInt(f[3], 16);
    const words = [];
    for (let i = 0; i < count; i++) words.push(f[4 + 2 * i].replace(/\([a-z]+\)$/, ''));
    let at = 4 + 2 * count;
    const pointerCount = Number(f[at++]);
    const pointers = [];
    for (let i = 0; i < pointerCount; i++, at += 4) pointers.push([f[at], f[at + 1], f[at + 2]]);
    synsets.set(f[0], { words, pointers, gloss: bar < 0 ? '' : line.slice(bar + 3).trim() });
  }
  return synsets;
}

// An index.<pos> file: lemma (lower case) -> synset offsets, the most frequent sense first.
function readIndex(text) {
  const index = new Map();
  for (const line of text.split('\n')) {
    if (line.startsWith(' ') || line.trim() === '') continue;
    const f = line.trim().split(' ');
    const pointerKinds = Number(f[3]);
    const senses = Number(f[2]);
    index.set(f[0], f.slice(6 + pointerKinds, 6 + pointerKinds + senses));
  }
  return index;
}

// The definition of a gloss, without its example sentences.
export const shortGloss = (gloss) => {
  const cut = gloss.search(/;\s*"/);
  return (cut < 0 ? gloss : gloss.slice(0, cut)).replace(/\s+/g, ' ').replace(/[;:,\s]+$/, '').trim();
};

const spelt = (word) => word.replace(/_/g, ' ');
export const bucketOf = (lemma) => (/^[a-z]{2}/.test(lemma) ? lemma.slice(0, 2) : lemma[0]);

// files: { 'index.noun', 'data.noun', 'index.verb', 'data.verb', 'noun.exc', 'verb.exc' } as text; freq: the list as text.
export function importWordnet(files, freq, { wordLimit = WORD_LIMIT, senseLimit = SENSE_LIMIT, limits } = {}) {
  const wanted = new Set();
  for (const line of freq.split('\n').slice(0, wordLimit)) {
    const w = line.trim().split(/\s+/)[0]?.toLowerCase();
    if (w && LEMMA.test(w)) wanted.add(w);
  }
  const stats = { listed: wanted.size, words: 0, senses: 0, skipped: 0, forms: 0, spellings: 0, shards: 0 };
  const groups = new Map(); // lemma -> { lemma, senses, words }
  const group = (lemma) => {
    if (!groups.has(lemma)) groups.set(lemma, { lemma, senses: [], words: [] });
    return groups.get(lemma);
  };
  for (const p of ['n', 'v']) {
    const pos = POS[p];
    const data = readData(files[`data.${pos}`]);
    const index = readIndex(files[`index.${pos}`]);
    for (const lemma of [...index.keys()].filter((l) => wanted.has(l)).sort(byText)) {
      const g = group(lemma);
      index.get(lemma).slice(0, senseLimit).forEach((offset, i) => {
        const s = data.get(offset);
        if (OFFENSIVE.test(s.gloss)) { stats.skipped++; return; }
        const own = s.words.find((w) => w.toLowerCase() === lemma) ?? lemma;
        const targets = (symbol) => [...new Set(s.pointers.filter(([sym, , tp]) => sym === symbol && tp === p)
          .map(([, off]) => spelt(data.get(off).words[0])))];
        const line = wire(`k.words.${seg(lemma)}.${pos}.${i + 1}`, 'k.words.sense', [
          ['word', own], ['pos', pos], ['n', i + 1], ['gloss', text(shortGloss(s.gloss))],
          ...[...new Set(s.words.filter((w) => w !== own).map(spelt))].map((w) => ['synonym', w]),
          ...targets('@').map((w) => ['is_a', w]),
          ...targets('@i').map((w) => ['instance_of', w]),
          ...targets('#p').map((w) => ['part_of', w]),
        ], SOURCE);
        g.senses.push(line);
        stats.senses++;
        if (own !== lemma && !g.words.some((x) => x.own === own)) g.words.push({ own });
      });
    }
    // Irregular forms (children -> child), for the words kept.
    for (const line of files[`${pos}.exc`].split('\n')) {
      const [form, ...bases] = line.trim().split(/\s+/);
      if (!form || !LEMMA.test(form)) continue;
      for (const base of bases) {
        if (!groups.has(base) || form === base || !index.has(base)) continue;
        const g = groups.get(base);
        if (!g.words.some((x) => x.form === form)) g.words.push({ form });
      }
    }
  }
  const buckets = new Map();
  for (const lemma of [...groups.keys()].sort(byText)) {
    const g = groups.get(lemma);
    if (!g.senses.length) continue;
    const lines = [...g.senses];
    // One core.word per word that has other spellings or irregular forms: text= each of them, means= the word.
    const spellings = g.words.filter((x) => x.own).map((x) => x.own).sort(byText);
    const forms = g.words.filter((x) => x.form).map((x) => x.form).sort(byText);
    stats.spellings += spellings.length;
    stats.forms += forms.length;
    // A spelling with a capital (China) is its own value of `word`; lower case text finds it.
    for (const own of spellings) lines.push(wire(`k.words.${seg(lemma)}.spelling.${seg(own)}`, 'core.word', [['text', lemma], ['means', own], ['of', 'k.words.sense.word']], SOURCE));
    if (forms.length) lines.push(wire(`k.words.${seg(lemma)}.forms`, 'core.word', [...forms.map((f) => ['text', f]), ['means', lemma], ['of', 'k.words.sense.word']], SOURCE));
    const b = bucketOf(lemma);
    if (!buckets.has(b)) buckets.set(b, []);
    buckets.get(b).push({ lemma, lines });
    stats.words++;
  }
  const out = {};
  for (const b of [...buckets.keys()].sort(byText)) {
    const parts = splitParts(buckets.get(b), limits);
    parts.forEach((part, i) => {
      const name = parts.length === 1 ? b : `${b}-${i + 1}`;
      const first = part[0].lemma, last = part[part.length - 1].lemma;
      out[`${name}.sop`] = `${header({
        id: `k.words/shards/${name}`,
        about: `noun and verb senses of the words from "${first}" to "${last}" (first letters "${b}"${parts.length > 1 ? `, part ${i + 1} of ${parts.length}` : ''}).`,
        sources: ['wordnet 3.1 (Princeton WordNet 3.1; words chosen with frequency-words 2018, the 20,000 most frequent)'],
        license: 'WordNet-3.0',
        script: 'tools/import/wordnet.mjs',
      })}\n${part.flatMap((g) => g.lines).join('\n')}\n`;
      stats.shards++;
    });
  }
  return { files: out, stats };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? dflt : process.argv[i + 1]; };
  const dict = arg('dict', join(repo, 'sources/wordnet/raw/wordnet31'));
  const files = Object.fromEntries(['index.noun', 'data.noun', 'index.verb', 'data.verb', 'noun.exc', 'verb.exc'].map((f) => [f, readFileSync(join(dict, f), 'latin1')]));
  const freq = readFileSync(arg('freq', join(repo, 'sources/frequency-words/raw/en_50k.txt')), 'utf8');
  const { files: out, stats } = importWordnet(files, freq);
  writeShards(arg('out', join(repo, 'docs/worlds/k.words/shards')), out);
  console.log(JSON.stringify(stats));
}
