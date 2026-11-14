// Round 11 item 1: a word for every key. The demo's real questions (tools/ask-real.mjs) showed one cause behind
// most "the asked word is not in the vocabulary": 241 of the 337 keys of the named types had no core.word, so a
// host could not get from "continent", "can" or "inside" to the slot. This tool writes, at the end of each
// schema.sop, one block of core.word wires: for every slot that is not the naming key, the name of the key as its
// word (`part_of` -> "part of"; the suffix `_about` left out), and the everyday words of EXTRA. A slot that
// already has a hand-written word keeps it and gets the rule's word too, if it is new.
//   node tools/key-words.mjs          rewrites the block of every docs/worlds/k.*/schema.sop
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { scanWorlds } from './lib/worlds.mjs';
import { parse } from './sopworld/sopworld.mjs';

const SRC = 'hand-core 1';
export const START = '# Words for the keys, by rule: the name of each key, and everyday words for some (tools/key-words.mjs).';
// Everyday words for a slot or a type, next to the name of the key. Written by hand, by cause: each line is a way
// people ask for that key in the demo's questions, not a single question.
export const EXTRA = {
  'k.animals.animal.can': ['can', 'able', 'do'], 'k.animals.animal.cannot': ['unable'], 'k.animals.animal.baby': ['called'],
  'k.attributes.thing.can': ['do'], 'k.commonsense.thing.can': ['can', 'able', 'do'], 'k.commonsense.thing.at': ['find', 'found', 'place'],
  'k.scenes.thing': ['thing'], 'k.scenes.thing.place': ['where', 'find', 'found'], 'k.scenes.thing.on': ['on'],
  'k.objects.object': ['draw', 'sketch', 'show', 'shaped like', 'looks like'],
  'k.words.sense.gloss': ['define', 'explain'], 'k.words.sense.kind_of': ['kind', 'kind of', 'type', 'type of'], 'k.words.sense.instance_of': ['kind', 'kind of'],
  'k.words.sense.near_opposite': ['opposite'], 'k.words.sense.pos': ['part of speech'],
  'k.parts.usual': ['part', 'parts'], 'k.parts.usual.has': ['has', 'have', 'with', 'built', 'inside'], 'k.parts.inherited': ['part', 'parts'], 'k.parts.inherited.has': ['has', 'have', 'with'],
  'k.parts.whole.has': ['built', 'inside'], 'k.parts.whole.plain': ['has', 'have'],
  'k.space.body.kind': ['kind'], 'k.space.body.colour': ['colour', 'color'], 'k.space.body.moons_about': ['moons'], 'k.space.body.orbit_years': ['year'], 'k.space.body.temperature_about': ['hot', 'cold', 'warm'],
  'k.space.body.age_years_about': ['old'], 'k.space.kind': ['kind'], 'k.space.kind.made_of': ['made', 'made of'],
  'k.body.part.part_of': ['part of', 'belongs'], 'k.body.part.count_per_part': ['many'], 'k.body.part.count_about': ['many'], 'k.body.part.about': ['for'], 'k.body.part.does': ['for'],
  'k.food.food.made_of': ['made', 'made from', 'make', 'recipe'], 'k.food.food.kind': ['kind of'],
  'k.geo.country.continent': ['where'], 'k.geo.city.country': ['where'], 'k.geo.city.capital_of': ['capital'], 'k.geo.river.country': ['where', 'flows'], 'k.geo.mountain.country': ['where'],
  'k.geo.country.area': ['size'], 'k.geo.lake.area_about': ['size'], 'k.geo.desert.area_about': ['size'], 'k.geo.sea.area_about': ['size'], 'k.geo.continent.area_about': ['size'],
  'k.units.unit.quantity': ['measure', 'kind'], 'k.units.quantity': ['quantity'], 'k.time.month.days': ['long'], 'k.time.duration.count': ['many'], 'k.time.hour.am_pm': ['am', 'pm'], 'k.time.hour.hour12': ['12-hour clock'], 'k.time.ordered.n': ['position', 'order'],
  'k.people.role.does': ['do', 'job'], 'k.people.kind.is_a': ['kind'], 'k.shapes.shape.sides': ['many'], 'k.attributes.thing.kind': ['kind'], 'k.attributes.thing.wheels': ['many'],
  'k.wearables.wearable.worn_for': ['for'], 'k.wearables.wearable.kind': ['kind'], 'k.feelings.feeling.tone': ['good', 'bad'],
};

const val = (v) => (/^[^\s"\\$?@#][^\s"\\]*$/.test(v) ? v : JSON.stringify(v));

// The block for one schema text (without an earlier block).
export function keyWordBlock(schemaText) {
  const wires = parse(schemaText);
  const world = wires.find((w) => w.type === 'core.module').attrs.name[0];
  const have = new Map(); // means -> Set(text)
  for (const w of wires) if (w.type === 'core.word') { const m = w.attrs.means?.[0]; if (!have.has(m)) have.set(m, new Set()); for (const t of w.attrs.text ?? []) have.get(m).add((t.startsWith('"') ? JSON.parse(t) : t).toLowerCase()); }
  const ids = new Map();
  for (const w of wires) if (w.type === 'core.slot' && w.attrs.id?.[0] === 'true' && !ids.has(w.attrs.of[0])) ids.set(w.attrs.of[0], w.attrs.key[0]);
  const lines = [];
  const add = (means, texts) => {
    const fresh = [...new Set(texts)].filter((t) => !(have.get(means)?.has(t)));
    if (fresh.length) lines.push(`@${world}.word.key.${means.slice(world.length + 1)} core.word ${fresh.map((t) => `text=${val(t)}`).join(' ')} means=${means} core.source="${SRC}"`);
  };
  for (const w of wires) {
    if (w.type === 'core.type' && EXTRA[w.attrs.of[0]]) add(w.attrs.of[0], EXTRA[w.attrs.of[0]]);
    if (w.type !== 'core.slot') continue;
    const type = w.attrs.of[0], key = w.attrs.key[0];
    if (!type.startsWith(`${world}.`) || ids.get(type) === key) continue;
    add(`${type}.${key}`, [key.replace(/_about$/, '').split('_').join(' '), ...(EXTRA[`${type}.${key}`] ?? [])]);
  }
  return lines.length ? `${START}\n${lines.join('\n')}\n` : '';
}

export const withoutBlock = (text) => { const at = text.indexOf(`\n${START}`); return at < 0 ? text : `${text.slice(0, at).replace(/\n+$/, '')}\n`; };
export const withBlock = (text) => { const base = withoutBlock(text); const block = keyWordBlock(base); return block ? `${base}\n${block}` : base; };

if (import.meta.url === `file://${process.argv[1]}`) {
  let n = 0;
  for (const w of scanWorlds().filter((x) => x.id.startsWith('k.'))) { const path = join(w.dir, 'schema.sop'); const next = withBlock(readFileSync(path, 'utf8')); n += next.split('\n').filter((l) => l.includes('.word.key.')).length; writeFileSync(path, next); }
  console.log(`${n} word wires for keys`);
}
