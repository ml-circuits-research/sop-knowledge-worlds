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

// An attribute: [name, holds, about].
export const ATTRIBUTES = [
  ['colour', 'colour', 'the colour a thing usually has'],
  ['material', 'material', 'what a thing is usually made of'],
  ['size', 'size', 'how big a thing is next to other things'],
  ['place', 'place', 'where a thing usually is'],
  ['kind', 'kind', 'what kind of thing it is'],
  ['parts', 'thing', 'the parts a thing usually has'],
  ['legs', 'number', 'how many legs it has'],
  ['wheels', 'number', 'how many wheels it has'],
  ['can', 'verb', 'what it can do'],
  ['cannot', 'verb', 'what it is known not to be able to do'],
  ['lives', 'place', 'where an animal lives'],
  ['eats', 'thing', 'what an animal eats'],
  ['covering', 'material', 'what covers the body of an animal'],
  ['sound', 'verb', 'the sound it makes'],
  ['used_for', 'use', 'what people use it for'],
];
// Where the values of an attribute are found: [attribute, world, type, key, for which things].
export const FOUND = [
  ['colour', 'k.attributes', 'k.attributes.thing', 'colour', 'common things'], ['colour', 'k.food', 'k.food.food', 'colour', 'foods'], ['colour', 'k.objects', 'k.objects.part', 'colour', 'each part of a drawing'],
  ['material', 'k.attributes', 'k.attributes.thing', 'material', 'common things'], ['material', 'k.commonsense', 'k.commonsense.thing', 'made_of', 'a few common things'],
  ['size', 'k.scenes', 'k.scenes.thing', 'size', 'drawable things'], ['size', 'k.commonsense', 'k.commonsense.thing', 'size', 'a few common things'],
  ['place', 'k.scenes', 'k.scenes.thing', 'place', 'drawable things'], ['place', 'k.commonsense', 'k.commonsense.thing', 'at', 'a few common things'],
  ['kind', 'k.attributes', 'k.attributes.thing', 'kind', 'common things'], ['kind', 'k.animals', 'k.animals.animal', 'class', 'animals'], ['kind', 'k.food', 'k.food.food', 'kind', 'foods'],
  ['parts', 'k.objects', 'k.objects.part', 'name', 'drawings with named parts'], ['parts', 'k.layouts', 'k.layouts.joins', 'a', 'kinds joined by part_of'],
  ['legs', 'k.animals', 'k.animals.animal', 'legs', 'animals'],
  ['wheels', 'k.attributes', 'k.attributes.thing', 'wheels', 'vehicles'],
  ['can', 'k.attributes', 'k.attributes.thing', 'can', 'common things'], ['can', 'k.animals', 'k.animals.animal', 'can', 'animals'], ['can', 'k.commonsense', 'k.commonsense.thing', 'can', 'a few common things'],
  ['cannot', 'k.animals', 'k.animals.animal', 'cannot', 'animals'],
  ['lives', 'k.animals', 'k.animals.animal', 'habitat', 'animals'],
  ['eats', 'k.animals', 'k.animals.animal', 'eats', 'animals'],
  ['covering', 'k.animals', 'k.animals.animal', 'covering', 'animals'],
  ['sound', 'k.animals', 'k.animals.animal', 'sound', 'animals'],
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
  const attrs = ATTRIBUTES.map(([name, holds, about]) => wire(`k.attributes.attribute.${seg(name)}`, 'k.attributes.attribute', [['name', name], ['holds', holds], ['about', text(about)]], SRC));
  const found = FOUND.map(([attribute, world, type, key, of]) => wire(`k.attributes.found.${seg(attribute)}.${seg(type)}.${seg(key)}`, 'k.attributes.found', [['attribute', attribute], ['world', world], ['type', type], ['key', key], ['covers', text(of)]], SRC));
  const kinds = KINDS.map(([name, attributes]) => wire(`k.attributes.kind.${seg(name)}`, 'k.attributes.kind', [['name', name], ...list(attributes).map((a) => ['attribute', a])], SRC));
  files['attributes.sop'] = `${header({ id: 'k.attributes/shards/attributes', about: `${ATTRIBUTES.length} attributes of things (${ATTRIBUTES.map((a) => a[0]).join(', ')}), in which world, type and key the values of each are found, and which attributes ${KINDS.length} kinds of things usually have.`,
    sources: ['hand-core 1 (hand-written in this repository: tools/attributes-core.mjs)'], license: 'CC0-1.0', script: 'tools/attributes-core.mjs' })}\n${attrs.join('\n')}\n\n# Where the values are found.\n${found.join('\n')}\n\n# Kinds of things and the attributes they usually have.\n${kinds.join('\n')}\n`;
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
  writeShards(join(WORLDS_DIR, 'k.attributes', 'shards'), attributeShards());
  console.log(`${readThings().length} things`);
}
