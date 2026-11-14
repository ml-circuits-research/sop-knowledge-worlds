// WordNet 3.1 -> k.words shards. Noun and verb senses of the words of a frequency list: a short gloss, synonyms,
// is-a (hypernyms), instance-of, part-of (part holonyms), and irregular forms as core.word facts.
// Deterministic: the same input gives byte-identical shards.
//   node tools/import/wordnet.mjs [--dict sources/wordnet/raw/wordnet31] [--freq sources/frequency-words/raw/en_50k.txt]
//                                 [--out docs/worlds/k.words/shards]
// How to fetch the raw files: sources/wordnet/SOURCE.md and sources/frequency-words/SOURCE.md.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { byText, seg, wire, text, header, writeShards, splitParts } from './lib.mjs';

export const SOURCE = 'wordnet 3.1';
export const WORD_LIMIT = 20000;   // the first lines of the frequency list
export const SENSE_LIMIT = 3;      // the most frequent senses of a word per part of speech (WordNet's order)
const POS = { n: 'noun', v: 'verb', a: 'adjective', r: 'adverb' };
const FILE = { n: 'noun', v: 'verb', a: 'adj', r: 'adv' };
export const COMMON_LIMIT = 3000;  // Round 9: the lines of the list whose words also get adjective and adverb senses and the chain `kind_of`
// Senses that WordNet itself marks as slurs or vulgar are left out (the worlds are also read by children's applications).
const OFFENSIVE = /ethnic slur|\((?:[a-z]+ )?(?:offensive|vulgar|obscene|taboo|derogatory)(?: [a-z]+)?\)|\b(?:offensive|derogatory|disparaging|obscene|vulgar|insulting|contemptuous|pejorative) (?:terms?|names?|words?|slang|expression)\b/i;
const LEMMA = /^[a-z][a-z0-9-]*$/; // what can be an atom and a segment of an id
// Q36: a name of several words, as WordNet writes it (manta_ray); its `word` is written with spaces ("manta ray")
const MULTI = /^[a-z][a-z0-9-]*(_[a-z][a-z0-9-]*)+$/;
// Words other worlds asked for, kept with every part of speech as common words whatever their place in the frequency
// list (reviewer block "16:10": the 9 lemmas of w.lang.ro's dictionary that had no English sense; the adjectives of
// text style and orientation that commands use).
export const ASKED = ['anterior', 'bold', 'horizontal', 'italic', 'sandy', 'thick', 'thicken', 'vertical'];
// Senses WordNet 3.1 does not have, written by hand (hand-core 1, CC0-1.0) into a shard of their own, `hand.sop`, so
// that no wire of another licence shares a shard with them. `n` counts on from WordNet's senses of that part of
// speech (none for these). "numbered" is in WordNet only as a form of the verb number ("give numbers to").
export const HAND_SENSES = [
  { word: 'numbered', pos: 'adjective', n: 1, gloss: 'marked with numbers that give an order', synonym: [], why: 'w.lang.ro numerotat; WordNet 3.1 has only the verb number, sense 2 "give numbers to"' },
];
const keyOf = (name) => String(name).toLowerCase().trim().replace(/\s+/g, '_');
const kept = (w) => LEMMA.test(w) || MULTI.test(w);

// A data.<pos> file: synset offset -> { words (as spelt), pointers [symbol, offset, pos], gloss }.
export function readData(text) {
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
    // A pointer: [symbol, offset, pos, source word number, target word number] (0 and 0: between the synsets).
    for (let i = 0; i < pointerCount; i++, at += 4) pointers.push([f[at], f[at + 1], f[at + 2], parseInt(f[at + 3].slice(0, 2), 16), parseInt(f[at + 3].slice(2), 16)]);
    synsets.set(f[0], { words, pointers, kind: f[2], gloss: bar < 0 ? '' : line.slice(bar + 3).trim() });
  }
  return synsets;
}

// An index.<pos> file: lemma (lower case) -> synset offsets, the most frequent sense first.
export function readIndex(text) {
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
// extra (Round 10, item 2): Map(word -> noun synset offset) of words that are kept whatever their place in the
// frequency list, each with that sense even when it is not among the first senses: the common things of
// tools/coverage.mjs with the sense kept there (427 of them come after the 20,000th line of the list).
// Round 9: the common words are those of the first `commonLimit` lines of the list and the words of `extra`: they
// also get their adjective and adverb senses (files 'index.adj', 'data.adj', 'index.adv', 'data.adv', where given)
// and, on their noun and verb senses, the chain `kind_of`. Every sense gets its `opposite`.
// asked: words kept as common words whatever their place in the list (ASKED). hand: senses written by hand (HAND_SENSES),
// written to the shard `hand.sop` with their own header; a hand sense of a word and part of speech WordNet has is refused.
export function importWordnet(files, freq, { wordLimit = WORD_LIMIT, senseLimit = SENSE_LIMIT, commonLimit = COMMON_LIMIT, limits, extra = new Map(), asked = [], hand = [] } = {}) {
  const wanted = new Set([...extra.keys(), ...asked].map(keyOf).filter(kept));
  extra = new Map([...extra].map(([k, v]) => [keyOf(k), v]));
  const common = new Set(commonLimit > 0 ? wanted : asked.map(keyOf));
  for (const line of freq.split('\n').slice(0, commonLimit)) {
    const w = line.trim().split(/\s+/)[0]?.toLowerCase();
    if (w && LEMMA.test(w)) common.add(w);
  }
  for (const line of freq.split('\n').slice(0, wordLimit)) {
    const w = line.trim().split(/\s+/)[0]?.toLowerCase();
    if (w && LEMMA.test(w)) wanted.add(w);
  }
  const stats = { listed: wanted.size, words: 0, senses: 0, skipped: 0, forms: 0, spellings: 0, shards: 0, opposites: 0, nearOpposites: 0, chains: 0 };
  const groups = new Map(); // lemma -> { lemma, senses, words }
  const group = (lemma) => {
    if (!groups.has(lemma)) groups.set(lemma, { lemma, senses: [], words: [] });
    return groups.get(lemma);
  };
  // Adjectives and adverbs (Round 9) only where their files are given, and only for the common words.
  for (const p of ['n', 'v', 'a', 'r'].filter((x) => files[`data.${FILE[x]}`])) {
    const pos = POS[p];
    const data = readData(files[`data.${FILE[p]}`]);
    const index = readIndex(files[`index.${FILE[p]}`]);
    const keep = p === 'n' || p === 'v' ? wanted : common;
    // The word a lexical pointer of a synset leads to: the antonym of one word of the synset is one word of another.
    const lexical = (s, own, symbol) => [...new Set(s.pointers.filter(([sym, off, tp, from]) => sym === symbol && data.has(off) && (tp === p || (p === 'a' && tp === 's'))
      && (from === 0 || s.words[from - 1]?.toLowerCase() === own.toLowerCase())).map(([, off, , , to]) => spelt(data.get(off).words[to > 0 ? to - 1 : 0])))];
    // The chain of kinds: the first hypernym of the sense, its first hypernym, and so on to the top; nearest first.
    const chain = (offset) => {
      const out = [], seen = new Set([offset]);
      for (let at = offset; ;) {
        const up = data.get(at).pointers.find(([sym, off, tp]) => (sym === '@' || sym === '@i') && tp === p && data.has(off));
        if (!up || seen.has(up[1])) break;
        seen.add(up[1]);
        out.push(spelt(data.get(up[1]).words[0]));
        at = up[1];
      }
      return out;
    };
    for (const lemma of [...index.keys()].filter((l) => keep.has(l)).sort(byText)) {
      const g = group(lemma);
      const all = index.get(lemma);
      const kept = all.map((offset, i) => [offset, i]).filter(([offset, i]) => i < senseLimit || (p === 'n' && extra.get(lemma) === offset));
      kept.forEach(([offset, i]) => {
        const s = data.get(offset);
        if (OFFENSIVE.test(s.gloss)) { stats.skipped++; return; }
        const own = s.words.find((w) => w.toLowerCase() === lemma) ?? lemma;
        const others = s.words.filter((w) => w !== own);
        const targets = (symbol) => [...new Set(s.pointers.filter(([sym, , tp]) => sym === symbol && tp === p)
          .map(([, off]) => spelt(data.get(off).words[0])))];
        // Round 9. The opposite: WordNet's antonym of this word in this sense. Where an adjective has none of its own
        // but is filed as similar to one that has (huge is similar to large, the opposite of small), the opposite of
        // that one is its near opposite. The chain of kinds: for the noun and verb senses of the common words.
        const opposite = lexical(s, own, '!');
        const near = opposite.length || p !== 'a' ? [] : [...new Set(s.pointers.filter(([sym, off]) => sym === '&' && data.has(off)).flatMap(([, off]) => lexical(data.get(off), data.get(off).words[0], '!')))];
        const kinds = (p === 'n' || p === 'v') && common.has(lemma) ? chain(offset) : [];
        const line = wire(`k.words.${seg(lemma)}.${pos}.${i + 1}`, 'k.words.sense', [
          ['word', spelt(own)], ['pos', pos], ['n', i + 1], ['gloss', text(shortGloss(s.gloss))],
          ...[...new Set(others.map(spelt))].filter((w) => w !== spelt(own)).map((w) => ['synonym', w]),
          ...targets('@').map((w) => ['is_a', w]),
          ...targets('@i').map((w) => ['instance_of', w]),
          ...targets('#p').map((w) => ['part_of', w]),
          ...opposite.map((w) => ['opposite', w]),
          ...near.map((w) => ['near_opposite', w]),
          ...kinds.map((w) => ['kind_of', w]),
        ], SOURCE);
        stats.opposites += opposite.length ? 1 : 0;
        stats.nearOpposites += near.length ? 1 : 0;
        stats.chains += kinds.length ? 1 : 0;
        g.senses.push(line);
        stats.senses++;
        if (own !== lemma && !g.words.some((x) => x.own === own)) g.words.push({ own });
      });
    }
    // Irregular forms (children -> child), for the words kept.
    for (const line of (files[`${FILE[p]}.exc`] ?? '').split('\n')) {
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
    for (const own of spellings) lines.push(wire(`k.words.${seg(lemma)}.spelling.${seg(own)}`, 'core.word', [['text', spelt(lemma)], ['means', spelt(own)], ['of', 'k.words.sense.word']], SOURCE));
    if (forms.length) lines.push(wire(`k.words.${seg(lemma)}.forms`, 'core.word', [...forms.map((f) => ['text', spelt(f)]), ['means', spelt(lemma)], ['of', 'k.words.sense.word']], SOURCE));
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
        about: `senses of the words from "${spelt(first)}" to "${spelt(last)}" (first letters "${b}"${parts.length > 1 ? `, part ${i + 1} of ${parts.length}` : ''}).`,
        sources: [`wordnet 3.1 (Princeton WordNet 3.1; words chosen with frequency-words 2018, the 20,000 most frequent${extra.size ? ', and the common things of tools/coverage.mjs' : ''})`],
        license: 'WordNet-3.0',
        script: 'tools/import/wordnet.mjs',
      })}\n${part.flatMap((g) => g.lines).join('\n')}\n`;
      stats.shards++;
    });
  }
  // Hand senses (HAND_SENSES): one shard of their own, CC0.
  const handLines = [];
  for (const h of hand) {
    const p = Object.keys(POS).find((x) => POS[x] === h.pos);
    if (readIndex(files[`index.${FILE[p]}`] ?? '').has(keyOf(h.word))) throw new Error(`hand sense ${h.word} ${h.pos}: WordNet has this word as ${h.pos}`);
    handLines.push(wire(`k.words.${seg(keyOf(h.word))}.${h.pos}.${h.n}`, 'k.words.sense', [['word', h.word], ['pos', h.pos], ['n', h.n], ['gloss', text(h.gloss)], ...h.synonym.map((w) => ['synonym', w])], 'hand-core 1'));
  }
  if (handLines.length) {
    out['hand.sop'] = `${header({
      id: 'k.words/shards/hand',
      about: 'senses WordNet 3.1 does not have, asked for by other worlds and written by hand (tools/import/wordnet.mjs HAND_SENSES says why each).',
      sources: ['hand-core 1 (written in this repository)'],
      license: 'CC0-1.0',
      script: 'tools/import/wordnet.mjs',
    })}\n${handLines.join('\n')}\n`;
    stats.hand = handLines.length;
    stats.shards++;
  }
  return { files: out, stats };
}

// `extra`: the names of the hand-written worlds, then the common things with the sense kept for each (these win).
export async function extraWords(files, worldsDir) {
  return new Map([...coreNames(files, worldsDir), ...await commonThings()]);
}

// The common things and the sense kept for each (tools/coverage.mjs), for `extra`.
export async function commonThings() {
  const { run } = await import('../coverage.mjs');
  return new Map(run().list.map((e) => [e.word, e.sense]));
}

// The names of the hand-written worlds (R11.1 left this cause to this tool: "What is a kilogram?" found no
// definition, since `k.words` kept only frequent words). For each type that names things, the WordNet synsets its
// things fall under (ROOTS); a name that is one word and has no sense yet is kept with its first noun sense that
// lies under one of them (through is-a or instance-of): `emu` under animal, `kilogram` under unit of measurement,
// `Mars` the planet, not the god. Names of several words are taken too (Q36: manta ray, light year), as WordNet
// writes them (manta_ray), with `word` written with spaces.
export const CORE_ROOTS = {
  // Q36: edible fat (olive oil) and topping (whipped cream) are food; a galaxy, the solar system and a black hole are
  // things of space though WordNet files them as a collection, a system and a region; an operator (bus driver) is a person.
  'k.animals.animal': ['00015568'], 'k.food.food': ['00021445', '07571428', '07687880', '07637385'], 'k.units.unit': ['13604927'], 'k.body.part': ['05227735'],
  'k.space.body': ['09262646', '08287963', '09462337', '09246084'], 'k.space.kind': ['09262646', '08287963', '09462337', '09246084'],
  'k.shapes.shape': ['05071206', '00028005'], 'k.colours.colour': ['04963771'],
  'k.people.role': ['00007846', '10398111'], 'k.wearables.wearable': ['03055525', '03602662', '03127399'], 'k.time.duration': ['15137796'],
};
export function coreNames(files, worldsDir) {
  const data = readData(files['data.noun']), index = readIndex(files['index.noun']);
  const under = (offset, roots, seen = new Set()) => {
    if (roots.includes(offset)) return true;
    if (seen.has(offset) || !data.has(offset)) return false;
    seen.add(offset);
    return data.get(offset).pointers.some(([sym, off, tp]) => (sym === '@' || sym === '@i') && tp === 'n' && under(off, roots, seen));
  };
  const out = new Map();
  for (const [type, roots] of Object.entries(CORE_ROOTS)) {
    const world = type.split('.').slice(0, 2).join('.');
    let dir;
    try { dir = readdirSync(join(worldsDir, world, 'shards')); } catch { continue; }
    for (const f of dir.filter((x) => x.endsWith('.sop')).sort()) {
      for (const m of readFileSync(join(worldsDir, world, 'shards', f), 'utf8').matchAll(new RegExp(`^@\\S+ ${type.replace(/\./g, '\\.')} name=("[^"]*"|\\S+)`, 'gm'))) {
        const name = keyOf(m[1].startsWith('"') ? JSON.parse(m[1]) : m[1]);
        if (!kept(name) || out.has(name)) continue;
        const sense = (index.get(name) ?? []).find((o) => under(o, roots));
        if (sense) out.set(name, sense);
      }
    }
  }
  return out;
}

// Not awaited at the top level: tools/coverage.mjs imports this module.
async function main() {
  const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? dflt : process.argv[i + 1]; };
  const dict = arg('dict', join(repo, 'sources/wordnet/raw/wordnet31'));
  const files = Object.fromEntries(['index.noun', 'data.noun', 'index.verb', 'data.verb', 'noun.exc', 'verb.exc', 'index.adj', 'data.adj', 'adj.exc', 'index.adv', 'data.adv', 'adv.exc'].map((f) => [f, readFileSync(join(dict, f), 'latin1')]));
  const freq = readFileSync(arg('freq', join(repo, 'sources/frequency-words/raw/en_50k.txt')), 'utf8');
  const { files: out, stats } = importWordnet(files, freq, { extra: await extraWords(files, join(repo, 'docs/worlds')), asked: ASKED, hand: HAND_SENSES });
  writeShards(arg('out', join(repo, 'docs/worlds/k.words/shards')), out);
  console.log(JSON.stringify(stats));
}
if (import.meta.url === `file://${process.argv[1]}`) main();
