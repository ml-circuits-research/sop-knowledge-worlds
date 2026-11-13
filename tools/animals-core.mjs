// The hand-written core of k.animals: the animals of sources/hand-core/animals.tsv as five shards by class.
//   node tools/animals-core.mjs     writes docs/worlds/k.animals/shards/*.sop
// Deterministic: the same table gives the same files. The table says how its columns are read.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, writeShards } from './import/lib.mjs';

const SRC = 'hand-core 1';
export const CLASSES = ['mammal', 'bird', 'fish', 'reptile', 'amphibian', 'insect', 'arachnid', 'crustacean', 'mollusc', 'worm', 'cnidarian', 'echinoderm', 'myriapod'];
export const SIZES = ['tiny', 'small', 'medium', 'large', 'huge'];
const COVERINGS = ['fur', 'hair', 'wool', 'feathers', 'scales', 'skin', 'shell', 'spines'];
const LEGS = { mammal: 4, bird: 2, fish: 0, reptile: 4, amphibian: 4, insect: 6, arachnid: 8, crustacean: 10 };
const COVER = { mammal: 'fur', bird: 'feathers', fish: 'scales', reptile: 'scales', amphibian: 'skin' };
const FLIERS = ['bird', 'insect'];
const SHARDS = [
  ['mammals', 'mammals', ['mammal']], ['birds', 'birds', ['bird']], ['fish', 'fish', ['fish']],
  ['reptiles-and-amphibians', 'reptiles and amphibians', ['reptile', 'amphibian']],
  ['invertebrates', 'insects, spiders, crustaceans, molluscs and other animals without a backbone', ['insect', 'arachnid', 'crustacean', 'mollusc', 'worm', 'cnidarian', 'echinoderm', 'myriapod']],
];
const list = (t) => (t ?? '').split(',').map((x) => x.trim()).filter(Boolean);

export function readAnimals(tsv = readFileSync(join(REPO, 'sources/hand-core/animals.tsv'), 'utf8')) {
  const seen = new Set();
  return tsv.split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => {
    const [name, cls, size, habitat, diet, eats, sound, baby, group, can, cannot, legs, covering, words, drawing] = l.split('\t').map((x) => x.trim());
    const where = `animals.tsv: ${name}`;
    if (!name || seen.has(name)) throw new Error(`${where}: a name, once`);
    seen.add(name);
    if (!CLASSES.includes(cls)) throw new Error(`${where}: class ${cls}`);
    if (!SIZES.includes(size)) throw new Error(`${where}: size ${size}`);
    if (diet && !['herbivore', 'carnivore', 'omnivore'].includes(diet)) throw new Error(`${where}: diet ${diet}`);
    const a = { name, class: cls, size, habitat: list(habitat), diet, eats: list(eats), sound: list(sound), baby, group, can: list(can), cannot: list(cannot), words: list(words), drawing };
    a.legs = legs === '-' ? undefined : legs === '' || legs === undefined ? LEGS[cls] : Number(legs);
    if (a.legs !== undefined && !Number.isInteger(a.legs)) throw new Error(`${where}: legs ${legs}`);
    a.covering = covering === '-' ? [] : list(covering).length ? list(covering) : COVER[cls] ? [COVER[cls]] : [];
    for (const c of a.covering) if (!COVERINGS.includes(c)) throw new Error(`${where}: covering ${c}`);
    // What is plain of every animal that is not a bird or an insect and is not said to fly.
    if (!FLIERS.includes(cls) && !a.can.includes('fly') && !a.cannot.includes('fly')) a.cannot.push('fly');
    for (const v of a.can) if (a.cannot.includes(v)) throw new Error(`${where}: can and cannot ${v}`);
    return a;
  });
}

// Q32: the place and the size class of every thing live in k.scenes.thing, those of the animals too. The table of
// animals keeps its column `size` as the source; this gives the k.scenes.thing rows for the animals that the table
// of places and sizes (sources/hand-core/place-size.tsv) does not have, and says under which name the row of each
// animal stands. An animal whose name is there the name of another thing of another size (a crane is also a
// machine, tuna also a tin) gets a row under its name followed by `bird`, `fish` or `animal`. The place, by rule and
// only where the rule is sure: `water` for a fish and for an animal that is not a bird and whose first habitat is
// water; `indoors` where the first habitat is the house; `sky` for a bird that flies and does not live on water
// only; `ground` for what cannot fly; none for the other flying birds and the flying insects.
const WATER = ['sea', 'river', 'lake', 'pond', 'coral reef', 'swamp'];
export function usualPlace(a) {
  const wet = (h) => WATER.includes(h);
  if (a.class === 'fish') return 'water';
  if (a.habitat[0] === 'house') return 'indoors';
  if (a.class === 'bird') return a.cannot.includes('fly') ? 'ground' : a.habitat.length && a.habitat.every(wet) ? '' : 'sky';
  if (a.habitat.length && wet(a.habitat[0])) return 'water';
  return a.cannot.includes('fly') ? 'ground' : '';
}
export function readPlaceSizeNames(tsv = readFileSync(join(REPO, 'sources/hand-core/place-size.tsv'), 'utf8')) {
  return new Map(tsv.split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t').map((x) => x.trim())).map(([name, , , size = '']) => [name, size]));
}
export function animalThings(animals = readAnimals(), taken = readPlaceSizeNames()) {
  const rows = [], thingOf = new Map();
  for (const a of animals) {
    if (taken.has(a.name) && taken.get(a.name) === a.size) continue;
    const name = taken.has(a.name) ? `${a.name} ${['bird', 'fish'].includes(a.class) ? a.class : 'animal'}` : a.name;
    if (taken.has(name)) { if (taken.get(name) !== a.size) throw new Error(`animals.tsv: ${a.name}: ${name} is ${taken.get(name)} in place-size.tsv, ${a.size} here`); } else rows.push({ name, place: usualPlace(a), on: '', size: a.size });
    if (name !== a.name) thingOf.set(a.name, name);
  }
  return { rows, thingOf };
}

export function animalShards(animals = readAnimals(), thingOf = animalThings(animals).thingOf) {
  const files = {};
  files['classes.sop'] = classShard();
  for (const [file, about, classes] of SHARDS) {
    const mine = animals.filter((a) => classes.includes(a.class));
    const facts = mine.map((a) => wire(`k.animals.animal.${seg(a.name)}`, 'k.animals.animal', [['name', a.name], ['class', a.class], ['legs', a.legs], ...a.covering.map((c) => ['covering', c]),
      ...a.sound.map((s) => ['sound', s]), ...a.habitat.map((h) => ['habitat', h]), ['diet', a.diet], ...a.eats.map((e) => ['eats', e]), ['baby', a.baby], ['group', a.group],
      ...a.can.map((c) => ['can', c]), ...a.cannot.map((c) => ['cannot', c]), ['drawing', a.drawing], ['thing', thingOf.get(a.name)], ['named', 'model']], SRC));
    const words = mine.filter((a) => a.words.length).map((a) => wire(`k.animals.word.${seg(a.name)}`, 'core.word', [...a.words.map((w) => ['text', w]), ['means', a.name], ['of', 'k.animals.animal.name']], SRC));
    files[`${file}.sop`] = `${header({ id: `k.animals/shards/${file}`, about: `${mine.length} ${about}: class, legs, covering, sound, habitat, diet, food, the name of the young and of a group, abilities (the size class and the usual place are in k.scenes.thing); and their plural forms and other names. Written by a language model, only where sure (named=model).`,
      sources: ['hand-core 1 (hand-written in this repository: sources/hand-core/animals.tsv)'], license: 'CC0-1.0', script: 'tools/animals-core.mjs' })}\n${facts.join('\n')}\n\n# Words: plural forms and other names.\n${words.join('\n')}\n`;
  }
  return files;
}

// The classes of animals and what is plain of a whole class (Round 11 item 1: "how many legs do insects have"):
// the walking legs and the covering that the table gives an animal of the class when its row says nothing.
// Only where it holds for the whole class: a snake is a reptile without legs, a whale a mammal without fur.
const SURE_LEGS = ['bird', 'fish', 'insect', 'arachnid'], SURE_COVER = ['bird', 'fish', 'reptile'];
const PLURAL = { mammal: 'mammals', bird: 'birds', fish: 'fishes', reptile: 'reptiles', amphibian: 'amphibians', insect: 'insects', arachnid: 'arachnids', crustacean: 'crustaceans', mollusc: 'molluscs', worm: 'worms', myriapod: 'myriapods' };
export function classShard() {
  const facts = CLASSES.map((c) => wire(`k.animals.class.${c}`, 'k.animals.class', [['name', c], ['legs', SURE_LEGS.includes(c) ? LEGS[c] : undefined], ['covering', SURE_COVER.includes(c) ? COVER[c] : undefined], ['named', 'model']], SRC));
  const words = CLASSES.filter((c) => PLURAL[c]).map((c) => wire(`k.animals.word.class.${c}`, 'core.word', [['text', PLURAL[c]], ['means', c], ['of', 'k.animals.class.name']], SRC));
  return `${header({ id: 'k.animals/shards/classes', about: `the ${CLASSES.length} classes of animals of this world, and, only where it holds for the whole class, the number of walking legs (${SURE_LEGS.join(', ')}) and the covering (${SURE_COVER.join(', ')}).`,
    sources: ['hand-core 1 (hand-written in this repository: tools/animals-core.mjs)'], license: 'CC0-1.0', script: 'tools/animals-core.mjs' })}\n${facts.join('\n')}\n\n# Words: plural forms.\n${words.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = { ...animalShards(), 'classes.sop': classShard() };
  writeShards(join(WORLDS_DIR, 'k.animals', 'shards'), files);
  console.log(Object.entries(files).map(([f, t]) => `${f}: ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`).join('\n'));
}
