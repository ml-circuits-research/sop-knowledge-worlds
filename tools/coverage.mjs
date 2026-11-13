// Coverage of common things by k.objects (R4.2): the most frequent English nouns that name a physical thing
// (frequency list x WordNet), which of them have a drawing, and which word without one has a WordNet synonym or
// direct hypernym with a drawing (R4.4). Deterministic.
//   node tools/coverage.mjs            writes docs/worlds/k.objects/MISSING.md and the shard
//                                      docs/worlds/k.objects/shards/words-wordnet.sop, and prints the numbers
//   node tools/coverage.mjs --list     prints the list (rank, word, count, drawing, link) as TSV instead
// The rule, for a word of the frequency list (the word itself, no inflection; rank = its place among the kept words):
//   1. it is a noun lemma of WordNet, spelt with letters only, at least three of them;
//   2. noun is its main use: the tagged-text counts of its noun senses (WordNet's index.sense) are at least those of
//      its verb, adjective and adverb senses together;
//   3. it names a physical thing: its first noun sense, or the noun senses that hold at least half of its noun
//      counts, are hyponyms of physical object, living thing, food or artifact (ROOTS); of these senses the one with
//      the most counts is the sense kept (for the gloss and for R4.4);
//   4. that sense is filed by WordNet's lexicographers under animals, artifacts, food, natural objects or plants,
//      or is one of the top concepts (KINDS). This drops what is under "physical object" but is not a thing one
//      draws: places (noun.location: city, side, America), persons (noun.person: roles and relatives; counted
//      apart, see questions.md Q20), groups, substances;
//      a sense whose synset spells every word with a capital is a proper name (Europe, Mars, Harvard) and is dropped;
//   5. it is not the regular plural of a more frequent noun (rooms, eggs), and no sense of it is marked offensive;
//   6. it is not in sources/coverage/not-things.tsv (looked at by a language model: given names, forms of a verb
//      that are more frequent than the noun, parts and sides that are not things).
// A word has a drawing when a k.objects object has its name (compared in lower case; the plural form of the word,
// as WordNet's rules and exceptions give it, counts too: grape has "grapes").
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds } from './lib/worlds.mjs';
import { readData, readIndex } from './import/wordnet.mjs';
import { wire, seg, header } from './import/lib.mjs';

export const LIMIT = 1500;
// physical object, living thing, food (nutrient), food (solid food), artifact
export const ROOTS = ['00002684', '00004258', '00021445', '07571428', '00022119'];
// Lexicographer files: 03 noun.Tops, 05 noun.animal, 06 noun.artifact, 13 noun.food, 17 noun.object, 20 noun.plant.
export const KINDS = ['03', '05', '06', '13', '17', '20'];
const PERSON_FILE = '18'; // noun.person
const OFFENSIVE = /ethnic slur|\((?:[a-z]+ )?(?:offensive|vulgar|obscene|taboo|derogatory)(?: [a-z]+)?\)|\b(?:offensive|derogatory|disparaging|obscene|vulgar|insulting|contemptuous|pejorative) (?:terms?|names?|words?|slang|expression)\b/i;
const WORD = /^[a-z]{3,}$/;

// The lexicographer file number of every noun synset.
const lexFiles = (text) => { const m = new Map(); for (const line of text.split('\n')) if (/^\d{8} /.test(line)) m.set(line.slice(0, 8), line.slice(9, 11)); return m; };

// index.sense: lemma -> { noun: Map(offset -> tag count), other: tag count of the other parts of speech }.
function tagCounts(text) {
  const counts = new Map();
  for (const line of text.split('\n')) {
    const f = line.trim().split(' ');
    if (f.length < 4) continue;
    const pct = f[0].indexOf('%');
    const lemma = f[0].slice(0, pct), type = f[0][pct + 1], n = Number(f[3]);
    if (!counts.has(lemma)) counts.set(lemma, { noun: new Map(), other: 0 });
    const c = counts.get(lemma);
    if (type === '1') c.noun.set(f[1], n); else c.other += n;
  }
  return counts;
}

// The plural forms of a noun: WordNet's exception list, and the regular endings.
export function plurals(word, exceptions) {
  const out = new Set(exceptions.get(word) ?? []);
  if (/(s|x|z|ch|sh)$/.test(word)) out.add(`${word}es`);
  else if (/[^aeiou]y$/.test(word)) out.add(`${word.slice(0, -1)}ies`);
  else out.add(`${word}s`);
  return [...out];
}

// files: { 'index.noun', 'data.noun', 'noun.exc', 'index.sense' } as text; freq: the frequency list as text;
// objects: the names of the k.objects objects; notThings: the text of not-things.tsv.
// notLinks: the text of not-links.tsv (word, other word, reason): links the rule gives that a look at the drawing refuses.
export function coverage({ files, freq, objects, notThings = '', notLinks = '', limit = LIMIT, roots = ROOTS }) {
  const unlinked = new Set(notLinks.split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t').slice(0, 2).map((x) => x.trim()).join('\t')));
  const data = readData(files['data.noun']);
  const index = readIndex(files['index.noun']);
  const lex = lexFiles(files['data.noun']);
  const tags = tagCounts(files['index.sense']);
  const excluded = new Set(notThings.split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t')[0].trim()));
  const exceptions = new Map();
  for (const line of files['noun.exc'].split('\n')) { const [form, ...bases] = line.trim().split(/\s+/); for (const b of bases) { if (!exceptions.has(b)) exceptions.set(b, []); exceptions.get(b).push(form); } }
  const hypernyms = (offset) => data.get(offset).pointers.filter(([sym, , pos]) => (sym === '@' || sym === '@i') && pos === 'n').map(([, off]) => off);
  const physical = new Map();
  const isPhysical = (offset) => {
    if (physical.has(offset)) return physical.get(offset);
    physical.set(offset, false); // guards against a loop
    const yes = roots.includes(offset) || hypernyms(offset).some(isPhysical);
    physical.set(offset, yes);
    return yes;
  };
  const byName = new Map(); // lower case -> the object's name (the first in sorted order)
  for (const name of [...objects].sort()) if (!byName.has(name.toLowerCase())) byName.set(name.toLowerCase(), name);
  const drawingOf = (word) => byName.get(word) ?? plurals(word, exceptions).map((p) => byName.get(p)).find(Boolean) ?? null;

  const rankOf = new Map(); // word -> its line in the frequency list
  freq.split('\n').forEach((line, i) => { const w = line.trim().split(/\s+/)[0]; if (w && !rankOf.has(w)) rankOf.set(w, i); });
  const singulars = (word) => [...new Set([...(files['noun.exc'].match(new RegExp(`^${word} (.*)$`, 'm'))?.[1].split(' ') ?? []),
    ...(word.endsWith('ies') ? [`${word.slice(0, -3)}y`] : []), ...(word.endsWith('es') ? [word.slice(0, -2)] : []), ...(word.endsWith('s') ? [word.slice(0, -1)] : [])])]
    .filter((b) => b !== word && index.has(b));
  // The sense kept for a word: its physical sense with the most counts (the first of them in WordNet's order when equal).
  const keptSense = (word) => {
    const key = word.replace(/ /g, '_');
    const t = tags.get(key)?.noun ?? new Map();
    const phys = (index.get(key) ?? []).filter(isPhysical);
    return phys.length ? phys.reduce((best, s) => ((t.get(s) ?? 0) > (t.get(best) ?? 0) ? s : best), phys[0]) : null;
  };
  const stats = { nouns: 0, verbOrOther: 0, abstract: 0, otherKinds: 0, plurals: 0, persons: 0, offensive: 0, notThings: 0, kept: 0, drawn: 0, bySynonym: 0, byHypernym: 0 };
  const list = [];
  const persons = [];
  const seen = new Set();
  for (const line of freq.split('\n')) {
    if (list.length >= limit) break;
    const [word, count] = line.trim().split(/\s+/);
    if (!word || !WORD.test(word) || seen.has(word) || !index.has(word)) continue;
    seen.add(word);
    stats.nouns++;
    const senses = index.get(word);
    const t = tags.get(word) ?? { noun: new Map(), other: 0 };
    const nounTags = senses.reduce((n, s) => n + (t.noun.get(s) ?? 0), 0);
    if (t.other > nounTags) { stats.verbOrOther++; continue; }
    const phys = senses.filter(isPhysical);
    const physTags = phys.reduce((n, s) => n + (t.noun.get(s) ?? 0), 0);
    if (!phys.length || !(phys[0] === senses[0] || (physTags > 0 && physTags * 2 >= nounTags))) { stats.abstract++; continue; }
    const sense = keptSense(word);
    if (lex.get(sense) === PERSON_FILE) { stats.persons++; persons.push(word); continue; }
    if (!KINDS.includes(lex.get(sense)) || data.get(sense).words.every((w) => /^[A-Z]/.test(w))) { stats.otherKinds++; continue; }
    if (singulars(word).some((b) => rankOf.get(b) < rankOf.get(word))) { stats.plurals++; continue; }
    if (senses.some((s) => OFFENSIVE.test(data.get(s).gloss))) { stats.offensive++; continue; }
    if (excluded.has(word)) { stats.notThings++; continue; }
    const entry = { rank: list.length + 1, word, count: Number(count), gloss: data.get(sense).gloss.split(';')[0].trim(), drawing: drawingOf(word), link: null };
    if (!entry.drawing) {
      // R4.4: a synonym in the kept sense, then a direct hypernym of it, that has a drawing. The other word must be
      // kept in that same sense too (a bullet is also called a slug, but "slug" is first of all the animal, and so
      // is its drawing). Words of several words are compared with their spaces ("ice cream").
      const spelt = (w) => w.replace(/_/g, ' ').toLowerCase();
      const drawn = (synset) => data.get(synset).words.map(spelt).filter((w) => w !== word && keptSense(w) === synset && !unlinked.has(`${word}\t${w}`)).map((w) => [w, drawingOf(w)]).find(([, d]) => d);
      const synonym = drawn(sense);
      const hyper = synonym ? null : hypernyms(sense).map(drawn).find(Boolean);
      if (synonym) entry.link = { kind: 'synonym', word: synonym[0], drawing: synonym[1] };
      else if (hyper) entry.link = { kind: 'hypernym', word: hyper[0], drawing: hyper[1] };
    }
    list.push(entry);
  }
  stats.kept = list.length;
  stats.drawn = list.filter((e) => e.drawing).length;
  stats.bySynonym = list.filter((e) => e.link?.kind === 'synonym').length;
  stats.byHypernym = list.filter((e) => e.link?.kind === 'hypernym').length;
  return { list, stats, persons };
}

export function missingPage({ list, stats, persons }) {
  const missing = list.filter((e) => !e.drawing);
  const pct = (n) => `${(100 * n / list.length).toFixed(1)}%`;
  const num = (n) => String(n).replace(/\B(?=(\d{3})+$)/g, ',');
  const none = list.length - stats.drawn - stats.bySynonym - stats.byHypernym;
  const rows = missing.map((e) => `| ${e.rank} | ${e.word} | ${e.link ? `${e.link.kind} ${e.link.word}${e.link.word === e.link.drawing ? '' : ` (drawing "${e.link.drawing}")`}` : ''} | ${e.gloss.replace(/\|/g, '/')} |`);
  return `# k.objects: common things without a drawing

Generated by \`tools/coverage.mjs\`; do not edit by hand.

The list of common things: the ${num(list.length)} most frequent English words (frequency-words 2018, film and television
subtitles) that are a noun in WordNet 3.1, are mainly used as a noun, and name a physical thing: a hyponym of physical
object, living thing, food or artifact in their first noun sense or in the senses that hold at least half of their
noun counts. Words for persons (WordNet's noun.person: ${num(persons.length)} words before the last of the list, such as
${persons.slice(0, 6).join(', ')}) and the words of \`sources/coverage/not-things.tsv\` are left out. The rule is at
the top of \`tools/coverage.mjs\`.

"Has a drawing" compares names only: the word and the name of a \`k.objects\` object (or its plural). It does not
check that the drawing shows the sense kept here (the drawing \`bank\` is a building, the sense kept is the river
bank).

| | Words | Share |
| --- | --- | --- |
| Common things | ${num(list.length)} | |
| with a drawing of that name | ${stats.drawn} | ${pct(stats.drawn)} |
| without, but a WordNet synonym has a drawing | ${stats.bySynonym} | ${pct(stats.bySynonym)} |
| without, but the direct hypernym has a drawing | ${stats.byHypernym} | ${pct(stats.byHypernym)} |
| with no drawing at all | ${none} | ${pct(none)} |

## The ${missing.length} words without a drawing of their name, most frequent first

"Rank" is the place of the word in the list of common things. "Link" names a WordNet synonym or direct hypernym
that has a drawing; each link is a \`core.word\` fact of the shard \`words-wordnet\`, so that the word finds that
drawing. The gloss is WordNet's, for the sense kept.

| Rank | Word | Link | Sense (WordNet 3.1) |
| --- | --- | --- | --- |
${rows.join('\n')}

Sources of this page: the order of the words is from FrequencyWords 2018 by Hermit Dave (CC BY-SA 4.0, made from
OpenSubtitles 2018); the senses, synonyms and hypernyms are from Princeton WordNet 3.1 (WordNet licence, see
\`k.words/LICENSE\`). This page is under CC BY-SA 4.0.
`;
}

// R4.4: the links as a k.objects shard: a core.word from the word to the object that draws its synonym or its direct
// hypernym, with WordNet as the source. The synonyms first, then the hypernyms, each by word.
export const WORDS_SHARD = 'words-wordnet';
export function wordsShard({ list }) {
  const links = list.filter((e) => e.link).sort((a, b) => (a.word < b.word ? -1 : a.word > b.word ? 1 : 0));
  const lines = (kind, id) => links.filter((e) => e.link.kind === kind)
    .map((e) => wire(`k.objects.wordnet.${id}.${seg(e.word)}`, 'core.word', [['text', e.word], ['means', e.link.drawing], ['of', 'k.objects.object.name']], 'wordnet 3.1'));
  return `${header({
    id: `k.objects/shards/${WORDS_SHARD}`,
    about: 'words for common things that have no drawing of their own: each word names the object that draws its WordNet synonym (the same thing) or its direct hypernym (the kind of thing it is: a puppy is drawn by the dog).',
    sources: ['wordnet 3.1 (Princeton WordNet 3.1: synonyms and direct hypernyms; the words are the common things of tools/coverage.mjs, chosen with frequency-words 2018)'],
    license: 'WordNet-3.0', script: 'tools/coverage.mjs',
  })}\n# The word and the object are the same thing (WordNet synonyms).\n${lines('synonym', 'same').join('\n')}\n\n# The object is the kind of thing the word names (the word's direct hypernym in WordNet).\n${lines('hypernym', 'kind').join('\n')}\n`;
}

// The names of the k.objects objects, read from the shards.
export function objectNames() {
  const names = [];
  for (const shard of scanWorlds().find((w) => w.id === 'k.objects').shards) for (const m of shard.text.matchAll(/ k\.objects\.object name=("[^"]*"|\S+)/g)) names.push(m[1].startsWith('"') ? JSON.parse(m[1]) : m[1]);
  return names;
}

export function run() {
  const dict = join(REPO, 'sources/wordnet/raw/wordnet31');
  const files = Object.fromEntries(['index.noun', 'data.noun', 'noun.exc', 'index.sense'].map((f) => [f, readFileSync(join(dict, f), 'latin1')]));
  const freq = readFileSync(join(REPO, 'sources/frequency-words/raw/en_50k.txt'), 'utf8');
  const read = (name) => { const p = join(REPO, 'sources/coverage', name); return existsSync(p) ? readFileSync(p, 'utf8') : ''; };
  return coverage({ files, freq, objects: objectNames(), notThings: read('not-things.tsv'), notLinks: read('not-links.tsv') });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = run();
  if (process.argv.includes('--list')) {
    for (const e of result.list) console.log([e.rank, e.word, e.count, e.drawing ?? '', e.link ? `${e.link.kind} ${e.link.word} -> ${e.link.drawing}` : '', e.gloss].join('\t'));
  } else {
    writeFileSync(join(WORLDS_DIR, 'k.objects', 'MISSING.md'), missingPage(result));
    writeFileSync(join(WORLDS_DIR, 'k.objects', 'shards', `${WORDS_SHARD}.sop`), wordsShard(result));
    console.log(JSON.stringify(result.stats));
  }
}
