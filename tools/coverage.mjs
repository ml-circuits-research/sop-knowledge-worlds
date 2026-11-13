// Coverage of common things by k.objects (R4.2): the most frequent English nouns that name a physical thing
// (frequency list x WordNet), which of them have a drawing, and which word without one has a WordNet synonym or
// direct hypernym with a drawing (R4.4, R5.1). Deterministic.
//   node tools/coverage.mjs            writes docs/worlds/k.objects/MISSING.md and the shards words-wordnet.sop
//                                      (synonyms, core.word) and stand-ins-wordnet.sop (hypernyms,
//                                      k.objects.stand_in) of docs/worlds/k.objects/shards, and prints the numbers
//   node tools/coverage.mjs --limit 3000   only prints the numbers for a longer list (nothing is written)
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
// The sense check (R5.1, sources/coverage/sense-check.tsv): every drawing of a word's name was looked at next to the
// gloss of the sense kept. Where the drawing shows another sense of the word (the drawing "bank" is a building, the
// sense kept is the river bank), the table names that sense in its last column (the offset of the WordNet noun
// synset; the tool checks that it is a sense of the word and physical, under ROOTS or under physical entity), or
// leaves the column empty when WordNet has no such sense (the drawing "tablet" is a tablet computer).
// Reviewer's answer to Q27 (it takes in Q25): a thing counts as drawn when any drawing in the catalog carries its
// name, whatever the source and whatever WordNet lists. One rule: the sense check takes no drawing away from its
// name; its table stays as the record of what each drawing shows (and of which senses the links may use).
// Two more ways to a drawing, after the WordNet links (Round 7): the word is a core.word of an object in a
// hand-written shard (marsh is a word of the drawing swamp), or sources/coverage/hand-links.tsv links it by hand
// (same: a core.word of the shard words-hand; kind: a stand-in of the shard stand-ins-hand).
// sources/coverage/not-drawable.tsv (R5.3): things that cannot be drawn as an object (materials, substances without
// a container); they leave the list and are named on the page.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds } from './lib/worlds.mjs';
import { readData, readIndex } from './import/wordnet.mjs';
import { wire, seg, header } from './import/lib.mjs';

export const LIMIT = 1500;
// physical object, living thing, food (nutrient), food (solid food), artifact
export const ROOTS = ['00002684', '00004258', '00021445', '07571428', '00022119'];
// Lexicographer files: 03 noun.Tops, 05 noun.animal, 06 noun.artifact, 13 noun.food, 17 noun.object, 20 noun.plant.
// A sense that a drawing may show (Q22): anything under physical entity (a wing is a body part, not an object).
export const PHYSICAL_ENTITY = '00001930';
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
// senseCheck: the text of sense-check.tsv (word, drawing, verdict, note, instead, shown). notDrawable: the text of
// not-drawable.tsv (word, reason).
export function coverage({ files, freq, objects, notThings = '', notLinks = '', senseCheck = '', notDrawable = '', words = new Map(), handLinks = '', limit = LIMIT, roots = ROOTS }) {
  const rowsOf = (text) => text.split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t').map((x) => x.trim()));
  const undrawable = new Map(rowsOf(notDrawable).map(([word, reason]) => [word, reason]));
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
  const isEntity = (offset, seen = new Set()) => roots.includes(offset) || offset === PHYSICAL_ENTITY || (!seen.has(offset) && seen.add(offset) && hypernyms(offset).some((h) => isEntity(h, seen)));
  // Verdict "wrong": the drawing shows another sense than the one kept. It counts as drawn all the same (Q27). The
  // column `shown` names the physical WordNet sense that it shows; it is empty when WordNet has no such sense.
  const other = new Map();
  for (const [word, drawing, verdict, note, instead, shown] of rowsOf(senseCheck)) {
    if (verdict !== 'wrong') continue;
    if (shown && (!(index.get(word) ?? []).includes(shown) || !isEntity(shown))) throw new Error(`sense-check.tsv: ${shown} is not a physical noun sense of "${word}"`);
    other.set(word, { drawing, note, shown: shown || null, instead: instead || null });
  }
  const byName = new Map(); // lower case -> the object's name (the first in sorted order)
  for (const name of [...objects].sort()) if (!byName.has(name.toLowerCase())) byName.set(name.toLowerCase(), name);
  const namedLike = (word) => byName.get(word) ?? plurals(word, exceptions).map((p) => byName.get(p)).find(Boolean) ?? null;
  // The drawing of a word: the object of its name (Q27), whatever sense it shows.
  const drawingOf = namedLike;
  // The drawing of the sense kept, for links: a word whose drawing shows another sense (Q22) is drawn in the sense
  // kept only by the object that the table names (a winery is a kind of plant, the factory: not the green plant).
  const isOther = (word) => other.has(word) && other.get(word).drawing === namedLike(word);
  const keptDrawingOf = (word) => (isOther(word) ? (byName.get(other.get(word).instead?.toLowerCase()) ?? null) : drawingOf(word));

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
  const hand = new Map(rowsOf(handLinks).map(([word, link, drawing]) => [word, { link, drawing }]));
  const stats = { nouns: 0, verbOrOther: 0, abstract: 0, otherKinds: 0, plurals: 0, persons: 0, offensive: 0, notThings: 0, notDrawable: 0, kept: 0, drawn: 0, otherSense: 0, unlistedSense: 0, bySynonym: 0, byHypernym: 0, byWord: 0, byHandSame: 0, byHandKind: 0 };
  const list = [];
  const notDrawn = [];
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
    if (undrawable.has(word)) { stats.notDrawable++; notDrawn.push({ word, reason: undrawable.get(word), gloss: data.get(sense).gloss.split(';')[0].trim() }); continue; }
    const entry = { rank: list.length + 1, word, count: Number(count), gloss: data.get(sense).gloss.split(';')[0].trim(), drawing: drawingOf(word), link: null,
      other: isOther(word) ? other.get(word) : null };
    // A word whose own name is an object (of another sense) gets no link: the word already finds that object.
    if (!entry.drawing) {
      // R4.4: a synonym in the kept sense, then a direct hypernym of it, that has a drawing. The other word must be
      // kept in that same sense too (a bullet is also called a slug, but "slug" is first of all the animal, and so
      // is its drawing). Words of several words are compared with their spaces ("ice cream").
      const spelt = (w) => w.replace(/_/g, ' ').toLowerCase();
      const drawn = (synset) => data.get(synset).words.map(spelt).filter((w) => w !== word && keptSense(w) === synset && !unlinked.has(`${word}\t${w}`)).map((w) => [w, keptDrawingOf(w)]).find(([, d]) => d);
      const synonym = drawn(sense);
      const hyper = synonym ? null : hypernyms(sense).map(drawn).find(Boolean);
      if (synonym) entry.link = { kind: 'synonym', word: synonym[0], drawing: synonym[1] };
      else if (hyper) entry.link = { kind: 'hypernym', word: hyper[0], drawing: hyper[1] };
      // Round 7: a word of an object in a hand-written shard, then a link written by hand.
      else if (byName.has(words.get(word)?.toLowerCase())) entry.link = { kind: 'word', word: words.get(word), drawing: byName.get(words.get(word).toLowerCase()) };
      else if (hand.has(word) && byName.has(hand.get(word).drawing.toLowerCase())) entry.link = { kind: hand.get(word).link === 'same' ? 'hand synonym' : 'hand stand-in', word: hand.get(word).drawing, drawing: byName.get(hand.get(word).drawing.toLowerCase()) };
    }
    list.push(entry);
  }
  stats.kept = list.length;
  stats.drawn = list.filter((e) => e.drawing).length;
  stats.otherSense = list.filter((e) => e.other?.shown).length;
  stats.unlistedSense = list.filter((e) => e.other && !e.other.shown).length;
  stats.bySynonym = list.filter((e) => e.link?.kind === 'synonym').length;
  stats.byHypernym = list.filter((e) => e.link?.kind === 'hypernym').length;
  stats.byWord = list.filter((e) => e.link?.kind === 'word').length;
  stats.byHandSame = list.filter((e) => e.link?.kind === 'hand synonym').length;
  stats.byHandKind = list.filter((e) => e.link?.kind === 'hand stand-in').length;
  return { list, stats, persons, notDrawn };
}

export function missingPage({ list, stats, persons, notDrawn = [] }) {
  const missing = list.filter((e) => !e.drawing);
  const pct = (n) => `${(100 * n / list.length).toFixed(1)}%`;
  const num = (n) => String(n).replace(/\B(?=(\d{3})+$)/g, ',');
  const none = list.filter((e) => !e.drawing && !e.link).length;
  const rows = missing.map((e) => `| ${e.rank} | ${e.word} | ${e.link ? `${e.link.kind} ${e.link.word}${e.link.word === e.link.drawing ? '' : ` (drawing "${e.link.drawing}")`}` : ''} | ${e.gloss.replace(/\|/g, '/')} |`);
  const undrawn = notDrawn.map((e) => `| ${e.word} | ${e.reason} | ${e.gloss.replace(/\|/g, '/')} |`);
  return `# k.objects: common things without a drawing

Generated by \`tools/coverage.mjs\`; do not edit by hand.

The list of common things: the ${num(list.length)} most frequent English words (frequency-words 2018, film and television
subtitles) that are a noun in WordNet 3.1, are mainly used as a noun, and name a physical thing: a hyponym of physical
object, living thing, food or artifact in their first noun sense or in the senses that hold at least half of their
noun counts. Words for persons (WordNet's noun.person: ${num(persons.length)} words before the last of the list, such as
${persons.slice(0, 6).join(', ')}) and the words of \`sources/coverage/not-things.tsv\` are left out. The rule is at
the top of \`tools/coverage.mjs\`.

"Has a drawing" compares the word with the name of a \`k.objects\` object (or its plural). Every such drawing was
looked at next to the gloss of the sense kept (\`sources/coverage/sense-check.tsv\`). A word counts as drawn when any
drawing in the catalog carries its name, whatever the source: ${stats.otherSense} drawings show another physical sense of the word
than the one kept (the drawing \`bank\` is a building, the sense kept is the river bank) and ${stats.unlistedSense} ${stats.unlistedSense === 1 ? 'shows' : 'show'} a meaning that
WordNet does not have for the word (the drawing \`tablet\` is a tablet computer). The table says which, so that a link
is made only in the sense kept.

| | Words | Share |
| --- | --- | --- |
| Common things | ${num(list.length)} | |
| with a drawing of that name | ${stats.drawn} | ${pct(stats.drawn)} |
| without, but a WordNet synonym has a drawing | ${stats.bySynonym} | ${pct(stats.bySynonym)} |
| without, but the direct hypernym has a drawing | ${stats.byHypernym} | ${pct(stats.byHypernym)} |
| without, but it is another word of an object (hand-written) | ${stats.byWord + stats.byHandSame} | ${pct(stats.byWord + stats.byHandSame)} |
| without, but a stand-in written by hand has a drawing | ${stats.byHandKind} | ${pct(stats.byHandKind)} |
| with no drawing at all | ${none} | ${pct(none)} |

## The ${missing.length} words without a drawing of their name, most frequent first

"Rank" is the place of the word in the list of common things. "Link" names a WordNet synonym or direct hypernym
that has a drawing: a synonym is a \`core.word\` fact of the shard \`words-wordnet\` (the word finds that drawing as
its own); a hypernym is a \`k.objects.stand_in\` fact of the shard \`stand-ins-wordnet\` (the drawing of the kind stands
in for the thing). "word" is a \`core.word\` of that object in its own shard; "hand synonym" and "hand stand-in" are
links written by hand (\`sources/coverage/hand-links.tsv\`, the shards \`words-hand\` and \`stand-ins-hand\`). The
gloss is WordNet's, for the sense kept.

| Rank | Word | Link | Sense (WordNet 3.1) |
| --- | --- | --- | --- |
${rows.join('\n')}
${undrawn.length ? `
## Not drawable: ${undrawn.length} words that left the list

Common words for things that cannot be drawn as an object (\`sources/coverage/not-drawable.tsv\`).

| Word | Why | Sense (WordNet 3.1) |
| --- | --- | --- |
${undrawn.join('\n')}
` : ''}
Sources of this page: the order of the words is from FrequencyWords 2018 by Hermit Dave (CC BY-SA 4.0, made from
OpenSubtitles 2018); the senses, synonyms and hypernyms are from Princeton WordNet 3.1 (WordNet licence, see
\`k.words/LICENSE\`). This page is under CC BY-SA 4.0.
`;
}

// R4.4, R5.1 (Q21): the links as two k.objects shards, with WordNet as the source. A synonym is the same thing: a
// core.word from the word to the object. A direct hypernym is only the kind of thing: a k.objects.stand_in fact
// (name = the word, drawing = the object that draws its kind), so that a host can say "I drew a dog for the puppy".
export const WORDS_SHARD = 'words-wordnet';
export function wordsShard({ list }) {
  const links = list.filter((e) => e.link).sort((a, b) => (a.word < b.word ? -1 : a.word > b.word ? 1 : 0));
  const lines = links.filter((e) => e.link.kind === 'synonym')
    .map((e) => wire(`k.objects.wordnet.same.${seg(e.word)}`, 'core.word', [['text', e.word], ['means', e.link.drawing], ['of', 'k.objects.object.name']], 'wordnet 3.1'));
  return `${header({
    id: `k.objects/shards/${WORDS_SHARD}`,
    about: 'words for common things that have no drawing of their own: each word names the object that draws its WordNet synonym (the same thing: a couch is drawn by the sofa).',
    sources: ['wordnet 3.1 (Princeton WordNet 3.1: synonyms; the words are the common things of tools/coverage.mjs, chosen with frequency-words 2018)'],
    license: 'WordNet-3.0', script: 'tools/coverage.mjs',
  })}\n${lines.join('\n')}\n`;
}
export const STAND_INS_SHARD = 'stand-ins-wordnet';
export function standInsShard({ list }) {
  const lines = list.filter((e) => e.link?.kind === 'hypernym').sort((a, b) => (a.word < b.word ? -1 : a.word > b.word ? 1 : 0))
    .map((e) => wire(`k.objects.wordnet.kind.${seg(e.word)}`, 'k.objects.stand_in', [['name', e.word], ['drawing', e.link.drawing]], 'wordnet 3.1'));
  return `${header({
    id: `k.objects/shards/${STAND_INS_SHARD}`,
    about: 'common things that have no drawing of their own and are a kind of something that has one: the drawing of the kind stands in for the thing (a puppy is drawn by the dog; the direct hypernym in WordNet).',
    sources: ['wordnet 3.1 (Princeton WordNet 3.1: direct hypernyms; the words are the common things of tools/coverage.mjs, chosen with frequency-words 2018)'],
    license: 'WordNet-3.0', script: 'tools/coverage.mjs',
  })}\n${lines.join('\n')}\n`;
}

// Round 7: the links written by hand (every row of hand-links.tsv, also for words outside the list), as two shards.
export const HAND_WORDS_SHARD = 'words-hand';
export const HAND_STAND_INS_SHARD = 'stand-ins-hand';
export function handRows(text, objects, words = new Map()) {
  const names = new Set(objects);
  const rows = text.split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t').map((x) => x.trim()));
  const seen = new Set();
  for (const [word, link, drawing] of rows) {
    if (!['same', 'kind'].includes(link)) throw new Error(`hand-links.tsv: ${word}: link ${link}`);
    if (!names.has(drawing)) throw new Error(`hand-links.tsv: ${word}: no object "${drawing}"`);
    if (names.has(word)) throw new Error(`hand-links.tsv: ${word} is an object itself`);
    if (seen.has(word)) throw new Error(`hand-links.tsv: ${word} twice`);
    if (words.has(word)) throw new Error(`hand-links.tsv: ${word} is already a word of the object "${words.get(word)}"`);
    seen.add(word);
  }
  return rows.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}
export function handShards(text, objects, words = new Map()) {
  const rows = handRows(text, objects, words);
  const same = rows.filter((r) => r[1] === 'same').map(([word, , drawing]) => wire(`k.objects.hand.same.${seg(word)}`, 'core.word', [['text', word], ['means', drawing], ['of', 'k.objects.object.name']], 'hand-core 1'));
  const kind = rows.filter((r) => r[1] === 'kind').map(([word, , drawing]) => wire(`k.objects.hand.kind.${seg(word)}`, 'k.objects.stand_in', [['name', word], ['drawing', drawing]], 'hand-core 1'));
  const head = (id, about) => header({ id: `k.objects/shards/${id}`, about, sources: ['hand-core 1 (hand-written in this repository: sources/coverage/hand-links.tsv)'], license: 'CC0-1.0', script: 'tools/coverage.mjs' });
  return {
    [`${HAND_WORDS_SHARD}.sop`]: `${head(HAND_WORDS_SHARD, 'words that name the same thing as an object and are not found by the WordNet rule (bike is the bicycle, tombstone the headstone); written by hand, every drawing looked at.')}\n${same.join('\n')}\n`,
    [`${HAND_STAND_INS_SHARD}.sop`]: `${head(HAND_STAND_INS_SHARD, 'things that have no drawing of their own and are drawn by the object of their kind, written by hand where the WordNet rule gives nothing (a sparrow by the bird, a villa by the house, a puddle by the pond); every drawing looked at.')}\n${kind.join('\n')}\n`,
  };
}

// The words of the objects in the hand-written shards (core.word ... of=k.objects.object.name), lower case -> object.
// Only hand-written shards: the words of the imported ones are the keywords of their source (bike for a lock).
// The shards that this tool writes are left out.
export function objectWords() {
  const generated = new Set([WORDS_SHARD, STAND_INS_SHARD, HAND_WORDS_SHARD, HAND_STAND_INS_SHARD].map((s) => `k.objects/shards/${s}`));
  const words = new Map();
  const tok = (t) => (t.startsWith('"') ? JSON.parse(t) : t);
  for (const shard of scanWorlds().find((w) => w.id === 'k.objects').shards) {
    if (generated.has(shard.id) || !/^# script: none \(hand-written\)/m.test(shard.text)) continue; // imported shards hold search keywords, not names
    for (const line of shard.text.split('\n')) {
      if (!/^@\S+ core\.word /.test(line) || !line.includes(' of=k.objects.object.name')) continue;
      const means = /\smeans=("[^"]*"|\S+)/.exec(line)?.[1];
      for (const m of line.matchAll(/\stext=("[^"]*"|\S+)/g)) if (means && !words.has(tok(m[1]).toLowerCase())) words.set(tok(m[1]).toLowerCase(), tok(means));
    }
  }
  return words;
}

// The names of the k.objects objects, read from the shards.
export function objectNames() {
  const names = [];
  for (const shard of scanWorlds().find((w) => w.id === 'k.objects').shards) for (const m of shard.text.matchAll(/ k\.objects\.object name=("[^"]*"|\S+)/g)) names.push(m[1].startsWith('"') ? JSON.parse(m[1]) : m[1]);
  return names;
}

export function run(limit = LIMIT) {
  const dict = join(REPO, 'sources/wordnet/raw/wordnet31');
  const files = Object.fromEntries(['index.noun', 'data.noun', 'noun.exc', 'index.sense'].map((f) => [f, readFileSync(join(dict, f), 'latin1')]));
  const freq = readFileSync(join(REPO, 'sources/frequency-words/raw/en_50k.txt'), 'utf8');
  const read = (name) => { const p = join(REPO, 'sources/coverage', name); return existsSync(p) ? readFileSync(p, 'utf8') : ''; };
  return coverage({ files, freq, objects: objectNames(), notThings: read('not-things.tsv'), notLinks: read('not-links.tsv'), senseCheck: read('sense-check.tsv'), notDrawable: read('not-drawable.tsv'), words: objectWords(), handLinks: read('hand-links.tsv'), limit });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const at = process.argv.indexOf('--limit');
  const result = run(at > 0 ? Number(process.argv[at + 1]) : LIMIT);
  if (at > 0 && !process.argv.includes('--list')) {
    console.log(JSON.stringify(result.stats));
  } else if (process.argv.includes('--list')) {
    for (const e of result.list) console.log([e.rank, e.word, e.count, e.drawing ?? '', e.link ? `${e.link.kind} ${e.link.word} -> ${e.link.drawing}` : '', e.gloss].join('\t'));
  } else {
    writeFileSync(join(WORLDS_DIR, 'k.objects', 'MISSING.md'), missingPage(result));
    writeFileSync(join(WORLDS_DIR, 'k.objects', 'shards', `${WORDS_SHARD}.sop`), wordsShard(result));
    writeFileSync(join(WORLDS_DIR, 'k.objects', 'shards', `${STAND_INS_SHARD}.sop`), standInsShard(result));
    const handText = readFileSync(join(REPO, 'sources/coverage/hand-links.tsv'), 'utf8');
    for (const [name, text] of Object.entries(handShards(handText, objectNames(), objectWords()))) writeFileSync(join(WORLDS_DIR, 'k.objects', 'shards', name), text);
    console.log(JSON.stringify(result.stats));
  }
}
