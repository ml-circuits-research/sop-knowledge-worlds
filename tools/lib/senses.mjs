// Q37: which sense a number or usage fact is about, for the names that have several senses in the catalog
// (k.attributes.same with only=false: turkey the bird and the food, kiwi the bird and the fruit). The table
// sources/hand-core/senses.tsv (type: number or usage, name, sense: a value of k.attributes.same.sense) is the
// judgement of the worker from the values of the fact (a turkey of 9 kg that runs 40 km/h is the bird; a kiwi of
// 7 cm is the fruit); tools/numbers-core.mjs and tools/usage-core.mjs write it as `sense=` on the fact, and
// tools/joins.mjs then files the fact under that sense instead of under every sense of the name.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from './worlds.mjs';

export const SENSES_TSV = join(REPO, 'sources', 'hand-core', 'senses.tsv');

// type ('number' or 'usage') -> Map(name -> sense)
export function readSenses(text = readFileSync(SENSES_TSV, 'utf8')) {
  const [head, ...rows] = text.split('\n').filter((l) => l.trim());
  if (head !== 'type\tname\tsense') throw new Error(`senses.tsv: header ${head}`);
  const out = { number: new Map(), usage: new Map() };
  for (const l of rows) {
    const [type, name, sense] = l.split('\t');
    if (!out[type] || !name || !sense) throw new Error(`senses.tsv: ${l}`);
    if (out[type].has(name)) throw new Error(`senses.tsv: ${type} ${name} twice`);
    out[type].set(name, sense);
  }
  return out;
}
