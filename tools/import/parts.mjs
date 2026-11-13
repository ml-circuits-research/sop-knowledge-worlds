// WordNet 3.1 part meronyms -> k.parts shards (Round 8, item 5): the usual parts of the 1,500 common things of
// tools/coverage.mjs, with or without a drawing. For the sense of the word that the coverage rule keeps: the parts
// WordNet gives that sense (k.parts.whole), and the parts it gives what the thing is a kind of, up to two
// kind-of steps (k.parts.inherited, one fact per kind). Deterministic.
//   node tools/import/parts.mjs      writes docs/worlds/k.parts/shards/*.sop (needs the raw files of
//                                    sources/wordnet/SOURCE.md and sources/frequency-words/SOURCE.md)
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR } from '../lib/worlds.mjs';
import { readData, shortGloss } from './wordnet.mjs';
import { run } from '../coverage.mjs';
import { wire, header, seg, text, writeShards, byText } from './lib.mjs';

export const SOURCE = 'wordnet 3.1';
export const STEPS = 2;
// Kinds too general for their parts to say anything about a thing ("a whole has parts", "an organism has cells").
export const TOO_GENERAL = new Set(['whole', 'organism', 'structure', 'plant', 'artifact', 'instrumentality', 'object', 'living thing', 'unit', 'vehicle', 'animal', 'vascular plant', 'container', 'device', 'equipment', 'food', 'clothing', 'covering', 'solid', 'substance', 'material', 'body part', 'part', 'thing', 'region', 'location']);
// A kind two steps above a thing passes its parts on only when it is one of these (read: their parts are usual
// for most of their kinds: a car is a motor vehicle, which is a wheeled vehicle, which has a wheel).
export const TWO_STEPS = new Set(['wheeled vehicle', 'motor vehicle', 'self-propelled vehicle', 'building', 'vessel', 'aircraft', 'bird', 'seat', 'room', 'dwelling', 'stringed instrument', 'edge tool', 'footwear']);
// sources/coverage/not-parts.tsv: inherited parts that were read and mislead (thing or *, kind, part or *, reason).
export const NOT_PARTS = join(REPO, 'sources', 'coverage', 'not-parts.tsv');
const FOOD_FILE = '13';
const spelt = (w) => w.replace(/_/g, ' ');

export function importParts(dataText, list, notParts = '') {
  const data = readData(dataText);
  const lexFile = new Map();
  for (const line of dataText.split('\n')) if (/^\d{8} \d\d /.test(line)) lexFile.set(line.slice(0, 8), line.slice(9, 11));
  const refused = new Set(notParts.split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t').slice(0, 3).map((x) => x.trim()).join('\t')));
  const isRefused = (word, kind, part) => refused.has(`${word}\t${kind}\t*`) || refused.has(`*\t${kind}\t*`) || refused.has(`*\t${kind}\t${part}`) || refused.has(`${word}\t${kind}\t${part}`);
  const first = (offset) => spelt(data.get(offset).words[0]);
  // The parts of a synset; a part filed under foods is left out when the whole is not a food (a horse has no
  // "horsemeat", a citrus tree no "citrus" as a part one would name).
  const partsOf = (offset) => [...new Set(data.get(offset).pointers.filter(([sym, o, pos]) => sym === '%p' && pos === 'n' && (lexFile.get(o) !== FOOD_FILE || lexFile.get(offset) === FOOD_FILE)).map(([, o]) => first(o)))];
  const groups = [];
  const stats = { things: list.length, withOwn: 0, withAny: 0, own: 0, inherited: 0 };
  for (const e of [...list].sort((a, b) => byText(a.word, b.word))) {
    const lines = [];
    const own = partsOf(e.sense).filter((p) => p.toLowerCase() !== e.word);
    const seen = new Set(own);
    if (own.length) {
      lines.push(wire(`k.parts.whole.${seg(e.word)}`, 'k.parts.whole', [['name', e.word], ['gloss', text(shortGloss(data.get(e.sense).gloss))], ...own.map((p) => ['has', p])], SOURCE));
      stats.withOwn++; stats.own += own.length;
    }
    let cur = e.sense;
    for (let step = 1; step <= STEPS; step++) {
      const up = data.get(cur).pointers.find(([sym, , pos]) => sym === '@' && pos === 'n');
      if (!up) break;
      cur = up[1];
      const kind = first(cur);
      if (TOO_GENERAL.has(kind.toLowerCase())) break;
      if (step === 2 && !TWO_STEPS.has(kind.toLowerCase())) break;
      const parts = partsOf(cur).filter((p) => !seen.has(p) && p.toLowerCase() !== e.word && !isRefused(e.word, kind, p));
      if (!parts.length) continue;
      for (const p of parts) seen.add(p);
      lines.push(wire(`k.parts.inherited.${seg(e.word)}.${seg(kind)}`, 'k.parts.inherited', [['name', e.word], ['from', kind], ['steps', step], ...parts.map((p) => ['has', p])], SOURCE));
      stats.inherited += parts.length;
    }
    if (lines.length) { stats.withAny++; groups.push({ word: e.word, lines }); }
  }
  const files = {};
  for (const letter of [...new Set(groups.map((g) => g.word[0]))].sort(byText)) {
    const mine = groups.filter((g) => g.word[0] === letter);
    files[`${letter}.sop`] = `${header({ id: `k.parts/shards/${letter}`, about: `the usual parts of ${mine.length} common things whose name starts with "${letter}" (${mine.slice(0, 6).map((g) => g.word).join(', ')} ...): the parts WordNet gives the thing, and the parts it gives what the thing is a kind of.`,
      sources: ['wordnet 3.1 (Princeton WordNet 3.1: part meronyms, hypernyms, glosses); which words are common things: tools/coverage.mjs (frequency-words 2018, wordnet 3.1)'], license: 'WordNet-3.0', script: 'tools/import/parts.mjs' })}\n${mine.flatMap((g) => g.lines).join('\n')}\n`;
  }
  return { files, stats };
}

export function runParts() {
  return importParts(readFileSync(join(REPO, 'sources/wordnet/raw/wordnet31/data.noun'), 'latin1'), run().list, existsSync(NOT_PARTS) ? readFileSync(NOT_PARTS, 'utf8') : '');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { files, stats } = runParts();
  writeShards(join(WORLDS_DIR, 'k.parts', 'shards'), files);
  console.log(JSON.stringify(stats));
}
