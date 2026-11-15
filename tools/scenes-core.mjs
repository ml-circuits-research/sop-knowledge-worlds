// The hand-written core of k.scenes (Round 7).
//   node tools/scenes-core.mjs       writes docs/worlds/k.scenes/shards/things-<letter>.sop (the usual place and
//                                    relative size of drawable things, from sources/hand-core/place-size.tsv). The
//                                    scenes-<group>.sop shards are hand-written: they are the home of the scenes.
// Deterministic: the same table and data give the same files.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, writeShards, byText } from './import/lib.mjs';
import { animalThings } from './animals-core.mjs';
import { measuredSizes } from './lib/size-class.mjs';

const SRC = 'hand-core 1';
const PLACES = ['sky', 'ground', 'water', 'indoors', 'on_thing'];
const SIZES = ['tiny', 'small', 'medium', 'large', 'huge'];

// The rows of place-size.tsv: { name, place, on, size }. KR1 item 3: the size of a thing that has a size_about in
// numbers.tsv is the class of that number (tools/lib/size-class.mjs), and the table tells none for it (one home).
export function readPlaceSize(text, measured = measuredSizes()) {
  return text.split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => {
    const [name, place = '', on = '', told = ''] = l.split('\t').map((x) => x.trim());
    if (place && !PLACES.includes(place)) throw new Error(`place-size.tsv: ${name}: place ${place}`);
    if (told && !SIZES.includes(told)) throw new Error(`place-size.tsv: ${name}: size ${told}`);
    if (told && measured.has(name)) throw new Error(`place-size.tsv: ${name}: size ${told} told, but numbers.tsv has its size_about (${measured.get(name).metres} m): the class comes from the number`);
    const size = told || measured.get(name)?.size || '';
    if (!place && !size) throw new Error(`place-size.tsv: ${name}: neither a place nor a size`);
    if (place === 'on_thing' && !on) throw new Error(`place-size.tsv: ${name}: on what?`);
    return { name, place, on, size };
  });
}

// The rows of the table and, after them, a row for every animal of k.animals that the table lacks (Q32: the size
// class of an animal is said here and nowhere else; tools/animals-core.mjs says how the row is made).
export function allThings(text = readFileSync(join(REPO, 'sources/hand-core/place-size.tsv'), 'utf8')) {
  const rows = readPlaceSize(text);
  return [...rows, ...animalThings(undefined, new Map(rows.map((r) => [r.name, r.size]))).rows];
}

// The first letter of a name, for the shard: a to z, or "0" for a digit or another sign.
export const letterOf = (name) => { const c = name.normalize('NFKD')[0].toLowerCase(); return /[a-z]/.test(c) ? c : '0'; };

export function thingShards(rows) {
  const byLetter = new Map();
  const ids = new Set();
  for (const r of [...rows].sort((a, b) => byText(a.name, b.name))) {
    const id = `k.scenes.thing.${seg(r.name)}`;
    if (ids.has(id)) throw new Error(`two things with the id ${id}`);
    ids.add(id);
    const line = wire(id, 'k.scenes.thing', [['name', r.name], ['place', r.place], ['on', r.on], ['size', r.size], ['named', 'model']], SRC);
    const l = letterOf(r.name);
    if (!byLetter.has(l)) byLetter.set(l, []);
    byLetter.get(l).push(line);
  }
  const files = {};
  for (const [l, lines] of [...byLetter].sort((a, b) => byText(a[0], b[0]))) {
    files[`things-${l}.sop`] = `${header({
      id: `k.scenes/shards/things-${l}`,
      about: `the usual place (sky, ground, water, indoors, on another thing) and the relative size (tiny to huge) of ${lines.length} things (the drawable things and the animals of k.animals) whose name starts with ${l === '0' ? 'a digit' : `"${l}"`}; labelled by a language model from the names (named=model), a sample checked against the drawings.`,
      sources: ['hand-core 1 (hand-written in this repository: sources/hand-core/place-size.tsv, and sources/hand-core/animals.tsv for the animals without a drawing)'],
      license: 'CC0-1.0', script: 'tools/scenes-core.mjs',
    })}\n${lines.join('\n')}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = join(WORLDS_DIR, 'k.scenes', 'shards');
  const rows = allThings();
  const things = thingShards(rows);
  writeShards(dir, things, 'things-');
  console.log(`${rows.length} things in ${Object.keys(things).length} shards`);
}
