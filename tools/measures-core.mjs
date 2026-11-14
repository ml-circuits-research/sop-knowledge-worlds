// k.units.measure (Round 9; every world since Q31): in which unit each number of the knowledge worlds is given.
//   node tools/measures-core.mjs     writes docs/worlds/k.units/shards/measures.sop
// The tool reads the schema of every world of the catalog, takes every slot of kind number or integer, and looks
// its key up: first under the type, then under '*' of the world. A numeric slot without an entry is an error, in
// any world, so a new number cannot be published without its unit. An entry: { unit } (a k.units.unit), { counts }
// (what is counted), { ordinal: true } (a place in an order), { frame } (a position or a length in a frame of
// coordinates that runs from 0 to 100; the value names the frame) or { plain: true } (the number is itself what
// is meant: the value of a number word). A key that ends in `_about` is marked approximate.
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds } from './lib/worlds.mjs';
import { wire, header, writeShards } from './import/lib.mjs';
import { parse } from './sopworld/sopworld.mjs';

const SRC = 'hand-core 1';
const deg = { unit: 'degree' }, km2 = { unit: 'square kilometre' };
const ord = { ordinal: true };
const ms = { unit: 'millisecond' };
const box = (frame) => ({ x: { frame }, y: { frame }, w: { frame }, h: { frame } });
const BOX = { lat: deg, lon: deg, west: deg, south: deg, east: deg, north: deg };
export const MEASURES = {
  'k.geo': {
    '*': { ...BOX, area_about: km2 },
    country: { population: { counts: 'person' }, area: km2 },
    city: { population: { counts: 'person' } },
    river: { length_about: { unit: 'kilometre' } },
    mountain: { elevation: { unit: 'metre' } },
    group: { as_of: { ordinal: true } },
  },
  'k.animals': { '*': { legs: { counts: 'leg' } } },
  'k.body': { part: { count: { counts: 'part of that name in an adult' }, child_count: { counts: 'part of that name in a young child' }, count_per_part: { counts: 'part of that name on one larger part' }, count_about: { counts: 'part of that name in an adult' },
    temperature_about: { unit: 'degree Celsius' }, amount_about: { unit: 'litre' }, length_about: { unit: 'metre' }, weight_about: { unit: 'kilogram' } } },
  'k.space': { body: { order: { ordinal: true }, size_rank: { ordinal: true }, moons: { counts: 'moon' }, moons_about: { counts: 'moon' }, orbit_years: { unit: 'year' }, orbit_days_about: { unit: 'day' },
    day_hours_about: { unit: 'hour' }, diameter_about: { unit: 'kilometre' }, distance_about: { unit: 'kilometre' }, temperature_about: { unit: 'degree Celsius' }, age_years_about: { unit: 'year' }, light_years_about: { unit: 'light year' } } },
  // Q31: the other worlds. Boxes and points of drawings are in the frame of the drawing; `z` and `n` are orders.
  'k.objects': { '*': { ...box('object'), z: ord, n: ord }, skeleton: { drawings: { counts: 'drawing' }, spread: { frame: 'object' } } },
  'k.faces': { '*': { ...box('face'), z: ord, n: ord },
    canon: { eye_line: { counts: 'height of the head box, from its top' }, nose_line: { counts: 'height of the head box, from its top' }, mouth_line: { counts: 'height of the head box, from its top' },
      eye_width: { counts: 'width of the head box' }, eye_gap: { counts: 'eye width' }, brow_above: { counts: 'eye width' } } },
  'k.drawing': { '*': { ...box('drawing'), z: ord, n: ord } }, // Q34 item 1: the frame of the drawing that extends it (an object, a face)
  'k.layouts': { slot: box('arrangement'), anchor: box('object') },
  'k.wearables': { place: box('person drawing') },
  'k.actions': { verb: { sense: ord } },
  'k.words': { sense: { n: ord }, frequency: { band: ord, zipf: { counts: 'log10 of the occurrences of the word per billion words of text' } } },
  'k.attributes': { thing: { wheels: { counts: 'wheel' } }, number: { size_about: { unit: 'metre' }, weight_about: { unit: 'kilogram' }, speed_about: { unit: 'kilometre per hour' }, legs: { counts: 'leg' }, sides: { counts: 'side' } },
    // a range is in the unit of the numbers it describes (k.units.measure of its type and key); a typicality weight is a plain share
    range: { low: { counts: 'unit of the measure of the range\'s type and key' }, high: { counts: 'unit of the measure of the range\'s type and key' }, median: { counts: 'unit of the measure of the range\'s type and key' }, count: { counts: 'number of the kind in the catalog' } }, typical: { weight: { plain: true } }, narration: { salience: { plain: true } } },
  'k.commonsense': { thing: { usually_count: { counts: 'thing of that name usually found together' } } },
  'k.parts': { inherited: { steps: { counts: 'step from the thing up to the kind' } } },
  'k.people': { kind: { height_about: { counts: 'hundredth of the height of a grown man' } } },
  'k.scenes': { has: { count: { counts: 'thing of that name in the scene' } } },
  'k.shapes': { shape: { sides: { counts: 'side' }, corners: { counts: 'corner' }, faces: { counts: 'face' }, edges: { counts: 'edge' } } },
  'k.time': { ordered: { n: ord }, cycle: { length: { counts: 'time of the cycle' } }, month: { n: ord, days: { unit: 'day' }, leap_days: { unit: 'day' } }, weekday: { n: ord }, season: { n: ord },
    part_of_day: { n: ord, starts_about: { counts: 'hour after midnight' }, ends_about: { counts: 'hour after midnight' } }, span: { starts_about: { counts: 'hour after midnight' }, ends_about: { counts: 'hour after midnight' } }, hour: { n: { counts: 'hour after midnight' }, hour12: { counts: 'hour after midnight or noon' } },
    duration: { count: { counts: 'span that the key unit of the same fact names' }, count_about: { counts: 'span that the key unit of the same fact names' } } },
  'k.units': { unit: { factor: { counts: 'base unit of its quantity in one of the unit' }, offset: { counts: 'base unit of its quantity added after the factor' } } },
  'k.values': { scale: { steps: { counts: 'step' } }, step: { rank: ord }, direction: { x: { counts: 'step to the right in a picture' }, y: { counts: 'step downwards in a picture' } }, number: { value: { plain: true }, value_about: { plain: true } },
    shade: { lightness: { plain: true }, saturation: { plain: true } } },
  // Round 12: the grammar world. Orders of trial and places in a frame are orders; the values of number words are plain.
  'w.lang.en': {
    det: { person: { plain: true }, value: { plain: true } }, pron: { person: { plain: true } }, anaphor: { order: ord }, prep: { arity: { counts: 'thing the preposition relates' } },
    ordinal: { value: { plain: true } }, numeral: { value: { plain: true } },
    inflect: { order: ord, drop: { counts: 'letter' }, min_length: { counts: 'letter' } }, frame: { priority: ord }, rule: { priority: ord }, alternation: { n: ord }, part: { at: ord, max_words: { counts: 'word' } },
    'ellipsis.lead': { order: ord }, 'ellipsis.trail': { order: ord }, 'ellipsis.param': { value: { counts: 'word or part that the name of the limit says' }, min: { counts: 'word or part that the name of the limit says' }, max: { counts: 'word or part that the name of the limit says' } },
    'coord.param': { value: { counts: 'word' } },
  },
  // k.motion: durations in milliseconds; layer priorities and step numbers are orders; a chance is a plain number.
  'k.motion': { layer: { priority: ord }, rule: { repeat_min: ms, repeat_max: ms, chance: { plain: true } }, step: { n: ord, with: ord, onset_min: ms, onset_max: ms, hold_min: ms, hold_max: ms, back_min: ms, back_max: ms }, set: { step: ord }, letters: { min: ms, max: ms } },
  // k.procedures: step numbers and ranks are orders; a default or a literal filler is the number the role takes.
  // w.lang.ro: a person is the grammatical person; a numeral's or an ordinal's value is the number it says.
  'w.lang.ro': { frame: { priority: ord }, part: { at: ord, max_words: { counts: 'word' } }, ending: { person: { plain: true } }, irregular: { person: { plain: true } }, det: { person: { plain: true }, value: { plain: true } }, pron: { person: { plain: true } }, numeral: { value: { plain: true } } },
  // k.interest: weights, bases and the points of a shape are plain shares or values of the feature's measure; a year is an order.
  'k.interest': { source: { year: ord }, appraisal: { base: { plain: true } }, feature: { start_at: { counts: 'unit of the feature\'s measure' }, peak_at: { counts: 'unit of the feature\'s measure' }, full_at: { counts: 'unit of the feature\'s measure' }, weight_min: { plain: true }, weight_max: { plain: true } } },
  // k.genres: places in an order and years are orders; counts of parts, sentences and words say what they count; a band is a place in an order.
  'k.genres': { source: { year: ord }, register: { sentence_min: { counts: 'word' }, sentence_typical: { counts: 'word' }, sentence_max: { counts: 'word' }, paragraph_min: { counts: 'sentence' }, paragraph_max: { counts: 'sentence' }, vocabulary_band: ord },
    part: { n: ord, min: { counts: 'time the part occurs in one document' }, max: { counts: 'time the part occurs in one document' } }, step: { n: ord, min: { counts: 'sentence' }, max: { counts: 'sentence' } } },
  // k.story: places in an order and years are orders; how many of an element a story has.
  'k.story': { source: { year: ord }, element: { n: ord, min: { counts: 'element of that name in one story' }, max: { counts: 'element of that name in one story' } } },
  'k.procedures': { method: { rank: ord }, goal: { default: { plain: true } }, binding: { step: ord, choose: { counts: 'value chosen' }, choose_min: { counts: 'value chosen' } }, match: { n: ord }, step: { n: ord, after: ord }, arg: { step: ord, value: { plain: true } }, condition: { n: ord, step: ord } },
};

// The numeric slots of a world: [type, key] in the order of the schema.
export function numericSlots(schemaText, world) {
  return parse(schemaText).filter((w) => w.type === 'core.slot' && (w.attrs.kind ?? []).some((k) => k === 'number' || k === 'integer'))
    .map((w) => [w.attrs.of[0].slice(world.length + 1), w.attrs.key[0]]);
}

export function measureRows(worlds = scanWorlds(), units = null) {
  const known = units ?? new Set([...worlds.find((w) => w.id === 'k.units').shards.flatMap((s) => [...s.text.matchAll(/ k\.units\.unit name=("[^"]*"|\S+)/g)].map((m) => (m[1].startsWith('"') ? JSON.parse(m[1]) : m[1])))]);
  const rows = [];
  for (const world of Object.keys(MEASURES)) if (!worlds.some((w) => w.id === world)) throw new Error(`measures: no world ${world}`);
  const order = [...Object.keys(MEASURES), ...worlds.map((w) => w.id).filter((id) => !MEASURES[id])];
  for (const world of order) {
    const entry = worlds.find((w) => w.id === world), table = MEASURES[world] ?? {};
    for (const [type, key] of numericSlots(entry.schemaText, world)) {
      const spec = table[type]?.[key] ?? table['*']?.[key];
      if (!spec) throw new Error(`measures: the number ${world}.${type}.${key} has no unit in tools/measures-core.mjs`);
      if (spec.unit && !known.has(spec.unit)) throw new Error(`measures: ${world}.${type}.${key}: no k.units.unit "${spec.unit}"`);
      rows.push({ world, type, key, ...spec, approximate: key.endsWith('_about') });
    }
  }
  return rows;
}

export function measuresShard(rows = measureRows()) {
  const lines = rows.map((r) => wire(`k.units.measure.${r.world}.${r.type}.${r.key}`, 'k.units.measure', [['world', r.world], ['type', r.type], ['key', r.key], ['unit', r.unit], ['counts', r.counts], ['frame', r.frame], ['plain', r.plain ? 'true' : undefined],
    ['ordinal', r.ordinal ? 'true' : undefined], ['approximate', r.approximate ? 'true' : undefined]], SRC));
  return `${header({ id: 'k.units/shards/measures', about: `in which unit the numbers of every knowledge world are given (${[...new Set(rows.map((r) => r.world))].join(', ')}): ${rows.length} slots, each with its unit, with what it counts, as a place in an order, as a position in a frame, or as a plain number.`,
    sources: ['hand-core 1 (hand-written in this repository: tools/measures-core.mjs)'], license: 'CC0-1.0', script: 'tools/measures-core.mjs' })}\n${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const text = measuresShard();
  writeShards(join(WORLDS_DIR, 'k.units', 'shards'), { 'measures.sop': text }, 'measures');
  console.log(`measures.sop: ${text.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(text)} bytes`);
}
