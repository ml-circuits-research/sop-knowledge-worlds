// KR1 item 3 (review 2026-11-15, finding 5): the size of a thing has one home, `k.attributes.number.size_about` (the
// length of its longest side in metres, sources/hand-core/numbers.tsv). The size class of k.scenes.thing (tiny, small,
// medium, large, huge) is computed from it wherever the number exists, as weight_class and speed_class are, and told
// (sources/hand-core/place-size.tsv, animals.tsv) only where it does not. The steps follow the examples the class
// definitions give (k.scenes/schema.sop; animals.tsv): tiny under 0.1 m (fits in a closed hand: a coin, a bee, a
// mouse), small under 0.8 m (held in one or two hands: a cup, a book, a cat, a hen), medium under 2 m (carried in both
// arms, up to a person: a chair, a dog, a sheep, a bicycle), large under 6 m (up to a truck: a horse, a car, a bed), huge
// from 6 m (an elephant, a house, a tree, a ship). Of the 650 things that had both before, 499 had the class these
// steps give.
import { readNumbers } from '../numbers-core.mjs';
import { readSenses } from './senses.mjs';

export const SIZE_STEPS = [[0.1, 'tiny'], [0.8, 'small'], [2, 'medium'], [6, 'large'], [Infinity, 'huge']];
export const sizeClass = (metres) => SIZE_STEPS.find(([below]) => metres < below)[1];

// name -> { metres, size, sense } for every row of numbers.tsv with a size_about (sense: senses.tsv, Q37, if the name
// has several senses).
export function measuredSizes(rows = readNumbers(), senses = readSenses().number) {
  const out = new Map();
  for (const r of rows) if (r.size_about !== undefined) out.set(r.name, { metres: Number(r.size_about), size: sizeClass(Number(r.size_about)), sense: senses.get(r.name) });
  return out;
}
