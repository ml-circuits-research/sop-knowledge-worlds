// The domains of tools/ask-sample.mjs: for each, the things asked about and the question templates.
// A template: [the question with {x} for the thing, (thing) => the queries of which one must be supported].
// In a query, the value '{x}' stands for the thing (by its name, or by the name a core.word gives it).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from './lib/worlds.mjs';

const column = (path, n = 0) => readFileSync(join(REPO, path), 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t')[n].trim());
const rows = (path) => readFileSync(join(REPO, path), 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t').map((x) => x.trim()));
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
  // sources/hand-core/questions/geo.tsv: well-known places by the names people use, written without looking at k.geo.
  geo: {
    things: () => rows('sources/hand-core/questions/geo.tsv'),
    templates: {
      country: [['what is the capital of {x}', one('k.geo.country', 'capital')], ['on which continent is {x}', one('k.geo.country', 'continent')], ['how many people live in {x}', one('k.geo.country', 'population')], ['how large is {x}', one('k.geo.country', 'area')]],
      river: [['how long is the river {x}', one('k.geo.river', 'length_about')], ['through which countries does the {x} flow', one('k.geo.river', 'country')]],
      mountain: [['how high is {x}', one('k.geo.mountain', 'elevation')], ['on which continent is {x}', one('k.geo.mountain', 'continent')]],
      lake: [['how large is {x}', one('k.geo.lake', 'area_about')], ['in which countries is {x}', one('k.geo.lake', 'country')]],
      desert: [['how large is the {x}', one('k.geo.desert', 'area_about')], ['on which continent is the {x}', one('k.geo.desert', 'continent')]],
      sea: [['how large is the {x}', one('k.geo.sea', 'area_about')], ['is the {x} an ocean, a sea or a gulf', one('k.geo.sea', 'kind')]],
      continent: [['how large is {x}', one('k.geo.continent', 'area_about')], ['how many countries are in {x}', () => [{ type: 'k.geo.country', where: { continent: '{x}' }, mode: 'count' }]]],
    },
  },
};
