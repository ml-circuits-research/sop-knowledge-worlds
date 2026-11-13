// The hand-written core of k.scenes (Round 7).
//   node tools/scenes-core.mjs       writes docs/worlds/k.scenes/shards/things-<letter>.sop (the usual place and
//                                    relative size of drawable things, from sources/hand-core/place-size.tsv) and
//                                    scenes-<group>.sop (the scenes of tools/scenes-data.mjs)
// Deterministic: the same table and data give the same files.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, writeShards, byText } from './import/lib.mjs';

const SRC = 'hand-core 1';
const PLACES = ['sky', 'ground', 'water', 'indoors', 'on_thing'];
const SIZES = ['tiny', 'small', 'medium', 'large', 'huge'];

// The rows of place-size.tsv: { name, place, on, size }.
export function readPlaceSize(text) {
  return text.split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => {
    const [name, place = '', on = '', size = ''] = l.split('\t').map((x) => x.trim());
    if (place && !PLACES.includes(place)) throw new Error(`place-size.tsv: ${name}: place ${place}`);
    if (size && !SIZES.includes(size)) throw new Error(`place-size.tsv: ${name}: size ${size}`);
    if (!place && !size) throw new Error(`place-size.tsv: ${name}: neither a place nor a size`);
    if (place === 'on_thing' && !on) throw new Error(`place-size.tsv: ${name}: on what?`);
    return { name, place, on, size };
  });
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
      about: `the usual place (sky, ground, water, indoors, on another thing) and the relative size (tiny to huge) of ${lines.length} drawable things whose name starts with ${l === '0' ? 'a digit' : `"${l}"`}; labelled by a language model from the names (named=model), a sample checked against the drawings.`,
      sources: ['hand-core 1 (hand-written in this repository: sources/hand-core/place-size.tsv)'],
      license: 'CC0-1.0', script: 'tools/scenes-core.mjs',
    })}\n${lines.join('\n')}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = join(WORLDS_DIR, 'k.scenes', 'shards');
  const rows = readPlaceSize(readFileSync(join(REPO, 'sources/hand-core/place-size.tsv'), 'utf8'));
  const things = thingShards(rows);
  writeShards(dir, things, 'things-');
  let scenes = 0;
  if (existsSync(join(REPO, 'tools/scenes-data.mjs'))) {
    const { sceneShards } = await import('./scenes-data.mjs');
    const files = sceneShards();
    writeShards(dir, files, 'scenes-');
    scenes = Object.keys(files).length;
  }
  console.log(`${rows.length} things in ${Object.keys(things).length} shards; ${scenes} scene shards`);
}
