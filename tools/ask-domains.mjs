// The domains of tools/ask-sample.mjs: for each, the things asked about and the question templates.
// A template: [the question with {x} for the thing, (thing) => the queries of which one must be supported].
// In a query, the value '{x}' stands for the thing (by its name, or by the name a core.word gives it).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from './lib/worlds.mjs';

const column = (path, n = 0) => readFileSync(join(REPO, path), 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t')[n].trim());
const one = (type, key, where = {}) => () => [{ type, where: { name: '{x}', ...where }, seek: key }];
const canDo = (type, verb) => () => [{ type, where: { name: '{x}', can: verb }, seek: 'name' }, { type, where: { name: '{x}', cannot: verb }, seek: 'name' }];

export const DOMAINS = {
  // The 314 animals of sources/hand-core/animals.tsv (the list of common animals the item asks facts for).
  animals: {
    things: () => column('sources/hand-core/animals.tsv'),
    templates: [
      ['how many legs does a {x} have', one('k.animals.animal', 'legs')],
      ['what covers the body of a {x}', one('k.animals.animal', 'covering')],
      ['how big is a {x}', one('k.animals.animal', 'size')],
      ['where does a {x} live', one('k.animals.animal', 'habitat')],
      ['what does a {x} eat', one('k.animals.animal', 'eats')],
      ['what sound does a {x} make', one('k.animals.animal', 'sound')],
      ['what is a young {x} called', one('k.animals.animal', 'baby')],
      ['what is a group of {x} called', one('k.animals.animal', 'group')],
      ['can a {x} fly', canDo('k.animals.animal', 'fly')],
      ['can a {x} swim', canDo('k.animals.animal', 'swim')],
      ['can a {x} climb', canDo('k.animals.animal', 'climb')],
    ],
  },
};
