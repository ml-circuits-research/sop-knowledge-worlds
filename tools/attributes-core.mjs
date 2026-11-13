// k.attributes (Round 8, item 2): which attributes kinds of things usually have, where the values of each attribute
// are found in the worlds, and usual values of things that no other world says (colour, material, wheels, what it
// can do, what it is used for).
//   node tools/attributes-core.mjs     writes docs/worlds/k.attributes/shards/*.sop
// The things are the rows of sources/hand-core/attributes.tsv, labelled by a language model (named=model).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, text, writeShards, byText } from './import/lib.mjs';

const SRC = 'hand-core 1';
export const THINGS_TSV = join(REPO, 'sources', 'hand-core', 'attributes.tsv');
const list = (s) => (s ?? '').split(',').map((x) => x.trim()).filter(Boolean);

// An attribute: [name, holds, about, aspect].
export const ATTRIBUTES = [
  ['colour', 'colour', 'the colour a thing usually has', 'visual'],
  ['material', 'material', 'what a thing is usually made of', 'visual'],
  ['size', 'size', 'how big a thing is next to other things', 'spatial'],
  ['place', 'place', 'where a thing usually is', 'spatial'],
  ['kind', 'kind', 'what kind of thing it is', 'relational'],
  ['parts', 'thing', 'the parts a thing usually has', 'relational'],
  ['legs', 'number', 'how many legs it has', 'numeric'],
  ['wheels', 'number', 'how many wheels it has', 'numeric'],
  ['can', 'verb', 'what it can do', 'relational'],
  ['cannot', 'verb', 'what it is known not to be able to do', 'relational'],
  ['lives', 'place', 'where an animal lives', 'spatial'],
  ['eats', 'thing', 'what an animal eats', 'relational'],
  ['covering', 'material', 'what covers the body of an animal', 'visual'],
  ['sound', 'verb', 'the sound it makes', 'textual'],
  ['used_for', 'use', 'what people use it for', 'relational'],
  // Round 11 item 1: the attributes that the scales of k.values order (longer, higher, farther, hotter, heavier),
  // named as the scale, so that a comparative finds the keys that hold the numbers.
  ['length', 'number', 'how long a thing is', 'numeric'],
  ['height', 'number', 'how high or tall a thing is', 'numeric'],
  ['distance', 'number', 'how far away a thing is', 'numeric'],
  ['temperature', 'number', 'how hot or cold a thing is', 'numeric'],
  ['weight', 'number', 'how heavy a thing is', 'numeric'],
];
// Where the values of an attribute are found: [attribute, world, type, key, for which things].
export const FOUND = [
  ['colour', 'k.attributes', 'k.attributes.thing', 'colour', 'common things'], ['colour', 'k.food', 'k.food.food', 'colour', 'foods'], ['colour', 'k.objects', 'k.objects.part', 'colour', 'each part of a drawing'], ['colour', 'k.attributes', 'k.attributes.drawn', 'drawn_colour', 'drawable things: the main colours of the drawing'],
  ['material', 'k.attributes', 'k.attributes.thing', 'material', 'common things'], ['material', 'k.commonsense', 'k.commonsense.thing', 'made_of', 'a few common things'],
  ['size', 'k.scenes', 'k.scenes.thing', 'size', 'drawable things'],
  ['place', 'k.scenes', 'k.scenes.thing', 'place', 'drawable things'], ['place', 'k.commonsense', 'k.commonsense.thing', 'at', 'a few common things'],
  ['kind', 'k.attributes', 'k.attributes.thing', 'kind', 'common things'], ['kind', 'k.animals', 'k.animals.animal', 'class', 'animals'], ['kind', 'k.food', 'k.food.food', 'kind', 'foods'],
  ['parts', 'k.objects', 'k.objects.part', 'name', 'drawings with named parts'], ['parts', 'k.layouts', 'k.layouts.joins', 'a', 'kinds joined by part_of'], ['parts', 'k.parts', 'k.parts.whole', 'has', 'common things, from WordNet'], ['parts', 'k.parts', 'k.parts.inherited', 'has', 'common things, through what they are a kind of'], ['parts', 'k.parts', 'k.parts.usual', 'has', 'common things without a part in WordNet, in plain words'],
  ['legs', 'k.animals', 'k.animals.animal', 'legs', 'animals'],
  ['wheels', 'k.attributes', 'k.attributes.thing', 'wheels', 'vehicles'],
  ['can', 'k.attributes', 'k.attributes.thing', 'can', 'common things'], ['can', 'k.animals', 'k.animals.animal', 'can', 'animals'], ['can', 'k.commonsense', 'k.commonsense.thing', 'can', 'a few common things'],
  ['cannot', 'k.animals', 'k.animals.animal', 'cannot', 'animals'],
  ['lives', 'k.animals', 'k.animals.animal', 'habitat', 'animals'],
  ['eats', 'k.animals', 'k.animals.animal', 'eats', 'animals'],
  ['covering', 'k.animals', 'k.animals.animal', 'covering', 'animals'],
  ['sound', 'k.animals', 'k.animals.animal', 'sound', 'animals'],
  ['size', 'k.geo', 'k.geo.country', 'area', 'countries: the area'], ['size', 'k.geo', 'k.geo.continent', 'area_about', 'continents: the area'], ['size', 'k.geo', 'k.geo.lake', 'area_about', 'lakes: the area'],
  ['size', 'k.geo', 'k.geo.desert', 'area_about', 'deserts: the area'], ['size', 'k.geo', 'k.geo.sea', 'area_about', 'oceans and seas: the area'], ['size', 'k.space', 'k.space.body', 'diameter_about', 'bodies in space: the width'],
  ['length', 'k.geo', 'k.geo.river', 'length_about', 'rivers'], ['length', 'k.body', 'k.body.part', 'length_about', 'a few parts of the body'],
  ['height', 'k.geo', 'k.geo.mountain', 'elevation', 'mountains'], ['height', 'k.people', 'k.people.kind', 'height_about', 'kinds of person'],
  ['distance', 'k.space', 'k.space.body', 'distance_about', 'bodies in space'], ['temperature', 'k.space', 'k.space.body', 'temperature_about', 'bodies in space'], ['temperature', 'k.body', 'k.body.part', 'temperature_about', 'the body'],
  ['weight', 'k.body', 'k.body.part', 'weight_about', 'a few parts of the body'],
  ['used_for', 'k.attributes', 'k.attributes.thing', 'used_for', 'common things'], ['used_for', 'k.commonsense', 'k.commonsense.thing', 'used_for', 'a few common things'],
];
// The attributes a kind of thing usually has: [kind, attributes].
export const KINDS = [
  ['animal', 'colour, size, place, parts, legs, covering, lives, eats, can, cannot, sound'], ['creature', 'colour, size, can'], ['person', 'size, parts, can'],
  ['plant', 'colour, size, place, parts, can'], ['food', 'colour, kind, size'], ['drink', 'colour'],
  ['vehicle', 'colour, size, place, parts, material, wheels, can, used_for'], ['machine', 'size, material, parts, can, used_for'],
  ['building', 'size, place, parts, material, used_for'], ['place', 'colour, size, used_for'], ['landform', 'colour, size, material'], ['sky', 'colour, size, material, can'],
  ['furniture', 'colour, size, place, parts, material, used_for'], ['appliance', 'size, place, material, used_for'], ['device', 'size, material, can, used_for'],
  ['clothing', 'colour, size, material, used_for'], ['jewellery', 'colour, material, used_for'], ['container', 'size, material, used_for'],
  ['tool', 'size, material, parts, can, used_for'], ['weapon', 'size, material, can, used_for'], ['tableware', 'colour, size, material, used_for'],
  ['toy', 'colour, size, material, can, used_for'], ['instrument', 'colour, size, material, parts, used_for'], ['part', 'material, can, used_for'],
  ['material', 'colour, can, used_for'], ['natural thing', 'colour, size, material'],
];

// ---- Aspects (reviewer, 2026-11-13 21:30) -------------------------------------------------------------------------
// An aspect: [name, about, the views that show it].
export const ASPECTS = [
  ['visual', 'how a thing looks: its drawing, colour, covering, what it is made of', 'picture, card'],
  ['spatial', 'where a thing is and how big it is next to other things', 'picture'],
  ['relational', 'how a thing is tied to other things: its kind, its parts, what it does, eats, uses or is used for', 'diagram'],
  ['numeric', 'what can be counted or measured about a thing', 'chart'],
  ['textual', 'what is said about a thing in words: a definition, a formal name, a sound', 'document, card'],
  ['geographic', 'where on the Earth a thing is', 'map'],
  ['temporal', 'when a thing is, how long it lasts, what comes before and after', ''],
  ['social', 'what a person is among people: age, sex, family, job', ''],
];
// A family of things: [name, about, world, type, the key of that type that names the thing]. The family
// "common thing" has no type of its own: its things are the frequent English nouns that name a physical thing.
export const FAMILIES = [
  ['common thing', 'a frequent English noun that names a physical thing (the list of 1,500 of tools/coverage.mjs)', undefined, undefined, undefined],
  ['animal', 'an animal', 'k.animals', 'k.animals.animal', 'name'], ['food', 'a food', 'k.food', 'k.food.food', 'name'],
  ['country', 'a country', 'k.geo', 'k.geo.country', 'name'], ['city', 'a city', 'k.geo', 'k.geo.city', 'name'], ['river', 'a river', 'k.geo', 'k.geo.river', 'name'],
  ['mountain', 'a mountain', 'k.geo', 'k.geo.mountain', 'name'], ['mountain range', 'a mountain range', 'k.geo', 'k.geo.range', 'name'], ['continent', 'a continent', 'k.geo', 'k.geo.continent', 'name'],
  ['kind of person', 'a kind of person by age and sex', 'k.people', 'k.people.kind', 'name'], ['role', 'a job, a family role or a story role', 'k.people', 'k.people.role', 'name'],
  ['month', 'a month of the year', 'k.time', 'k.time.month', 'name'], ['weekday', 'a day of the week', 'k.time', 'k.time.weekday', 'name'], ['season', 'a season', 'k.time', 'k.time.season', 'name'],
  ['duration', 'a length of time', 'k.time', 'k.time.duration', 'name'],
  ['body in space', 'a planet, moon, star or other body', 'k.space', 'k.space.body', 'name'],
];
// Where a family shows an aspect: family | aspect | type | the key that names the thing | the keys that hold values.
const SHOWS_TEXT = `
common thing | visual | k.objects.object | name | name
common thing | visual | k.objects.stand_in | name | drawing
common thing | visual | k.attributes.thing | name | colour, material
common thing | visual | k.objects.part | of | colour
common thing | visual | k.attributes.drawn | name | drawn_colour, drawn_shade
common thing | spatial | k.scenes.thing | name | place, size, on
common thing | spatial | k.layouts.anchor | of | kind
common thing | relational | k.words.sense | word | is_a, part_of, synonym
common thing | relational | k.attributes.thing | name | kind, can, used_for
common thing | relational | k.layouts.joins | a | rel
common thing | relational | k.objects.part | of | name
common thing | relational | k.parts.whole | name | has
common thing | relational | k.parts.inherited | name | has
common thing | relational | k.parts.usual | name | has
common thing | numeric | k.attributes.thing | name | wheels
common thing | textual | k.words.sense | word | gloss
animal | visual | k.animals.animal | name | drawing, covering
animal | visual | k.attributes.thing | name | colour
animal | spatial | k.animals.animal | name | habitat
animal | spatial | k.scenes.thing | name | place, size
animal | relational | k.animals.animal | name | class, diet, eats, baby, can, cannot
animal | numeric | k.animals.animal | name | legs
animal | textual | k.animals.animal | name | sound
animal | textual | k.words.sense | word | gloss
food | visual | k.food.food | name | colour, drawing
food | spatial | k.scenes.thing | name | place, size
food | relational | k.food.food | name | kind, botanically, grows_on, comes_from, eaten
food | textual | k.words.sense | word | gloss
country | relational | k.geo.country | name | capital, continent, region, neighbour
country | numeric | k.geo.country | name | population, area
country | textual | k.geo.country | name | formal, code
country | geographic | k.geo.country | name | lat, lon, west, south, east, north
city | relational | k.geo.city | name | country, capital_of
city | numeric | k.geo.city | name | population
city | geographic | k.geo.city | name | lat, lon
river | relational | k.geo.river | name | continent, country
river | geographic | k.geo.river | name | lat, lon, west, south, east, north
mountain | relational | k.geo.mountain | name | continent, country
mountain | numeric | k.geo.mountain | name | elevation
mountain | geographic | k.geo.mountain | name | lat, lon
mountain range | relational | k.geo.range | name | continent
mountain range | geographic | k.geo.range | name | lat, lon, west, south, east, north
continent | relational | k.geo.country | continent | name
kind of person | visual | k.people.kind | name | drawing, hair, face
kind of person | relational | k.people.kind | name | is_a
kind of person | numeric | k.people.kind | name | height_about
kind of person | social | k.people.kind | name | age, sex
role | visual | k.people.role | name | drawing, wears, hat, glasses, beard, moustache, shoulders, face
role | spatial | k.people.role | name | works_at
role | relational | k.people.role | name | is, holds, uses, does
role | social | k.people.role | name | group
month | numeric | k.time.month | name | days, leap_days
month | temporal | k.time.month | name | n, season_north, season_south
weekday | temporal | k.time.weekday | name | n, weekend
season | temporal | k.time.season | name | n, after
season | relational | k.time.month | season_north | name
duration | numeric | k.time.duration | name | count
duration | relational | k.time.duration | name | unit
body in space | visual | k.space.body | name | colour, drawing, rings
body in space | spatial | k.space.body | name | order, in
body in space | relational | k.space.body | name | kind, orbits, group
body in space | numeric | k.space.body | name | size_rank, moons, moons_about
body in space | temporal | k.space.body | name | orbit_years
`;
export const SHOWS = SHOWS_TEXT.split('\n').filter((l) => l.trim()).map((l) => { const [family, aspect, type, by, keys] = l.split('|').map((x) => x.trim()); return { family, aspect, type, by, keys: list(keys), world: type.split('.').slice(0, 2).join('.') }; });

export function readThings() {
  return readFileSync(THINGS_TSV, 'utf8').split('\n').filter((l) => l.trim()).slice(1).map((l) => {
    const [name, kind, colour, material, wheels, can, usedFor] = l.split('\t');
    return { name, kind, colour: list(colour), material: list(material), wheels: wheels === '' || wheels === undefined ? undefined : Number(wheels), can: list(can), usedFor: list(usedFor) };
  });
}
// Shards of things by kind, so that one shard answers for one kind of thing.
const SHARD_OF = (kind) => (['animal', 'creature', 'person'].includes(kind) ? 'living' : ['plant', 'landform', 'sky', 'natural thing', 'material', 'place', 'food', 'drink'].includes(kind) ? 'nature'
  : ['vehicle', 'machine', 'building'].includes(kind) ? 'big' : ['clothing', 'jewellery'].includes(kind) ? 'worn' : 'objects');
const ABOUT = { living: 'animals and creatures', nature: 'plants, land, sky, materials, places, food and drink', big: 'vehicles, machines and buildings', worn: 'clothing and jewellery', objects: 'furniture, tools, containers, devices, toys, instruments and other objects' };

export function attributeShards() {
  const things = readThings().sort((a, b) => byText(a.name, b.name));
  const files = {};
  const attrs = ATTRIBUTES.map(([name, holds, about, aspect]) => wire(`k.attributes.attribute.${seg(name)}`, 'k.attributes.attribute', [['name', name], ['holds', holds], ['aspect', aspect], ['about', text(about)]], SRC));
  const found = FOUND.map(([attribute, world, type, key, of]) => wire(`k.attributes.found.${seg(attribute)}.${seg(type)}.${seg(key)}`, 'k.attributes.found', [['attribute', attribute], ['world', world], ['type', type], ['key', key], ['covers', text(of)]], SRC));
  const kinds = KINDS.map(([name, attributes]) => wire(`k.attributes.kind.${seg(name)}`, 'k.attributes.kind', [['name', name], ...list(attributes).map((a) => ['attribute', a])], SRC));
  files['attributes.sop'] = `${header({ id: 'k.attributes/shards/attributes', about: `${ATTRIBUTES.length} attributes of things (${ATTRIBUTES.map((a) => a[0]).join(', ')}), in which world, type and key the values of each are found, and which attributes ${KINDS.length} kinds of things usually have.`,
    sources: ['hand-core 1 (hand-written in this repository: tools/attributes-core.mjs)'], license: 'CC0-1.0', script: 'tools/attributes-core.mjs' })}\n${attrs.join('\n')}\n\n# Where the values are found.\n${found.join('\n')}\n\n# Kinds of things and the attributes they usually have.\n${kinds.join('\n')}\n`;
  {
    const aspects = ASPECTS.map(([name, about, views]) => wire(`k.attributes.aspect.${seg(name)}`, 'k.attributes.aspect', [['name', name], ['about', text(about)], ...list(views).map((v) => ['shown_in', v])], SRC));
    const families = FAMILIES.map(([name, about, world, type, by]) => wire(`k.attributes.family.${seg(name)}`, 'k.attributes.family', [['name', name], ['about', text(about)], ['world', world], ['type', type], ['by', by]], SRC));
    const shows = SHOWS.flatMap((r) => r.keys.map((key) => wire(`k.attributes.shows.${seg(r.family)}.${seg(r.aspect)}.${seg(r.type)}.${seg(key)}`, 'k.attributes.shows', [['family', r.family], ['aspect', r.aspect], ['world', r.world], ['type', r.type], ['key', key], ['by', r.by]], SRC)));
    files['aspects.sop'] = `${header({ id: 'k.attributes/shards/aspects', about: `the ${ASPECTS.length} aspects of things (${ASPECTS.map((a) => a[0]).join(', ')}), ${FAMILIES.length} families of things, and for each family and aspect the world, type and key where the values are found.`,
      sources: ['hand-core 1 (hand-written in this repository: tools/attributes-core.mjs)'], license: 'CC0-1.0', script: 'tools/attributes-core.mjs' })}\n${aspects.join('\n')}\n\n# Families of things.\n${families.join('\n')}\n\n# Where a family shows an aspect.\n${shows.join('\n')}\n`;
  }
  for (const key of Object.keys(ABOUT)) {
    const mine = things.filter((t) => SHARD_OF(t.kind) === key);
    const lines = mine.map((t) => wire(`k.attributes.thing.${seg(t.name)}`, 'k.attributes.thing', [['name', t.name], ['kind', t.kind], ...t.colour.map((c) => ['colour', c]), ...t.material.map((m) => ['material', m]),
      ['wheels', t.wheels], ...t.can.map((c) => ['can', c]), ...t.usedFor.map((u) => ['used_for', text(u)]), ['named', 'model']], SRC));
    files[`things-${key}.sop`] = `${header({ id: `k.attributes/shards/things-${key}`, about: `usual values of ${mine.length} things (${ABOUT[key]}): colour, material, wheels, what it can do, what it is used for, each only where it is plain.`,
      sources: ['hand-core 1 (labelled by a language model, named=model: sources/hand-core/attributes.tsv)'], license: 'CC0-1.0', script: 'tools/attributes-core.mjs' })}\n${lines.join('\n')}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // Only the shards of this tool are replaced (drawn-*.sop are written by tools/drawn-colour.mjs, numbers-*.sop and
  // usage-*.sop by the tools named in their headers).
  const files = attributeShards();
  const mine = (prefix) => Object.fromEntries(Object.entries(files).filter(([name]) => name.startsWith(prefix)));
  for (const prefix of ['attributes.', 'aspects.', 'things-']) writeShards(join(WORLDS_DIR, 'k.attributes', 'shards'), mine(prefix), prefix);
  console.log(`${readThings().length} things`);
}
