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
  // sources/hand-core/questions/space.tsv: the planets, the Sun, the Moon, well-known stars, the kinds of thing in space.
  space: {
    things: () => rows('sources/hand-core/questions/space.tsv'),
    templates: {
      planet: [['how many moons does {x} have', () => [{ type: 'k.space.body', where: { name: '{x}' }, seek: 'moons' }, { type: 'k.space.body', where: { name: '{x}' }, seek: 'moons_about' }]], ['does {x} have rings', one('k.space.body', 'rings')],
        ['which planet from the Sun is {x}', one('k.space.body', 'order')], ['what colour is {x}', one('k.space.body', 'colour')], ['why does {x} have its colour', one('k.space.body', 'colour_why')],
        ['how long is a day on {x}', one('k.space.body', 'day_hours_about')], ['how long is a year on {x}', one('k.space.body', 'orbit_years')], ['how wide is {x}', one('k.space.body', 'diameter_about')], ['how far is {x} from the Sun', one('k.space.body', 'distance_about')]],
      dwarf: [['what kind of thing is {x}', one('k.space.body', 'kind')], ['how many moons does {x} have', one('k.space.body', 'moons')], ['how long is a year on {x}', one('k.space.body', 'orbit_years')], ['how wide is {x}', one('k.space.body', 'diameter_about')]],
      sun: [['how wide is the {x}', one('k.space.body', 'diameter_about')], ['how hot is the {x}', one('k.space.body', 'temperature_about')], ['how old is the {x}', one('k.space.body', 'age_years_about')], ['what colour is the {x}', one('k.space.body', 'colour')],
        ['what kind of thing is the {x}', one('k.space.body', 'kind')], ['why does the {x} have its colour', one('k.space.body', 'colour_why')]],
      moon: [['how wide is the {x}', one('k.space.body', 'diameter_about')], ['how far is the {x} from the Earth', one('k.space.body', 'distance_about')], ['what does the {x} go around', one('k.space.body', 'orbits')],
        ['how long does the {x} take to go around the Earth', one('k.space.body', 'orbit_days_about')], ['what colour is the {x}', one('k.space.body', 'colour')], ['why does the {x} shine', one('k.space.body', 'colour_why')]],
      star: [['how far away is {x}', one('k.space.body', 'light_years_about')], ['what kind of thing is {x}', one('k.space.body', 'kind')], ['in which galaxy is {x}', one('k.space.body', 'in')]],
      kind: [['what is a {x}', one('k.space.kind', 'about')], ['what is a {x} made of', one('k.space.kind', 'made_of')]],
    },
  },
  // sources/hand-core/questions/body.tsv: parts of the body by their common names, written without looking at k.body.
  body: {
    things: () => rows('sources/hand-core/questions/body.tsv'),
    templates: (() => {
      const count = ['how many {x}s does a person have', () => [{ type: 'k.body.part', where: { name: '{x}' }, seek: 'count' }, { type: 'k.body.part', where: { name: '{x}' }, seek: 'count_about' }]];
      const where = ['where on the body is the {x}', () => [{ type: 'k.body.part', where: { name: '{x}' }, seek: 'part_of' }, { type: 'k.body.part', where: { name: '{x}' }, seek: 'inside' }]];
      const does = ['what does the {x} do', () => [{ type: 'k.body.part', where: { name: '{x}' }, seek: 'does' }, { type: 'k.body.part', where: { name: '{x}' }, seek: 'about' }]];
      const parts = ['which parts does the {x} have', () => [{ type: 'k.body.part', where: { part_of: '{x}' }, seek: 'name', mode: 'list' }, { type: 'k.body.part', where: { inside: '{x}' }, seek: 'name', mode: 'list' }]];
      return { part: [count, where, does], organ: [count, where, does, ['say in a sentence what the {x} does', one('k.body.part', 'about')]], whole: [count, parts, does] };
    })(),
  },
  // sources/hand-core/questions/food.tsv: common foods and dishes, written without looking at k.food.
  food: {
    things: () => rows('sources/hand-core/questions/food.tsv'),
    templates: {
      food: [['what kind of food is {x}', one('k.food.food', 'kind')], ['what colour is {x}', one('k.food.food', 'colour')],
        ['where does {x} come from', () => [{ type: 'k.food.food', where: { name: '{x}' }, seek: 'comes_from' }, { type: 'k.food.food', where: { name: '{x}' }, seek: 'grows_on' }, { type: 'k.food.food', where: { name: '{x}' }, seek: 'made_of' }]]],
      dish: [['what is {x} made of', one('k.food.food', 'made_of')], ['what kind of food is {x}', one('k.food.food', 'kind')], ['is {x} eaten raw or cooked', one('k.food.food', 'eaten')]],
    },
  },
};
