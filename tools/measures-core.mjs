// k.units.measure (Round 9): in which unit each number of the knowledge worlds listed here is given.
//   node tools/measures-core.mjs     writes docs/worlds/k.units/shards/measures.sop
// The tool reads the schemas of the worlds of MEASURES, takes every slot of kind number or integer, and looks its
// key up: first under the type, then under '*' of the world. A numeric slot without an entry is an error, so a
// new number cannot be published without its unit. An entry: { unit } (a k.units.unit), { counts } (what is
// counted) or { ordinal: true } (a place in an order). A key that ends in `_about` is marked approximate.
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds } from './lib/worlds.mjs';
import { wire, header, writeShards } from './import/lib.mjs';
import { parse } from './sopworld/sopworld.mjs';

const SRC = 'hand-core 1';
const deg = { unit: 'degree' }, km2 = { unit: 'square kilometre' };
const BOX = { lat: deg, lon: deg, west: deg, south: deg, east: deg, north: deg };
export const MEASURES = {
  'k.geo': {
    '*': { ...BOX, area_about: km2 },
    country: { population: { counts: 'person' }, area: km2 },
    city: { population: { counts: 'person' } },
    river: { length_about: { unit: 'kilometre' } },
    mountain: { elevation: { unit: 'metre' } },
  },
  'k.animals': { animal: { legs: { counts: 'leg' } } },
  'k.body': { part: { count: { counts: 'part of that name in an adult' }, child_count: { counts: 'part of that name in a young child' }, count_per_part: { counts: 'part of that name on one larger part' }, count_about: { counts: 'part of that name in an adult' },
    temperature_about: { unit: 'degree Celsius' }, amount_about: { unit: 'litre' }, length_about: { unit: 'metre' }, weight_about: { unit: 'kilogram' } } },
  'k.space': { body: { order: { ordinal: true }, size_rank: { ordinal: true }, moons: { counts: 'moon' }, moons_about: { counts: 'moon' }, orbit_years: { unit: 'year' }, orbit_days_about: { unit: 'day' },
    day_hours_about: { unit: 'hour' }, diameter_about: { unit: 'kilometre' }, distance_about: { unit: 'kilometre' }, temperature_about: { unit: 'degree Celsius' }, age_years_about: { unit: 'year' }, light_years_about: { unit: 'light year' } } },
};

// The numeric slots of a world: [type, key] in the order of the schema.
export function numericSlots(schemaText, world) {
  return parse(schemaText).filter((w) => w.type === 'core.slot' && (w.attrs.kind ?? []).some((k) => k === 'number' || k === 'integer'))
    .map((w) => [w.attrs.of[0].slice(world.length + 1), w.attrs.key[0]]);
}

export function measureRows(worlds = scanWorlds(), units = null) {
  const known = units ?? new Set([...worlds.find((w) => w.id === 'k.units').shards.flatMap((s) => [...s.text.matchAll(/ k\.units\.unit name=("[^"]*"|\S+)/g)].map((m) => (m[1].startsWith('"') ? JSON.parse(m[1]) : m[1])))]);
  const rows = [];
  for (const [world, table] of Object.entries(MEASURES)) {
    const entry = worlds.find((w) => w.id === world);
    if (!entry) throw new Error(`measures: no world ${world}`);
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
  const lines = rows.map((r) => wire(`k.units.measure.${r.world}.${r.type}.${r.key}`, 'k.units.measure', [['world', r.world], ['type', r.type], ['key', r.key], ['unit', r.unit], ['counts', r.counts],
    ['ordinal', r.ordinal ? 'true' : undefined], ['approximate', r.approximate ? 'true' : undefined]], SRC));
  return `${header({ id: 'k.units/shards/measures', about: `in which unit the numbers of ${Object.keys(MEASURES).join(', ')} are given: ${rows.length} slots, each with its unit, with what it counts, or as a place in an order.`,
    sources: ['hand-core 1 (hand-written in this repository: tools/measures-core.mjs)'], license: 'CC0-1.0', script: 'tools/measures-core.mjs' })}\n${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const text = measuresShard();
  writeShards(join(WORLDS_DIR, 'k.units', 'shards'), { 'measures.sop': text }, 'measures');
  console.log(`measures.sop: ${text.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(text)} bytes`);
}
