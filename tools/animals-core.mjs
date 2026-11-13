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

export function animalShards(animals = readAnimals()) {
  const files = {};
  for (const [file, about, classes] of SHARDS) {
    const mine = animals.filter((a) => classes.includes(a.class));
    const facts = mine.map((a) => wire(`k.animals.animal.${seg(a.name)}`, 'k.animals.animal', [['name', a.name], ['class', a.class], ['legs', a.legs], ...a.covering.map((c) => ['covering', c]), ['size', a.size],
      ...a.sound.map((s) => ['sound', s]), ...a.habitat.map((h) => ['habitat', h]), ['diet', a.diet], ...a.eats.map((e) => ['eats', e]), ['baby', a.baby], ['group', a.group],
      ...a.can.map((c) => ['can', c]), ...a.cannot.map((c) => ['cannot', c]), ['drawing', a.drawing], ['named', 'model']], SRC));
    const words = mine.filter((a) => a.words.length).map((a) => wire(`k.animals.word.${seg(a.name)}`, 'core.word', [...a.words.map((w) => ['text', w]), ['means', a.name], ['of', 'k.animals.animal.name']], SRC));
    files[`${file}.sop`] = `${header({ id: `k.animals/shards/${file}`, about: `${mine.length} ${about}: class, legs, covering, size class, sound, habitat, diet, food, the name of the young and of a group, abilities; and their plural forms and other names. Written by a language model, only where sure (named=model).`,
      sources: ['hand-core 1 (hand-written in this repository: sources/hand-core/animals.tsv)'], license: 'CC0-1.0', script: 'tools/animals-core.mjs' })}\n${facts.join('\n')}\n\n# Words: plural forms and other names.\n${words.join('\n')}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = animalShards();
  writeShards(join(WORLDS_DIR, 'k.animals', 'shards'), files);
  console.log(Object.entries(files).map(([f, t]) => `${f}: ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`).join('\n'));
}
