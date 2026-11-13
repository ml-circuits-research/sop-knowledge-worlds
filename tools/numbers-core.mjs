// k.attributes.number (Round 10, item 5): the usual numbers of the common things, so that charts and comparisons
// have something to show ("which is heavier, a horse or a cow", "the fastest of these").
//   node tools/numbers-core.mjs     writes docs/worlds/k.attributes/shards/numbers-*.sop
// The values are the rows of sources/hand-core/numbers.tsv, labelled by a language model (named=model) from the
// everyday meaning of the name, each only where it is plain: the longest side in metres (`size_about`), the weight
// in kilograms (`weight_about`), the usual top speed in kilometres per hour when the thing moves by itself or carries
// people (`speed_about`), the legs of a thing that is not an animal (`legs`; the legs of animals are k.animals), the
// flat sides of a thing whose sides are counted (`sides`), and whether it is cheap, medium or expensive to buy
// (`price_class`). The units are said in k.units.measure (tools/measures-core.mjs).
// Two classes are not labelled but computed here from the number, so that they never disagree with it; their
// values are steps of the k.values scales of the same name: weight_class light under 2 kg, heavy over 30 kg (what
// one person lifts with one hand, and what one person cannot carry), medium between; speed_class slow under
// 10 km/h (walking and below), fast over 60 km/h (faster than any person and most land animals), medium between.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, writeShards, byText } from './import/lib.mjs';

const SRC = 'hand-core 1';
export const NUMBERS_TSV = join(REPO, 'sources', 'hand-core', 'numbers.tsv');
export const KEYS = ['size_about', 'weight_about', 'speed_about', 'legs', 'sides', 'price_class'];
export const PRICE = ['cheap', 'medium', 'expensive'];
export const weightClass = (kg) => (kg === undefined ? undefined : kg < 2 ? 'light' : kg > 30 ? 'heavy' : 'medium');
export const speedClass = (kmh) => (kmh === undefined ? undefined : kmh < 10 ? 'slow' : kmh > 60 ? 'fast' : 'medium');
const NUMBER = /^\d+(\.\d+)?$/;

export function readNumbers(text = readFileSync(NUMBERS_TSV, 'utf8')) {
  const [head, ...rows] = text.split('\n').filter((l) => l.trim());
  if (head !== ['name', ...KEYS].join('\t')) throw new Error(`numbers.tsv: header ${head}`);
  return rows.map((l) => {
    const [name, ...cells] = l.split('\t');
    const row = { name };
    KEYS.forEach((k, i) => {
      const c = (cells[i] ?? '').trim();
      if (c === '') return;
      if (k === 'price_class') { if (!PRICE.includes(c)) throw new Error(`${name}: price_class ${c}`); row[k] = c; return; }
      if (!NUMBER.test(c)) throw new Error(`${name}: ${k} ${c}`);
      if ((k === 'legs' || k === 'sides') && !/^\d+$/.test(c)) throw new Error(`${name}: ${k} ${c}`);
      row[k] = c;
    });
    return row;
  });
}

// Shards by the first letter of the name, so that none is large: a-f, g-o, p-z.
const PARTS = [['a-f', /^[a-f]/], ['g-o', /^[g-o]/], ['p-z', /^[p-z]/]];

export function numberShards(rows = readNumbers()) {
  const files = {};
  for (const [part, re] of PARTS) {
    const mine = rows.filter((r) => re.test(r.name)).sort((a, b) => byText(a.name, b.name));
    const lines = mine.map((r) => wire(`k.attributes.number.${seg(r.name)}`, 'k.attributes.number', [['name', r.name], ['size_about', r.size_about], ['weight_about', r.weight_about],
      ['weight_class', weightClass(r.weight_about === undefined ? undefined : Number(r.weight_about))], ['speed_about', r.speed_about],
      ['speed_class', speedClass(r.speed_about === undefined ? undefined : Number(r.speed_about))], ['legs', r.legs], ['sides', r.sides], ['price_class', r.price_class], ['named', 'model']], SRC));
    files[`numbers-${part}.sop`] = `${header({ id: `k.attributes/shards/numbers-${part}`, about: `the usual numbers of ${mine.length} common things whose name starts with ${part.replace('-', ' to ')}: the longest side in metres, the weight in kilograms and its class, the top speed in kilometres per hour and its class, legs of things that are not animals, flat sides, and the price class, each only where it is plain.`,
      sources: ['hand-core 1 (labelled by a language model, named=model: sources/hand-core/numbers.tsv; the classes of weight and speed computed from the numbers by tools/numbers-core.mjs)'], license: 'CC0-1.0', script: 'tools/numbers-core.mjs' })}\n${lines.join('\n')}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = readNumbers();
  writeShards(join(WORLDS_DIR, 'k.attributes', 'shards'), numberShards(rows), 'numbers-');
  const count = (k) => rows.filter((r) => r[k] !== undefined).length;
  console.log(`${rows.length} things; ${KEYS.map((k) => `${k} ${count(k)}`).join(', ')}`);
}
